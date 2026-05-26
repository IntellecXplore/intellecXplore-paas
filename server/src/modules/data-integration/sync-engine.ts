import { FindOneByKey, FindAll, UpdateByKeyAndRes, CreateQueryBuilder } from '@/core/database/repository';
import { client as defaultClient } from '@/core/database/pg';
import { connectionManager, type StorageConfig } from '@/core/database/connection-manager';
import { dataIntegrationSourceSchema } from '@database/schema/data_integration_source';
import { dataIntegrationObjectSchema } from '@database/schema/data_integration_object';
import { dataIntegrationMappingSchema } from '@database/schema/data_integration_mapping';
import { dataIntegrationTaskSchema } from '@database/schema/data_integration_task';
import { dataIntegrationLogSchema } from '@database/schema/data_integration_log';
import { metadataCollectionsSchema } from '@database/schema/metadata_collections';
import { metadataFieldsSchema } from '@database/schema/metadata_fields';
import { getAdapter } from './adapters';
import { decryptConnectionConfig } from './credential';
import { coerceValue } from '@/shared/coerce-value';
import { logger } from '@/shared/logger';

function safeIdent(name: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error(`Invalid SQL identifier: ${name}`);
    }
    return name;
}

/** 获取目标 collection 信息及其字段定义 */
async function getTargetMeta(collectionId: number, tenantId: number = 1) {
    const coll = await FindOneByKey(metadataCollectionsSchema, 'id', collectionId, tenantId) as any;
    if (!coll) throw new Error(`目标数据表(ID=${collectionId})不存在`);

    const builder = new CreateQueryBuilder(metadataFieldsSchema)
        .eq('collectionId', collectionId)
        .eq('delFlag', false)
        .eq('status', 'active');
    const fields = await FindAll(metadataFieldsSchema, builder.build(), {
        orderByColumn: 'sort_order', sortRule: 'asc',
    }) as any[];

    return { collection: coll, fields };
}

/** 获取目标客户端连接 */
function getTargetClient(collection: any) {
    const storageConfig = collection.storageConfig as StorageConfig | null;
    if (storageConfig && storageConfig.host) {
        return connectionManager.getClient(storageConfig);
    }
    return defaultClient;
}

/** 对单行数据应用字段映射 */
function applyMappings(row: Record<string, any>, mappings: any[]): Record<string, any> {
    const result: Record<string, any> = {};
    for (const m of mappings) {
        if (m.transformRule === 'constant') {
            result[m.targetField] = m.transformConfig?.value ?? null;
        } else if (m.transformRule === 'expression' && m.transformConfig?.script) {
            try {
                const fn = new Function('val', 'row', `return ${m.transformConfig.script}`);
                result[m.targetField] = fn(row[m.sourceField], row);
            } catch {
                result[m.targetField] = null;
            }
        } else if (m.transformRule === 'composite') {
            const parts = (m.transformConfig?.fields || []).map((f: string) => row[f] ?? '');
            const sep = m.transformConfig?.separator ?? '';
            result[m.targetField] = parts.join(sep);
        } else {
            // direct
            result[m.targetField] = row[m.sourceField];
        }
    }
    return result;
}

/** 批量写入目标 collection */
async function batchInsert(
    targetClient: any,
    tableName: string,
    collectionFields: any[],
    rows: Record<string, any>[],
    tenantId: number,
): Promise<number> {
    if (rows.length === 0) return 0;

    const writableFields = collectionFields.filter((f: any) => {
        const name = f.columnName;
        return name !== 'id' && name !== 'create_time' && name !== 'update_time'
            && name !== 'update_by' && name !== 'del_flag' && name !== 'remark';
    });

    const qualifiedName = `"${safeIdent(tableName)}"`;
    const columns: string[] = [];
    const allValues: any[] = [];
    let paramIdx = 1;

    // 收集所有行的 SQL 占位符
    const rowPlaceholders: string[] = [];
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const rowParams: string[] = [];
        const rowCols: string[] = [];

        for (const field of writableFields) {
            const val = row[field.columnName];
            if (val === undefined || val === null) continue;
            const coerced = coerceValue(val, field.type, { strict: false });
            if (coerced === null && !field.nullable) continue;

            if (r === 0) {
                rowCols.push(`"${safeIdent(field.columnName)}"`);
            }
            rowParams.push(`$${paramIdx}`);
            allValues.push(coerced);
            paramIdx++;
        }

        // 公共字段
        if (r === 0) {
            columns.push(...rowCols);
            columns.push('"tenant_id"');
        }
        rowParams.push(`$${paramIdx}`); // tenant_id
        allValues.push(tenantId);
        paramIdx++;

        rowPlaceholders.push(`(${rowParams.join(', ')})`);
    }

    if (columns.length === 0) return 0;

    const sql = `INSERT INTO ${qualifiedName} (${columns.join(', ')})
        VALUES ${rowPlaceholders.join(', ')}
        ON CONFLICT DO NOTHING`;

    const result = await targetClient.unsafe(sql, allValues);
    return result.count ?? rows.length;
}

/**
 * 执行单次同步任务。
 * 调用方应自行 try/catch 包裹，失败时更新 log 表。
 */
export async function executeSync(taskId: number, logId: number, tenantId: number = 1): Promise<void> {
    const startTime = Date.now();

    const task = await FindOneByKey(dataIntegrationTaskSchema, 'id', taskId, tenantId) as any;
    if (!task) throw new Error('同步任务不存在');

    const source = await FindOneByKey(dataIntegrationSourceSchema, 'id', task.sourceId, tenantId) as any;
    if (!source) throw new Error('数据源不存在');

    const object = await FindOneByKey(dataIntegrationObjectSchema, 'id', task.objectId, tenantId) as any;
    if (!object) throw new Error('数据对象不存在');

    const adapter = getAdapter(source.productType);
    if (!adapter) throw new Error(`不支持的产品类型: ${source.productType}`);

    // 加载字段映射
    const mappingBuilder = new CreateQueryBuilder(dataIntegrationMappingSchema)
        .eq('objectId', task.objectId)
        .eq('delFlag', false);
    const mappings = await FindAll(dataIntegrationMappingSchema, mappingBuilder.build(), {
        orderByColumn: 'sortOrder', sortRule: 'asc',
    }) as any[];

    // 加载目标 collection
    let targetMeta: { collection: any; fields: any[] } | null = null;
    if (task.targetType === 'collection' && task.targetCollectionId) {
        targetMeta = await getTargetMeta(task.targetCollectionId, tenantId);
    }

    const config = decryptConnectionConfig(source.connectionConfig as any);

    let totalCount = 0;
    let insertCount = 0;
    let errorCount = 0;
    const errorSamples: any[] = [];

    const syncIter = task.syncMode === 'incremental' && task.lastSyncAt
        ? await adapter.incrementalSync(config, object.objectCode, new Date(task.lastSyncAt), {
            batchSize: task.batchSize || 500,
            filterConfig: task.filterConfig as any,
        })
        : await adapter.fullSync(config, object.objectCode, {
            batchSize: task.batchSize || 500,
            filterConfig: task.filterConfig as any,
        });

    for await (const batch of syncIter) {
        totalCount += batch.data.length;

        if (targetMeta && batch.data.length > 0) {
            try {
                const transformed = mappings.length > 0
                    ? batch.data.map(row => applyMappings(row, mappings))
                    : batch.data;

                const targetClient = getTargetClient(targetMeta.collection);
                const written = await batchInsert(
                    targetClient,
                    targetMeta.collection.tableName,
                    targetMeta.fields,
                    transformed,
                    tenantId,
                );
                insertCount += written;
            } catch (error: any) {
                errorCount += batch.data.length;
                if (errorSamples.length < 10) {
                    errorSamples.push({ message: error.message, rowCount: batch.data.length });
                }
            }
        }
    }

    const durationMs = Date.now() - startTime;
    const finalStatus = errorCount === 0 ? 'success'
        : insertCount > 0 ? 'partial' : 'failed';

    await UpdateByKeyAndRes(dataIntegrationTaskSchema, 'id', null, {
        id: taskId,
        lastSyncAt: new Date(),
        lastSyncStatus: finalStatus,
    });

    await UpdateByKeyAndRes(dataIntegrationLogSchema, 'id', null, {
        id: logId,
        endTime: new Date(),
        status: finalStatus,
        totalCount,
        insertCount,
        errorCount,
        errorSamples: errorSamples.length > 0 ? errorSamples : null,
        durationMs,
    });
}
