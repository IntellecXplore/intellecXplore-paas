import { Context } from 'elysia';
import { BaseResultData } from '@/core/result';
import {
    InsertOneAndRes, FindOneByKey, UpdateByKey, UpdateByKeyAndRes,
    SoftDeleteByKeys, FindAll,
    CreateQueryBuilder, FindPage,
} from '@/core/database/repository';
import { dataIntegrationSourceSchema } from '@database/schema/data_integration_source';
import { dataIntegrationObjectSchema } from '@database/schema/data_integration_object';
import { dataIntegrationMappingSchema } from '@database/schema/data_integration_mapping';
import { dataIntegrationTaskSchema } from '@database/schema/data_integration_task';
import { dataIntegrationLogSchema } from '@database/schema/data_integration_log';
import { getAdapter, getRegisteredProductTypes } from './adapters';
import { encryptConnectionConfig, decryptConnectionConfig } from './credential';
import { executeSync } from './sync-engine';
import { logger } from '@/shared/logger';

// ==================== Source CRUD ====================

export async function createSource(ctx: Context) {
    const body = ctx.body as any;
    body.connectionConfig = encryptConnectionConfig(body.connectionConfig);
    const record = await InsertOneAndRes(dataIntegrationSourceSchema, ctx);
    return BaseResultData.ok(record);
}

export async function findSourceList(ctx: Context) {
    const qb = new CreateQueryBuilder(dataIntegrationSourceSchema, (ctx as any).tenantId);
    const query = ctx.query as any;
    if (query.name) qb.ilike('name', query.name);
    if (query.productType) qb.eq('productType', query.productType);
    if (query.connectionType) qb.eq('connectionType', query.connectionType);
    if (query.status) qb.eq('status', query.status);
    qb.eq('delFlag', false);

    const result = await FindPage(dataIntegrationSourceSchema, qb.build(), {
        pageNum: query.pageNum, pageSize: query.pageSize,
        orderByColumn: query.orderByColumn, sortRule: query.sortRule,
    });
    return BaseResultData.ok(result);
}

export async function findSourceOne(ctx: Context) {
    const record = await FindOneByKey(dataIntegrationSourceSchema, 'id', Number(ctx.params.id));
    if (record) {
        try {
            record.connectionConfig = decryptConnectionConfig(record.connectionConfig as any);
        } catch { /* keep encrypted */ }
    }
    return BaseResultData.ok(record);
}

export async function updateSource(ctx: Context) {
    const body = ctx.body as any;
    if (body.connectionConfig) {
        body.connectionConfig = encryptConnectionConfig(body.connectionConfig);
    }
    await UpdateByKey(dataIntegrationSourceSchema, 'id', ctx);
    return BaseResultData.ok(null);
}

export async function removeSource(ctx: Context) {
    await SoftDeleteByKeys(dataIntegrationSourceSchema, 'id', ctx);
    return BaseResultData.ok(null);
}

// ==================== Test Connection ====================

export async function testConnection(ctx: Context) {
    const { productType, connectionConfig } = ctx.body as any;
    const adapter = getAdapter(productType);
    if (!adapter) {
        return BaseResultData.ok({ success: false, error: `不支持的产品类型: ${productType}` });
    }
    try {
        const decrypted = decryptConnectionConfig(connectionConfig);
        const result = await adapter.testConnection(decrypted);
        return BaseResultData.ok(result);
    } catch (error: any) {
        return BaseResultData.ok({ success: false, error: error.message });
    }
}

// ==================== Discover Objects ====================

export async function discoverObjects(ctx: Context) {
    const sourceId = Number(ctx.params.id);
    const source = await FindOneByKey(dataIntegrationSourceSchema, 'id', sourceId);
    if (!source) return BaseResultData.fail(404, '数据源不存在');

    const adapter = getAdapter(source.productType);
    if (!adapter) return BaseResultData.fail(400, `不支持的产品类型: ${source.productType}`);

    try {
        const config = decryptConnectionConfig(source.connectionConfig as any);
        const objects = await adapter.getObjects(config);
        return BaseResultData.ok(objects);
    } catch (error: any) {
        return BaseResultData.fail(500, error.message);
    }
}

// ==================== Object CRUD ====================

export async function createObject(ctx: Context) {
    const record = await InsertOneAndRes(dataIntegrationObjectSchema, ctx);
    return BaseResultData.ok(record);
}

export async function findObjectList(ctx: Context) {
    const qb = new CreateQueryBuilder(dataIntegrationObjectSchema, (ctx as any).tenantId);
    const query = ctx.query as any;
    if (query.sourceId) qb.eq('sourceId', query.sourceId);
    if (query.objectCode) qb.ilike('objectCode', query.objectCode);
    if (query.objectType) qb.eq('objectType', query.objectType);
    qb.eq('delFlag', false);
    const result = await FindPage(dataIntegrationObjectSchema, qb.build(), {
        pageNum: query.pageNum, pageSize: query.pageSize,
        orderByColumn: query.orderByColumn, sortRule: query.sortRule,
    });
    return BaseResultData.ok(result);
}

export async function findObjectOne(ctx: Context) {
    const record = await FindOneByKey(dataIntegrationObjectSchema, 'id', Number(ctx.params.id));
    return BaseResultData.ok(record);
}

export async function updateObject(ctx: Context) {
    await UpdateByKey(dataIntegrationObjectSchema, 'id', ctx);
    return BaseResultData.ok(null);
}

export async function removeObject(ctx: Context) {
    await SoftDeleteByKeys(dataIntegrationObjectSchema, 'id', ctx);
    return BaseResultData.ok(null);
}

// ==================== Get Object Fields from Adapter ====================

export async function getObjectFields(ctx: Context) {
    const objectId = Number(ctx.params.id);
    const object = await FindOneByKey(dataIntegrationObjectSchema, 'id', objectId);
    if (!object) return BaseResultData.fail(404, '数据对象不存在');

    const source = await FindOneByKey(dataIntegrationSourceSchema, 'id', object.sourceId);
    if (!source) return BaseResultData.fail(404, '数据源不存在');

    const adapter = getAdapter(source.productType);
    if (!adapter) return BaseResultData.fail(400, '不支持的产品类型');

    try {
        const config = decryptConnectionConfig(source.connectionConfig as any);
        const fields = await adapter.getFields(config, object.objectCode);
        return BaseResultData.ok(fields);
    } catch (error: any) {
        return BaseResultData.fail(500, error.message);
    }
}

// ==================== Mapping CRUD ====================

export async function createMapping(ctx: Context) {
    const record = await InsertOneAndRes(dataIntegrationMappingSchema, ctx);
    return BaseResultData.ok(record);
}

export async function findMappingList(ctx: Context) {
    const qb = new CreateQueryBuilder(dataIntegrationMappingSchema, (ctx as any).tenantId);
    const query = ctx.query as any;
    if (query.objectId) qb.eq('objectId', query.objectId);
    qb.eq('delFlag', false);
    const result = await FindPage(dataIntegrationMappingSchema, qb.build(), {
        pageNum: query.pageNum, pageSize: query.pageSize,
        orderByColumn: 'sortOrder', sortRule: 'asc',
    });
    return BaseResultData.ok(result);
}

export async function updateMapping(ctx: Context) {
    await UpdateByKey(dataIntegrationMappingSchema, 'id', ctx);
    return BaseResultData.ok(null);
}

export async function removeMapping(ctx: Context) {
    await SoftDeleteByKeys(dataIntegrationMappingSchema, 'id', ctx);
    return BaseResultData.ok(null);
}

// ==================== Task CRUD ====================

export async function createTask(ctx: Context) {
    const record = await InsertOneAndRes(dataIntegrationTaskSchema, ctx);
    return BaseResultData.ok(record);
}

export async function findTaskList(ctx: Context) {
    const qb = new CreateQueryBuilder(dataIntegrationTaskSchema, (ctx as any).tenantId);
    const query = ctx.query as any;
    if (query.name) qb.ilike('name', query.name);
    if (query.sourceId) qb.eq('sourceId', query.sourceId);
    if (query.status) qb.eq('status', query.status);
    qb.eq('delFlag', false);
    const result = await FindPage(dataIntegrationTaskSchema, qb.build(), {
        pageNum: query.pageNum, pageSize: query.pageSize,
        orderByColumn: query.orderByColumn, sortRule: query.sortRule,
    });
    return BaseResultData.ok(result);
}

export async function findTaskOne(ctx: Context) {
    const record = await FindOneByKey(dataIntegrationTaskSchema, 'id', Number(ctx.params.id));
    return BaseResultData.ok(record);
}

export async function updateTask(ctx: Context) {
    await UpdateByKey(dataIntegrationTaskSchema, 'id', ctx);
    return BaseResultData.ok(null);
}

export async function removeTask(ctx: Context) {
    await SoftDeleteByKeys(dataIntegrationTaskSchema, 'id', ctx);
    return BaseResultData.ok(null);
}

// ==================== Task Actions ====================

export async function triggerSync(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const task = await FindOneByKey(dataIntegrationTaskSchema, 'id', taskId);
    if (!task) return BaseResultData.fail(404, '任务不存在');

    const logEntry = {
        taskId,
        startTime: new Date(),
        status: 'running',
        triggerType: 'manual',
    };
    const logRecord = await InsertOneAndRes(dataIntegrationLogSchema, null, logEntry as any);

    const tenantId = (ctx as any)?.tenantId ?? 1;
    executeSync(taskId, logRecord.id, tenantId).catch(err => {
        logger.error(`[Integration] Sync failed for task ${taskId}: ${err.message}`);
    });

    return BaseResultData.ok({ logId: logRecord.id });
}

export async function toggleTask(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const task = await FindOneByKey(dataIntegrationTaskSchema, 'id', taskId);
    if (!task) return BaseResultData.fail(404, '任务不存在');

    const newStatus = task.status === 'active' ? 'paused' : 'active';
    await UpdateByKeyAndRes(dataIntegrationTaskSchema, 'id', null, { id: taskId, status: newStatus });
    return BaseResultData.ok({ status: newStatus });
}

export async function previewData(ctx: Context) {
    const taskId = Number(ctx.params.id);
    const task = await FindOneByKey(dataIntegrationTaskSchema, 'id', taskId);
    if (!task) return BaseResultData.fail(404, '任务不存在');

    const source = await FindOneByKey(dataIntegrationSourceSchema, 'id', task.sourceId);
    if (!source) return BaseResultData.fail(404, '数据源不存在');

    const object = await FindOneByKey(dataIntegrationObjectSchema, 'id', task.objectId);
    if (!object) return BaseResultData.fail(404, '数据对象不存在');

    const adapter = getAdapter(source.productType);
    if (!adapter) return BaseResultData.fail(400, '不支持的产品类型');

    try {
        const config = decryptConnectionConfig(source.connectionConfig as any);
        const limit = Number((ctx.query as any).limit) || 10;
        const syncIter = task.syncMode === 'incremental' && task.lastSyncAt
            ? await adapter.incrementalSync(config, object.objectCode, new Date(task.lastSyncAt), { batchSize: limit })
            : await adapter.fullSync(config, object.objectCode, { batchSize: limit });

        const iterator = syncIter[Symbol.asyncIterator]();
        const first = await iterator.next();
        const list = first.value?.data?.slice(0, limit) || [];
        const total = first.value?.total || list.length;

        return BaseResultData.ok({ list, total });
    } catch (error: any) {
        return BaseResultData.fail(500, error.message);
    }
}

// ==================== Log ====================

export async function findLogList(ctx: Context) {
    const qb = new CreateQueryBuilder(dataIntegrationLogSchema, (ctx as any).tenantId);
    const query = ctx.query as any;
    if (query.taskId) qb.eq('taskId', query.taskId);
    if (query.status) qb.eq('status', query.status);
    qb.eq('delFlag', false);
    const result = await FindPage(dataIntegrationLogSchema, qb.build(), {
        pageNum: query.pageNum, pageSize: query.pageSize,
        orderByColumn: 'startTime', sortRule: 'desc',
    });
    return BaseResultData.ok(result);
}

export async function findLogOne(ctx: Context) {
    const record = await FindOneByKey(dataIntegrationLogSchema, 'id', Number(ctx.params.id));
    return BaseResultData.ok(record);
}

// ==================== Webhook Receiver ====================

export async function webhookReceive(ctx: Context) {
    const sourceId = Number(ctx.params.sourceId);
    const source = await FindOneByKey(dataIntegrationSourceSchema, 'id', sourceId);
    if (!source) return BaseResultData.fail(404, '数据源不存在');
    if (source.status !== 'active') return BaseResultData.fail(400, '数据源未启用');

    const adapter = getAdapter(source.productType);
    if (!adapter?.verifyWebhookSignature) {
        return BaseResultData.fail(400, '该产品类型不支持 Webhook');
    }

    // 签名验证
    const body = (ctx.body as any) ?? {};
    const payload = JSON.stringify(body);
    const signature = (ctx.headers as any)?.['x-kingdee-signature']
        || (ctx.headers as any)?.['x-ca-signature']
        || (ctx.headers as any)?.['x-signature']
        || '';

    const config = decryptConnectionConfig(source.connectionConfig as any);
    if (!adapter.verifyWebhookSignature!(payload, signature, config)) {
        logger.warn(`[Integration] Webhook 签名验证失败 sourceId=${sourceId}`);
        return BaseResultData.fail(403, '签名验证失败');
    }

    // 快速响应（金蝶要求 3 秒内返回）
    // 异步查找匹配任务并触发同步
    const tenantId = (ctx as any)?.tenantId ?? 1;
    handleWebhookEvent(sourceId, source.productType, body, tenantId).catch(err => {
        logger.error(`[Integration] Webhook 事件处理失败 sourceId=${sourceId}: ${err.message}`);
    });

    return BaseResultData.ok({ message: 'received' });
}

async function handleWebhookEvent(sourceId: number, productType: string, payload: any, tenantId: number) {
    // 查找该数据源关联的所有 active 任务
    const taskQb = new CreateQueryBuilder(dataIntegrationTaskSchema, tenantId)
        .eq('sourceId', sourceId)
        .eq('status', 'active')
        .eq('delFlag', false);
    const tasks = await FindAll(dataIntegrationTaskSchema, taskQb.build()) as any[];

    for (const task of tasks) {
        // 创建日志并触发同步
        const logEntry = {
            taskId: task.id,
            startTime: new Date(),
            status: 'running',
            triggerType: 'webhook',
        };
        const logRecord = await InsertOneAndRes(dataIntegrationLogSchema, null, logEntry as any);

        logger.info(`[Integration] Webhook 触发同步: task=${task.id} sourceId=${sourceId}`);
        executeSync(task.id, logRecord.id, tenantId).catch(err => {
            logger.error(`[Integration] Webhook 同步失败 task=${task.id}: ${err.message}`);
        });
    }
}

// ==================== Product Types ====================

export async function getProductTypes(_ctx: Context) {
    return BaseResultData.ok(getRegisteredProductTypes());
}
