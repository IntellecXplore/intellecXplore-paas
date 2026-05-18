import { registerTool } from '@/core/agent/tool-registry';

async function getCollectionDetail(args: Record<string, unknown>) {
    const collMod = await import('@/modules/metadata-collection/handle');
    const fieldMod = await import('@/modules/metadata-field/handle');
    const collFn = collMod.findOne;
    const fieldFn = fieldMod.findList;
    if (!collFn) throw new Error('元数据模块未加载');

    const collResult = await collFn({ params: { id: String(args.collectionId) } });
    if (collResult.code !== 200 || !collResult.data) {
        return JSON.stringify({ error: collResult.msg || '表不存在' });
    }
    const collection = collResult.data;

    let fields: any[] = [];
    if (fieldFn) {
        const fieldResult = await fieldFn({
            query: { collectionId: args.collectionId, pageNum: 1, pageSize: 200 },
        });
        if (fieldResult.code === 200 && fieldResult.data) {
            fields = fieldResult.data.list || [];
        }
    }

    return JSON.stringify({
        collection: {
            id: collection.id, tableName: collection.tableName, label: collection.label,
            description: collection.description, status: collection.status,
            namespace: collection.namespace, version: collection.version,
        },
        fields: fields.map((f: any) => ({
            id: f.id, columnName: f.columnName, label: f.label, type: f.type,
            length: f.length, required: f.required, indexed: f.indexed,
            isUnique: f.isUnique, sortOrder: f.sortOrder,
        })),
        fieldCount: fields.length,
    });
}

registerTool({
    name: 'get_collection_detail',
    description: '获取某个元数据表的详细信息，包括所有字段定义',
    parameters: {
        type: 'object',
        properties: {
            collectionId: { type: 'integer', description: '元数据表ID' },
        },
        required: ['collectionId'],
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await getCollectionDetail(args); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
