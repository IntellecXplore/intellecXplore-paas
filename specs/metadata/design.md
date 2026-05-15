# 元数据系统 — 前后端完整设计方案

> 基于数据库 Schema（`.trae/rules/database-schema.md`），遵循项目现有前后端编码约定。

---

## 一、Collection 状态生命周期

```
draft ──→ preparing ──→ staging ──→ active ──→ inactive
  ↑           │             │                       │
  └───────────┴─────────────┴───────────────────────┘
               sync_failed
```

| 状态 | 说明 | 可操作 |
|------|------|--------|
| `draft` | 草稿，正在编辑字段 | 增删改字段、修改配置、删除 Collection |
| `preparing` | DDL 执行中（异步） | 等待完成，不可编辑 |
| `staging` | 物理表已创建，待上线 | 可部署上线，不可编辑字段 |
| `active` | 已上线，正常使用 | 仅可停用、查看 |
| `inactive` | 已停用 | 可重新激活 |
| `sync_failed` | DDL 执行失败 | 查看错误信息，重新发布 |

**关键设计决策：**
- **draft 阶段字段可自由增删改**，不影响物理表
- **发布（publish）**：从 draft → preparing，后台异步执行 CREATE TABLE DDL，完成后变为 staging
- **部署（deploy）**：从 staging → active，标记上线
- 已 active 的 Collection **字段结构锁定**，如需修改需先变为 inactive

---

## 二、前端设计

### 2.1 目录结构

```
admin/src/
├── api/
│   └── metadata/
│       ├── collection.ts          # Collection API
│       └── field.ts               # Field API
├── types/api/
│   └── metadata-collection.d.ts   # Collection 类型
│   └── metadata-field.d.ts        # Field 类型
├── router/modules/
│   └── system.ts                  # 追加 metadata 路由
└── views/
    └── system/
        └── metadata/
            ├── collection/
            │   ├── index.vue              # Collection 列表页
            │   └── modules/
            │       ├── collection-search.vue   # 搜索栏
            │       └── collection-dialog.vue   # 新增/编辑弹窗
            └── field/
                ├── index.vue              # 字段管理页
                └── modules/
                    ├── field-dialog.vue        # 字段新增/编辑弹窗
                    └── field-sort-dialog.vue   # 字段排序弹窗
```

### 2.2 路由设计

在 `admin/src/router/modules/system.ts` 追加：

```typescript
{
  path: 'metadata',
  name: 'Metadata',
  component: '/system/metadata/collection',
  meta: {
    title: '元数据管理',
    icon: 'ri:database-2-line',
    keepAlive: true,
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'collection',
      name: 'MetadataCollection',
      component: '/system/metadata/collection',
      meta: { title: '数据表管理', keepAlive: true }
    },
    {
      path: 'field/:collectionId',
      name: 'MetadataField',
      component: '/system/metadata/field',
      meta: { title: '字段管理', isHide: true, isHideTab: true }
    }
  ]
}
```

### 2.3 页面设计

#### 2.3.1 Collection 列表页 (`collection/index.vue`)

**表格列：**

| 列名 | 字段 | 渲染方式 |
|------|------|----------|
| 序号 | — | `type: index` |
| 名称 | name | text |
| 显示名称 | title | text |
| 存储类型 | databaseType | tag（PostgreSQL / MongoDB） |
| 命名空间 | namespace | text |
| 版本 | version | text |
| 状态 | status | tag + 颜色映射 |
| 创建时间 | createTime | date 格式化 |
| 操作 | — | 编辑 / 配置字段 / 发布 / 部署 / 停用 / 删除 |

**状态标签颜色：**

| status | tag 颜色 |
|--------|----------|
| draft | info |
| preparing | warning |
| staging | primary |
| active | success |
| inactive | danger |
| sync_failed | danger |

**操作按钮（按状态显示）：**

| 按钮 | 显示条件 |
|------|----------|
| 编辑 | draft / sync_failed |
| 配置字段 | draft |
| 发布 | draft / sync_failed |
| 部署上线 | staging |
| 停用 | active |
| 重新激活 | inactive |
| 删除 | draft / inactive |

#### 2.3.2 Collection 新增/编辑弹窗 (`collection-dialog.vue`)

使用 `ArtForm`，表单字段：

| 字段 key | 类型 | 说明 |
|----------|------|------|
| name | input | Collection 名称（唯一标识） |
| title | input | 显示名称 |
| description | input (textarea) | 描述 |
| databaseType | select | 存储类型（postgresql / mongodb） |
| tableName | input | 物理表名（自动从 name 生成默认值） |
| namespace | select | 命名空间（business / system / custom） |

> 注：`storageConfig` / `accessControl` / `tableConfig` / `uiConfig` / `ai` 等 JSONB 字段前期暂不提供 UI 编辑入口，后续迭代。

#### 2.3.3 字段管理页 (`field/index.vue`)

**页面布局：**
- 顶部面包屑 + Collection 信息卡片（名称、状态、版本）
- 操作栏：新增字段 / 批量排序 / 返回列表
- 字段列表表格（拖拽排序）

**表格列：**

| 列名 | 字段 | 渲染方式 |
|------|------|----------|
| 拖拽手柄 | — | 可拖拽列 |
| 字段标识 | key | text |
| 字段类型 | type | tag |
| 数据库列名 | columnName | text |
| 必填 | required | √ / × |
| 唯一 | isUnique | √ / × |
| 索引 | indexed | √ / × |
| 排序 | sortOrder | text |
| 状态 | status | tag |
| 操作 | — | 编辑 / 删除 |

#### 2.3.4 字段新增/编辑弹窗 (`field-dialog.vue`)

使用 `ArtForm`，分为基础配置和高级配置两组：

**基础配置（必填）：**

| 字段 key | 类型 | 说明 |
|----------|------|------|
| key | input | 字段标识符 |
| type | select | 字段类型（string / integer / boolean / date / datetime / text / decimal / json / enum / email / phone / url / richtext） |

**高级配置：**

| 字段 key | 类型 | 说明 |
|----------|------|------|
| columnName | input | 数据库列名 |
| nullable | switch | 是否可为空 |
| required | switch | 是否必填 |
| isUnique | switch | 是否唯一 |
| indexed | switch | 是否建索引 |
| default_value | input | 默认值 |
| length | input-number | 长度 |
| precision | input-number | 精度（decimal） |
| scale | input-number | 小数位（decimal） |
| min | input-number | 最小值 |
| max | input-number | 最大值 |
| pattern | input | 正则约束 |

> 注：`relation`、`uiConfig`、`ai`、`customValidator` 等 JSONB 字段暂不提供 UI。

---

## 三、后端设计

### 3.1 目录结构

```
server/src/modules/
├── metadata-collection/
│   ├── dto.ts          # Collection DTO
│   ├── handle.ts       # Collection 业务逻辑 + DDL 执行
│   └── route.ts        # Collection 路由
└── metadata-field/
    ├── dto.ts          # Field DTO
    ├── handle.ts       # Field 业务逻辑
    └── route.ts        # Field 路由
```

### 3.2 API 路由一览

#### metadata-collection

| 方法 | URL | 说明 | meta.permission |
|------|-----|------|-----------------|
| POST | `/system/metadata/collection` | 创建 (status=draft) | `system:metadata:collection:create` |
| GET | `/system/metadata/collection/list` | 分页查询列表 | `system:metadata:collection:query` |
| GET | `/system/metadata/collection/:id` | 查询详情（含 fields） | `system:metadata:collection:query` |
| PUT | `/system/metadata/collection` | 更新基本信息 | `system:metadata:collection:update` |
| POST | `/system/metadata/collection/:id/publish` | 发布（draft→preparing→staging） | `system:metadata:collection:update` |
| POST | `/system/metadata/collection/:id/deploy` | 部署上台（staging→active） | `system:metadata:collection:update` |
| POST | `/system/metadata/collection/:id/disable` | 停用 | `system:metadata:collection:update` |
| DELETE | `/system/metadata/collection/:ids` | 软删除 | `system:metadata:collection:delete` |

#### metadata-field

| 方法 | URL | 说明 | meta.permission |
|------|-----|------|-----------------|
| POST | `/system/metadata/field` | 创建字段 | `system:metadata:field:create` |
| GET | `/system/metadata/field/list` | 查询字段列表（?collectionId=） | `system:metadata:field:query` |
| GET | `/system/metadata/field/:id` | 查询字段详情 | `system:metadata:field:query` |
| PUT | `/system/metadata/field` | 更新字段 | `system:metadata:field:update` |
| POST | `/system/metadata/field/sort` | 批量排序 | `system:metadata:field:update` |
| DELETE | `/system/metadata/field/:ids` | 软删除 | `system:metadata:field:delete` |

### 3.3 核心业务逻辑

#### 3.3.1 发布（publish）

```
POST /system/metadata/collection/:id/publish

流程：
1. 校验 collection 状态必须是 draft 或 sync_failed
2. 查询该 collection 的所有 active 字段
3. 生成 CREATE TABLE DDL 语句：
   - 公共字段：id(bigserial PK), tenant_id (预留), create_time, update_time, ...
   - 根据 field.type 映射 PostgreSQL 数据类型
   - 根据 field 约束添加 NOT NULL / UNIQUE / DEFAULT
4. 更新 collection status → preparing
5. 异步执行 DDL（此处先用同步简化，后续接 Temporal）
6. 创建索引（根据 fields 中 marked indexed 的字段）
7. 更新 collection status → staging（成功）或 sync_failed（失败）
```

**DDL 生成规则（简表）：**

| Field Type | PostgreSQL DDL |
|-----------|----------------|
| string(length=50) | VARCHAR(50) |
| text | TEXT |
| integer | INTEGER |
| decimal | DECIMAL(precision, scale) |
| boolean | BOOLEAN |
| date | DATE |
| datetime | TIMESTAMP |
| json | JSONB |
| email / phone / url / enum / richtext | VARCHAR(length) |

#### 3.3.2 部署上线（deploy）

```
POST /system/metadata/collection/:id/deploy

流程：
1. 校验 collection 状态必须是 staging
2. 更新 status → active
```

#### 3.3.3 字段排序（field sort）

```
POST /system/metadata/field/sort
Body: { fields: [{ fieldId: number, sortOrder: number }] }

流程：
1. 批量更新 sort_order
```

### 3.4 数据库扩展

需要新增一张菜单按钮权限记录表，无需新增 schema 表。在现有 `system_menu_btn` 表中注册以下权限：

| permission | title |
|------------|-------|
| `system:metadata:collection:create` | 新增数据表 |
| `system:metadata:collection:query` | 查询数据表 |
| `system:metadata:collection:update` | 编辑数据表 |
| `system:metadata:collection:delete` | 删除数据表 |
| `system:metadata:field:create` | 新增字段 |
| `system:metadata:field:query` | 查询字段 |
| `system:metadata:field:update` | 编辑字段 |
| `system:metadata:field:delete` | 删除字段 |

---

## 四、实施步骤

| Phase | 内容 | 预估文件数 |
|-------|------|-----------|
| **Phase 1** | 后端 metadata-field（dto/handle/route） | 3 |
| **Phase 2** | 后端 metadata-collection（dto/handle/route + DDL 生成） | 3 |
| **Phase 3** | 前端 API 层 + 类型定义 | 4 |
| **Phase 4** | 前端 Collection 列表页 + 弹窗 | 3 |
| **Phase 5** | 前端 Field 管理页 + 弹窗 | 4 |
| **Phase 6** | 路由注册 + 菜单权限 | 2 |

总计约 **19 个文件**。

---

## 五、暂缓项（后续迭代）

- JSONB 字段 UI 编辑（storageConfig / accessControl / tableConfig / uiConfig / ai）
- metadata_relations 表管理 UI
- metadata_indexes 表管理 UI
- 动态表创建异步化（接 Temporal / 消息队列）
- 字段变更迁移（ALTER TABLE）
- 多租户支持
- MongoDB 存储类型支持
