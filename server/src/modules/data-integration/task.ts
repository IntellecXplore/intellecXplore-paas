import type { Job } from 'bullmq';
import { isNotNull, and, eq } from 'drizzle-orm';
import { FindAll, CreateQueryBuilder } from '@/core/database/repository';
import { dataIntegrationTaskSchema } from '@database/schema/data_integration_task';
import { logger } from '@/shared/logger';
import { executeSync } from './sync-engine';

/** 定时扫描启用了 schedule_cron 的同步任务，匹配则触发执行 */
async function syncScheduler(_job: Job): Promise<void> {
    const qb = new CreateQueryBuilder(dataIntegrationTaskSchema)
        .eq('status', 'active')
        .isNotNull('scheduleCron')
        .eq('delFlag', false);

    const tasks = await FindAll(dataIntegrationTaskSchema, qb.build()) as any[];
    let triggered = 0;

    for (const task of tasks) {
        if (!task.scheduleCron) continue;

        // 简单的 Cron 匹配检查（生产环境应用 cron-parser）
        if (!shouldRunNow(task.scheduleCron, task.lastSyncAt)) continue;

        logger.info(`[Integration] 定时触发同步任务: ${task.name} (ID=${task.id})`);

        // 异步触发（不等待完成）
        executeSync(task.id, 0, task.tenantId || 1).catch(err => {
            logger.error(`[Integration] 定时同步失败 task=${task.id}: ${err.message}`);
        });

        triggered++;
    }

    if (triggered > 0) {
        logger.info(`[Integration] 定时同步调度完成: 触发${triggered}个任务`);
    }
}

/** 简单的最小间隔检查，避免过于频繁触发 */
function shouldRunNow(cronExpr: string, lastSyncAt: Date | null): boolean {
    // 解析 Cron: "分 时 日 月 周"
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    const now = new Date();

    // 最后同步时间在 2 分钟内的，跳过
    if (lastSyncAt && (now.getTime() - new Date(lastSyncAt).getTime()) < 2 * 60 * 1000) {
        return false;
    }

    // 检查小时匹配
    const hour = parts[1];
    if (hour !== '*' && Number(hour) !== now.getHours()) return false;

    // 检查分钟匹配
    const minute = parts[0];
    if (minute !== '*' && Number(minute) !== now.getMinutes()) return false;

    return true;
}

export const tasks = [
    {
        name: '数据集成-定时同步调度',
        pattern: '*/5 * * * *', // 每 5 分钟检查一次
        handler: syncScheduler,
    },
];
