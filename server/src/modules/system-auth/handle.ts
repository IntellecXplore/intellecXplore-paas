import { Context } from 'elysia';
import { eq, and } from 'drizzle-orm';
import pg from '@/core/database/pg';
import { BaseResultData } from '@/core/result';
import { GenerateToken, VerifyToken } from '@/shared/jwt';
import { BcryptCompare, BcryptHash } from '@/shared/bcrypt';
import { GenerateUUID } from '@/shared/uuid';
import {
    InsertOne,
    FindOneByKey,
    UpdateByKeyAndRes,
    CreateQueryBuilder,
    FindAll,
} from '@/core/database/repository';
import { RunTransaction } from '@/core/database/transaction';
import { systemUserSchema } from '@database/schema/system_user';
import { systemRoleSchema, systemRoleMenuSchema } from '@database/schema/system_role';
import { systemMenuBtnSchema } from '@database/schema/system_menu';
import { systemIpBlackSchema } from '@database/schema/system_ip_black';
import { logger } from '@/shared/logger';
import { GetNowTime, ConvertTimeToSecond } from '@/shared/time';
import { CacheEnum } from '@/constants/enum';
import { Get, Set, Del, Keys } from '@/core/database/redis';
import { SendMail } from '@/infrastructure/clients/smtp';
import { GenerateForgetPasswordHtmlTemplate } from '@/shared/htmltemplate';
import config from '@/config';
import { GetClientInfo, GetClientIp } from '@/shared/ip';
import type { IAccountType } from '@/types/common';
import { systemUserTenantSchema, systemUserRoleSchema } from '@database/schema/system_user';
import { systemTenantSchema } from '@database/schema/system_tenant';

/** 内联：根据键查用户（消除跨模块导入） */
async function GetUserBy(key: string, val: any) {
    try { return await FindOneByKey(systemUserSchema, key, val); }
    catch (error) { logger.error('获得用户信息失败' + error); return null; }
}

/** 内联：注册用户（消除跨模块导入） */
async function RegisterUser(username: string, password: string): Promise<void> {
    const exists = await GetUserBy('username', username);
    if (exists) {
        const e = new Error('用户名已存在') as Error & { httpStatus?: number };
        e.httpStatus = 409; throw e;
    }
    const hash = BcryptHash(password);
    try { await InsertOne(systemUserSchema, null, { username, password: hash }); }
    catch (error: any) {
        const code = error?.cause?.code ?? error?.code;
        if (code === '23505') {
            const e = new Error('用户名已存在') as Error & { httpStatus?: number };
            e.httpStatus = 409; throw e;
        }
        logger.error('注册用户失败' + error); throw error;
    }
}

/** 内联：设置用户密码（消除跨模块导入） */
async function SetUserPassword(userId: number, password: string): Promise<void> {
    const hash = BcryptHash(password);
    const row = await UpdateByKeyAndRes(systemUserSchema, 'userId', null, { password: hash, userId });
    if (!row) {
        const e = new Error('密码更新失败') as Error & { httpStatus?: number };
        e.httpStatus = 500; throw e;
    }
}

/** 内联：获取用户角色和权限（来自 system-role，统一数据源） */
import { GetUserRoleAndPermission } from '@/modules/system-role/handle';

/** 内联：插入IP黑名单（消除跨模块导入） */
async function InsertIpBlack(data: typeof systemIpBlackSchema.$inferInsert) {
    try {
        await RunTransaction(async (tx: any) => {
            const ipList = await tx.select().from(systemIpBlackSchema).where(eq(systemIpBlackSchema.ipAddress, data.ipAddress));
            const ipInfo = ipList[0] || null;
            if (ipInfo) {
                await tx.update(systemIpBlackSchema).set({ status: true, remark: data.remark, updateTime: new Date() }).where(eq(systemIpBlackSchema.ipBlackId, ipInfo.ipBlackId));
            } else {
                await tx.insert(systemIpBlackSchema).values({ ...data, status: true });
            }
        });
    } catch (error) { logger.error('插入IP黑名单失败:' + error); }
}

function isPublicRegisterAllowed(): boolean {
    const v = process.env.ALLOW_PUBLIC_REGISTER;
    if (v === 'true') return true;
    if (v === 'false') return false;
    return config.app.allowPublicRegister ?? false;
};

/** 查询用户的所有租户（带租户详情） */
async function GetUserTenants(userId: number) {
    const rows = await pg.select({
        ut: systemUserTenantSchema,
        t: systemTenantSchema,
    })
        .from(systemUserTenantSchema)
        .innerJoin(systemTenantSchema, eq(systemUserTenantSchema.tenantId, systemTenantSchema.tenantId))
        .where(and(
            eq(systemUserTenantSchema.userId, userId),
            eq(systemTenantSchema.delFlag, false),
        ));
    return rows.map(r => ({
        tenantId: r.t.tenantId,
        tenantName: r.t.tenantName,
        tenantCode: r.t.tenantCode,
        status: r.t.status,
        isDefault: r.ut.isDefault === 1,
    }));
};

/** 确保用户至少有一个租户，若无则自动关联默认租户（tenantId=1） */
async function EnsureUserHasTenant(userId: number): Promise<number> {
    const tenants = await GetUserTenants(userId);
    if (tenants.length > 0) {
        // 返回默认租户，无默认则返回第一个
        const def = tenants.find(t => t.isDefault);
        return def ? def.tenantId : tenants[0].tenantId;
    }
    // 无租户关联 → 自动绑定默认租户
    await pg.insert(systemUserTenantSchema).values({
        userId,
        tenantId: 1,
        isDefault: 1,
    } as any);
    return 1;
};

export async function accountPasswordLogin(ctx: Context) {
    try {
        const { username, password, tenantCode, tenantId: reqTenantId } = ctx.body as any;
        const user = await GetUserBy('username', username);
        if (!user) return BaseResultData.fail(404, '用户不存在');
        if (!user?.status) return BaseResultData.fail(403, '用户已停用');
        if (user?.delFlag) return BaseResultData.fail(410, '用户已删除');
        if (!BcryptCompare(password, user?.password || '')) {
            await addPasswordErrorTimes(ctx);
            return BaseResultData.fail(400, '密码错误');
        };
        // 确定登录租户：前端指定 > 默认租户
        const tenants = await GetUserTenants(user.userId);
        let tenantId: number;
        if (reqTenantId) {
            // 通过 tenantId 指定
            const target = tenants.find(t => t.tenantId === reqTenantId);
            if (!target) return BaseResultData.fail(403, '无权访问该租户');
            if (!target.status) return BaseResultData.fail(403, '该租户已禁用');
            tenantId = reqTenantId;
        } else if (tenantCode) {
            // 通过租户标识指定
            const target = tenants.find(t => t.tenantCode === tenantCode);
            if (!target) return BaseResultData.fail(403, '无权访问该租户');
            if (!target.status) return BaseResultData.fail(403, '该租户已禁用');
            tenantId = target.tenantId;
        } else {
            // 未指定则使用默认租户
            tenantId = await EnsureUserHasTenant(user.userId);
        }
        const payload = { userId: user.userId, tenantId };
        const baseKey = CacheEnum.REFRESH_TOKEN + `${user.userId}:`;
        const oldkeys = await Keys(baseKey);
        if (oldkeys.length) {
            const isDel = await Del(oldkeys);
            if (!isDel) return BaseResultData.fail(500, '刷新令牌删除失败');
        };
        const tokens = await generateAndStoreTokens(payload);
        if ('error' in tokens) return tokens.error;
        const { roles, permissions } = await GetUserRoleAndPermission(user.userId, tenantId);
        const clientInfo = await GetClientInfo(ctx);
        (ctx as any).clientInfo = clientInfo;
        const userInfo = {
            userId: user.userId,
            username: user.username,
            email: user.email,
            phone: user.phone,
            sex: user.sex,
            avatar: user.avatar,
            loginLocation: clientInfo.loginLocation,
            ipaddr: clientInfo.ipaddr,
            roles,
            permissions,
            userType: 'admin' as IAccountType,
            loginTime: GetNowTime(),
            tenantId,
            tenants,
        };
        const onlineKey = CacheEnum.ONLINE_USER + user.userId;
        const isSetOnline = await Set(onlineKey, userInfo);
        if (!isSetOnline) return BaseResultData.fail(500, '在线用户设置失败');
        (ctx as any).user = userInfo;
        return BaseResultData.ok({ ...tokens, currentTenantId: tenantId, tenants });
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function refreshToken(ctx: Context) {
    try {
        const { refreshToken } = ctx.body as any;
        if (!refreshToken) return BaseResultData.fail(404, '刷新令牌不存在');
        const payload = await VerifyToken('refreshToken', refreshToken);
        if (!payload) return BaseResultData.fail(400, '刷新令牌无效');
        const oldKey = CacheEnum.REFRESH_TOKEN + `${payload.userId}:${payload.uuid}`;
        const oldPayload = await Get(oldKey);
        if (!oldPayload) return BaseResultData.fail(400, '刷新令牌无效');
        const isDel = await Del(oldKey);
        if (!isDel) return BaseResultData.fail(500, '刷新令牌删除失败');
        const tokens = await generateAndStoreTokens(oldPayload);
        if ('error' in tokens) return tokens.error;
        return BaseResultData.ok(tokens);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function registerUser(ctx: Context) {
    try {
        if (!isPublicRegisterAllowed()) return BaseResultData.fail(403, '公开注册已关闭');
        const { username, password } = ctx.body as any;
        await RegisterUser(username, password);
        return BaseResultData.ok();
    } catch (error: any) {
        if (error?.httpStatus === 409) return BaseResultData.fail(409, error.message);
        return BaseResultData.fail(500, error);
    }
};

export async function forgetPassword(ctx: Context) {
    try {
        const { email } = ctx.body as any;
        const user = await GetUserBy('email', email);
        if (user?.email && user?.status && !user?.delFlag) {
            const key = CacheEnum.FORGET_PASSWORD + user.userId;
            const oldKeys = await Keys(`${key}:*`);
            if (oldKeys.length) await Del(oldKeys);
            const uuid = GenerateUUID();
            const cacheKey = `${key}:${uuid}`;
            const isSet = await Set(cacheKey, { userId: user.userId }, config.app.forgetPasswordExpiresIn);
            if (!isSet) return BaseResultData.fail(500);
            try {
                const resetUrl = `${config.app.forgetPasswordUrl}?token=${uuid}&uid=${user.userId}`;
                const html = GenerateForgetPasswordHtmlTemplate(resetUrl, user?.nickname || '');
                const isSend = await SendMail({
                    to: email,
                    subject: `[${config.app.id}] - 重置密码`,
                    html,
                });
                if (!isSend) {
                    await Del(cacheKey);
                    return BaseResultData.fail(500);
                }
            } catch (mailError) {
                await Del(cacheKey);
                return BaseResultData.fail(500, mailError);
            }
        };
        return BaseResultData.ok(null, '如果该邮箱存在，我们已发送重置邮件');
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function resetPassword(ctx: Context) {
    try {
        const { uid, token, password } = ctx.body as any;
        const key = CacheEnum.FORGET_PASSWORD + uid + ':' + token;
        const payload = await Get(key);
        if (!payload) return BaseResultData.fail(400, '重置令牌无效');
        await SetUserPassword(uid, password);
        const isDel = await Del(key);
        if (!isDel) return BaseResultData.fail(500, '重置令牌删除失败');
        return BaseResultData.ok(null, '密码重置成功');
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function logout(ctx: Context) {
    try {
        const userId = (ctx as any)?.user?.userId as string;
        // 刷新token
        const refreshKey = CacheEnum.REFRESH_TOKEN + `${userId}:`;
        const oldKeys = await Keys(refreshKey) || [];
        // 在线状态
        const onlineKey = CacheEnum.ONLINE_USER + `${userId}`;
        // 权限菜单
        const menuKey = CacheEnum.ADMIN_MENU + `${userId}`;
        await Del([...oldKeys, onlineKey, menuKey]);
        return BaseResultData.ok();
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

// 生成并存储令牌
async function generateAndStoreTokens(payload: any): Promise<{ accessToken: string, refreshToken: string, accessExpiresIn: number, refreshExpiresIn: number } | { error: any }> {
    const uuid = GenerateUUID();
    const accessToken = await GenerateToken('accessToken', payload);
    const refreshToken = await GenerateToken('refreshToken', { uuid, ...payload });
    const refreshKey = CacheEnum.REFRESH_TOKEN + `${payload.userId}:${uuid}`;
    const accessExpiresIn = ConvertTimeToSecond(config.jwt.accessToken.expiresIn);
    const refreshExpiresIn = ConvertTimeToSecond(config.jwt.refreshToken.expiresIn);
    const isSet = await Set(refreshKey, payload, refreshExpiresIn);
    if (!isSet) return { error: BaseResultData.fail(500, '刷新令牌设置失败') };
    return { accessToken, refreshToken, accessExpiresIn, refreshExpiresIn };
};

/** 获取当前用户可访问的租户列表 */
export async function getTenantList(ctx: Context) {
    try {
        const userId = (ctx as any)?.user?.userId as number;
        if (!userId) return BaseResultData.fail(401);
        const tenants = await GetUserTenants(userId);
        return BaseResultData.ok(tenants);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

/** 切换到指定租户，签发新令牌 */
export async function switchTenant(ctx: Context) {
    try {
        const userId = (ctx as any)?.user?.userId as number;
        const { tenantId } = ctx.body as any;
        if (!tenantId) return BaseResultData.fail(400, '请指定租户');
        // 校验用户属于目标租户
        const tenants = await GetUserTenants(userId);
        const target = tenants.find(t => t.tenantId === tenantId);
        if (!target) return BaseResultData.fail(403, '无权访问该租户');
        if (!target.status) return BaseResultData.fail(403, '该租户已禁用');
        // 清除旧刷新令牌
        const baseKey = CacheEnum.REFRESH_TOKEN + `${userId}:`;
        const oldKeys = await Keys(baseKey);
        if (oldKeys.length) await Del(oldKeys);
        // 签发新令牌
        const payload = { userId, tenantId };
        const tokens = await generateAndStoreTokens(payload);
        if ('error' in tokens) return tokens.error;
        // 更新在线用户缓存中的 tenantId
        const onlineKey = CacheEnum.ONLINE_USER + userId;
        const userInfo = await Get(onlineKey);
        if (userInfo) {
            userInfo.tenantId = tenantId;
            userInfo.tenants = tenants;
            await Set(onlineKey, userInfo);
        }
        return BaseResultData.ok({ ...tokens, currentTenantId: tenantId });
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

// 添加密码错误次数
async function addPasswordErrorTimes(ctx: Context) {
    const ip = GetClientIp(ctx);
    let strCount = await Get(CacheEnum.ADMIN_LOGIN_ERROR_COUNT + ip);
    let count = Number(strCount) || 0;
    count++;
    if (count >= config.app.maxLoginAttempts) {
        await InsertIpBlack({
            ipAddress: ip,
            remark: '登录失败次数超过' + config.app.maxLoginAttempts + '次'
        });
        await Del(CacheEnum.ADMIN_LOGIN_ERROR_COUNT + ip);
        return;
    };
    await Set(CacheEnum.ADMIN_LOGIN_ERROR_COUNT + ip, count, config.app.baseCacheTime);
};