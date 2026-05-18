import { logger } from '@/shared/logger';
import { queueManager, schedule } from '@/infrastructure/queue';
import { FindAll } from '@/core/database/repository';
import { monitorJobSchema } from 'database/schema/monitor_job';
import { eq } from 'drizzle-orm';

function parseJobArgs(jobArgs?: string): Record<string, unknown> {
    if (!jobArgs) return {};
    try {
        return JSON.parse(jobArgs);
    } catch {
        return {};
    }
}

/**
 * 启动时从数据库恢复所有启用的定时任务到 BullMQ repeat 队列
 *
 * 支持两种任务类型：
 * 1. 普通任务 → 调度到 system-cron-queue（沙箱执行）
 * 2. workflow 任务 → 调度到 workflow-execution-queue（完整应用上下文执行）
 *    识别方式：jobArgs JSON 中包含 "type": "workflow"
 */
export async function RegisterAllTasks() {
    const cronQueue = queueManager.getQueue('system-cron-queue');
    const workflowQueue = queueManager.getQueue('workflow-execution-queue');

    if (!cronQueue && !workflowQueue) {
        logger.error('RegisterAllTasks: 无可用的任务队列，跳过任务恢复');
        return;
    }

    try {
        const jobs = await FindAll(
            monitorJobSchema,
            eq(monitorJobSchema.delFlag, false),
        );
        if (!jobs?.length) {
            logger.info('✓ 无需恢复定时任务');
            return;
        }

        let cronCount = 0;
        let workflowCount = 0;

        for (const job of jobs) {
            if (!job.status || !job.jobName || !job.jobCron) continue;

            const args = parseJobArgs(job.jobArgs || undefined);

            // workflow 类型 → 调度到 workflow-execution 队列
            if (args.type === 'workflow' && workflowQueue) {
                await schedule(workflowQueue, `wf-${String(job.jobName)}`, {
                    cron: String(job.jobCron),
                    data: {
                        type: 'workflow',
                        definitionId: args.definitionId,
                        input: args.input || {},
                    },
                });
                workflowCount++;
                continue;
            }

            // 普通任务 → system-cron-queue
            if (cronQueue) {
                await schedule(cronQueue, String(job.jobName), {
                    cron: String(job.jobCron),
                    data: {
                        taskName: String(job.jobName),
                        jobArgs: job.jobArgs ?? '',
                    },
                });
                cronCount++;
            }
        }

        logger.info(
            `✓ 定时任务恢复完成: ${cronCount} 个 cron 任务, ${workflowCount} 个 workflow 任务`,
        );
    } catch (error: any) {
        logger.error('定时任务恢复失败:', error);
        throw error;
    }
}