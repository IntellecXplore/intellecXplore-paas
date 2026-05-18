import { registerTool } from '@/core/agent/tool-registry';
import type { ToolContext } from '@/core/agent/tool-registry';

registerTool({
    name: 'get_user_permissions',
    description: '获取当前用户的权限列表、角色信息和用户基本信息',
    parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
    },
    handler: async (_args, ctx: ToolContext) => {
        return JSON.stringify({
            userId: ctx.userId, userName: ctx.userName,
            permissions: ctx.permissions, roles: ctx.roles,
            permissionCount: ctx.permissions.length, roleCount: ctx.roles.length,
        });
    },
});

registerTool({
    name: 'create_menu',
    description: '创建一个新的系统菜单路由。仅在有 system:menu:create 权限时使用',
    parameters: {
        type: 'object',
        properties: {
            title: { type: 'string', description: '菜单标题' },
            path: { type: 'string', description: '路由路径，如 /system/customer-info' },
            component: { type: 'string', description: '前端组件路径' },
            name: { type: 'string', description: '路由名称' },
            icon: { type: 'string', description: '图标' },
            sort: { type: 'integer', description: '排序号，默认0', default: 0 },
            parentId: { type: 'integer', description: '父菜单ID，0表示顶级菜单', default: 0 },
            metadataCollectionId: { type: 'integer', description: '关联的元数据表ID' },
            keepAlive: { type: 'boolean', description: '是否缓存页面', default: true },
            isHide: { type: 'boolean', description: '是否隐藏', default: false },
        },
        required: ['title', 'path', 'component'],
        additionalProperties: false,
    },
    handler: async (args, ctx: ToolContext) => {
        try {
            if (!ctx.permissions.includes('system:menu:create')) {
                return JSON.stringify({
                    error: '当前用户没有菜单创建权限 (system:menu:create)',
                    userPermissions: ctx.permissions,
                });
            }
            const mod = await import('@/modules/system-menu/handle');
            const fn = mod.createMenu;
            if (!fn) return JSON.stringify({ error: '菜单模块未加载' });

            const result = await fn({
                body: {
                    title: args.title, name: args.name || args.title,
                    path: args.path, component: args.component,
                    icon: args.icon || '', sort: args.sort ?? 0,
                    parentId: args.parentId ?? 0, metadataCollectionId: args.metadataCollectionId || null,
                    keepAlive: args.keepAlive ?? true, isHide: args.isHide ?? false, status: true,
                },
                user: ctx,
            });
            if (result.code === 200) {
                return JSON.stringify({ message: `菜单 "${args.title}" 创建成功`, path: args.path, success: true });
            }
            return JSON.stringify({ error: result.msg, success: false });
        } catch (e: any) {
            return JSON.stringify({ error: e.message });
        }
    },
});

registerTool({
    name: 'get_dynamic_page_info',
    description: '获取动态数据页面的路由信息和访问方式',
    parameters: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: '动态表名（可选）' },
        },
        additionalProperties: false,
    },
    handler: async (args) => {
        const info: any = {
            dynamicCrudPage: {
                component: '/system/dynamic-crud/index',
                description: '动态数据 CRUD 页面',
            },
            routePattern: {
                example: {
                    title: '客户信息', name: 'CustomerInfo', path: '/system/customer-info',
                    component: '/system/dynamic-crud/index', icon: 'ri:user-line',
                    parentId: 0, metadataCollectionId: '{collectionId}', keepAlive: true,
                },
                note: 'parentId 设为 0 表示顶级菜单',
            },
        };

        if (args.tableName) {
            try {
                const mod = await import('@/modules/metadata-collection/handle');
                const fn = mod.findList;
                if (fn) {
                    const result = await fn({ query: { tableName: args.tableName, pageNum: 1, pageSize: 1 } });
                    if (result.code === 200 && result.data?.list?.length > 0) {
                        const col = result.data.list[0];
                        info.matchedCollection = {
                            id: col.id, tableName: col.tableName, label: col.label, status: col.status,
                            suggestedMenu: {
                                title: col.label,
                                name: col.tableName.replace(/_/g, '-')
                                    .replace(/(^|-)([a-z])/g, (m: string) => m.toUpperCase()).replace(/-/g, ''),
                                path: `/system/${col.tableName.replace(/_/g, '-')}`,
                                component: '/system/dynamic-crud/index',
                                metadataCollectionId: col.id,
                            },
                        };
                    }
                }
            } catch { /* ignore */ }
        }

        return JSON.stringify(info);
    },
});
