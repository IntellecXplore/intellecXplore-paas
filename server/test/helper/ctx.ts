import type { Context } from 'elysia'

/**
 * 构造测试用 Elysia Context（模拟中间件已挂载的字段）。
 * 用于 handler 单元测试，无需启动真实 HTTP 服务。
 */
export function buildFakeCtx(overrides: Partial<{
  body: Record<string, any>
  query: Record<string, any>
  params: Record<string, any>
  headers: Record<string, string>
  user: Record<string, any>
  tenant: Record<string, any>
  tenantId: number
  routeInfo: { tags: string; summary: string; meta: { isAuth?: boolean; permission?: string } }
  set: { status: number; headers: Record<string, string> }
}> = {}): Context {
  return {
    body: overrides.body ?? {},
    query: overrides.query ?? {},
    params: overrides.params ?? {},
    headers: overrides.headers ?? {},
    user: overrides.user ?? { userId: 1, userName: 'test-admin', tenantId: 1 },
    tenant: overrides.tenant ?? { tenantId: 1, tenantName: 'default', status: 1 },
    tenantId: overrides.tenantId ?? 1,
    routeInfo: overrides.routeInfo ?? {
      tags: 'test',
      summary: 'test route',
      meta: {},
    },
    set: overrides.set ?? { status: 200, headers: {} },
    request: new Request('http://localhost/api/test'),
    route: '/api/test',
    store: {},
  } as unknown as Context
}
