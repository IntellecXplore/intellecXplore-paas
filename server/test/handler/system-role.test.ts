/**
 * 权限链路 handler 测试（真实数据库）
 *
 * 前置：测试数据库已创建且种子数据已插入
 * 运行：cd server && bun test test/handler/system-role.test.ts
 * 跳过：cd server && bun test --testPathPattern="test/(unit)/"
 */
import { describe, expect, it, beforeAll } from 'bun:test'
import type { Elysia } from 'elysia'

let app: Elysia
let accessToken: string

beforeAll(async () => {
  try {
    const { CreateTestApp } = await import('../helper/app')
    app = await CreateTestApp()

    // 登录获取 token
    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' }),
      })
    )
    const json = await res.json()
    if (json.code === 200) accessToken = json.data.accessToken
  } catch (e) {
    console.warn('跳过 handler 测试：数据库未就绪')
  }
})

describe('Permission chain (critical regression guard)', () => {
  it('login should succeed', () => {
    if (!app) return
    expect(accessToken).toBeTruthy()
  })

  it('/api/system/user/perm should return NON-EMPTY permissions', async () => {
    if (!app || !accessToken) return

    const res = await app.handle(
      new Request('http://localhost/api/system/user/perm', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
    )
    const json = await res.json()
    expect(json.code).toBe(200)

    // ★ 核心断言：权限数组不能为空
    const perms: string[] = json.data?.permissions ?? []
    expect(perms.length).toBeGreaterThan(0)
    expect(perms).toContain('system:user:query')
    expect(json.data.roles.length).toBeGreaterThan(0)
  })

  it('/api/system/user/list should return 200 (not 403)', async () => {
    if (!app || !accessToken) return

    const res = await app.handle(
      new Request('http://localhost/api/system/user/list?pageNum=1&pageSize=10', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
    )
    const json = await res.json()
    expect(json.code).toBe(200)
  })

  it('/api/system/role/list should return 200 (not 403)', async () => {
    if (!app || !accessToken) return

    const res = await app.handle(
      new Request('http://localhost/api/system/role/list?pageNum=1&pageSize=10', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
    )
    const json = await res.json()
    expect(json.code).toBe(200)
  })
})
