/**
 * WorkflowExecution Worker 注册
 * 使用函数模式（非沙箱），因为需要完整的应用上下文（DB、AI SDK）
 *
 * 支持两种 Job 类型：
 * 1. { instanceId } — 执行已有实例
 * 2. { type: 'workflow', definitionId, input } — 创建新实例并执行（cron 触发）
 */
import { queueManager, buildRetry, RetryPresets } from '../../core';
import { logger } from '@/shared/logger';

queueManager.registerWorker({
    queueName: 'workflow-execution-queue',
    processor: async (job) => {
        const { instanceId, type, definitionId, input } = job.data;

        // cron 触发：先创建实例再执行
        if (type === 'workflow' && definitionId) {
            const { workflowExecutor } = await import('@/modules/workflow/executor');
            const pg = (await import('@/core/database/pg')).default;
            const {
                workflowDefinitionSchema,
            } = await import('@database/schema/workflow_definition');
            const { workflowInstanceSchema } = await import(
                '@database/schema/workflow_instance'
            );
            const { eq } = await import('drizzle-orm');

            // 查找定义
            const [def] = await pg
                .select({
                    id: workflowDefinitionSchema.id,
                    name: workflowDefinitionSchema.name,
                    version: workflowDefinitionSchema.version,
                })
                .from(workflowDefinitionSchema)
                .where(eq(workflowDefinitionSchema.id, definitionId))
                .limit(1);

            if (!def) {
                throw new Error(`Workflow definition id=${definitionId} not found`);
            }

            // 创建实例
            const [inst] = await pg
                .insert(workflowInstanceSchema)
                .values({
                    definitionId,
                    definitionVersion: def.version,
                    workflowName: def.name,
                    status: 'pending',
                    input: (input || {}) as any,
                    context: { input: input || {} },
                    scheduledAt: new Date(),
                    triggerType: 'cron',
                    userId: 1, // 系统用户
                } as any)
                .returning({ id: workflowInstanceSchema.id });

            await workflowExecutor.execute(inst.id);
            return { success: true, instanceId: inst.id, trigger: 'cron' };
        }

        // 直接执行已有实例
        if (instanceId) {
            const { workflowExecutor } = await import('@/modules/workflow/executor');
            await workflowExecutor.execute(instanceId);
            return { success: true, instanceId };
        }

        throw new Error('Invalid job data: need instanceId or { type, definitionId }');
    },
    options: {
        concurrency: 3,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
        ...buildRetry(RetryPresets.standard),
    },
});
