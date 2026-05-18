# 多租户架构设计

> 为 intellecXplore-paas 接入不同企业的业务系统提供数据隔离能力。

---

## 一、概述

### 1.1 背景

项目需要接入多个外部产品，各产品分属不同企业。每个企业的用户、角色、菜单、部门、业务数据需要完全隔离，互不可见。

### 1.2 设计目标

1. **数据隔离**：租户 A 的用户无法访问租户 B 的任何数据
2. **最小侵入**：业务模块改动量最小，基础设施层自动生效
3. **平滑迁移**：存量数据无缝接入多租户体系
4. **可演进**：未来可按需将大租户迁移至独立数据库

### 1.3 方案选型

三种主流多租户策略对比：

| 策略 | 隔离性 | 复杂度 | 成本 | 适用场景 |
|------|--------|--------|------|---------|
| 共享表 + tenant_id 列 | 低 | 低 | 低 | 中小规模 SaaS |
| 独享 Schema | 中 | 中 | 中 | 合规要求较高 |
| 独享数据库 | 高 | 高 | 高 | 金融/医疗等强隔离 |

**采用方案**：共享表 + `tenant_id` 列，配合 Repository 层自动作用域。

选择理由：
- 项目已有统一的 `BaseSchema` 和通用 `Repository` 层，改造成本最低
- 所有表继承 `BaseSchema`，加一个 `tenant_id` 即可全局生效
- Drizzle ORM 的动态查询能力天然适合在 Repository 层做自动过滤
- 不排斥未来对特定大租户做独库迁移

---

## 二、数据库设计

### 2.1 BaseSchema 变更

```typescript
// database/base-schema.ts
export const BaseSchema = {
    tenantId: bigint('tenant_id', { mode: 'number' }).default(1), // 新增
    createTime: timestamp('create_time', { withTimezone: true }).defaultNow(),
    createBy: bigint('create_by', { mode: 'number' }),
    updateTime: timestamp('update_time', { withTimezone: true }),
    updateBy: bigint('update_by', { mode: 'number' }),
    delFlag: boolean('del_flag').default(false),
    remark: varchar('remark', { length: 255 }),
};
```

`tenant_id` 默认值为 1（默认租户），确保：
- `drizzle-kit push` 添加列时不会因 NOT NULL 报错
- 存量数据自动归属到默认租户
- 新插入数据在不指定 tenant_id 时自动归属默认租户

### 2.2 新增表

#### system_tenant — 租户信息表（全局表，不继承 BaseSchema）

| 字段 | 类型 | 说明 |
|------|------|------|
| tenant_id | BIGSERIAL PK | 租户 ID |
| tenant_name | VARCHAR(100) NOT NULL | 企业名称 |
| tenant_code | VARCHAR(50) NOT NULL UNIQUE | 租户标识（用于子域名等） |
| contact_name | VARCHAR(50) | 联系人 |
| contact_phone | VARCHAR(20) | 联系电话 |
| status | BOOLEAN DEFAULT true | 状态（false=禁用） |
| expire_time | TIMESTAMPTZ | 租期截止时间，NULL=永久 |
| config | JSONB DEFAULT '{}' | 租户级配置（logo、主题、配额等） |
| create_time | TIMESTAMPTZ | 创建时间 |
| update_time | TIMESTAMPTZ | 更新时间 |
| del_flag | BOOLEAN | 删除标志 |
| remark | VARCHAR(255) | 备注 |

> **注意**：`system_tenant` 自身不继承 `BaseSchema`，因为它是租户体系的根节点，其字段（create_time 等）手动定义。

#### system_user_tenant — 用户-租户关联表

| 字段 | 类型 | 说明 |
|------|------|------|
| user_tenant_id | BIGSERIAL PK | 关联 ID |
| user_id | BIGINT NOT NULL | 用户 ID（FK → system_user） |
| tenant_id | BIGINT NOT NULL | 租户 ID（FK → system_tenant） |
| is_default | SMALLINT DEFAULT 0 | 是否默认租户 |

支持一个用户属于多个租户，`is_default` 标记登录时的默认选择。

### 2.3 表分类

#### 租户作用域表（继承 BaseSchema，查询自动过滤 tenant_id）

所有业务表均属于此类，包括但不限于：

- `system_user`、`system_role`、`system_menu`、`system_menu_btn`、`system_dept`
- `business_orders`、`business_payments`、`business_refund`、`business_merchant`
- `metadata_collections`、`metadata_fields`、`metadata_relations`
- `workflow_definition`、`workflow_instance`、`workflow_step_execution`
- `system_agent_config`、`system_dict_type`、`system_dict_data`
- `system_login_log`、`system_oper_log`、`system_storage`
- `system_ip_black`、`monitor_job`、`business_merchant_configs`、`metadata_indexes`

> **注意**：`workflow_instance` 和 `workflow_step_execution` 的 DDL 已包含 `tenant_id` 列，但其 TypeScript Drizzle schema 尚未定义 `tenantId` 字段，Repository 自动作用域对这两张表暂不生效，需手动过滤。

#### 全局表（不按 tenant_id 过滤）

| 表 | 说明 |
|----|------|
| `system_tenant` | 租户定义表自身 |
| `system_user_tenant` | 用户-租户关联（跨租户查询） |
| `system_user_role` | 用户-角色关联（通过 role 间接作用域） |
| `system_role_menu` | 角色-菜单关联（通过 role 间接作用域） |
| `system_api` | 平台级 API 管理（全局共享，各租户不可修改） |

### 2.4 索引建议

```sql
-- 租户作用域高频查询应包含 tenant_id 前缀
CREATE INDEX idx_role_tenant ON system_role(tenant_id);
CREATE INDEX idx_menu_tenant ON system_menu(tenant_id);
CREATE INDEX idx_dept_tenant ON system_dept(tenant_id);
CREATE INDEX idx_user_tenant ON system_user(tenant_id);

-- 复合索引：租户 + 状态
CREATE INDEX idx_role_tenant_status ON system_role(tenant_id, status, del_flag);
CREATE INDEX idx_menu_tenant_status ON system_menu(tenant_id, status, del_flag);

-- 用户-租户关联
CREATE INDEX idx_user_tenant_user ON system_user_tenant(user_id);
CREATE UNIQUE INDEX uq_user_tenant ON system_user_tenant(user_id, tenant_id);
```

---

## 三、后端架构

### 3.1 中间件链

```
IPBlack → ApiGuard → AnalysisRoute → AuthGuard → TenantGuard → IpRateLimit → PermissionGuard
                                              ↑ Phase 2 新增
```

#### TenantGuard 租户守卫

```typescript
// middleware/guards/tenant.ts
export async function TenantGuard(ctx: Context) {
    const routeInfo = (ctx as any).routeInfo;
    if (!routeInfo?.meta?.isAuth) return;          // 公开接口放行
    const user = (ctx as any).user;
    if (!user) return;

    const tenantId = user.tenantId ?? 1;            // 过渡期默认租户1
    const tenant = await getTenant(tenantId);       // Redis 缓存 5 分钟
    if (!tenant) return fail(403, '租户不存在');
    if (!tenant.status) return fail(403, '租户已禁用');
    if (tenant.expireTime && expired) return fail(403, '租户已过期');

    (ctx as any).tenant = tenant;                   // 挂载租户信息
    (ctx as any).tenantId = tenantId;               // 挂载租户 ID
}
```

### 3.2 Repository 层自动作用域

核心原则：**基础设施层静默生效，业务代码无感**。

#### QueryBuilder — 查询自动过滤

```typescript
// 构造函数自动添加 tenant_id 条件
constructor(schema?: T, tenantId?: number) {
    this.schema = schema;
    if (tenantId != null && (schema as any)?.tenantId) {
        this.conditions.push(eq((schema as any).tenantId, tenantId));
    }
}

// 业务代码用法
const where = CreateQueryBuilder(systemRoleSchema, ctx.tenantId)
    .eq('delFlag', false)
    .build();
```

#### 写操作 — 自动注入

| 函数 | 机制 |
|------|------|
| `InsertOne(schema, ctx)` | 从 `ctx.tenantId` 提取，注入 `data.tenantId` |
| `InsertOneAndRes(schema, ctx)` | 同上 |
| `InsertMany(schema, ctx)` | 同上 |
| `UpdateByKey(schema, key, ctx)` | WHERE 自动追加 `tenant_id = ?` |
| `UpdateByKeyAndRes(schema, key, ctx)` | 同上 |
| `SoftDeleteByKeys(schema, key, ctx)` | 同上 |
| `FindOneByKey(schema, key, val, tenantId?)` | 可选参数，传入时追加过滤 |

### 3.3 Auth 流程

#### 登录

```
1. 验证用户名密码
2. EnsureUserHasTenant(userId) → 查询/自动绑定租户
3. JWT payload 写入 { userId, tenantId }
4. Redis 缓存用户信息（含 tenantId + tenants 列表）
5. 返回 tokens + currentTenantId + tenants
```

#### 租户切换

```
POST /auth/switch-tenant  { tenantId }
  → 校验用户属于目标租户 → 清旧 refresh token
  → 签发新 token 对（含新 tenantId）→ 更新 Redis
  → 返回新 tokens
```

#### Token 刷新

刷新时 `tenantId` 自动保留（payload 从 Redis 透传）。

### 3.4 RBAC 租户化

角色、菜单、部门全部按租户隔离：

| 模块 | 隔离方式 |
|------|---------|
| `system-role` | `CreateQueryBuilder(systemRoleSchema, tenantId)` — findList/findOne/findOptions |
| `system-menu` | `CreateQueryBuilder(systemMenuSchema, tenantId)` — findSimple/findTree |
| `system-dept` | `CreateQueryBuilder(systemDeptSchema, tenantId)` — findTree/findOptions |
| 角色 → 权限 | `GetUserRoleAndPermission(userId, tenantId)` |
| 缓存键 | `{app.id}:baseOptions:systemRole:{tenantId}` / `{app.id}:baseOptions:systemDeptTree:{tenantId}`（按租户隔离缓存） |

#### 权限链路

```
Login → EnsureUserHasTenant → tenantId
  → GetUserRoleAndPermission(userId, tenantId)
    → CreateQueryBuilder(systemRoleSchema, tenantId)  ← 只查本租户角色
  → GetMenuPermissionByRoleIds(roleIds)
    → 返回权限列表（system:role:query 等）

Request → AuthGuard → TenantGuard → ctx.tenantId
  → findList(ctx) → CreateQueryBuilder(schema, ctx.tenantId) ← 只查本租户数据
  → insert/update/delete → Repository 自动注入 ctx.tenantId
```

---

## 四、API 端点

### 新增端点

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/auth/tenants` | 获取当前用户可访问的租户列表 | 需要 |
| POST | `/auth/switch-tenant` | 切换到指定租户，返回新令牌 | 需要 |

### 响应格式变化

登录 / 切换租户 的响应 data 中新增：

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "accessExpiresIn": 900,
  "refreshExpiresIn": 604800,
  "currentTenantId": 1,
  "tenants": [
    {
      "tenantId": 1,
      "tenantName": "默认租户",
      "tenantCode": "default",
      "status": true,
      "isDefault": true
    }
  ]
}
```

### JWT Payload

```json
{
  "userId": 1,
  "tenantId": 1,
  "iat": 1779121281,
  "exp": 1779122181,
  "jti": "019e3be4..."
}
```

---

## 五、数据流全景

```
┌─────────────────────────────────────────────────────────┐
│ 登录流程                                                  │
│                                                          │
│ POST /auth/login                                         │
│   → 验证密码                                              │
│   → EnsureUserHasTenant(userId)                          │
│       → 查询 system_user_tenant                           │
│       → 无关联 → 自动绑定默认租户(tenantId=1)               │
│   → JWT = { userId, tenantId }                           │
│   → Redis = { userId, ..., permissions, tenantId, tenants }│
│   → Response = { tokens, currentTenantId, tenants }       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 请求流程                                                  │
│                                                          │
│ Request (Authorization: Bearer <JWT>)                    │
│   → AuthGuard: Redis 加载 user → ctx.user               │
│   → TenantGuard: 校验租户状态 → ctx.tenant / ctx.tenantId │
│   → PermissionGuard: RBAC 权限检查                       │
│   → Handler: findList(ctx)                              │
│       → CreateQueryBuilder(schema, ctx.tenantId)         │
│           → WHERE tenant_id = 1 AND ...                  │
│       → 只返回本租户数据                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 切换租户                                                  │
│                                                          │
│ POST /auth/switch-tenant { tenantId: 2 }                 │
│   → 校验 user 属于 tenant 2                               │
│   → 清旧 refresh token                                   │
│   → 签发新 JWT { userId, tenantId: 2 }                    │
│   → 更新 Redis 缓存                                      │
│   → 后续请求自动作用域切换到 tenant 2                       │
└─────────────────────────────────────────────────────────┘
```

---

## 六、实施阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | BaseSchema 加 `tenant_id`、创建 `system_tenant` 表、种子数据 | 完成 |
| Phase 2 | TenantGuard 中间件、Repository 层自动作用域改造 | 完成 |
| Phase 3 | Auth 流程改造（多租户登录/切换）、JWT 增加 tenant claim | 完成 |
| Phase 4 | RBAC 租户化（角色/菜单/部门按租户隔离） | 完成 |
| Phase 5 | 业务模块逐一接入（orders、payments、workflow、metadata、agent 等） | 待实施 |
| Phase 6 | 前端租户选择/切换 UI、租户管理后台（超管） | 待实施 |

---

## 七、关键文件索引

| 文件 | 职责 |
|------|------|
| `database/base-schema.ts` | BaseSchema — `tenantId` 字段定义（含 `BASE_COLUMNS_SQL` 常量） |
| `database/schema/system_tenant.ts` | 租户表 schema |
| `database/schema/system_user.ts` | 用户表 — `system_user_tenant` 关联表 |
| `database/sql/tenant_migration.sql` | 多租户迁移 DDL（建表 + 19 张业务表加列） |
| `src/middleware/guards/tenant.ts` | TenantGuard 租户守卫 |
| `src/middleware/index.ts` | 中间件链编排 |
| `src/core/database/repository.ts` | Repository 层 — QueryBuilder/CRUD 自动作用域 |
| `src/modules/system-auth/handle.ts` | 登录/刷新/切换租户 |
| `src/modules/system-auth/route.ts` | `/auth/tenants` + `/auth/switch-tenant` 端点 |
| `src/modules/system-auth/dto.ts` | SwitchTenantDto |
| `src/modules/system-auth/task.ts` | 模块任务注册（当前为空） |
| `src/modules/system-role/handle.ts` | 角色 CRUD + GetUserRoleAndPermission（按租户） |
| `src/modules/system-menu/handle.ts` | 菜单 CRUD + 菜单树（按租户） |
| `src/modules/system-dept/handle.ts` | 部门 CRUD（按租户） |
| `src/constants/enum.ts` | `CacheEnum.TENANT_INFO` 缓存键 |
| `script/seed.ts` | 默认租户 + 用户-租户关联种子数据 |

---

## 八、注意事项

1. **`drizzle-kit push` 必须在 TTY 终端执行**：非 TTY 环境下 schema 冲突需要交互确认，会静默跳过变更
2. **`tenant_id` 默认值为 1**：存量数据自动归属默认租户，新租户注册后需手动分配
3. **超管视角**（`tenantId = 0` 跳过过滤）：当前 `tenantId = 0` 会生成 `WHERE tenant_id = 0`（无匹配记录），超管功能待 Phase 6 实现
4. **缓存键按租户隔离**：`{app.id}:baseOptions:systemRole:{tenantId}` / `{app.id}:baseOptions:systemDeptTree:{tenantId}`，避免跨租户数据泄漏
5. **junction 表不直接过滤**：`system_user_role`、`system_role_menu` 等关联表通过主表间接作用域
6. **Repository 函数向后兼容**：所有 `tenantId` 参数均为可选，不传时行为不变
