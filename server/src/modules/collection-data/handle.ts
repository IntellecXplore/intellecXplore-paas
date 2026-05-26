import { Context } from 'elysia';
import { eq } from 'drizzle-orm';
import { BaseResultData } from '@/core/result';
import { db, FindAll, CreateQueryBuilder } from '@/core/database/repository';
import { client as defaultClient } from '@/core/database/pg';
import { connectionManager, type StorageConfig } from '@/core/database/connection-manager';
import { metadataCollectionsSchema } from '@database/schema/metadata_collections';
import { metadataFieldsSchema } from '@database/schema/metadata_fields';
import { logger } from '@/shared/logger';
import { coerceValue } from '@/shared/coerce-value';

const BASE_COLUMNS = ['id', 'create_time', 'create_by', 'update_time', 'update_by', 'del_flag', 'remark'];

function safeIdent(name: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,99}$/.test(name)) {
        throw new Error(`Invalid SQL identifier: ${name}`);
    }
    return name;
}

async function getActiveCollection(tableName: string, tenantId: number = 1) {
    const builder = CreateQueryBuilder(metadataCollectionsSchema, tenantId)
        .eq('delFlag', false)
        .eq('tableName', tableName)
        .eq('status', 'active');
    const results = await FindAll(metadataCollectionsSchema, builder.build()) as any[];
    return results[0] || null;
}

async function getFields(collectionId: number) {
    const builder = CreateQueryBuilder(metadataFieldsSchema)
        .eq('delFlag', false)
        .eq('collectionId', collectionId)
        .eq('status', 'active');
    return await FindAll(metadataFieldsSchema, builder.build(), {
        orderByColumn: 'sort_order',
        sortRule: 'asc',
    }) as any[];
}

function buildFilterCondition(field: any, value: string, paramIndex: number): { condition: string; param: any } {
    const col = safeIdent(field.columnName);
    const type = field.type;

    switch (type) {
        case 'string':
        case 'text':
        case 'email':
        case 'phone':
        case 'url':
        case 'richtext':
            return { condition: `${col} ILIKE $${paramIndex}`, param: `%${value}%` };

        case 'integer':
        case 'decimal': {
            const n = Number(value);
            if (isNaN(n)) return { condition: '', param: null };
            return { condition: `${col} = $${paramIndex}`, param: n };
        }

        case 'boolean': {
            const b = value === 'true' || value === '1' || value === '是';
            return { condition: `${col} = $${paramIndex}`, param: b };
        }

        case 'enum':
            return { condition: `${col} = $${paramIndex}`, param: value };

        default:
            return { condition: `${col} ILIKE $${paramIndex}`, param: `%${value}%` };
    }
}

function getTargetClient(collection: any): { client: typeof defaultClient; qualifiedName: string; schema: string } {
    const storageConfig = collection.storageConfig as StorageConfig | null;
    if (storageConfig && storageConfig.host) {
        const client = connectionManager.getClient(storageConfig);
        const schema = storageConfig.schema || 'public';
        const qualifiedName = connectionManager.getQualifiedName(storageConfig, collection.tableName);
        return { client, qualifiedName, schema };
    }
    return {
        client: defaultClient,
        qualifiedName: `"${safeIdent(collection.tableName)}"`,
        schema: 'public',
    };
}

function getAllowedColumns(fields: any[]): string[] {
    return [...BASE_COLUMNS, ...fields.map((f: any) => f.columnName)];
}

function getFieldByColumnName(fields: any[], columnName: string) {
    return fields.find((f: any) => f.columnName === columnName);
}

// ====== Handlers ======

export async function findList(ctx: Context) {
    try {
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const tableName = ctx.params.tableName as string;
        const query = ctx.query as Record<string, any>;

        const collection = await getActiveCollection(tableName, tenantId);
        if (!collection) return BaseResultData.fail(404, '数据表不存在或未激活');

        const fields = await getFields(collection.id);
        const { client: targetClient, qualifiedName: tableIdent } = getTargetClient(collection);

        const pageNum = Math.max(1, Number(query.pageNum) || 1);
        const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 10));

        const skipKeys = new Set(['pageNum', 'pageSize', 'orderByColumn', 'sortRule', 'fields', 'tableName']);

        const actualConditions: string[] = [];
        const params: any[] = [];
        let paramCounter = 1;

        for (const [key, value] of Object.entries(query)) {
            if (skipKeys.has(key)) continue;
            if (value === undefined || value === null || value === '') continue;
            if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) continue;
            const field = getFieldByColumnName(fields, key);
            if (!field) {
                logger.warn(`[CollectionData] Unknown filter field: ${key} on table ${tableName}`);
                continue;
            }
            const { condition, param } = buildFilterCondition(field, String(value), paramCounter);
            if (condition && param !== null) {
                actualConditions.push(condition);
                params.push(param);
                paramCounter++;
            }
        }

        const whereClause = actualConditions.length > 0
            ? `"${tableIdent}".del_flag = false AND ${actualConditions.join(' AND ')} AND "${tableIdent}".tenant_id = $${paramCounter}`
            : `"${tableIdent}".del_flag = false AND "${tableIdent}".tenant_id = $${paramCounter}`;
        params.push(tenantId);
        paramCounter++;

        // Order by
        let orderBy = '"id" DESC';
        if (query.orderByColumn) {
            const allowed = getAllowedColumns(fields);
            if (allowed.includes(query.orderByColumn)) {
                const sortCol = safeIdent(query.orderByColumn);
                const dir = query.sortRule === 'asc' ? 'ASC' : 'DESC';
                orderBy = `"${sortCol}" ${dir}`;
            }
        }

        // Use window function for count (same pattern as FindPage)
        const offset = (pageNum - 1) * pageSize;
        const dataSql = `
            SELECT *, COUNT(*) OVER() AS _total_count
            FROM ${tableIdent}
            WHERE ${whereClause}
            ORDER BY ${orderBy}
            LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
        `;

        const finalParams = [...params, pageSize, offset];
        const rows = await targetClient.unsafe(dataSql, finalParams);
        const total = rows.length > 0 ? Number(rows[0]._total_count) : 0;

        // Strip the _total_count from rows
        const cleanRows = rows.map((r: any) => {
            const { _total_count, ...rest } = r;
            return rest;
        });

        return BaseResultData.ok({ list: cleanRows, total });
    } catch (error: any) {
        logger.error('[CollectionData] findList error:', error?.message || error);
        return BaseResultData.fail(500, error?.message || error);
    }
}

export async function findOne(ctx: Context) {
    try {
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const tableName = ctx.params.tableName as string;
        const id = Number(ctx.params.id);

        const collection = await getActiveCollection(tableName, tenantId);
        if (!collection) return BaseResultData.fail(404, '数据表不存在或未激活');

        const { client: targetClient, qualifiedName: tableIdent } = getTargetClient(collection);

        const rows = await targetClient.unsafe(
            `SELECT * FROM ${tableIdent} WHERE id = $1 AND del_flag = false AND "${tableIdent}".tenant_id = $2`,
            [id, tenantId],
        );

        if (!rows || rows.length === 0) return BaseResultData.fail(404, '数据不存在');
        return BaseResultData.ok(rows[0]);
    } catch (error: any) {
        logger.error('[CollectionData] findOne error:', error?.message || error);
        return BaseResultData.fail(500, error?.message || error);
    }
}

export async function create(ctx: Context) {
    try {
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const body = ctx.body as Record<string, any>;
        const tableName = body.tableName as string;
        const data = body.data as Record<string, any>;

        const collection = await getActiveCollection(tableName, tenantId);
        if (!collection) return BaseResultData.fail(404, '数据表不存在或未激活');

        const fields = await getFields(collection.id);
        const { client: targetClient, qualifiedName: tableIdent } = getTargetClient(collection);

        // Validate required fields and collect columns+values
        const columns: string[] = [];
        const values: any[] = [];
        const placeholders: string[] = [];
        let idx = 1;

        for (const field of fields) {
            if (field.isPrimaryKey || field.columnName === 'id') continue;
            if (field.columnName === 'del_flag' || field.columnName === 'create_time'
                || field.columnName === 'update_time' || field.columnName === 'create_by'
                || field.columnName === 'update_by' || field.columnName === 'remark') continue;

            let value = data[field.columnName];

            // Check required
            if (field.required && (value === undefined || value === null || value === '')) {
                return BaseResultData.fail(400, `字段 ${field.label || field.columnName} 为必填项`);
            }

            // Skip null/undefined values for non-required fields (let DB use defaults)
            if (value === undefined || value === null) continue;

            try {
                value = coerceValue(value, field.type);
            } catch (e: any) {
                return BaseResultData.fail(400, `字段 ${field.label || field.columnName}: ${e.message}`);
            }

            columns.push(`"${safeIdent(field.columnName)}"`);
            values.push(value);
            placeholders.push(`$${idx}`);
            idx++;
        }

        if (columns.length === 0) {
            return BaseResultData.fail(400, '没有可写入的字段');
        }

        // Auto-fill create_by
        const userId = (ctx as any)?.user?.userId || null;
        if (userId) {
            columns.push('"create_by"');
            values.push(userId);
        }

        // Auto-fill tenant_id
        columns.push('"tenant_id"');
        values.push(tenantId);

        const sql = `
            INSERT INTO ${tableIdent} (${columns.join(', ')})
            VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
            RETURNING *
        `;

        const rows = await targetClient.unsafe(sql, values);
        return BaseResultData.ok(rows[0]);
    } catch (error: any) {
        logger.error('[CollectionData] create error:', error?.message || error);
        return BaseResultData.fail(500, error?.message || error);
    }
}

export async function update(ctx: Context) {
    try {
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const body = ctx.body as Record<string, any>;
        const tableName = body.tableName as string;
        const id = Number(body.id);
        const data = body.data as Record<string, any>;

        if (!id || isNaN(id)) return BaseResultData.fail(400, '缺少主键ID');

        const collection = await getActiveCollection(tableName, tenantId);
        if (!collection) return BaseResultData.fail(404, '数据表不存在或未激活');

        const fields = await getFields(collection.id);
        const tableIdent = safeIdent(tableName);

        // Check record exists
        const existing = await targetClient.unsafe(
            `SELECT id FROM "${tableIdent}" WHERE id = $1 AND del_flag = false AND "${tableIdent}".tenant_id = $2`,
            [id, tenantId],
        );
        if (!existing || existing.length === 0) return BaseResultData.fail(404, '数据不存在');

        // Collect update columns
        const setClauses: string[] = [];
        const values: any[] = [];
        let idx = 1;

        for (const field of fields) {
            if (field.isPrimaryKey || field.columnName === 'id'
                || field.columnName === 'create_time' || field.columnName === 'create_by'
                || field.columnName === 'del_flag') continue;

            // Only process fields explicitly included in data
            if (!(field.columnName in data)) continue;

            let value = data[field.columnName];

            if (field.required && (value === null || value === '')) {
                return BaseResultData.fail(400, `字段 ${field.label || field.columnName} 为必填项`);
            }

            if (value === undefined) continue;

            try {
                value = coerceValue(value, field.type);
            } catch (e: any) {
                return BaseResultData.fail(400, `字段 ${field.label || field.columnName}: ${e.message}`);
            }

            setClauses.push(`"${safeIdent(field.columnName)}" = $${idx}`);
            values.push(value);
            idx++;
        }

        if (setClauses.length === 0) return BaseResultData.fail(400, '没有需要更新的字段');

        // Auto-fill update_time and update_by
        setClauses.push(`"update_time" = $${idx}`);
        values.push(new Date().toISOString());
        idx++;

        const userId = (ctx as any)?.user?.userId || null;
        if (userId) {
            setClauses.push(`"update_by" = $${idx}`);
            values.push(userId);
            idx++;
        }

        // Add id and tenant_id as the last params for WHERE
        values.push(id);
        values.push(tenantId);

        const sql = `
            UPDATE "${tableIdent}"
            SET ${setClauses.join(', ')}
            WHERE id = $${idx} AND del_flag = false AND "${tableIdent}".tenant_id = $${idx + 1}
            RETURNING *
        `;

        const rows = await targetClient.unsafe(sql, values);
        return BaseResultData.ok(rows[0]);
    } catch (error: any) {
        logger.error('[CollectionData] update error:', error?.message || error);
        return BaseResultData.fail(500, error?.message || error);
    }
}

export async function remove(ctx: Context) {
    try {
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const tableName = ctx.params.tableName as string;
        const idsStr = ctx.params.ids as string;

        const collection = await getActiveCollection(tableName, tenantId);
        if (!collection) return BaseResultData.fail(404, '数据表不存在或未激活');

        const { client: targetClient, qualifiedName: tableIdent } = getTargetClient(collection);
        const ids = idsStr.split(',').map(Number).filter(n => !isNaN(n));
        if (ids.length === 0) return BaseResultData.fail(400, '缺少ID参数');

        const userId = (ctx as any)?.user?.userId || null;

        // Build IN clause
        const placeholders = ids.map((_, i) => `$${i + 1}`);
        const params: any[] = [true, new Date().toISOString(), ...ids];
        if (userId) params.splice(2, 0, userId);
        params.push(tenantId);

        let sql: string;
        if (userId) {
            sql = `
                UPDATE ${tableIdent}
                SET del_flag = $1, update_time = $2, update_by = $3
                WHERE id IN (${ids.map((_, i) => `$${i + 4}`).join(', ')}) AND del_flag = false AND "${tableIdent}".tenant_id = $${ids.length + 4}
            `;
        } else {
            sql = `
                UPDATE ${tableIdent}
                SET del_flag = $1, update_time = $2
                WHERE id IN (${ids.map((_, i) => `$${i + 3}`).join(', ')}) AND del_flag = false AND "${tableIdent}".tenant_id = $${ids.length + 3}
            `;
        }

        await targetClient.unsafe(sql, params);
        return BaseResultData.ok(null, '删除成功');
    } catch (error: any) {
        logger.error('[CollectionData] remove error:', error?.message || error);
        return BaseResultData.fail(500, error?.message || error);
    }
}
