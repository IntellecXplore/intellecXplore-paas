import { registerTool } from '@/core/agent/tool-registry';
import type { ToolContext } from '@/core/agent/tool-registry';

async function deleteCollection(args: Record<string, unknown>, ctx: ToolContext) {
    // 1. 加载 collection 信息
    const collMod = await import('@/modules/metadata-collection/handle');
    const collFn = collMod.findOne;
    if (!collFn) throw new Error('元数据模块未加载');

    const collectionId = Number(args.collectionId);
    const collResult = await collFn({ params: { id: String(collectionId) } });
    if (collResult.code !== 200 || !collResult.data) {
        return JSON.stringify({ error: collResult.msg || '表不存在' });
    }
    const collection = collResult.data;
    const tableName = collection.tableName;
    const status = collection.status;

    const results: string[] = [];

    // 2. 删除物理表（如果存在）
    if (status === 'active' || status === 'staging') {
        try {
            const { db } = await import('@/core/database/repository');
            const { default: config2 } = await import('@/config');
            const schema = config2.app?.database?.schema || 'public';
            const qualifiedName = schema !== 'public'
                ? `"${schema}"."${tableName}"`
                : `"${tableName}"`;

            await db.execute(`DROP TABLE IF EXISTS ${qualifiedName}`);
            results.push(`物理表 ${tableName} 已删除`);
        } catch (e: any) {
            results.push(`物理表删除失败: ${e.message}`);
        }
    }

    // 3. 删除关联菜单
    try {
        const menuMod = await import('@/modules/system-menu/handle');
        const menuFn = menuMod.findList;
        if (menuFn) {
            const menuResult = await menuFn({
                query: {
                    pageNum: 1, pageSize: 100,
                    metadataCollectionId: collectionId,
                },
            });
            if (menuResult.code === 200 && menuResult.data?.list?.length > 0) {
                const removeFn = menuMod.deleteMenu || menuMod.remove;
                if (removeFn) {
                    let deletedCount = 0;
                    for (const menu of menuResult.data.list) {
                        try {
                            await removeFn({ params: { id: String(menu.menuId || menu.id) } });
                            deletedCount++;
                        } catch { /* skip */ }
                    }
                    if (deletedCount > 0) results.push(`已删除 ${deletedCount} 个关联菜单`);
                }
            }
        }
    } catch { /* menu delete is best-effort */ }

    // 4. 删除 collection 定义和 fields（软删除）
    const removeFn = collMod.remove;
    if (removeFn) {
        const mockCtx = {
            params: { ids: String(collectionId) },
            user: { userId: ctx.userId, userName: ctx.userName },
        };
        const removeResult = await removeFn(mockCtx);
        if (removeResult.code === 200) {
            results.push(`元数据表定义 "${collection.label || tableName}" (${tableName}) 已删除`);
        } else {
            results.push(`元数据表定义删除失败: ${removeResult.msg}`);
        }
    }

    return JSON.stringify({
        message: results.join('；'),
        details: results,
        success: true,
    });
}

registerTool({
    name: 'delete_collection',
    description: '删除整个元数据表——包括物理表（DROP TABLE）、表定义、关联字段、关联菜单。请谨慎使用，操作不可逆',
    parameters: {
        type: 'object',
        properties: {
            collectionId: { type: 'integer', description: '元数据表ID' },
        },
        required: ['collectionId'],
        additionalProperties: false,
    },
    handler: async (args, ctx) => {
        try { return await deleteCollection(args, ctx); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
