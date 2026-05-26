# AI 开发上下文速览（工具链补充）

**不替代** `.ai/AI_CODE_EXAMPLES.md` 里的代码模板；本文仅 MCP、内置组件索引、手执 SQL、数据字典与菜单权限等运维向约定。

---

## 1. 内置 UI（勿为查用法通读 `components/core`）

- 常用路径：`@/components/core/forms/`（如 `ArtForm`、`ArtSearchBar`、`ArtButtonTable`、`ArtExcelImport`、`ArtExcelExport`、`ArtWangEditor`）、`@/components/core/tables/`（`ArtTable`、`ArtTableHeader`）。
- 复杂 props：**只**打开参考页 `admin/src/views/system/user/` 对照，不要扫整个 `core`。

---

## 2. Excel

- **导出**：优先 `ArtExcelExport` + 列表/选中行数据（见 user 页）。
- **导入**：通常要专用接口与校验；未确认前不要臆造批量写库。

---

## 3. MCP `user-postgres`

- 若会话中 **可用** `query`：仅用于 **只读** SQL（核对表、查数据、对照菜单/字典等）。
- **不能**用 MCP 代替迁移、DDL 或业务写库。

---

## 4. 开发者手执 SQL（与 MCP 互补）

- **适用**：种子数据、菜单/字典/角色关联、联调假数据等需写库、且不必写进应用代码路径的场景。
- **做法**：根据已确认表结构输出可复制 `INSERT`/`UPDATE`（可提示 `BEGIN` / `ON CONFLICT` 幂等）；**由开发者在目标库手动执行**，执行前自行确认环境（勿默认生产）。
- **边界**：DDL、删表、无 WHERE 的大范围更新须谨慎；**改 schema 须先征得用户同意**；不要在回复中假装已执行写操作。

---

## 5. 新菜单 / 权限（checklist）

**CRITICAL**：新建前端页面模块时，以下三步缺一不可：

### 5a. 路由注册（前端）
- `admin/src/router/modules/system.ts` 中添加 Vue Router 路由定义（path / name / component / meta）。

### 5b. 菜单写入（数据库 — 必须执行！）
- 向 `system_menu` 表 INSERT 菜单记录，`parentId` 指向正确的父菜单。
- 向 `system_role_menu` 表 INSERT 权限关联（至少给 role_id=1 超级管理员）。
- **实践**：写 seed 脚本后用 `bun run script/xxx.ts` 执行；或提供手执 SQL。
- **常见父菜单**：`path=metadata, parent_id=3` 为"元数据管理"；其他父菜单参考 `seed-workflow-menu.ts` 的查找模式。

### 5c. 权限标识对齐
- 后端：新模块 `route.ts` 每条路由 `meta.permission` 与约定 `group:name:action` 一致（参见 `AI_CODE_EXAMPLES`）。
- 前端：`v-auth` / `auth.hasAuth` 与上述字符串一致（见 `.cursor/rules/frontend.mdc`）。
- 如需按钮级权限：在 `system_menu_btn` 表中增加记录。

---

## 6. 业务类型 / 枚举与数据字典

- 状态、类型、选项等应对齐库内字典（常见表名：`system_dict_type`、`system_dict_data`；列细节以迁移/只读查询为准）。
- **有 live `query`**：先只读查是否已有合适 `dict_type` 与数据项，避免重复编码。
- **无 live `query`**：以迁移、仓库内 schema、用户说明为准；**不**把「未配置 MCP」当成已查库。
- **缺项**：仍不经 MCP 写入；输出 **手执 SQL** 补字典，或一句「请在后台字典管理维护」，择一即可。
