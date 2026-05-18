import { registerTool } from '@/core/agent/tool-registry';
import type { ToolContext } from '@/core/agent/tool-registry';

async function addFields(args: Record<string, unknown>, ctx: ToolContext) {
    const mod = await import('@/modules/metadata-field/handle');
    const fn = mod.create;
    if (!fn) throw new Error('字段模块未加载');

    const fields = args.fields as any[];
    const results: any[] = [];
    const errors: any[] = [];

    for (const field of fields) {
        try {
            const result = await fn({
                body: {
                    collectionId: args.collectionId, columnName: field.columnName,
                    label: field.label || field.columnName, type: field.type || 'string',
                    length: field.length ?? (field.type === 'string' ? 255 : undefined),
                    required: field.required ?? false, indexed: field.indexed ?? false,
                    isUnique: field.isUnique ?? false,
                    sortOrder: field.sortOrder ?? (results.length + 1), status: 'active',
                },
                user: ctx,
            });
            if (result.code === 200) {
                results.push({ columnName: field.columnName, type: field.type, label: field.label, status: 'ok' });
            } else {
                errors.push({ columnName: field.columnName, error: result.msg });
            }
        } catch (e: any) {
            errors.push({ columnName: field.columnName, error: e.message });
        }
    }

    return JSON.stringify({
        added: results,
        errors: errors.length > 0 ? errors : undefined,
        message: `成功添加 ${results.length} 个字段` + (errors.length > 0 ? `，${errors.length} 个失败` : ''),
    });
}

const fieldItemSchema = {
    type: 'object',
    properties: {
        columnName: { type: 'string', description: '英文列名，如 user_name' },
        label: { type: 'string', description: '中文标签，如 用户名' },
        type: { type: 'string', description: '字段类型：string/text/integer/decimal/boolean/date/datetime/json/email/phone/url/richtext' },
        length: { type: 'integer', description: '长度（string类型用），默认255' },
        required: { type: 'boolean', description: '是否必填，默认false' },
        indexed: { type: 'boolean', description: '是否建索引，默认false' },
        isUnique: { type: 'boolean', description: '是否唯一，默认false' },
        sortOrder: { type: 'integer', description: '排序顺序，默认0' },
    },
    required: ['columnName'],
} as const;

registerTool({
    name: 'add_fields_to_collection',
    description: '向元数据表批量添加字段。在 draft 状态下使用',
    parameters: {
        type: 'object',
        properties: {
            collectionId: { type: 'integer', description: '元数据表ID' },
            fields: { type: 'array', description: '字段定义数组', items: fieldItemSchema },
        },
        required: ['collectionId', 'fields'],
        additionalProperties: false,
    },
    handler: async (args, ctx) => {
        try { return await addFields(args, ctx); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
