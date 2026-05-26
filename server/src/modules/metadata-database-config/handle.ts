import { Context } from 'elysia';
import { eq, and } from 'drizzle-orm';
import { BaseResultData } from '@/core/result';
import {
    InsertOne,
    SoftDeleteByKeys,
    CreateQueryBuilder,
    FindPage,
    FindOneByKey,
    FindAll,
    db,
} from '@/core/database/repository';
import { metadataDatabaseConfigsSchema } from '@database/schema/metadata_database_configs';
import { connectionManager, type StorageConfig } from '@/core/database/connection-manager';

export async function create(ctx: Context) {
    try {
        await InsertOne(metadataDatabaseConfigsSchema, ctx);
        return BaseResultData.ok();
    } catch (error: any) {
        const detail = error?.cause?.detail || error?.detail || error?.message || String(error);
        return BaseResultData.fail(500, detail);
    }
}

export async function findList(ctx: Context) {
    try {
        const { pageNum = 1, pageSize = 10, orderByColumn = "createTime", sortRule = "desc", name } = ctx.query;
        const whereCondition = CreateQueryBuilder(metadataDatabaseConfigsSchema, (ctx as any)?.tenantId)
            .eq('delFlag', false)
            .like('name', name)
            .build();
        const res = await FindPage(metadataDatabaseConfigsSchema, whereCondition, {
            pageNum, pageSize, orderByColumn, sortRule
        });
        return BaseResultData.ok(res);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function findAll(ctx: Context) {
    try {
        const whereCondition = CreateQueryBuilder(metadataDatabaseConfigsSchema, (ctx as any)?.tenantId)
            .eq('delFlag', false)
            .eq('status', 'active')
            .build();
        const res = await FindAll(metadataDatabaseConfigsSchema, whereCondition, {
            orderByColumn: 'createTime',
            sortRule: 'desc',
        });
        return BaseResultData.ok(res);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function findOne(ctx: Context) {
    try {
        const cid = Number(ctx.params.id);
        const data = await FindOneByKey(metadataDatabaseConfigsSchema, 'id', cid, (ctx as any)?.tenantId);
        if (!data || data.delFlag) return BaseResultData.fail(404);
        return BaseResultData.ok(data);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function update(ctx: Context) {
    try {
        const body = ctx.body as Record<string, any>;
        const cid = body.id;
        const tenantId = (ctx as any)?.tenantId;
        const current = await FindOneByKey(metadataDatabaseConfigsSchema, 'id', cid, tenantId);
        if (!current || current.delFlag) return BaseResultData.fail(404);

        const updateData: Record<string, any> = {
            ...body,
            updateTime: new Date(),
        };
        const updateBy = (ctx as any)?.user?.userId || null;
        if (updateBy) updateData.updateBy = updateBy;

        await db.update(metadataDatabaseConfigsSchema)
            .set(updateData as any)
            .where(and(
                eq(metadataDatabaseConfigsSchema.id, cid),
                eq(metadataDatabaseConfigsSchema.tenantId, tenantId!),
            ));
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function remove(ctx: Context) {
    try {
        await SoftDeleteByKeys(metadataDatabaseConfigsSchema, 'id', ctx);
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function testConnection(ctx: Context) {
    try {
        const config = ctx.body as StorageConfig;
        if (!config || !config.host || !config.port || !config.username || !config.database) {
            return BaseResultData.fail(400, '数据库配置不完整：host/port/username/database 为必填');
        }
        const result = await connectionManager.testConnection(config);
        if (result.success) {
            return BaseResultData.ok({ success: true, latency: result.latency }, '连接成功');
        }
        return BaseResultData.ok({ success: false, error: result.error, latency: result.latency }, '连接失败');
    } catch (error: any) {
        return BaseResultData.fail(500, error?.message || error);
    }
}
