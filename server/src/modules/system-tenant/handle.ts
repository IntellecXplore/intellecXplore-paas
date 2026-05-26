import { Context } from 'elysia';
import { eq, and, like, count } from 'drizzle-orm';
import pg from '@/core/database/pg';
import { logger } from '@/shared/logger';
import { BaseResultData } from '@/core/result';
import { BcryptHash } from '@/shared/bcrypt';
import { systemTenantSchema } from '@database/schema/system_tenant';
import { FindAll } from '@/core/database/repository';
import { RunTransaction } from '@/core/database/transaction';
import { ParseDateFields } from '@/types/dto';
import { systemRoleSchema, systemRoleMenuSchema } from '@database/schema/system_role';
import { systemUserTenantSchema, systemUserRoleSchema, systemUserSchema } from '@database/schema/system_user';

/** 创建租户，并自动关联创建者、复制默认角色、创建默认管理员账号 */
export async function create(ctx: Context) {
    try {
        const data = ctx.body as any;
        const userId = (ctx as any)?.user?.userId;

        if (!userId) {
            const [result] = await pg.insert(systemTenantSchema).values(data).returning();
            return BaseResultData.ok(result);
        }

        // 确定管理员用户名：优先 "admin"，已存在则 "admin_{租户标识}"
        const [existAdmin] = await pg.select()
            .from(systemUserSchema)
            .where(and(eq(systemUserSchema.username, 'admin'), eq(systemUserSchema.delFlag, false)));
        const adminUsername = existAdmin && data.tenantCode
            ? `admin_${data.tenantCode}`
            : 'admin';

        // 在事务中完成租户创建、用户关联、角色复制、管理员账号创建
        const result = await RunTransaction(async (tx: any) => {
            // 1. 创建租户
            const [tenant] = await tx.insert(systemTenantSchema).values(data).returning();

            // 2. 将创建者关联到新租户
            await tx.insert(systemUserTenantSchema).values({
                userId,
                tenantId: tenant.tenantId,
                isDefault: 0,
            } as any);

            // 3. 复制默认租户（tenantId=1）的角色到新租户
            const defaultRoles = await tx.select()
                .from(systemRoleSchema)
                .where(and(
                    eq(systemRoleSchema.tenantId, 1),
                    eq(systemRoleSchema.delFlag, false)
                ));

            const roleIdMap = new Map<number, number>(); // oldRoleId → newRoleId

            for (const role of defaultRoles) {
                const [newRole] = await tx.insert(systemRoleSchema).values({
                    roleName: role.roleName,
                    roleCode: role.roleCode,
                    sort: role.sort,
                    status: role.status,
                    tenantId: tenant.tenantId,
                    remark: role.remark,
                } as any).returning();

                roleIdMap.set(role.roleId, newRole.roleId);

                // 4. 复制角色-菜单关联
                const roleMenus = await tx.select()
                    .from(systemRoleMenuSchema)
                    .where(eq(systemRoleMenuSchema.roleId, role.roleId));

                for (const rm of roleMenus) {
                    await tx.insert(systemRoleMenuSchema).values({
                        roleId: newRole.roleId,
                        menuId: rm.menuId,
                        menuBtnId: rm.menuBtnId,
                    });
                }
            }

            // 5. 给创建者分配新租户下的管理员角色
            const adminRoleEntry = defaultRoles.find(r => r.roleCode === 'SYS_ADMIN');
            if (adminRoleEntry) {
                const newAdminRoleId = roleIdMap.get(adminRoleEntry.roleId);
                if (newAdminRoleId) {
                    await tx.insert(systemUserRoleSchema).values({
                        userId,
                        roleId: newAdminRoleId,
                    });
                }

                // 6. 为新租户创建默认超级管理员账号
                const hashedPwd = BcryptHash('admin');
                const [newAdmin] = await tx.insert(systemUserSchema).values({
                    username: adminUsername,
                    password: hashedPwd,
                    nickname: '管理员',
                    tenantId: tenant.tenantId,
                    status: true,
                } as any).returning();

                // 6a. 关联管理员到新租户（设为默认）
                await tx.insert(systemUserTenantSchema).values({
                    userId: newAdmin.userId,
                    tenantId: tenant.tenantId,
                    isDefault: 1,
                } as any);

                // 6b. 分配超级管理员角色
                await tx.insert(systemUserRoleSchema).values({
                    userId: newAdmin.userId,
                    roleId: newAdminRoleId,
                });
            }

            return tenant;
        });

        return BaseResultData.ok(result);
    } catch (error) {
        logger.error('创建租户失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 查询租户列表 */
export async function findList(ctx: Context) {
    try {
        const { pageNum = 1, pageSize = 10, orderByColumn, sortRule, tenantName, tenantCode, status } = ctx.query as any;
        const conditions = [eq(systemTenantSchema.delFlag, false)];
        if (tenantName) conditions.push(like(systemTenantSchema.tenantName, `%${tenantName}%`));
        if (tenantCode) conditions.push(like(systemTenantSchema.tenantCode, `%${tenantCode}%`));
        if (status !== undefined && status !== '') conditions.push(eq(systemTenantSchema.status, status === 'true'));

        const where = and(...conditions);
        const total = await pg.select({ count: count() }).from(systemTenantSchema).where(where);
        const list = await pg.select().from(systemTenantSchema).where(where)
            .limit(pageSize).offset((pageNum - 1) * pageSize)
            .orderBy(orderByColumn ? (systemTenantSchema as any)[orderByColumn] : systemTenantSchema.createTime);
        return BaseResultData.ok({ list, total: Number(total[0]?.count ?? 0) });
    } catch (error) {
        logger.error('查询租户列表失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 查询租户详情 */
export async function findOne(ctx: Context) {
    try {
        const id = (ctx.params as any).id;
        const [data] = await pg.select().from(systemTenantSchema)
            .where(and(eq(systemTenantSchema.tenantId, Number(id)), eq(systemTenantSchema.delFlag, false)));
        if (!data) return BaseResultData.fail(404, '租户不存在');
        return BaseResultData.ok(data);
    } catch (error) {
        logger.error('查询租户详情失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 更新租户 */
export async function update(ctx: Context) {
    try {
        const data = ctx.body as any;
        ParseDateFields(data);
        data.updateTime = new Date();
        const [result] = await pg.update(systemTenantSchema).set(data)
            .where(eq(systemTenantSchema.tenantId, data.tenantId)).returning();
        if (!result) return BaseResultData.fail(404, '租户不存在');
        return BaseResultData.ok(result);
    } catch (error) {
        logger.error('更新租户失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 删除租户（软删除） */
export async function remove(ctx: Context) {
    try {
        const { ids } = ctx.params as any;
        const idArray = ids.split(',').map(Number);
        await pg.update(systemTenantSchema).set({ delFlag: true, updateTime: new Date() } as any)
            .where(and(...idArray.map(id => eq(systemTenantSchema.tenantId, id))));
        return BaseResultData.ok();
    } catch (error) {
        logger.error('删除租户失败:', error);
        return BaseResultData.fail(500, error);
    }
};

/** 租户下拉选项（供前端选择器使用） */
export async function findOptions(ctx: Context) {
    try {
        const where = and(eq(systemTenantSchema.delFlag, false), eq(systemTenantSchema.status, true));
        const list = await FindAll(systemTenantSchema, where);
        const options = list.map((item: any) => ({
            tenantId: item.tenantId,
            tenantName: item.tenantName,
        }));
        return BaseResultData.ok(options);
    } catch (error) {
        logger.error('查询租户选项失败:', error);
        return BaseResultData.fail(500, error);
    }
};
