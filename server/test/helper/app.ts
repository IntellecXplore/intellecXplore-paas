import type { Elysia } from 'elysia'

/**
 * 创建测试用 Elysia 应用实例。
 * 通过 TEST_MODE 环境变量跳过认证、租户、限流、权限等中间件，
 * 仅保留 AnalysisRoute（路由解析）中间件。
 *
 * TEST_MODE 下会自动注入模拟用户上下文：
 *   ctx.user      = { userId: 1, userName: 'test-admin', tenantId: 1 }
 *   ctx.tenant    = { tenantId: 1, tenantName: 'default', status: 1 }
 *   ctx.tenantId  = 1
 */
export async function CreateTestApp(): Promise<Elysia> {
  process.env.TEST_MODE = 'true'
  const { CreateApp } = await import('@/app')
  return CreateApp()
}
