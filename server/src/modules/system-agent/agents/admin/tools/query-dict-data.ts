import { registerTool } from '@/core/agent/tool-registry';

async function queryDictData(args: Record<string, unknown>) {
    const mod = await import('@/modules/system-dict/handle');
    const fn = mod.findAllData;
    if (!fn) throw new Error('字典模块未加载');

    const result = await fn({
        query: { dictType: args.dictType || '', dictLabel: args.dictLabel || '' },
    });
    if (result.code === 200 && result.data) {
        return JSON.stringify({ data: result.data, total: Array.isArray(result.data) ? result.data.length : 0 });
    }
    return JSON.stringify({ error: result.msg });
}

registerTool({
    name: 'query_dict_data',
    description: '查询字典数据，可按字典类型过滤',
    parameters: {
        type: 'object',
        properties: {
            dictType: { type: 'string', description: '字典类型编码' },
            dictLabel: { type: 'string', description: '字典标签（模糊搜索）' },
        },
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await queryDictData(args); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
