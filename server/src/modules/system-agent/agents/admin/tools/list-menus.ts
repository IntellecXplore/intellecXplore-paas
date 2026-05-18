import { registerTool } from '@/core/agent/tool-registry';
import type { ToolContext } from '@/core/agent/tool-registry';

async function listMenus(_args: Record<string, unknown>, ctx: ToolContext) {
    const mod = await import('@/modules/system-menu/handle');
    const fn = mod.findSimple;
    if (!fn) throw new Error('菜单模块未加载');

    const mockCtx = { user: { userId: ctx.userId } };
    const result = await fn(mockCtx);
    if (result.code === 200 && result.data) {
        const menus = Array.isArray(result.data) ? result.data : result.data.list || [];
        return JSON.stringify({
            menus: menus.slice(0, 50).map((m: any) => ({
                title: m.title || m.menuName,
                path: m.path,
                icon: m.icon,
            })),
            total: menus.length,
        });
    }
    return JSON.stringify({ error: result.msg });
}

registerTool({
    name: 'list_menus',
    description: '获取系统菜单列表',
    parameters: {
        type: 'object',
        properties: {
            title: { type: 'string', description: '菜单标题（模糊搜索）' },
        },
        additionalProperties: false,
    },
    handler: async (args, ctx) => {
        try { return await listMenus(args, ctx); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
