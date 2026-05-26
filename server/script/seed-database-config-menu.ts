/**
 * 数据库配置菜单种子数据（含按钮权限）
 *
 * 运行: bun run server/script/seed-database-config-menu.ts
 */
import pg from '../src/core/database/pg';
import { systemMenuSchema, systemMenuBtnSchema } from '../database/schema/system_menu';
import { systemRoleMenuSchema } from '../database/schema/system_role';
import { eq, and } from 'drizzle-orm';

const BTN_PERMISSIONS = [
    { title: '新增', permission: 'system:metadata:database-config:create', sort: 0 },
    { title: '查询', permission: 'system:metadata:database-config:query', sort: 1 },
    { title: '编辑', permission: 'system:metadata:database-config:update', sort: 2 },
    { title: '删除', permission: 'system:metadata:database-config:delete', sort: 3 },
];

async function seed() {
    console.log('Seeding database-config menu + button permissions...');

    const [metadataMenu] = await pg
        .select()
        .from(systemMenuSchema)
        .where(
            and(
                eq(systemMenuSchema.path, 'metadata'),
                eq(systemMenuSchema.parentId, 3),
            ),
        )
        .limit(1);

    if (!metadataMenu) {
        console.error('未找到"元数据管理"父菜单 (path=metadata, parent_id=3)，请先运行 pg.sql 初始化');
        process.exit(1);
    }

    const parentId = metadataMenu.menuId;
    console.log(`找到父菜单: menu_id=${parentId}, title=${metadataMenu.title}`);

    // 查找或创建"数据库配置"菜单
    let dbConfigMenuId: number;
    const [existingMenu] = await pg
        .select({ menuId: systemMenuSchema.menuId })
        .from(systemMenuSchema)
        .where(
            and(
                eq(systemMenuSchema.path, 'database-config'),
                eq(systemMenuSchema.parentId, parentId),
            ),
        )
        .limit(1);

    if (existingMenu) {
        dbConfigMenuId = existingMenu.menuId;
        console.log(`"数据库配置"菜单已存在 (menu_id=${dbConfigMenuId})，检查按钮权限...`);
    } else {
        const [row] = await pg
            .insert(systemMenuSchema)
            .values({
                path: 'database-config',
                name: 'MetadataDatabaseConfig',
                component: '/system/metadata/database-config',
                title: '数据库配置',
                icon: 'ri:settings-3-line',
                sort: 0,
                parentId,
                keepAlive: true,
            } as any)
            .returning({ menuId: systemMenuSchema.menuId });

        dbConfigMenuId = row.menuId;
        console.log(`  ✓ 插入菜单: 数据库配置 (menu_id=${dbConfigMenuId})`);

        // 关联菜单到超级管理员角色
        await pg.insert(systemRoleMenuSchema).values({
            roleId: 1,
            menuId: dbConfigMenuId,
        } as any);
        console.log(`  ✓ 关联角色: role_id=1 → menu_id=${dbConfigMenuId}`);
    }

    // 检查已有的按钮权限
    const existingBtns = await pg
        .select({ btnId: systemMenuBtnSchema.btnId, permission: systemMenuBtnSchema.permission })
        .from(systemMenuBtnSchema)
        .where(eq(systemMenuBtnSchema.menuId, dbConfigMenuId));

    const existingPermissions = new Set(existingBtns.map(b => b.permission));

    // 插入缺失的按钮权限
    for (const btn of BTN_PERMISSIONS) {
        if (existingPermissions.has(btn.permission)) {
            console.log(`  - 按钮权限已存在: ${btn.title} (${btn.permission})`);
            continue;
        }

        const [btnRow] = await pg
            .insert(systemMenuBtnSchema)
            .values({
                menuId: dbConfigMenuId,
                title: btn.title,
                permission: btn.permission,
                sort: btn.sort,
                status: true,
            } as any)
            .returning({ btnId: systemMenuBtnSchema.btnId });

        console.log(`  ✓ 插入按钮: ${btn.title} (btn_id=${btnRow.btnId}, permission=${btn.permission})`);

        // 关联按钮到超级管理员角色
        await pg.insert(systemRoleMenuSchema).values({
            roleId: 1,
            menuId: dbConfigMenuId,
            menuBtnId: btnRow.btnId,
        } as any);
        console.log(`    ✓ 关联角色按钮: role_id=1 → btn_id=${btnRow.btnId}`);
    }

    console.log('\n数据库配置种子数据完成！');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
