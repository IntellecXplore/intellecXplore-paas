import { Context } from 'elysia';
import { eq } from 'drizzle-orm';
import { BaseResultData } from '@/core/result';
import {
    InsertOne,
    UpdateByKey,
    SoftDeleteByKeys,
    CreateQueryBuilder,
    FindAll,
    FindAllWithJoin,
} from '@/core/database/repository';
import { systemMenuSchema, systemMenuBtnSchema } from '@database/schema/system_menu';
import { systemRoleMenuSchema } from '@database/schema/system_role';
import { ListToTree } from '@/core/function';
import { WithCache } from '@/core/cache';
import { CacheEnum } from '@/constants/enum';
import { logger } from '@/shared/logger';
import { Set as RedisSet } from '@/core/database/redis';
import { systemUserRoleSchema as roleUserRoleSchema } from '@database/schema/system_user';

/** 内联：获取角色菜单Ids和按钮Ids（消除跨模块导入） */
async function GetRoleMenuIdsAndBtnIds(userId: number) {
    try {
        const userRoleWhere = CreateQueryBuilder(roleUserRoleSchema).eq('userId', userId).build();
        const userRoleData = await FindAll(roleUserRoleSchema, userRoleWhere);
        const roleIds = userRoleData.map((item: any) => item.roleId).filter(Boolean) as number[];
        if (roleIds.length === 0) return { menuIds: [] as number[], menuBtnIds: [] as number[] };
        const roleMenuWhere = CreateQueryBuilder(systemRoleMenuSchema).in('roleId', roleIds).build();
        const roleMenuData = await FindAll(systemRoleMenuSchema, roleMenuWhere);
        const menuIds = new Set(roleMenuData.map((item: any) => item.menuId).filter(Boolean) as number[]);
        const menuBtnIds = new Set(roleMenuData.map((item: any) => item.menuBtnId).filter(Boolean) as number[]);
        return { menuIds: [...menuIds], menuBtnIds: [...menuBtnIds] };
    } catch (error) {
        logger.error('获取角色菜单Ids失败:' + error);
        return { menuIds: [] as number[], menuBtnIds: [] as number[] };
    }
}

export async function createMenu(ctx: Context) {
    try {
        await InsertOne(systemMenuSchema, ctx);
        return BaseResultData.ok();
    }
    catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function createMenuBtn(ctx: Context) {
    try {
        await InsertOne(systemMenuBtnSchema, ctx);
        return BaseResultData.ok();
    }
    catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function findSimple(ctx: Context) {
    try {
        const { userId } = (ctx as any)?.user;
        const tenantId = (ctx as any)?.tenantId;
        const data = await WithCache(CacheEnum.ADMIN_MENU + userId, async () => {
            const { menuBtnIds, menuIds } = await GetRoleMenuIdsAndBtnIds(userId);
            const menuWhere = CreateQueryBuilder(systemMenuSchema, tenantId).in('menuId', [...menuIds]).build();
            const menuData = await FindAll(systemMenuSchema, menuWhere, {
                orderByColumn: 'sort',
                sortRule: 'desc',
            });
            const menuBtnWhere = CreateQueryBuilder(systemMenuBtnSchema, tenantId).in('btnId', [...menuBtnIds]).build();
            const menuBtnData = await FindAll(systemMenuBtnSchema, menuBtnWhere);
            return handleMenuListToTree(menuData, menuBtnData);
        });
        return BaseResultData.ok(data);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function findTree(ctx: Context) {
    try {
        const {
            title,
            path,
        } = ctx.query;
        const builder = CreateQueryBuilder(systemMenuSchema, (ctx as any)?.tenantId)
            .eq('delFlag', false)
            .like('title', title)
            .like('path', path)
            .join({
                joinSchema: systemMenuBtnSchema,
                fieldName: 'authList',
                foreignKey: 'menuId',
                primaryKey: 'menuId',
                defaultValue: [],
                where: eq(systemMenuBtnSchema.delFlag, false),
                multiple: true
            });
        const data = await FindAllWithJoin(systemMenuSchema, builder);
        const tree = ListToTree(data, {
            idKey: 'menuId',
            parentKey: 'parentId',
            childrenKey: 'children',
            rootValue: 0,
            sortKey: 'sort',
        });
        return BaseResultData.ok(tree);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function updateMenu(ctx: Context) {
    try {
        await UpdateByKey(systemMenuSchema, 'menuId', ctx);
        return BaseResultData.ok();
    }
    catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function updateMenuBtn(ctx: Context) {
    try {
        await UpdateByKey(systemMenuBtnSchema, 'btnId', ctx);
        return BaseResultData.ok();
    }
    catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function removeMenu(ctx: Context) {
    try {
        await SoftDeleteByKeys(systemMenuSchema, 'menuId', ctx);
        return BaseResultData.ok();
    }
    catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function removeMenuBtn(ctx: Context) {
    try {
        await SoftDeleteByKeys(systemMenuBtnSchema, 'btnId', ctx);
        return BaseResultData.ok();
    }
    catch (error) {
        return BaseResultData.fail(500, error);
    }
};

// 把菜单列表转成后台生成菜单的树
export function handleMenuListToTree(
    menuList: typeof systemMenuSchema.$inferSelect[],
    menuBtnList?: typeof systemMenuBtnSchema.$inferSelect[]
) {
    if (!menuList || menuList.length === 0) return [];
    const menuBtnMap = new Map<number, Array<{ title: string; authMark: string }>>();
    if (menuBtnList && menuBtnList.length > 0) {
        for (const btn of menuBtnList) {
            if (btn.menuId) {
                const authList = menuBtnMap.get(btn.menuId);
                if (authList) {
                    authList.push({
                        title: btn.title || '',
                        authMark: btn.permission || ''
                    });
                } else {
                    menuBtnMap.set(btn.menuId, [{
                        title: btn.title || '',
                        authMark: btn.permission || ''
                    }]);
                }
            }
        }
    };
    const menuMap = new Map<number, any>();
    menuList.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    for (const menu of menuList) {
        const menuNode: any = {
            name: menu.name,
            path: menu.path,
            component: menu.component,
            meta: { title: menu.title, }
        };
        if (menu.icon) menuNode.meta.icon = menu.icon;
        if (menu.keepAlive !== null && menu.keepAlive !== undefined) menuNode.meta.keepAlive = menu.keepAlive;
        if (menu.fixedTab) menuNode.meta.fixedTab = menu.fixedTab;
        if (menu.isHide) menuNode.meta.isHide = menu.isHide;
        if (menu.isHideTab) menuNode.meta.isHideTab = menu.isHideTab;
        if (menu.isFullPage) menuNode.meta.isFullPage = menu.isFullPage;
        if (menu.showBadge) menuNode.meta.showBadge = menu.showBadge;
        if (menu.showTextBadge) menuNode.meta.showTextBadge = menu.showTextBadge;
        if (menu.link) menuNode.meta.link = menu.link;
        if (menu.isIframe) menuNode.meta.isIframe = menu.isIframe;
        if (menu.activePath) menuNode.meta.activePath = menu.activePath;
        if (menu.metadataCollectionId) menuNode.meta.metadataCollectionId = menu.metadataCollectionId;
        const authList = menuBtnMap.get(menu.menuId);
        if (authList) menuNode.meta.authList = authList;
        menuNode.children = [];
        menuMap.set(menu.menuId, menuNode);
    };
    const rootMenus: any[] = [];
    for (const menu of menuList) {
        const menuNode = menuMap.get(menu.menuId);
        if (menu.parentId === null || menu.parentId === undefined || menu.parentId === 0) {
            rootMenus.push(menuNode);
        } else {
            const parentNode = menuMap.get(menu.parentId);
            if (parentNode) parentNode.children.push(menuNode);
        };
    };
    for (const node of menuMap.values()) {
        if (node.children && node.children.length === 0) {
            delete node.children;
        }
    };
    return rootMenus;
};

// 刷新缓存菜单树
export async function RefreshRoutes(userId: number, tenantId?: number) {
    try {
        const { menuBtnIds, menuIds } = await GetRoleMenuIdsAndBtnIds(userId);
        const menuWhere = CreateQueryBuilder(systemMenuSchema, tenantId).in('menuId', [...menuIds]).build();
        const menuData = await FindAll(systemMenuSchema, menuWhere, {
            orderByColumn: 'sort',
            sortRule: 'desc',
        });
        const menuBtnWhere = CreateQueryBuilder(systemMenuBtnSchema, tenantId).in('btnId', [...menuBtnIds]).build();
        const menuBtnData = await FindAll(systemMenuBtnSchema, menuBtnWhere);
        const data = handleMenuListToTree(menuData, menuBtnData);
        if (data) await RedisSet(CacheEnum.ADMIN_MENU + userId, data);
    } catch (error) {
        logger.error('刷新缓存菜单树失败:' + error);
        throw error;
    }
};