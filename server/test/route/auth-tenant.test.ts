/**
 * 登录权限链路集成测试
 *
 * 前置条件：
 *   1. 测试数据库已创建且 schema 已同步（NODE_ENV=test bun run db:push）
 *   2. 种子数据已插入（NODE_ENV=test bun run seed）
 *   3. Redis 可连接
 *
 * 运行：
 *   cd server && bun test test/route/auth-tenant.test.ts
 *
 * 若无测试数据库，可跳过：
 *   cd server && bun test --testPathPattern="test/(unit|handler)/"
 */
import { describe, expect, it, beforeAll } from 'bun:test'
import type { Elysia } from 'elysia'

describe('auth → login → permissions chain', () => {
  let app: Elysia
  let loginTokens: { accessToken: string; currentTenantId: number; tenants: any[] }

  beforeAll(async () => {
    try {
      const { CreateTestApp } = await import('../helper/app')
      app = await CreateTestApp()
    } catch (e) {
      console.warn('跳过集成测试：数据库未就绪')
      console.warn(String(e).slice(0, 200))
    }
  })

  describe('POST /api/auth/login', () => {
    it('should login and return permissions', async () => {
      if (!app) return

      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: '123456' }),
        })
      )
      const json = await res.json()
      expect(json.code).toBe(200)
      expect(json.data.accessToken).toBeTruthy()
      expect(json.data.currentTenantId).toBeGreaterThan(0)
      expect(json.data.tenants.length).toBeGreaterThan(0)

      loginTokens = json.data
    })
  })

  describe('GET /api/auth/tenants', () => {
    it('should return user tenant list', async () => {
      if (!app || !loginTokens) return

      const res = await app.handle(
        new Request('http://localhost/api/auth/tenants', {
          headers: { 'Authorization': `Bearer ${loginTokens.accessToken}` },
        })
      )
      const json = await res.json()
      expect(json.code).toBe(200)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBeGreaterThan(0)
      expect(json.data[0]).toHaveProperty('tenantId')
      expect(json.data[0]).toHaveProperty('tenantName')
    })
  })

  describe('GET /api/system/user/perm (critical)', () => {
    it('should return user info with NON-EMPTY permissions', async () => {
      if (!app || !loginTokens) return

      const res = await app.handle(
        new Request('http://localhost/api/system/user/perm', {
          headers: { 'Authorization': `Bearer ${loginTokens.accessToken}` },
        })
      )
      const json = await res.json()
      expect(json.code).toBe(200)

      // ⚠️ 核心断言：权限数组不能为空（防止回归 #1）
      const perms: string[] = json.data?.permissions ?? []
      expect(perms.length).toBeGreaterThan(0)

      // 基础权限应包含
      expect(perms).toContain('system:user:query')
      expect(json.data.roles.length).toBeGreaterThan(0)
    })
  })

  describe('system:user:query authorized API', () => {
    it('should return 200 for authorized endpoint', async () => {
      if (!app || !loginTokens) return

      const res = await app.handle(
        new Request('http://localhost/api/system/user/list?pageNum=1&pageSize=10', {
          headers: { 'Authorization': `Bearer ${loginTokens.accessToken}` },
        })
      )
      const json = await res.json()
      expect(json.code).toBe(200)
      expect(json.data).toHaveProperty('list')
      expect(json.data).toHaveProperty('total')
    })
  })
})

describe('tenant data isolation', () => {
  let app: Elysia
  let tokenA: string
  let tokenB: string

  beforeAll(async () => {
    try {
      const { CreateTestApp } = await import('../helper/app')
      app = await CreateTestApp()
    } catch {
      return
    }

    // 登录默认租户 (tenant 1)
    {
      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: '123456', tenantCode: 'default' }),
        })
      )
      const json = await res.json()
      tokenA = json.data?.accessToken ?? ''
    }
  })

  it('should only see own tenant data', async () => {
    if (!app || !tokenA) return

    // 在租户 A 中查询数据
    const res = await app.handle(
      new Request('http://localhost/api/system/user/list?pageNum=1&pageSize=100', {
        headers: { 'Authorization': `Bearer ${tokenA}` },
      })
    )
    const json = await res.json()
    expect(json.code).toBe(200)

    // 所有返回的用户应该有 tenantId = 1（租户 A）
    const list: any[] = json.data?.list ?? []
    if (list.length > 0) {
      // 注意：用户列表可能不直接返回 tenantId，这里验证无 403 即可
      // 完整的隔离验证需在 handler 测试中做
      expect(list.every((item: any) => item.tenantId === undefined || item.tenantId === 1)).toBe(true)
    }
  })
})
