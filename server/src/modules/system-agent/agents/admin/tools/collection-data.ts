import { registerTool } from '@/core/agent/tool-registry';
import type { ToolContext } from '@/core/agent/tool-registry';

async function queryData(args: Record<string, unknown>) {
    const mod = await import('@/modules/collection-data/handle');
    const fn = mod.findList;
    if (!fn) throw new Error('数据模块未加载');

    const queryParams: Record<string, any> = {
        pageNum: args.pageNum || 1,
        pageSize: Math.min(Number(args.pageSize) || 20, 100),
    };
    if (args.filters && typeof args.filters === 'object') {
        Object.assign(queryParams, args.filters);
    }

    const result = await fn({ params: { tableName: args.tableName }, query: queryParams });
    if (result.code === 200 && result.data) {
        const { list, total } = result.data;
        return JSON.stringify({ records: list, total, pageNum: args.pageNum || 1 });
    }
    return JSON.stringify({ error: result.msg });
}

async function insertData(args: Record<string, unknown>, ctx: ToolContext) {
    const mod = await import('@/modules/collection-data/handle');
    const fn = mod.create;
    if (!fn) throw new Error('数据模块未加载');

    const result = await fn({ body: { tableName: args.tableName, data: args.data }, user: ctx });
    if (result.code === 200) {
        return JSON.stringify({ message: '数据插入成功', record: result.data });
    }
    return JSON.stringify({ error: result.msg });
}

async function updateData(args: Record<string, unknown>, ctx: ToolContext) {
    const mod = await import('@/modules/collection-data/handle');
    const fn = mod.update;
    if (!fn) throw new Error('数据模块未加载');

    const result = await fn({ body: { tableName: args.tableName, id: args.id, data: args.data }, user: ctx });
    if (result.code === 200) {
        return JSON.stringify({ message: '数据更新成功', record: result.data });
    }
    return JSON.stringify({ error: result.msg });
}

async function deleteData(args: Record<string, unknown>) {
    const mod = await import('@/modules/collection-data/handle');
    const fn = mod.remove;
    if (!fn) throw new Error('数据模块未加载');

    const result = await fn({ params: { tableName: args.tableName, ids: String(args.ids) } });
    if (result.code === 200) {
        return JSON.stringify({ message: `数据删除成功（软删除），ids: ${args.ids}` });
    }
    return JSON.stringify({ error: result.msg });
}

registerTool({
    name: 'query_collection_data',
    description: '查询已上线的动态表中的数据。支持按字段过滤、分页',
    parameters: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: '表名（与元数据表的 tableName 一致）' },
            pageNum: { type: 'integer', description: '页码，默认1', default: 1 },
            pageSize: { type: 'integer', description: '每页数量，默认20，最大100', default: 20 },
            filters: { type: 'object', description: '字段过滤条件，如 {"user_name": "张三", "status": "active"}' },
        },
        required: ['tableName'],
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await queryData(args); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});

registerTool({
    name: 'insert_collection_data',
    description: '向已上线的动态表插入一条新数据',
    parameters: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: '表名' },
            data: { type: 'object', description: '要插入的数据对象' },
        },
        required: ['tableName', 'data'],
        additionalProperties: false,
    },
    handler: async (args, ctx) => {
        try { return await insertData(args, ctx); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});

registerTool({
    name: 'update_collection_data',
    description: '更新动态表中的一条数据',
    parameters: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: '表名' },
            id: { type: 'integer', description: '数据记录ID' },
            data: { type: 'object', description: '要更新的字段和值' },
        },
        required: ['tableName', 'id', 'data'],
        additionalProperties: false,
    },
    handler: async (args, ctx) => {
        try { return await updateData(args, ctx); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});

registerTool({
    name: 'delete_collection_data',
    description: '删除动态表中的数据（软删除）',
    parameters: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: '表名' },
            ids: { type: 'string', description: '要删除的记录ID，多个用逗号分隔' },
        },
        required: ['tableName', 'ids'],
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await deleteData(args); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
