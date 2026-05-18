/**
 * 工作流定时任务
 *
 * 使用方式：
 * 1. 在 monitor_job 表中创建记录，jobArgs 为 JSON:
 *    { "type": "workflow", "definitionId": 1, "input": { "key": "value" } }
 * 2. RegisterAllTasks 会自动识别并调度到 workflow-execution 队列
 */
import { logger } from '@/shared/logger';
import pg from '@/core/database/pg';
import { workflowDefinitionSchema } from '@database/schema/workflow_definition';
import { workflowInstanceSchema } from '@database/schema/workflow_instance';
import { eq } from 'drizzle-orm';

/**
 * 定时触发的 workflow 任务处理器
 * 由 system-cron processor 调用，直接创建 workflow 实例并入队
 */
export async function triggerWorkflow(definitionId: number, inputJson?: string): Promise<void> {
    let input: Record<string, unknown> = {};
    if (inputJson) {
        try {
            input = JSON.parse(inputJson);
        } catch {
            input = { raw: inputJson };
        }
    }

    // 验证定义存在
    const [def] = await pg
        .select({ id: workflowDefinitionSchema.id, name: workflowDefinitionSchema.name })
        .from(workflowDefinitionSchema)
        .where(eq(workflowDefinitionSchema.id, definitionId))
        .limit(1);

    if (!def) {
        throw new Error(`Workflow definition id=${definitionId} not found`);
    }

    // 创建实例
    const [instance] = await pg
        .insert(workflowInstanceSchema)
        .values({
            definitionId,
            definitionVersion: 1,
            workflowName: def.name,
            status: 'pending',
            input: input as any,
            context: { input },
            scheduledAt: new Date(),
            triggerType: 'cron',
            userId: 1, // 系统用户
        } as any)
        .returning({ id: workflowInstanceSchema.id });

    logger.info(`[workflow-task] Cron 触发 workflow "${def.name}", instanceId=${instance.id}`);

    // 入队到 workflow-execution 队列
    try {
        const { queueManager } = await import('@/infrastructure/queue/core');
        const queue = queueManager.getQueue('workflow-execution-queue');
        if (queue) {
            await queue.add('workflow-execution-queue', { instanceId: instance.id });
        }
    } catch (e: any) {
        logger.warn('[workflow-task] 无法入队，将内联执行:', e.message);
        const { workflowExecutor } = await import('./executor');
        workflowExecutor.execute(instance.id).catch(err => {
            logger.error(`[workflow-task] Workflow ${instance.id} execute error:`, err);
        });
    }
}
