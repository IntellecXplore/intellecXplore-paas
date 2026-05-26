/**
 * 工作流菜单种子数据
 *
 * 运行: bun run server/script/seed-workflow-menu.ts
 *
 * 在 system_menu 表中插入工作流相关的菜单项，
 * 并给超级管理员角色 (role_id=1) 分配权限。
 */
import pg from '../src/core/database/pg';
import { systemMenuSchema } from '../database/schema/system_menu';
import { systemRoleMenuSchema } from '../database/schema/system_role';
import { eq, and } from 'drizzle-orm';

async function seed() {
    console.log('Seeding workflow menu items...');

    // 查找"元数据管理"父菜单 (path='metadata', parent_id=3)
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

    // 检查是否已存在
    const existing = await pg
        .select({ path: systemMenuSchema.path })
        .from(systemMenuSchema)
        .where(eq(systemMenuSchema.parentId, parentId));

    const existingPaths = new Set(existing.map((r) => r.path));

    const menus = [
        {
            path: 'workflow-definitions',
            name: 'WorkflowDefinitions',
            component: '/system/workflow/definition',
            title: '工作流定义',
            icon: 'ri:flow-chart',
            sort: 1,
            parentId,
            keepAlive: true,
        },
        {
            path: 'workflow-instances',
            name: 'WorkflowInstances',
            component: '/system/workflow/instance',
            title: '工作流执行历史',
            icon: 'ri:history-line',
            sort: 2,
            parentId,
            keepAlive: true,
        },
        {
            path: 'workflow/instances/:id',
            name: 'WorkflowInstanceDetail',
            component: '/system/workflow/detail',
            title: '执行详情',
            sort: 3,
            parentId,
            isHide: true,
            isHideTab: true,
            keepAlive: false,
        },
    ];

    let inserted = 0;
    for (const menu of menus) {
        if (existingPaths.has(menu.path)) {
            console.log(`  跳过已存在: ${menu.path}`);
            continue;
        }

        const [row] = await pg
            .insert(systemMenuSchema)
            .values(menu as any)
            .returning({ menuId: systemMenuSchema.menuId });

        // 给超级管理员角色分配权限
        await pg.insert(systemRoleMenuSchema).values({
            roleId: 1,
            menuId: row.menuId,
        } as any);

        console.log(`  ✓ 插入: ${menu.title} (menu_id=${row.menuId})`);
        inserted++;
    }

    if (inserted === 0) {
        console.log('所有工作流菜单已存在，无需插入');
    } else {
        console.log(`✓ 共插入 ${inserted} 个工作流菜单项`);
    }

    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
