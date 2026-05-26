import { Set, Get, Del } from '@/core/database/redis';
import { getAdapter, type ConnectionConfig, type AuthResult } from './adapters/interface';
import { decryptConnectionConfig } from './credential';
import { logger } from '@/shared/logger';

const TOKEN_PREFIX = 'integration:token:';
const TOKEN_LOCK_PREFIX = 'integration:token:lock:';
/** Token 提前过期缓冲区（秒），在 Redis TTL 基础上提前刷新 */
const TOKEN_EXPIRY_BUFFER_SEC = 60;

/** 获取有效 Token（自动缓存和刷新） */
export async function getToken(sourceId: number, config: ConnectionConfig): Promise<string> {
    const cacheKey = TOKEN_PREFIX + sourceId;
    const cached = await Get(cacheKey);
    if (cached?.accessToken) {
        const now = Date.now();
        if (cached.expiresAt > now + TOKEN_EXPIRY_BUFFER_SEC * 1000) {
            return cached.accessToken;
        }
    }

    // 避免并发刷新：使用简单的 Redis 锁
    const lockKey = TOKEN_LOCK_PREFIX + sourceId;
    const lockAcquired = await Set(lockKey, '1', 10);
    if (!lockAcquired) {
        // 短暂等待锁释放后重试缓存
        await new Promise(r => setTimeout(r, 200));
        const retry = await Get(cacheKey);
        if (retry?.accessToken) return retry.accessToken;
    }

    try {
        const adapter = getAdapter(config.productType);
        if (!adapter) throw new Error(`No adapter found for product type: ${config.productType}`);

        const decryptedConfig = decryptConnectionConfig(config as any);
        const authResult: AuthResult = await adapter.authenticate(decryptedConfig);

        const ttl = Math.max(60, Math.floor((authResult.expiresAt - Date.now()) / 1000) - TOKEN_EXPIRY_BUFFER_SEC);
        await Set(cacheKey, authResult, ttl);

        if (authResult.refreshToken) {
            await Set(cacheKey + ':refresh', { refreshToken: authResult.refreshToken }, ttl * 6);
        }

        return authResult.accessToken;
    } catch (error: any) {
        logger.error(`[TokenManager] Failed to get token for source ${sourceId}: ${error.message}`);
        throw error;
    } finally {
        await Del(TOKEN_LOCK_PREFIX + sourceId);
    }
}

/** 清除 Token 缓存 */
export async function clearToken(sourceId: number): Promise<void> {
    await Del(TOKEN_PREFIX + sourceId);
}
