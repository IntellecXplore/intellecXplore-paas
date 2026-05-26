import { afterAll, describe, expect, it, mock } from 'bun:test'
import { buildFakeCtx } from '../helper/ctx'
import { createRepositoryMock, createResultMock, createMockSchema } from '../helper/mocks'

afterAll(() => {
  mock.restore()
})

function makeMockTx() {
  return {
    insert: mock(() => ({
      values: mock(() => ({
        returning: mock(() => [{ userId: 1, username: 'testuser' }]),
      })),
    })),
    update: mock(() => ({
      set: mock(() => ({
        where: mock(() => undefined),
      })),
    })),
    delete: mock(() => ({
      where: mock(() => undefined),
    })),
  }
}

mock.module('@/core/database/transaction', () => ({
  RunTransaction: mock(async (cb: (tx: any) => Promise<any>) => cb(makeMockTx())),
}))

// 仅 system-user 的 update 事务回调中直接调用了 drizzle-orm 的 eq/and，
// 因此需要 mock 这两个函数。其他 handler 测试不依赖此 mock。
mock.module('drizzle-orm', () => ({
  eq: mock((..._args: any[]) => ({ _type: 'eq' })),
  and: mock((..._args: any[]) => ({ _type: 'and' })),
}))

const repoMock = createRepositoryMock()
repoMock.FindOneByKey.mockResolvedValue({
  userId: 1, username: 'testuser', nickname: '测试用户',
  email: 'test@example.com', phone: '13800138000',
  sex: '1', status: '1', deptId: 1, delFlag: false,
  password: '$2b$10$hashedpassword',
  createTime: new Date(), updateTime: new Date(),
})
repoMock.FindPage.mockResolvedValue({
  list: [
    { userId: 1, username: 'testuser', nickname: '测试用户', email: 'test@example.com', phone: '13800138000', sex: '1', status: '1', deptId: 1, delFlag: false, password: 'hashed', createTime: new Date(), updateTime: new Date() },
    { userId: 2, username: 'admin', nickname: '管理员', email: 'admin@example.com', phone: '13900139000', sex: '0', status: '1', deptId: 1, delFlag: false, password: 'hashed', createTime: new Date(), updateTime: new Date() },
  ],
  total: 2,
})
repoMock.FindAll.mockResolvedValue([
  { userId: 1, roleId: 1 },
  { userId: 1, roleId: 2 },
])

mock.module('@/core/database/repository', () => repoMock)

mock.module('@/core/database/redis', () => ({
  Get: mock().mockResolvedValue(null),
}))

mock.module('@/shared/bcrypt', () => ({
  BcryptHash: mock((str: string) => `hashed:${str}`),
  BcryptCompare: mock((str: string, hash: string) => hash === `hashed:${str}`),
}))

mock.module('@/shared/logger', () => ({
  logger: { error: mock(() => {}) },
}))

mock.module('@/types/dto', () => ({
  ParseDateFields: mock((data: any) => data),
}))

mock.module('@/core/result', () => createResultMock())

mock.module('@database/schema/system_user', () => ({
  systemUserSchema: createMockSchema('systemUser'),
  systemUserRoleSchema: createMockSchema('systemUserRole'),
}))

mock.module('@database/schema/system_dept', () => ({
  systemDeptSchema: createMockSchema('systemDept'),
}))

const {
  create,
  findList,
  findPerm,
  findBasic,
  findOne,
  update,
  updateBasic,
  updatePassword,
  remove,
} = await import('@/modules/system-user/handle')

describe('system-user handlers', () => {
  describe('create', () => {
    it('should create user and return ok', async () => {
      const ctx = buildFakeCtx({
        body: {
          username: 'newuser',
          password: 'plainpass',
          nickname: '新用户',
          roles: [1, 2],
        },
      })
      const result = await create(ctx)
      expect(result.code).toBe(200)
    })

    it('should create user without roles', async () => {
      const ctx = buildFakeCtx({
        body: { username: 'norole', password: 'plainpass' },
      })
      const result = await create(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on transaction error', async () => {
      const { RunTransaction } = await import('@/core/database/transaction')
      RunTransaction.mockRejectedValueOnce(new Error('TX error'))
      const ctx = buildFakeCtx({
        body: { username: 'failuser', password: 'x' },
      })
      const result = await create(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findList', () => {
    it('should return paginated list without password field', async () => {
      const ctx = buildFakeCtx({ query: { pageNum: 1, pageSize: 10 } })
      const result = await findList(ctx)
      expect(result.code).toBe(200)
      expect(result.data.total).toBe(2)
      expect(result.data.list).toHaveLength(2)
      expect(result.data.list[0]).not.toHaveProperty('password')
    })

    it('should filter by username', async () => {
      const ctx = buildFakeCtx({
        query: { pageNum: 1, pageSize: 10, username: 'test' },
      })
      const result = await findList(ctx)
      expect(result.code).toBe(200)
    })

    it('should filter by status', async () => {
      const ctx = buildFakeCtx({
        query: { pageNum: 1, pageSize: 10, status: '1' },
      })
      const result = await findList(ctx)
      expect(result.code).toBe(200)
    })

    it('should filter by email and phone', async () => {
      const ctx = buildFakeCtx({
        query: { pageNum: 1, pageSize: 10, email: 'test@', phone: '138' },
      })
      const result = await findList(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.FindPage.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ query: { pageNum: 1, pageSize: 10 } })
      const result = await findList(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findPerm', () => {
    it('should return user from cache', async () => {
      const { Get } = await import('@/core/database/redis')
      Get.mockResolvedValueOnce({
        userId: 1, username: 'testuser', nickname: '测试',
        loginLocation: '127.0.0.1', ipaddr: '127.0.0.1',
        userType: 'admin', loginTime: '2024-01-01',
      })
      const ctx = buildFakeCtx()
      const result = await findPerm(ctx)
      expect(result.code).toBe(200)
      expect(result.data).not.toHaveProperty('loginLocation')
      expect(result.data).not.toHaveProperty('ipaddr')
      expect(result.data).not.toHaveProperty('userType')
      expect(result.data).not.toHaveProperty('loginTime')
      expect(result.data).toHaveProperty('username', 'testuser')
    })

    it('should return 404 if user not in cache', async () => {
      const { Get } = await import('@/core/database/redis')
      Get.mockResolvedValueOnce(null)
      const ctx = buildFakeCtx()
      const result = await findPerm(ctx)
      expect(result.code).toBe(404)
    })

    it('should return fail on error', async () => {
      const { Get } = await import('@/core/database/redis')
      Get.mockRejectedValueOnce(new Error('Redis error'))
      const ctx = buildFakeCtx()
      const result = await findPerm(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findBasic', () => {
    it('should return basic user info with deptName', async () => {
      const ctx = buildFakeCtx()
      const result = await findBasic(ctx)
      expect(result.code).toBe(200)
      expect(result.data).not.toHaveProperty('password')
    })

    it('should return 404 if user not found', async () => {
      repoMock.FindOneByKey.mockResolvedValueOnce(null)
      const ctx = buildFakeCtx()
      const result = await findBasic(ctx)
      expect(result.code).toBe(404)
    })

    it('should return 404 if user is soft-deleted', async () => {
      repoMock.FindOneByKey.mockResolvedValueOnce({
        userId: 1, delFlag: true,
      })
      const ctx = buildFakeCtx()
      const result = await findBasic(ctx)
      expect(result.code).toBe(404)
    })
  })

  describe('findOne', () => {
    it('should return user with roles', async () => {
      const ctx = buildFakeCtx({ params: { id: '1' } })
      const result = await findOne(ctx)
      expect(result.code).toBe(200)
      expect(result.data).not.toHaveProperty('password')
      expect(result.data).toHaveProperty('roles')
      expect(Array.isArray(result.data.roles)).toBe(true)
    })

    it('should return 404 if not found', async () => {
      repoMock.FindOneByKey.mockResolvedValueOnce(null)
      const ctx = buildFakeCtx({ params: { id: '999' } })
      const result = await findOne(ctx)
      expect(result.code).toBe(404)
    })

    it('should return 404 if soft-deleted', async () => {
      repoMock.FindOneByKey.mockResolvedValueOnce({ userId: 1, delFlag: true })
      const ctx = buildFakeCtx({ params: { id: '1' } })
      const result = await findOne(ctx)
      expect(result.code).toBe(404)
    })
  })

  describe('update', () => {
    it('should update user and roles', async () => {
      const ctx = buildFakeCtx({
        body: {
          userId: 1, username: 'updated', nickname: '更新',
          roles: [1, 3],
        },
      })
      const result = await update(ctx)
      expect(result.code).toBe(200)
    })

    it('should update user without roles', async () => {
      const ctx = buildFakeCtx({
        body: { userId: 1, username: 'updated' },
      })
      const result = await update(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on error', async () => {
      const { RunTransaction } = await import('@/core/database/transaction')
      RunTransaction.mockRejectedValueOnce(new Error('TX error'))
      const ctx = buildFakeCtx({ body: { userId: 1 } })
      const result = await update(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('updateBasic', () => {
    it('should update current user basic info', async () => {
      const ctx = buildFakeCtx({
        body: { nickname: '新昵称', email: 'new@test.com' },
      })
      const result = await updateBasic(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on error', async () => {
      repoMock.UpdateByKey.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { nickname: 'x' } })
      const result = await updateBasic(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('updatePassword', () => {
    it('should update password when old password matches', async () => {
      // BcryptCompare: hash === `hashed:${str}`
      repoMock.FindOneByKey.mockResolvedValueOnce({
        userId: 1, username: 'testuser',
        password: 'hashed:oldpass',
        delFlag: false,
      })
      const ctx = buildFakeCtx({
        body: { oldPassword: 'oldpass', newPassword: 'newpass' },
      })
      const result = await updatePassword(ctx)
      expect(result.code).toBe(200)
    })

    it('should return 400 when old password is wrong', async () => {
      repoMock.FindOneByKey.mockResolvedValueOnce({
        userId: 1, username: 'testuser',
        password: 'hashed:correctpass',
        delFlag: false,
      })
      const ctx = buildFakeCtx({
        body: { oldPassword: 'wrongpass', newPassword: 'newpass' },
      })
      const result = await updatePassword(ctx)
      expect(result.code).toBe(400)
    })

    it('should return 404 if user not found', async () => {
      repoMock.FindOneByKey.mockResolvedValueOnce(null)
      const ctx = buildFakeCtx({
        body: { oldPassword: 'old', newPassword: 'new' },
      })
      const result = await updatePassword(ctx)
      expect(result.code).toBe(404)
    })

    it('should return fail when SetUserPassword throws', async () => {
      // GetUserBy 内部有 try/catch 返回 null，不会抛错到外层
      // 需要通过 UpdateByKeyAndRes 抛错来触发 500（SetUserPassword 内部）
      repoMock.FindOneByKey.mockResolvedValueOnce({
        userId: 1, username: 'testuser',
        password: 'hashed:oldpass',
        delFlag: false,
      })
      repoMock.UpdateByKeyAndRes.mockRejectedValueOnce(new Error('DB error'))

      const ctx = buildFakeCtx({
        body: { oldPassword: 'oldpass', newPassword: 'newpass' },
      })
      const result = await updatePassword(ctx)
      // SetUserPassword 内部 UpdateByKeyAndRes 失败会 throw
      // updatePassword 的 try/catch 捕获 → 500
      expect(result.code).toBe(500)
    })
  })

  describe('remove', () => {
    it('should soft-delete users by ids', async () => {
      const ctx = buildFakeCtx({ params: { ids: '1,2,3' } })
      const result = await remove(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.SoftDeleteByKeys.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ params: { ids: '1' } })
      const result = await remove(ctx)
      expect(result.code).toBe(500)
    })
  })
})
