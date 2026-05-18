import { registerTool } from '@/core/agent/tool-registry';

async function listCollections(args: Record<string, unknown>) {
    const mod = await import('@/modules/metadata-collection/handle');
    const fn = mod.findList;
    if (!fn) throw new Error('元数据模块未加载');

    const result = await fn({
        query: {
            pageNum: args.pageNum || 1,
            pageSize: args.pageSize || 10,
            tableName: args.tableName || '',
            label: args.label || '',
            status: args.status || '',
        },
    });
    if (result.code === 200 && result.data) {
        const { list, total } = result.data;
        const summary = (list || []).map((c: any) => ({
            id: c.id, tableName: c.tableName, label: c.label,
            status: c.status, description: c.description, updatedAt: c.updateTime,
        }));
        return JSON.stringify({ collections: summary, total });
    }
    return JSON.stringify({ error: result.msg });
}

registerTool({
    name: 'list_collections',
    description: '查询元数据表列表，可按表名或标签搜索',
    parameters: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: '表名（模糊搜索）' },
            label: { type: 'string', description: '标签（模糊搜索）' },
            status: { type: 'string', description: '状态过滤：draft/preparing/staging/active/inactive' },
            pageNum: { type: 'integer', description: '页码，默认1', default: 1 },
            pageSize: { type: 'integer', description: '每页数量，默认10', default: 10 },
        },
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await listCollections(args); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
