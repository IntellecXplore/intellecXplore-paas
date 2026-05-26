/**
 * 为租户管理页面添加菜单记录并关联 SYS_ADMIN 角色权限
 * 用法: cd server && bun run script/seed-tenant-menu.ts
 */
import pg from '@/core/database/pg';
import { systemMenuSchema } from '@database/schema/system_menu';
import { systemRoleSchema, systemRoleMenuSchema } from '@database/schema/system_role';
import { eq, and, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('=== 查询 System 父菜单 ===');
  const systemMenu = await pg.select().from(systemMenuSchema)
    .where(and(eq(systemMenuSchema.name, 'System'), eq(systemMenuSchema.delFlag, false)));
  if (!systemMenu.length) {
    console.error('❌ 未找到 System 父菜单');
    process.exit(1);
  }
  const parentMenu = systemMenu[0];
  console.log(`System 菜单: menuId=${parentMenu.menuId}, name=${parentMenu.name}`);

  console.log('\n=== 查询 SYS_ADMIN 角色 ===');
  const adminRole = await pg.select().from(systemRoleSchema)
    .where(and(eq(systemRoleSchema.roleCode, 'SYS_ADMIN'), eq(systemRoleSchema.delFlag, false)));
  if (!adminRole.length) {
    console.error('❌ 未找到 SYS_ADMIN 角色');
    process.exit(1);
  }
  const role = adminRole[0];
  console.log(`SYS_ADMIN 角色: roleId=${role.roleId}, roleCode=${role.roleCode}`);

  console.log('\n=== 检查是否已存在 Tenant 菜单 ===');
  const existingTenant = await pg.select().from(systemMenuSchema)
    .where(and(eq(systemMenuSchema.name, 'Tenant'), eq(systemMenuSchema.delFlag, false)));
  if (existingTenant.length) {
    console.log(`⚠️  Tenant 菜单已存在: menuId=${existingTenant[0].menuId}`);
    // 检查角色关联
    const existingRel = await pg.select().from(systemRoleMenuSchema)
      .where(and(
        eq(systemRoleMenuSchema.roleId, role.roleId),
        eq(systemRoleMenuSchema.menuId, existingTenant[0].menuId)
      ));
    if (existingRel.length) {
      console.log('⚠️  角色关联也已存在，无需处理');
      process.exit(0);
    }
    // 补充角色关联
    await pg.insert(systemRoleMenuSchema).values({
      roleId: role.roleId,
      menuId: existingTenant[0].menuId,
    } as any);
    console.log('✅ 已补充角色-菜单关联');
    process.exit(0);
  }

  console.log('\n=== 获取当前最大 menuId ===');
  const maxResult = await pg.execute(sql`SELECT MAX(menu_id) as max_id FROM system_menu`);
  const maxId = Number((maxResult as any)[0]?.max_id || 0);
  console.log(`当前最大 menuId: ${maxId}`);

  console.log('\n=== 获取当前最大排序值 ===');
  const sortResult = await pg.execute(sql`
    SELECT MAX(sort) as max_sort FROM system_menu
    WHERE parent_id = ${parentMenu.menuId} AND del_flag = false
  `);
  const maxSort = Number((sortResult as any)[0]?.max_sort || 0);
  console.log(`System 子菜单最大 sort: ${maxSort}`);

  console.log('\n=== 插入租户管理菜单 ===');
  const inserted = await pg.insert(systemMenuSchema).values({
    path: 'tenant',
    name: 'Tenant',
    component: '/system/tenant',
    title: 'menus.system.tenant',
    icon: 'ri:building-2-line',
    keepAlive: true,
    sort: maxSort + 1,
    status: true,
    parentId: parentMenu.menuId,
  } as any).returning();

  const newMenu = inserted[0];
  console.log(`✅ 已插入菜单: menuId=${newMenu.menuId}, name=${newMenu.name}, path=${newMenu.path}`);

  console.log('\n=== 关联角色-菜单权限 ===');
  await pg.insert(systemRoleMenuSchema).values({
    roleId: role.roleId,
    menuId: newMenu.menuId,
  } as any);
  console.log(`✅ 已关联: roleId=${role.roleId} -> menuId=${newMenu.menuId}`);

  // 同时为现有租户权限按钮（system:tenant:*）关联到这个新菜单
  console.log('\n=== 关联租户权限按钮 ===');
  // 查找 system:tenant:* 权限按钮
  const btnResult = await pg.execute(sql`
    SELECT * FROM system_menu_btn
    WHERE permission LIKE 'system:tenant:%' AND del_flag = false
  `);
  const btns = btnResult as any[];
  console.log(`找到 ${btns.length} 个租户权限按钮`);
  for (const btn of btns) {
    // 检查关联是否已存在
    const existingBtnRel = await pg.select().from(systemRoleMenuSchema)
      .where(and(
        eq(systemRoleMenuSchema.roleId, role.roleId),
        eq(systemRoleMenuSchema.menuBtnId, btn.btn_id)
      ));
    if (!existingBtnRel.length) {
      // 注意：按钮关联需要角色+菜单+按钮，这里只关联角色+按钮，不绑定特定菜单
      // 因为按钮可能跨菜单使用
      console.log(`  跳过按钮 ${btn.permission}: 需要确认归属菜单`);
    }
  }

  console.log('\n✅ 租户管理菜单添加完成！请刷新页面或重新登录验证。');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ 执行失败:', err);
  process.exit(1);
});
