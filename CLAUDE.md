# CLAUDE.md — intellecXplore-paas (Elysia Admin)

> 全栈后台管理系统，ElysiaJS + Bun + Vue 3 + PostgreSQL + Redis + BullMQ

---

## AI 辅助工具文档体系

项目由四种 AI 工具协作开发，各自有独立的规则目录：

| 工具 | 规则路径 | 机制 |
|------|---------|------|
| **Cursor** | `.cursor/rules/` (4 `.mdc` 文件) | IDE 自动加载 |
| **Trae** | `.trae/rules/` (5 `.md` 文件) | IDE 自动加载 |
| **Kiro** | `.kiro/steering/` (7 `.md` 文件) | IDE 自动加载 |
| **Proma** | **CLAUDE.md** (本文件) + **Memory 系统** | 会话启动加载 |

### Proma Memory 系统

> **路径**: `~/.proma/sdk-config/projects/-Users-limingxuan/memory/MEMORY.md`

Memory 是 Proma 的**确定性跨会话持久化机制**，每个新会话必定加载 `MEMORY.md` 索引。包含 5 条项目记忆：

| 文件 | 内容 |
|------|------|
| `project-architecture.md` | 分层架构、依赖方向、Core 层保护 |
| `project-module-contract.md` | dto/handle/route/task 四文件结构 |
| `project-code-rules.md` | Repository 抽象、统一响应、禁止事项 |
| `project-tech-stack.md` | 技术栈、关键命令、配置要点 |
| `project-code-patterns.md` | Repository 函数签名、DTO/Route/前端模板 |

**修改规则后需同步**：当 `.ai/` 或 `.cursor/rules/` 中的架构/模块/代码规则发生变更时，应同步更新上述 Memory 文件，避免 Proma Agent 跨会话漂移。

---

## 技术栈速览

| 层 | 技术 |
|----|------|
| 后端框架 | ElysiaJS (Bun runtime) |
| 数据库 | PostgreSQL + Drizzle ORM |
| 缓存/队列 | Redis + BullMQ |
| AI | Vercel AI SDK v6 (`ai` + `@ai-sdk/openai-compatible`) |
| 前端 | Vue 3 + Element Plus + Pinia + Tailwind CSS |
| 验证 | Zod (后端 DTO) |
| LLM Provider | DeepSeek (默认), 支持 OpenAI-compatible |

---

## 项目结构

```
server/
├── src/
│   ├── config/           # YAML 配置 (development.yaml / production.yaml)
│   ├── core/             # 基础设施: PG连接池、Redis、通用CRUD、缓存、路由注册、任务注册
│   ├── infrastructure/   # 外部服务: BullMQ队列、支付、邮件、对象存储
│   ├── middleware/        # 全局中间件链: IP黑名单→API熔断→路由分析→Auth→租户→权限→IP限流
│   ├── modules/          # 业务模块 (每个模块含 route.ts + handle.ts + dto.ts)
│   │   ├── system-agent/     # Agent v2 (AI SDK v6 + Tool Registry)
│   │   └── system-workflow/  # ★ 工作流引擎 (NEW)
│   ├── shared/           # 纯工具: JWT、bcrypt、UUID、日志、Cron
│   └── types/            # 类型定义
├── database/
│   ├── base-schema.ts    # BaseSchema (tenantId/createTime/updateTime/delFlag/remark)
│   └── schema/           # 20+ Drizzle schema 文件
└── script/               # 种子脚本
admin/
├── src/
│   ├── api/              # HTTP 请求层 (无业务逻辑)
│   ├── views/            # 页面组件
│   ├── router/           # 路由配置
│   └── store/            # Pinia 状态管理
└── .ai/                  # AI 开发规范 (AI_STRUCTURE.md, AI_MODULE_STANDARD.md, etc.)
```

---

## 关键开发命令

```bash
# 后端开发
cd server && bun run dev          # 启动开发服务器 (localhost:3000)
cd server && bun run build        # 构建
cd server && bun run seed         # 运行种子脚本

# 前端开发
cd admin && pnpm dev              # 启动前端开发服务器

# 数据库
cd server && bun run db:push      # Drizzle Kit push — 直接推送 schema 到数据库（dev 模式）
cd server && bun run db:pull      # Drizzle Kit pull — 从数据库拉取 schema
cd server && bun run seed:workflow  # 插入工作流种子数据
```

---

## 业务模块开发规范

遵循 `.ai/AI_MODULE_STANDARD.md`。每个模块包含三个文件:
- `route.ts` — IRouteModule 定义 (tags + routes[])
- `handle.ts` — 路由处理函数 (async (ctx: Context) => object)
- `dto.ts` — Zod 验证 schema (body/query/params)

路由自动注册: 开发环境扫描 `modules/` 目录，生产环境用预生成文件。

---

## ★ 工作流引擎 (新增)

### 核心文件

| 文件 | 职责 |
|------|------|
| `server/src/modules/system-workflow/types.ts` | 核心类型 (Step, WorkflowDefinition, Context, RetryPolicy) |
| `server/src/modules/system-workflow/registry.ts` | 工作流注册中心 (代码 + DB 双重来源) |
| `server/src/modules/system-workflow/template-engine.ts` | 模板解析 `{{input.field}}` / `{{step.id.output}}` |
| `server/src/modules/system-workflow/executor.ts` | 核心执行器 (步骤持久化、重试、超时) |
| `server/src/modules/system-workflow/handle.ts` | API 路由处理函数 |
| `server/src/modules/system-workflow/route.ts` | API 路由定义 |
| `server/src/modules/system-workflow/dto.ts` | Zod 验证 DTO |
| `server/src/modules/system-workflow/task.ts` | 定时任务处理器 |
| `server/src/modules/system-agent/core/tool-registry.ts` | Tool Registry (workflow ToolStep 的执行目标) |

### 数据库表 (Drizzle Schema)

| 表 | Schema 文件 | 用途 |
|----|-----------|------|
| `workflow_definition` | `database/schema/workflow_definition.ts` | 工作流定义 (JSONB 存储 DAG) |
| `workflow_instance` | `database/schema/workflow_instance.ts` | 执行实例 (状态、上下文、断点) |
| `workflow_step_execution` | `database/schema/workflow_step_execution.ts` | 步骤执行追踪 (input/output/耗时) |

### 工作流定义 JSON 结构

```json
{
  "id": "my-workflow",
  "name": "示例工作流",
  "steps": [
    { "id": "s1", "type": "tool", "name": "步骤1", "tool": "get_current_time", "input": {} },
    { "id": "s2", "type": "llm", "name": "LLM总结", "systemPrompt": "...", "userPrompt": "时间: {{step.s1.output}}" },
    { "id": "s3", "type": "conditional", "name": "判断", "branches": [...] }
  ],
  "retryPolicy": { "maxAttempts": 3, "initialDelayMs": 1000, "backoffMultiplier": 2, "maxDelayMs": 60000 },
  "timeoutMs": 120000
}
```

### 支持的步骤类型

- `tool` — 调用 ToolRegistry 中的工具
- `llm` — 调用 LLM (AI SDK generateText)
- `conditional` — 条件分支 (eq/neq/gt/lt/in/and/or/not)
- `parallel` — 并行执行
- `wait` — 等待 (delay/approval/webhook)
- `sub_workflow` — 子工作流

### BullMQ 队列

| 队列 | 用途 |
|------|------|
| `system-cron-queue` | 系统定时任务 (沙箱模式) |
| `workflow-execution-queue` | 工作流执行 (函数模式, concurrency=3) |
| `flow-buffer-queue` | 流程缓冲 |
| `trade-order-queue` | 交易订单 |

### 定时触发工作流

在 `monitor_job` 表中创建记录，`jobArgs` JSON 设置:
```json
{ "type": "workflow", "definitionId": 1, "input": { "key": "value" } }
```
`RegisterAllTasks()` 会自动识别并调度到 `workflow-execution-queue`。

### 崩溃恢复

Executor 每步执行后立即持久化 `completedSteps` + `context` 到 `workflow_instance`。
Worker 重启后，`execute()` 检查 `completedSteps`，跳过已完成的步骤从断点继续。

---

## Agent 系统 (已有)

- Tool Registry: `server/src/core/agent/tool-registry.ts`
  - 全局工具注册表，支持按 Agent 动态加载
  - `registerTool()` / `buildToolSet()` / `getToolSchemas()`
  - 工具含 `idempotent` + `timeoutMs` 字段供 workflow 重试决策
- Agent Loop: `server/src/core/agent/agent-loop.ts`
  - AI SDK v6 `streamText()` + `smoothStream()` + `stepCountIs()`
- Agent 定义: `server/src/modules/system-agent/agents/admin/`
  - `prompt.ts` — system prompt
  - `tools.ts` — 工具名列表
  - `tools/*.ts` — 各工具实现 (registerTool 副作用导入)
- 会话存储: Redis (`core/agent/session-store.ts`)

---

## ★ 多租户系统 (Phase 1-4 已完成)

### 架构概览

采用 **共享表 + tenant_id 列** 策略，所有数据表通过 `BaseSchema` 继承 `tenantId` 字段。
Repository 层自动注入/过滤，业务代码最小侵入。

### 核心文件

| 文件 | 职责 |
|------|------|
| `database/base-schema.ts` | BaseSchema — `tenantId BIGINT DEFAULT 1` |
| `database/schema/system_tenant.ts` | 租户表（全局表，不继承 BaseSchema） |
| `database/schema/system_user.ts` | `system_user_tenant` 用户-租户关联表 |
| `src/middleware/guards/tenant.ts` | TenantGuard — 校验租户状态、缓存到 Redis |
| `src/middleware/index.ts` | 中间件链: AuthGuard → **TenantGuard** → PermissionGuard |
| `src/core/database/repository.ts` | QueryBuilder/Insert/Update/Delete 自动作用域 |
| `src/modules/system-auth/handle.ts` | 登录(EnsureUserHasTenant)、切换租户、JWT 含 tenantId |
| `src/constants/enum.ts` | `TENANT_INFO` 缓存键 |

### 中间件执行顺序

```
IPBlack → ApiGuard → AnalysisRoute → AuthGuard → TenantGuard → IpRateLimit → PermissionGuard
```

### Repository 自动作用域

- **QueryBuilder**: `new QueryBuilder(schema, tenantId)` 自动添加 `WHERE tenant_id = ?`
- **InsertOne/InsertOneAndRes/InsertMany**: 从 `ctx.tenantId` 自动注入 `data.tenantId`
- **UpdateByKey/SoftDeleteByKeys**: WHERE 自动追加 `tenant_id = ?`
- **FindOneByKey**: 可选第 4 参数 `tenantId`
- 所有 tenantId 参数可选 — 不传时行为不变（向后兼容）

### 租户数据流

```
Login → EnsureUserHasTenant → JWT { userId, tenantId }
  → Redis 缓存 userInfo (含 permissions, tenantId, tenants)
  → 返回 { tokens, currentTenantId, tenants }

Request → AuthGuard (Redis → ctx.user)
  → TenantGuard (校验租户 → ctx.tenant / ctx.tenantId)
  → Handler: CreateQueryBuilder(schema, ctx.tenantId)
    → WHERE tenant_id = 1 AND ...
```

### API 端点

| 端点 | 说明 |
|------|------|
| `GET /auth/tenants` | 获取当前用户可访问的租户列表 |
| `POST /auth/switch-tenant` | 切换租户，返回新 JWT |

### 关键注意

1. `tenant_id` 默认值为 1 — 存量数据自动归属默认租户
2. **`drizzle-kit push` 必须在 TTY 终端执行** — 非 TTY 下 schema 冲突需要交互确认，会静默跳过
3. junction 表（`system_user_role`、`system_role_menu`）不直接过滤，通过主表间接作用域
4. 缓存键按租户隔离：`systemRole:{tenantId}`、`systemDeptTree:{tenantId}`
5. 设计规范详见 `specs/multi-tenant/design.md`

---

## 配置

`server/src/config/development.yaml`:
```yaml
agent:
  provider: "openai"
  apiBase: "https://api.deepseek.com"
  model: "deepseek-v4-pro"
  maxTokens: 4096
  maxToolRounds: 5
  conversationTTL: 86400
```

环境变量: `AGENT_API_KEY` 可覆盖 config 中的 apiKey。

---

## 注意事项

1. Drizzle schema 使用 `drizzle-typebox` 生成 validator，非 Zod
2. API 响应格式统一为 `{ code: 200, msg: '操作成功', data: ... }`
3. 生产环境路由从预生成文件加载 (`core/route-registry.generated.ts`)
4. BullMQ Worker 独立进程运行 (`runtime/worker.ts`)
5. 前端 views 按目录组织，子组件放 `modules/` 子目录
6. Workflow executor 使用函数模式 Worker（非沙箱），需要完整应用上下文
