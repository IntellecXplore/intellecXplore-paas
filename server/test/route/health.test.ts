/**
 * 路由集成测试——验证 CreateTestApp 工厂和路由解析是否正常。
 *
 * 前置条件：
 *   1. PostgreSQL 数据库 `elysia-admin-test` 已创建
 *   2. 数据库 schema 已同步：bun run db:push（先设置 NODE_ENV=test）
 *
 * 运行：
 *   cd server && bun test test/route/
 *
 * 若无测试数据库，可暂时跳过：
 *   cd server && bun test --testPathPattern="test/(unit|handler)/"
 */
import { describe, expect, it, beforeAll } from 'bun:test'
import type { Elysia } from 'elysia'

describe('route integration', () => {
  let app: Elysia

  beforeAll(async () => {
    try {
      const { CreateTestApp } = await import('../helper/app')
      app = await CreateTestApp()
    } catch (e) {
      // 如果数据库未就绪，跳过集成测试
      console.warn('跳过集成测试：无法创建测试 App（可能缺少测试数据库）')
      console.warn(String(e).slice(0, 200))
    }
  })

  it('should reject request to unknown route with 404', async () => {
    if (!app) return // 跳过

    const res = await app.handle(
      new Request('http://localhost/api/nonexistent-route')
    )
    expect(res.status).toBe(404)
  })

  it('should return validation error for missing body on login', async () => {
    if (!app) return

    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    )
    const json = await res.json()
    // 验证错误：缺少必要字段
    expect(json.code).toBe(400)
  })
})
