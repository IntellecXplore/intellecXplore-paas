import { Context } from 'elysia';
import { eq } from 'drizzle-orm';
import { BaseResultData } from '@/core/result';
import { CacheEnum } from '@/constants/enum';
import { Get, Set } from '@/core/database/redis';
import pg from '@/core/database/pg';
import { systemTenantSchema } from '@database/schema/system_tenant';

async function getTenant(tenantId: number) {
    const cacheKey = CacheEnum.TENANT_INFO + tenantId;
    const cached = await Get(cacheKey);
    if (cached) return cached;
    const rows = await pg.select()
        .from(systemTenantSchema)
        .where(eq(systemTenantSchema.tenantId, tenantId))
        .limit(1);
    const tenant = rows[0] || null;
    if (tenant) await Set(cacheKey, tenant, 300); // 缓存 5 分钟
    return tenant;
};

/**
 * 租户守卫
 * 在 AuthGuard 之后执行，校验租户有效性并将租户信息挂载到 ctx
 */
export async function TenantGuard(ctx: Context) {
    try {
        const routeInfo = (ctx as any).routeInfo;
        const isAuth = routeInfo?.meta?.isAuth || false;
        if (!isAuth) return; // 公开接口无需租户上下文

        const user = (ctx as any).user;
        if (!user) return; // AuthGuard 已保证不会走到这里

        // 过渡期：user 中无 tenantId 时默认归属租户 1
        const tenantId = user.tenantId ?? 1;
        const tenant = await getTenant(tenantId);
        if (!tenant) return BaseResultData.fail(403, '租户不存在');
        if (!tenant.status) return BaseResultData.fail(403, '租户已禁用');
        if (tenant.expireTime && new Date(tenant.expireTime) < new Date()) {
            return BaseResultData.fail(403, '租户已过期');
        }

        (ctx as any).tenant = tenant;
        (ctx as any).tenantId = tenantId;
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};
