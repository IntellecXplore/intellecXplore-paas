import { Context } from 'elysia';
import { eq, and, like } from 'drizzle-orm';
import pg from '@/core/database/pg';
import { logger } from '@/shared/logger';
import { BaseResultData } from '@/core/result';
import { systemTenantSchema } from '@database/schema/system_tenant';
import { FindAll } from '@/core/database/repository';
import { ParseDateFields } from '@/types/dto';

/** 创建租户 */
export async function create(ctx: Context) {
    try {
        const data = ctx.body as any;
        const [result] = await pg.insert(systemTenantSchema).values(data).returning();
        return BaseResultData.ok(result);
    } catch (error) {
        logger.error('创建租户失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 查询租户列表 */
export async function findList(ctx: Context) {
    try {
        const { pageNum = 1, pageSize = 10, orderByColumn, sortRule, tenantName, tenantCode, status } = ctx.query as any;
        const conditions = [eq(systemTenantSchema.delFlag, false)];
        if (tenantName) conditions.push(like(systemTenantSchema.tenantName, `%${tenantName}%`));
        if (tenantCode) conditions.push(like(systemTenantSchema.tenantCode, `%${tenantCode}%`));
        if (status !== undefined && status !== '') conditions.push(eq(systemTenantSchema.status, status === 'true'));

        const where = and(...conditions);
        const total = await pg.select({ count: pg.fn.count() }).from(systemTenantSchema).where(where);
        const list = await pg.select().from(systemTenantSchema).where(where)
            .limit(pageSize).offset((pageNum - 1) * pageSize)
            .orderBy(orderByColumn ? pg.dynamic().ref(orderByColumn) : systemTenantSchema.createTime);
        return BaseResultData.ok({ list, total: Number(total[0]?.count ?? 0) });
    } catch (error) {
        logger.error('查询租户列表失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 查询租户详情 */
export async function findOne(ctx: Context) {
    try {
        const id = (ctx.params as any).id;
        const [data] = await pg.select().from(systemTenantSchema)
            .where(and(eq(systemTenantSchema.tenantId, Number(id)), eq(systemTenantSchema.delFlag, false)));
        if (!data) return BaseResultData.fail(404, '租户不存在');
        return BaseResultData.ok(data);
    } catch (error) {
        logger.error('查询租户详情失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 更新租户 */
export async function update(ctx: Context) {
    try {
        const data = ctx.body as any;
        ParseDateFields(data);
        data.updateTime = new Date();
        const [result] = await pg.update(systemTenantSchema).set(data)
            .where(eq(systemTenantSchema.tenantId, data.tenantId)).returning();
        if (!result) return BaseResultData.fail(404, '租户不存在');
        return BaseResultData.ok(result);
    } catch (error) {
        logger.error('更新租户失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 删除租户（软删除） */
export async function remove(ctx: Context) {
    try {
        const { ids } = ctx.params as any;
        const idArray = ids.split(',').map(Number);
        await pg.update(systemTenantSchema).set({ delFlag: true, updateTime: new Date() } as any)
            .where(and(...idArray.map(id => eq(systemTenantSchema.tenantId, id))));
        return BaseResultData.ok();
    } catch (error) {
        logger.error('删除租户失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 租户下拉选项（供前端选择器使用） */
export async function findOptions(ctx: Context) {
    try {
        const where = and(eq(systemTenantSchema.delFlag, false), eq(systemTenantSchema.status, true));
        const list = await FindAll(systemTenantSchema, where);
        const options = list.map((item: any) => ({
            tenantId: item.tenantId,
            tenantName: item.tenantName,
        }));
        return BaseResultData.ok(options);
    } catch (error) {
        logger.error('查询租户选项失败:', error);
        return BaseResultData.fail(500, error);
    }
};
