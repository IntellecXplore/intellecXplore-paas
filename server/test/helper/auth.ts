import { SignJWT } from 'jose'

const TEST_JWT_SECRET = 'test-access-token-secret'

/**
 * 生成测试用 JWT access token。
 * 使用独立的 test secret，不依赖生产配置。
 */
export async function createTestToken(payload: {
  userId: number
  userName: string
  tenantId: number
}): Promise<string> {
  const encoder = new TextEncoder().encode(TEST_JWT_SECRET)
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(encoder)
}

export { TEST_JWT_SECRET }
