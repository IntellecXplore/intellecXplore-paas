import { registerTool } from '@/core/agent/tool-registry';
import type { ToolContext } from '@/core/agent/tool-registry';

async function createCollection(args: Record<string, unknown>, ctx: ToolContext) {
    const mod = await import('@/modules/metadata-collection/handle');
    const fn = mod.create;
    if (!fn) throw new Error('元数据模块未加载');

    const result = await fn({
        body: {
            tableName: args.tableName, label: args.label,
            description: args.description || '', namespace: args.namespace || 'default',
            databaseType: 'postgresql',
        },
        user: ctx,
    });
    if (result.code === 200 && result.data) {
        return JSON.stringify({
            created: result.data,
            message: `元数据表 "${args.label}" (${args.tableName}) 创建成功，状态为 draft。接下来需要添加字段。`,
        });
    }
    return JSON.stringify({ error: result.msg });
}

async function runAction(args: Record<string, unknown>, action: string) {
    const mod = await import('@/modules/metadata-collection/handle');
    const fn = mod[action];
    if (!fn) throw new Error('元数据模块未加载');

    const result = await fn({ params: { id: String(args.collectionId) } });
    if (result.code === 200) {
        const msgs: Record<string, string> = {
            publish: '建表成功！物理表已在数据库中创建，状态变更为 staging。接下来使用 deploy_collection 部署上线。',
            deploy: '部署上线成功！表现在处于 active 状态，可以向其中插入和查询数据。',
        };
        return JSON.stringify({ message: msgs[action] || '操作成功', success: true });
    }
    return JSON.stringify({ error: result.msg, success: false });
}

registerTool({
    name: 'create_collection',
    description: '创建一个新的元数据表定义。创建后状态为 draft，需要用 add_fields_to_collection 添加字段，然后用 publish_collection 发布建表',
    parameters: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: '英文表名，小写+下划线，如 user_profiles' },
            label: { type: 'string', description: '中文标签，如 用户档案' },
            description: { type: 'string', description: '表描述/用途说明' },
            namespace: { type: 'string', description: '命名空间，用于分组' },
        },
        required: ['tableName', 'label'],
        additionalProperties: false,
    },
    handler: async (args, ctx) => {
        try { return await createCollection(args, ctx); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});

registerTool({
    name: 'publish_collection',
    description: '发布元数据表——在数据库中执行 CREATE TABLE 建表语句。需要先添加字段。状态从 draft 变为 staging',
    parameters: {
        type: 'object',
        properties: {
            collectionId: { type: 'integer', description: '元数据表ID' },
        },
        required: ['collectionId'],
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await runAction(args, 'publish'); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});

registerTool({
    name: 'deploy_collection',
    description: '部署元数据表上线——状态从 staging 变为 active。部署后即可插入和查询数据',
    parameters: {
        type: 'object',
        properties: {
            collectionId: { type: 'integer', description: '元数据表ID' },
        },
        required: ['collectionId'],
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await runAction(args, 'deploy'); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
