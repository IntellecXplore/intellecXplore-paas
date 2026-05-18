# Backend Architecture Contract (STRICT)

This project follows:

- modular monolith
- layered architecture
- strict separation of concerns
- unified repository abstraction
- dynamic route registry
- unified result wrapper

DO NOT redesign architecture.
DO NOT introduce new abstraction layers.
DO NOT modify core infrastructure.

---

# Module Standard Structure (MANDATORY)

Every business module MUST contain exactly four core files:

modules/{moduleName}/
    dto.ts
    handle.ts
    route.ts
    task.ts

Do not rename files.

**例外：复杂模块额外支撑文件**

以下情况允许模块内额外的文件/子目录，但必须保留 4 核心文件：

- **Agent 模块**：允许 `agents/` 子目录存放 Agent 定义（prompt/tools），Agent 基础设施代码应放在 `core/agent/`
- **工作流模块**：允许 executor.ts、registry.ts、template-engine.ts、types.ts 等核心引擎文件
- **元数据模块**：允许动态 DDL 构建等支撑文件

额外文件必须与模块强相关，纯基础设施代码应提取到 `core/` 层。
Do not change folder structure lightly.

---

# dto.ts (Validation Layer)

Responsibility:
- Define request validation schema
- Define DTO types
- Transform input data only

Allowed:
- schema definition
- type definition
- input transform

Forbidden:
- business logic
- database access
- repository usage
- calling handle
- http handling
- importing core/database
- importing repository

dto.ts must be pure and side-effect free.

---

# handle.ts (Business Layer)

Responsibility:
- Implement business logic
- Use repository abstraction
- Call shared utilities
- Call infrastructure clients

Allowed:
- repository functions
- QueryBuilder
- shared utilities
- infrastructure clients
- transaction wrapper

Forbidden:
- direct pg usage
- raw SQL
- Elysia instance usage
- route definition
- modifying core layer
- cross-module import

All database operations MUST use existing repository functions.

Do NOT introduce new ORM.
Do NOT rewrite repository.
Do NOT replace QueryBuilder.

---

# route.ts (HTTP Mapping Layer)

Responsibility:
- Define HTTP routes
- Bind dto and handle
- Export IRouteModule

Allowed:
- parameter validation
- call handle
- wrap result using unified result format

Forbidden:
- business logic
- database access
- repository usage
- complex logic
- modifying infrastructure

route.ts must be thin and declarative.

---

# task.ts (Scheduled Task Layer)

Responsibility:
- Define scheduled tasks
- Export ITaskModule

Allowed:
- call handle functions
- define cron expression

Forbidden:
- business logic duplication
- direct database access
- route registration
- http handling

Task logic must reuse handle functions when possible.

---

# Core Layer Protection (DO NOT MODIFY)

The following are protected:

core/database/*
core/repository.ts
core/transaction.ts
core/route-registry.ts
core/task-registry.ts
core/result.ts

Never:
- refactor core layer
- redesign route loading mechanism
- redesign task registry
- replace repository abstraction
- introduce new database layer

---

# Shared Layer Rules

shared/
- pure utility functions only
- no business logic
- no database access
- no http handling
- no module dependency
- no side effects on import
- functions must be stateless

Dependency direction:
modules → shared only

shared must NOT import modules.
shared must NOT import core/database.

---

# Infrastructure Layer Rules

infrastructure/
- external service clients only
- storage providers only
- no business logic

modules may call infrastructure.
infrastructure must NOT depend on modules.

---

# Unified Result Contract

All HTTP responses must use unified result wrapper.

Do not return raw objects.
Do not return raw arrays.
Do not change response structure.

---

# Repository Usage Rules

Always:
- use existing CRUD abstraction
- use QueryBuilder
- use transaction wrapper if needed

Never:
- write raw SQL directly
- access pg.ts directly
- create new repository abstraction
- introduce ORM

---

# Module Creation Rules

When generating a new module:

1. Create folder under modules/{moduleName}
2. Create exactly four files:
   - dto.ts
   - handle.ts
   - route.ts
   - task.ts
3. Put business logic only in handle.ts
4. dto.ts must contain validation only
5. route.ts must be thin
6. task.ts must reuse handle logic
7. Follow existing export pattern strictly
8. Do not modify other modules
9. Do not modify core layer

Always follow existing module pattern.
Never redesign structure.

---

# AI Behavior Rules

When generating code:

1. Explain plan in max 5 lines
2. List files to create or modify
3. Do not refactor unrelated files
4. Do not modify folder structure
5. Do not introduce new dependency
6. Generate minimal code
7. Follow existing naming conventions
8. Ask before modifying database schema
9. No over-engineering
10. Respect dependency direction strictly

If conflict exists between this document and existing project pattern,
always follow existing project pattern.