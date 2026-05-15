import { Context } from 'elysia';
import { eq, and, count } from 'drizzle-orm';
import { BaseResultData } from '@/core/result';
import {
    InsertOne, FindOneByKey, UpdateByKey, SoftDeleteByKeys,
    CreateQueryBuilder, FindPage,
} from '@/core/database/repository';
import { db } from '@/core/database/repository';
import { metadataFieldsSchema } from '@database/schema/metadata_fields';
import { metadataRelationsSchema } from '@database/schema/metadata_relations';

export async function create(ctx: Context) {
    try {
        await InsertOne(metadataFieldsSchema, ctx);
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function findList(ctx: Context) {
    try {
        const { pageNum = 1, pageSize = 10, orderByColumn = "sort_order",
                sortRule = "asc", collectionId, columnName, type } = ctx.query;
        const whereCondition = CreateQueryBuilder(metadataFieldsSchema)
            .eq('delFlag', false)
            .eq('collectionId', collectionId)
            .like('columnName', columnName)
            .eq('type', type)
            .build();
        const res = await FindPage(metadataFieldsSchema, whereCondition, {
            pageNum, pageSize, orderByColumn, sortRule
        });
        return BaseResultData.ok(res);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function findOne(ctx: Context) {
    try {
        const fid = Number(ctx.params.id);
        const data = await FindOneByKey(metadataFieldsSchema, 'id', fid);
        if (!data || data.delFlag) return BaseResultData.fail(404);
        return BaseResultData.ok(data);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function update(ctx: Context) {
    try {
        const body = ctx.body as Record<string, any>;
        const fid = body.id;
        const current = await FindOneByKey(metadataFieldsSchema, 'id', fid);
        if (!current || current.delFlag) return BaseResultData.fail(404);

        const expectedVersion = current.version || 0;
        const updateData: Record<string, any> = {
            ...body,
            version: expectedVersion + 1,
            updateTime: new Date(),
        };
        const updateBy = (ctx as any)?.user?.userId || null;
        if (updateBy) updateData.updateBy = updateBy;

        const result = await db.update(metadataFieldsSchema)
            .set(updateData as any)
            .where(and(
                eq(metadataFieldsSchema.id, fid),
                eq(metadataFieldsSchema.version, expectedVersion),
            ))
            .returning({ id: metadataFieldsSchema.id });

        if (result.length === 0) {
            return BaseResultData.fail(409, '数据已被他人修改，请刷新后重试');
        }
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function remove(ctx: Context) {
    try {
        const ids: number[] = ctx.params.ids.split(',').map(Number);
        for (const fid of ids) {
            const field = await FindOneByKey(metadataFieldsSchema, 'id', fid);
            if (!field) continue;

            const sourceRef = await db.select({ total: count() })
                .from(metadataRelationsSchema)
                .where(and(
                    eq(metadataRelationsSchema.delFlag, false),
                    eq(metadataRelationsSchema.sourceCollectionId, field.collectionId),
                    eq(metadataRelationsSchema.sourceField, field.columnName),
                ));
            const targetRef = await db.select({ total: count() })
                .from(metadataRelationsSchema)
                .where(and(
                    eq(metadataRelationsSchema.delFlag, false),
                    eq(metadataRelationsSchema.targetCollectionId, field.collectionId),
                    eq(metadataRelationsSchema.targetField, field.columnName),
                ));
            const refCount = Number(sourceRef[0]?.total || 0) + Number(targetRef[0]?.total || 0);
            if (refCount > 0) {
                return BaseResultData.fail(400, `字段 "${field.columnName}" 被 ${refCount} 个关系引用，请先删除关联关系`);
            }
        }
        await SoftDeleteByKeys(metadataFieldsSchema, 'id', ctx);
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function sortFields(ctx: Context) {
    try {
        const { fields } = ctx.body as { fields: { id: number, sortOrder: number }[] };
        await db.transaction(async (tx) => {
            for (const item of fields) {
                await tx.update(metadataFieldsSchema)
                    .set({ sortOrder: item.sortOrder, updateTime: new Date() } as any)
                    .where(eq(metadataFieldsSchema.id, item.id));
            }
        });
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}
