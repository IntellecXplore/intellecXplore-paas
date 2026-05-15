import { Context } from 'elysia';
import { eq, inArray, and } from 'drizzle-orm';
import { BaseResultData } from '@/core/result';
import {
    InsertOne, InsertOneAndRes, FindOneByKey, UpdateByKey, SoftDeleteByKeys,
    CreateQueryBuilder, FindPage, FindAll,
} from '@/core/database/repository';
import { db } from '@/core/database/repository';
import { metadataCollectionsSchema } from '@database/schema/metadata_collections';
import { metadataFieldsSchema } from '@database/schema/metadata_fields';
import { metadataIndexesSchema } from '@database/schema/metadata_indexes';
import { BASE_COLUMNS_SQL } from '@database/base-schema';
import { logger } from '@/shared/logger';

const VALID_INDEX_TYPES = ['btree', 'hash', 'gist', 'gin', 'brin', 'sp-gist'];

const TYPE_TO_PG: Record<string, (f: any) => string> = {
    string: (f) => `VARCHAR(${f.length || 255})`,
    text: () => 'TEXT',
    integer: () => 'INTEGER',
    decimal: (f) => `DECIMAL(${f.precision || 10}, ${f.scale || 2})`,
    boolean: () => 'BOOLEAN',
    date: () => 'DATE',
    datetime: () => 'TIMESTAMP',
    json: () => 'JSONB',
    email: (f) => `VARCHAR(${f.length || 255})`,
    phone: (f) => `VARCHAR(${f.length || 64})`,
    url: (f) => `VARCHAR(${f.length || 500})`,
    enum: (f) => `VARCHAR(${f.length || 100})`,
    richtext: () => 'TEXT',
};

function safeIdent(name: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,99}$/.test(name)) {
        throw new Error(`Invalid SQL identifier: ${name}`);
    }
    return name;
}

function safeDefault(value: any, type: string): string {
    const numTypes = ['integer', 'decimal'];
    const boolType = 'boolean';
    if (numTypes.includes(type)) {
        const n = Number(value);
        if (isNaN(n)) throw new Error(`Invalid numeric default: ${value}`);
        return String(n);
    }
    if (type === boolType) {
        if (value === true || value === 'true') return 'TRUE';
        if (value === false || value === 'false') return 'FALSE';
        throw new Error(`Invalid boolean default: ${value}`);
    }
    return `'${String(value).replace(/'/g, "''")}'`;
}

function buildDDL(tableName: string, fields: any[]): string {
    const lines: string[] = [...BASE_COLUMNS_SQL];

    for (const f of fields) {
        const col = safeIdent(f.columnName);
        const pgTypeFn = TYPE_TO_PG[f.type];
        if (!pgTypeFn) continue;
        let def = `${col} ${pgTypeFn(f)}`;
        if (f.isPrimaryKey) {
            // BASE_COLUMNS_SQL already provides 'id BIGSERIAL PRIMARY KEY'
            continue;
        }
        if (!f.nullable) def += ' NOT NULL';
        if (f.default_value !== null && f.default_value !== undefined) {
            def += ` DEFAULT ${safeDefault(f.default_value, f.type)}`;
        }
        if (f.isUnique) def += ' UNIQUE';
        lines.push(def);
    }

    return `CREATE TABLE IF NOT EXISTS ${safeIdent(tableName)} (\n  ${lines.join(',\n  ')}\n)`;
}

export async function create(ctx: Context) {
    try {
        const record = await InsertOneAndRes(metadataCollectionsSchema, ctx);
        return BaseResultData.ok(record);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function findList(ctx: Context) {
    try {
        const { pageNum = 1, pageSize = 10, orderByColumn = "create_time",
                sortRule = "desc", tableName, label, databaseType, namespace, status } = ctx.query;
        const whereCondition = CreateQueryBuilder(metadataCollectionsSchema)
            .eq('delFlag', false)
            .like('tableName', tableName)
            .like('label', label)
            .eq('databaseType', databaseType)
            .eq('namespace', namespace)
            .eq('status', status)
            .build();
        const res = await FindPage(metadataCollectionsSchema, whereCondition, {
            pageNum, pageSize, orderByColumn, sortRule
        });
        return BaseResultData.ok(res);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function findOne(ctx: Context) {
    try {
        const cid = Number(ctx.params.id);
        const data = await FindOneByKey(metadataCollectionsSchema, 'id', cid);
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
        const current = await FindOneByKey(metadataCollectionsSchema, 'id', cid);
        if (!current || current.delFlag) return BaseResultData.fail(404);

        const expectedVersion = current.version || 0;
        const updateData: Record<string, any> = {
            ...body,
            version: expectedVersion + 1,
            updateTime: new Date(),
        };
        const updateBy = (ctx as any)?.user?.userId || null;
        if (updateBy) updateData.updateBy = updateBy;

        const result = await db.update(metadataCollectionsSchema)
            .set(updateData as any)
            .where(and(
                eq(metadataCollectionsSchema.id, cid),
                eq(metadataCollectionsSchema.version, expectedVersion),
            ))
            .returning({ id: metadataCollectionsSchema.id });

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
        // 级联软删除关联的 Fields
        if (ids.length === 1) {
            await db.update(metadataFieldsSchema)
                .set({ delFlag: true, updateTime: new Date() } as any)
                .where(eq(metadataFieldsSchema.collectionId, ids[0]))
                .execute();
        } else {
            await db.update(metadataFieldsSchema)
                .set({ delFlag: true, updateTime: new Date() } as any)
                .where(inArray(metadataFieldsSchema.collectionId, ids))
                .execute();
        }
        await SoftDeleteByKeys(metadataCollectionsSchema, 'id', ctx);
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

async function executeDDL(collectionId: number, tableName: string, fields: any[], version: number) {
    try {
        const ddl = buildDDL(tableName, fields);
        await db.execute(ddl);

        // 从 fields.indexed 属性创建简单索引
        const indexFields = fields.filter((f: any) => f.indexed);
        for (const f of indexFields) {
            const col = safeIdent(f.columnName);
            const idxName = `idx_${tableName}_${col}`;
            await db.execute(`CREATE INDEX IF NOT EXISTS ${idxName} ON ${safeIdent(tableName)} (${col})`).catch((e) => {
                logger.warn(`[Metadata] Index creation failed: ${idxName}`, e?.message);
            });
        }

        // 从 metadata_indexes 表创建高级索引
        const indexWhere = CreateQueryBuilder(metadataIndexesSchema)
            .eq('delFlag', false)
            .eq('collectionId', collectionId)
            .eq('status', 'active')
            .build();
        const customIndexes = await FindAll(metadataIndexesSchema, indexWhere) as any[];
        for (const idx of customIndexes) {
            try {
                const columns = Array.isArray(idx.fields)
                    ? idx.fields.map((f: string) => safeIdent(String(f))).join(', ')
                    : safeIdent(String(idx.fields));
                const uniqueClause = idx.isUnique ? 'UNIQUE ' : '';
                const type = VALID_INDEX_TYPES.includes(idx.type) ? idx.type : 'btree';
                const whereClause = idx.partialCondition
                    ? ` WHERE ${String(idx.partialCondition).replace(/[^a-zA-Z0-9_\s(),.'=<>!+\-*/%@:]/g, '')}`
                    : '';
                const sql2 = `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${safeIdent(idx.name)} ON ${safeIdent(tableName)} USING ${type} (${columns})${whereClause}`;
                await db.execute(sql2);
            } catch (e: any) {
                logger.warn(`[Metadata] Custom index creation failed: ${idx.name}`, e?.message);
            }
        }

        await db.update(metadataCollectionsSchema)
            .set({ status: 'staging', version: version + 1, updateTime: new Date() } as any)
            .where(eq(metadataCollectionsSchema.id, collectionId))
            .execute();
    } catch (error: any) {
        logger.error(`[Metadata] Publish collection(${collectionId}) failed:`, error?.message || error);
        await db.update(metadataCollectionsSchema)
            .set({ status: 'sync_failed', remark: `DDL error: ${error?.message || error}`, updateTime: new Date() } as any)
            .where(eq(metadataCollectionsSchema.id, collectionId))
            .execute();
    }
}

export async function publish(ctx: Context) {
    try {
        const cid = Number(ctx.params.id);
        const collection = await FindOneByKey(metadataCollectionsSchema, 'id', cid);
        if (!collection || collection.delFlag) return BaseResultData.fail(404);
        if (collection.status !== 'draft' && collection.status !== 'sync_failed') {
            return BaseResultData.fail(400, '仅草稿或失败状态可发布');
        }

        const fieldWhere = CreateQueryBuilder(metadataFieldsSchema)
            .eq('delFlag', false)
            .eq('collectionId', cid)
            .eq('status', 'active')
            .build();
        const fields = await FindAll(metadataFieldsSchema, fieldWhere) as any[];

        if (!fields || fields.length === 0) {
            return BaseResultData.fail(400, '请至少添加一个字段后再发布');
        }

        await UpdateByKey(metadataCollectionsSchema, 'id', null, {
            id: cid,
            status: 'preparing',
        });

        const tableName = collection.tableName;
        const version = collection.version || 1;

        await executeDDL(cid, tableName, fields, version);

        const updated = await FindOneByKey(metadataCollectionsSchema, 'id', cid);
        if (updated && updated.status === 'sync_failed') {
            return BaseResultData.fail(500, updated.remark || 'DDL 执行失败');
        }
        return BaseResultData.ok();
    } catch (error: any) {
        return BaseResultData.fail(500, error?.message || error);
    }
}

export async function deploy(ctx: Context) {
    try {
        const cid = Number(ctx.params.id);
        const collection = await FindOneByKey(metadataCollectionsSchema, 'id', cid);
        if (!collection || collection.delFlag) return BaseResultData.fail(404);
        if (collection.status !== 'staging') {
            return BaseResultData.fail(400, '仅待发布状态可部署上线');
        }
        await UpdateByKey(metadataCollectionsSchema, 'id', null, {
            id: cid,
            status: 'active',
        });
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

export async function toggleStatus(ctx: Context) {
    try {
        const cid = Number(ctx.params.id);
        const collection = await FindOneByKey(metadataCollectionsSchema, 'id', cid);
        if (!collection || collection.delFlag) return BaseResultData.fail(404);

        const currentStatus = collection.status;
        if (currentStatus !== 'active' && currentStatus !== 'inactive') {
            return BaseResultData.fail(400, '仅已上线或已停用状态可切换');
        }

        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await UpdateByKey(metadataCollectionsSchema, 'id', null, {
            id: cid,
            status: newStatus,
        });
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}
