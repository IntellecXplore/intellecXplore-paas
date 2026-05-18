import type { Context } from 'elysia';
import { BaseResultData } from '@/core/result';
import { systemAgentConfigSchema } from '@database/schema/system_agent_config';
import { FindOneByKey, InsertOne, UpdateByKey } from '@/core/database/repository';
import { logger } from '@/shared/logger';

function getUserId(ctx: Context): number {
    return Number((ctx as any).user?.userId) || 0;
}

/**
 * 获取当前用户的智能体配置
 */
export async function getConfig(ctx: Context) {
    try {
        const userId = getUserId(ctx);
        if (!userId) return BaseResultData.fail(401, '未登录');

        const data = await FindOneByKey(systemAgentConfigSchema, 'userId', userId, (ctx as any)?.tenantId);
        if (!data) {
            // 返回默认配置
            const config = await import('@/config').then(m => m.default);
            return BaseResultData.ok({
                provider: config.agent.provider,
                apiKey: '',
                apiBase: config.agent.apiBase,
                model: config.agent.model,
                maxTokens: config.agent.maxTokens,
                maxToolRounds: config.agent.maxToolRounds,
                conversationTTL: config.agent.conversationTTL,
                status: true,
            });
        }
        return BaseResultData.ok(data);
    } catch (e: any) {
        logger.error('getConfig error:', e);
        return BaseResultData.fail(500, e.message);
    }
}

/**
 * 保存当前用户的智能体配置（新增或更新）
 */
export async function saveConfig(ctx: Context) {
    try {
        const userId = getUserId(ctx);
        if (!userId) return BaseResultData.fail(401, '未登录');

        const body = ctx.body as Record<string, unknown>;
        const existing = await FindOneByKey(systemAgentConfigSchema, 'userId', userId, (ctx as any)?.tenantId);

        if (existing) {
            await UpdateByKey(systemAgentConfigSchema, 'userId', { ...ctx, body: { ...body, userId } } as any);
        } else {
            await InsertOne(systemAgentConfigSchema, { ...ctx, body: { ...body, userId } } as any);
        }

        return BaseResultData.ok(null, '保存成功');
    } catch (e: any) {
        logger.error('saveConfig error:', e);
        return BaseResultData.fail(500, e.message);
    }
}
