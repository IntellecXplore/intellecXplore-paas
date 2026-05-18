import { Context } from 'elysia';
import { eq, inArray, and, or } from 'drizzle-orm';
import { BaseResultData } from '@/core/result';
import {
    InsertOne, InsertOneAndRes, FindOneByKey, UpdateByKey, SoftDeleteByKeys,
    CreateQueryBuilder, FindPage, FindAll,
} from '@/core/database/repository';
import { db } from '@/core/database/repository';
import { metadataCollectionsSchema } from '@database/schema/metadata_collections';
import { metadataFieldsSchema } from '@database/schema/metadata_fields';
import { metadataIndexesSchema } from '@database/schema/metadata_indexes';
import { metadataRelationsSchema } from '@database/schema/metadata_relations';
import { BASE_COLUMNS_SQL } from '@database/base-schema';
import { logger } from '@/shared/logger';
import config from '@/config';
import { connectionManager, type StorageConfig } from '@/core/database/connection-manager';

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
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(name)) {
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

function buildDDL(tableName: string, fields: any[], schema?: string): string {
    const lines: string[] = [...BASE_COLUMNS_SQL];

    for (const f of fields) {
        const col = safeIdent(f.columnName);
        const pgTypeFn = TYPE_TO_PG[f.type];
        if (!pgTypeFn) continue;
        if (f.isPrimaryKey) {
            // 替换 BASE_COLUMNS_SQL 中的默认 id BIGSERIAL PRIMARY KEY
            lines[0] = `${col} BIGSERIAL PRIMARY KEY`;
            continue;
        }
        let def = `${col} ${pgTypeFn(f)}`;
        if (!f.nullable) def += ' NOT NULL';
        if (f.default_value !== null && f.default_value !== undefined) {
            def += ` DEFAULT ${safeDefault(f.default_value, f.type)}`;
        }
        if (f.isUnique) def += ' UNIQUE';
        lines.push(def);
    }

    const qualifiedName = schema && schema !== 'public'
        ? `"${safeIdent(schema)}"."${safeIdent(tableName)}"`
        : `"${safeIdent(tableName)}"`;

    return `CREATE TABLE IF NOT EXISTS ${qualifiedName} (\n  ${lines.join(',\n  ')}\n)`;
}

export async function createWithFields(ctx: Context) {
    try {
        const body = ctx.body as {
            collection: Record<string, any>;
            fields: Record<string, any>[];
        };
        const { collection, fields } = body;
        const tenantId = (ctx as any)?.tenantId;
        const createBy = (ctx as any)?.user?.userId || null;

        if (!collection.tableName || !collection.label) {
            return BaseResultData.fail(400, '表名和显示名称为必填项');
        }
        if (!fields || fields.length === 0) {
            return BaseResultData.fail(400, '请至少添加一个字段');
        }
        for (const f of fields) {
            if (!f.columnName || !f.type) {
                return BaseResultData.fail(400, '每个字段必须指定列名和类型');
            }
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f.columnName)) {
                return BaseResultData.fail(400, `列名 "${f.columnName}" 格式非法`);
            }
        }

        const result = await db.transaction(async (tx) => {
            const collData: Record<string, any> = {
                ...collection,
                databaseType: collection.databaseType || 'postgresql',
                status: 'draft',
                version: 1,
                createTime: new Date(),
                tenantId,
                createBy,
                delFlag: false,
            };
            const [created] = await tx.insert(metadataCollectionsSchema).values(collData as any).returning();
            if (!created) throw new Error('创建数据表失败');

            const fieldRecords = fields.map((f: Record<string, any>) => ({
                collectionId: created.id,
                columnName: f.columnName,
                label: f.label || null,
                type: f.type,
                length: f.length ?? null,
                required: f.required ?? false,
                isUnique: f.isUnique ?? false,
                indexed: f.indexed ?? false,
                nullable: f.nullable ?? true,
                default_value: f.default_value || null,
                uiConfig: f.uiConfig || null,
                status: 'active',
                version: 1,
                sortOrder: f.sortOrder ?? 0,
                createTime: new Date(),
                tenantId,
                createBy,
                delFlag: false,
            }));
            await tx.insert(metadataFieldsSchema).values(fieldRecords as any);
            return created;
        });

        return BaseResultData.ok(result);
    } catch (error: any) {
        const detail = error?.cause?.detail || error?.detail || error?.message || String(error);
        const constraint = error?.cause?.constraint || error?.constraint || '';
        const hint = constraint ? `违反约束: ${constraint}. ${detail}` : detail;
        logger.error('批量创建 metadata_collection + fields 失败:', { hint });
        return BaseResultData.fail(500, hint);
    }
}

export async function create(ctx: Context) {
    try {
        const record = await InsertOneAndRes(metadataCollectionsSchema, ctx);
        return BaseResultData.ok(record);
    } catch (error: any) {
        // 提取 PostgreSQL 约束冲突等详细错误
        const detail = error?.cause?.detail || error?.detail || error?.message || String(error);
        const constraint = error?.cause?.constraint || error?.constraint || '';
        const hint = constraint
            ? `违反约束: ${constraint}. ${detail}`
            : detail;
        logger.error('创建 metadata_collection 失败:', { hint, tableName: (ctx.body as any)?.tableName });
        return BaseResultData.fail(500, hint);
    }
}

export async function findList(ctx: Context) {
    try {
        const { pageNum = 1, pageSize = 10, orderByColumn = "create_time",
                sortRule = "desc", tableName, label, databaseType, namespace, status } = ctx.query;
        const whereCondition = CreateQueryBuilder(metadataCollectionsSchema, (ctx as any)?.tenantId)
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
        const data = await FindOneByKey(metadataCollectionsSchema, 'id', cid, (ctx as any)?.tenantId);
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
        const current = await FindOneByKey(metadataCollectionsSchema, 'id', cid, tenantId);
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
                eq(metadataCollectionsSchema.tenantId, tenantId!),
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
        const tenantId = (ctx as any)?.tenantId;
        const inCollection = ids.length === 1
            ? eq(metadataFieldsSchema.collectionId, ids[0])
            : inArray(metadataFieldsSchema.collectionId, ids);
        const fieldWhere = tenantId
            ? and(inCollection, eq(metadataFieldsSchema.tenantId, tenantId))
            : inCollection;
        // 级联软删除关联的 Fields
        await db.update(metadataFieldsSchema)
            .set({ delFlag: true, updateTime: new Date() } as any)
            .where(fieldWhere)
            .execute();
        // 级联软删除关联的 Indexes
        const rawIndexIn = ids.length === 1
            ? eq(metadataIndexesSchema.collectionId, ids[0])
            : inArray(metadataIndexesSchema.collectionId, ids);
        const indexWhere = tenantId
            ? and(rawIndexIn, eq(metadataIndexesSchema.tenantId, tenantId))
            : rawIndexIn;
        await db.update(metadataIndexesSchema)
            .set({ delFlag: true, updateTime: new Date() } as any)
            .where(indexWhere)
            .execute();
        // 级联软删除关联的 Relations（source 或 target 匹配）
        const inCollectionRel = ids.length === 1
            ? eq(metadataRelationsSchema.sourceCollectionId, ids[0])
            : inArray(metadataRelationsSchema.sourceCollectionId, ids);
        const inTargetRel = ids.length === 1
            ? eq(metadataRelationsSchema.targetCollectionId, ids[0])
            : inArray(metadataRelationsSchema.targetCollectionId, ids);
        const relWhere = tenantId
            ? and(or(inCollectionRel, inTargetRel)!, eq(metadataRelationsSchema.tenantId, tenantId))
            : or(inCollectionRel, inTargetRel)!;
        await db.update(metadataRelationsSchema)
            .set({ delFlag: true, updateTime: new Date() } as any)
            .where(relWhere)
            .execute();
        await SoftDeleteByKeys(metadataCollectionsSchema, 'id', ctx);
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
}

async function executeDDL(collectionId: number, tableName: string, fields: any[], version: number, tenantId?: number, storageConfig?: StorageConfig) {
    // 确定目标连接：有独立配置用独立连接，否则用系统默认
    const targetClient = storageConfig ? await connectionManager.getClient(storageConfig) : null;
    const schema = storageConfig?.schema || 'public';
    const qualifiedName = schema !== 'public'
        ? `"${safeIdent(schema)}"."${safeIdent(tableName)}"`
        : `"${safeIdent(tableName)}"`;

    try {
        const ddl = buildDDL(tableName, fields, schema);

        if (targetClient) {
            await targetClient.unsafe(ddl);
        } else {
            await db.execute(ddl);
        }

        // 从 fields.indexed 属性创建简单索引
        const indexFields = fields.filter((f: any) => f.indexed);
        for (const f of indexFields) {
            const col = safeIdent(f.columnName);
            const idxName = `idx_${tableName}_${col}`;
            const idxSql = `CREATE INDEX IF NOT EXISTS ${safeIdent(idxName)} ON ${qualifiedName} (${col})`;
            try {
                if (targetClient) {
                    await targetClient.unsafe(idxSql);
                } else {
                    await db.execute(idxSql);
                }
            } catch (e: any) {
                logger.warn(`[Metadata] Index creation failed: ${idxName}`, e?.message);
            }
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
                    ? idx.fields.map((f: unknown) => {
                        const col = typeof f === 'string' ? f : String(f);
                        return safeIdent(col);
                      }).join(', ')
                    : safeIdent(typeof idx.fields === 'string' ? idx.fields : String(idx.fields));
                const uniqueClause = idx.isUnique ? 'UNIQUE ' : '';
                const type = VALID_INDEX_TYPES.includes(idx.type) ? idx.type : 'btree';
                const whereClause = idx.partialCondition
                    ? (() => {
                        const raw = String(idx.partialCondition);
                        const safe = raw.replace(/[^a-zA-Z0-9_\s(),.=<>!+\-*/%@:]/g, '');
                        if (safe !== raw) {
                            logger.warn(`[Metadata] Partial condition sanitized for index ${idx.name}: stripped unsafe chars`);
                        }
                        return ` WHERE ${safe}`;
                      })()
                    : '';
                const sql2 = `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${safeIdent(idx.name)} ON ${qualifiedName} USING ${type} (${columns})${whereClause}`;
                if (targetClient) {
                    await targetClient.unsafe(sql2);
                } else {
                    await db.execute(sql2);
                }
            } catch (e: any) {
                logger.warn(`[Metadata] Custom index creation failed: ${idx.name}`, e?.message);
            }
        }

        const collFilter = tenantId
            ? and(eq(metadataCollectionsSchema.id, collectionId), eq(metadataCollectionsSchema.tenantId, tenantId))
            : eq(metadataCollectionsSchema.id, collectionId);
        await db.update(metadataCollectionsSchema)
            .set({ status: 'staging', version: version + 1, updateTime: new Date() } as any)
            .where(collFilter)
            .execute();
    } catch (error: any) {
        logger.error(`[Metadata] Publish collection(${collectionId}) failed:`, error?.message || error);
        await db.update(metadataCollectionsSchema)
            .set({ status: 'sync_failed', remark: `DDL error: ${error?.message || error}`, updateTime: new Date() } as any)
            .where(collFilter)
            .execute();
    } finally {
        if (targetClient && storageConfig) {
            connectionManager.releaseByConfig(storageConfig);
        }
    }
}

export async function publish(ctx: Context) {
    try {
        const cid = Number(ctx.params.id);
        const tenantId = (ctx as any)?.tenantId;
        const collection = await FindOneByKey(metadataCollectionsSchema, 'id', cid, tenantId);
        if (!collection || collection.delFlag) return BaseResultData.fail(404);
        if (collection.status !== 'draft' && collection.status !== 'sync_failed') {
            return BaseResultData.fail(400, '仅草稿或失败状态可发布');
        }

        const fieldWhere = CreateQueryBuilder(metadataFieldsSchema, tenantId)
            .eq('delFlag', false)
            .eq('collectionId', cid)
            .eq('status', 'active')
            .build();
        const fields = await FindAll(metadataFieldsSchema, fieldWhere) as any[];

        if (!fields || fields.length === 0) {
            return BaseResultData.fail(400, '请至少添加一个字段后再发布');
        }

        // 原子更新：仅当 status 仍为 draft/sync_failed 时才改为 preparing，防并发竞态
        const result = await db.update(metadataCollectionsSchema)
            .set({ status: 'preparing' as any, updateTime: new Date() } as any)
            .where(and(
                eq(metadataCollectionsSchema.id, cid),
                eq(metadataCollectionsSchema.status, collection.status),
                eq(metadataCollectionsSchema.tenantId, tenantId!),
            ))
            .returning({ id: metadataCollectionsSchema.id });
        if (result.length === 0) {
            return BaseResultData.fail(409, '数据表状态已变更，请刷新后重试');
        }

        const tableName = collection.tableName;
        const version = collection.version || 1;
        const storageConfig = collection.storageConfig as StorageConfig | null;

        await executeDDL(cid, tableName, fields, version, tenantId, storageConfig || undefined);

        const updated = await FindOneByKey(metadataCollectionsSchema, 'id', cid, tenantId);
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
        const tenantId = (ctx as any)?.tenantId;
        const collection = await FindOneByKey(metadataCollectionsSchema, 'id', cid, tenantId);
        if (!collection || collection.delFlag) return BaseResultData.fail(404);
        if (collection.status !== 'staging') {
            return BaseResultData.fail(400, '仅待发布状态可部署上线');
        }
        await UpdateByKey(metadataCollectionsSchema, 'id', ctx, {
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
        const tenantId = (ctx as any)?.tenantId;
        const collection = await FindOneByKey(metadataCollectionsSchema, 'id', cid, tenantId);
        if (!collection || collection.delFlag) return BaseResultData.fail(404);

        const currentStatus = collection.status;
        if (currentStatus !== 'active' && currentStatus !== 'inactive') {
            return BaseResultData.fail(400, '仅已上线或已停用状态可切换');
        }

        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        await UpdateByKey(metadataCollectionsSchema, 'id', ctx, {
            id: cid,
            status: newStatus,
        });
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

export async function testSchema(ctx: Context) {
    try {
        const body = ctx.body as StorageConfig & { createIfNotExists?: boolean };
        if (!body || !body.host || !body.port || !body.username || !body.database) {
            return BaseResultData.fail(400, '数据库配置不完整');
        }
        if (!body.schema || body.schema === 'public') {
            return BaseResultData.ok({ schemaExists: true, schema: 'public' });
        }

        // 先测试连接
        const connResult = await connectionManager.testConnection(body);
        if (!connResult.success) {
            return BaseResultData.ok({ schemaExists: false, connectionError: connResult.error }, '连接失败，无法验证 Schema');
        }

        const exists = await connectionManager.schemaExists(body);
        if (!exists && body.createIfNotExists) {
            await connectionManager.createSchema(body);
            return BaseResultData.ok({ schemaExists: false, created: true, schema: body.schema }, `Schema "${body.schema}" 已创建`);
        }
        return BaseResultData.ok({ schemaExists: exists, schema: body.schema }, exists ? 'Schema 已存在' : 'Schema 不存在');
    } catch (error: any) {
        return BaseResultData.fail(500, error?.message || error);
    }
}

export async function getSystemDbConfig(ctx: Context) {
    try {
        return BaseResultData.ok({
            host: config.pg.host,
            port: config.pg.port,
            username: config.pg.username,
            database: config.pg.database,
        });
    } catch (error: any) {
        return BaseResultData.fail(500, error?.message || error);
    }
}
