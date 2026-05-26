import { afterAll, describe, expect, it, mock } from 'bun:test'
import { buildFakeCtx } from '../helper/ctx'
import { createRepositoryMock, createResultMock, createMockSchema } from '../helper/mocks'

afterAll(() => {
  mock.restore()
})

const repoMock = createRepositoryMock()
repoMock.FindOneByKey.mockResolvedValue({
  apiId: 1, apiName: '用户列表', apiPath: '/api/system/user/list',
  apiMethod: '2', status: true, delFlag: false,
})
repoMock.FindPage.mockResolvedValue({
  list: [
    { apiId: 1, apiName: '用户列表', apiPath: '/api/system/user/list', apiMethod: '2', status: true },
    { apiId: 2, apiName: '角色列表', apiPath: '/api/system/role/list', apiMethod: '2', status: true },
  ],
  total: 2,
})

mock.module('@/core/database/repository', () => repoMock)

mock.module('@/core/database/redis', () => ({
  Del: mock().mockResolvedValue(undefined),
  Set: mock().mockResolvedValue(undefined),
}))

mock.module('@/core/result', () => createResultMock())

mock.module('@/constants/dict', () => ({
  SYSTEM_API_METHOD: {
    GET: '1', POST: '2', PUT: '3', DELETE: '4',
  },
}))

mock.module('@database/schema/system_api', () => ({
  systemApiSchema: createMockSchema('systemApi'),
}))

const {
  create,
  findList,
  findOne,
  update,
  remove,
} = await import('@/modules/system-api/handle')

describe('system-api handlers', () => {
  describe('create', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({
        body: { apiName: '测试API', apiPath: '/api/test', apiMethod: '2' },
      })
      const result = await create(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.InsertOne.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { apiName: 'x' } })
      const result = await create(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findList', () => {
    it('should return paginated list', async () => {
      const ctx = buildFakeCtx({ query: { pageNum: 1, pageSize: 10 } })
      const result = await findList(ctx)
      expect(result.code).toBe(200)
      expect(result.data.total).toBe(2)
      expect(result.data.list).toHaveLength(2)
    })

    it('should filter by apiName', async () => {
      const ctx = buildFakeCtx({
        query: { pageNum: 1, pageSize: 10, apiName: '用户' },
      })
      const result = await findList(ctx)
      expect(result.code).toBe(200)
    })

    it('should filter by apiMethod', async () => {
      const ctx = buildFakeCtx({
        query: { pageNum: 1, pageSize: 10, apiMethod: '2' },
      })
      const result = await findList(ctx)
      expect(result.code).toBe(200)
    })

    it('should filter by apiPath', async () => {
      const ctx = buildFakeCtx({
        query: { pageNum: 1, pageSize: 10, apiPath: '/api/system' },
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

  describe('findOne', () => {
    it('should return api by id', async () => {
      const ctx = buildFakeCtx({ params: { id: '1' } })
      const result = await findOne(ctx)
      expect(result.code).toBe(200)
      expect(result.data).toHaveProperty('apiName', '用户列表')
    })

    it('should return 404 if not found', async () => {
      repoMock.FindOneByKey.mockResolvedValueOnce(null)
      const ctx = buildFakeCtx({ params: { id: '999' } })
      const result = await findOne(ctx)
      expect(result.code).toBe(404)
    })

    it('should return 404 if soft-deleted', async () => {
      repoMock.FindOneByKey.mockResolvedValueOnce({ apiId: 1, delFlag: true })
      const ctx = buildFakeCtx({ params: { id: '1' } })
      const result = await findOne(ctx)
      expect(result.code).toBe(404)
    })

    it('should return fail on DB error', async () => {
      repoMock.FindOneByKey.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ params: { id: '1' } })
      const result = await findOne(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('update', () => {
    it('should return ok and update cache when status is true', async () => {
      const ctx = buildFakeCtx({
        body: { apiId: 1, apiName: '更新后的API', apiMethod: '2', apiPath: '/api/test', status: true },
      })
      const result = await update(ctx)
      expect(result.code).toBe(200)
    })

    it('should return ok and update cache when status is false', async () => {
      const ctx = buildFakeCtx({
        body: { apiId: 1, apiName: '禁用API', apiMethod: '2', apiPath: '/api/test', status: false },
      })
      const result = await update(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.UpdateByKey.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { apiId: 1 } })
      const result = await update(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('remove', () => {
    it('should soft-delete by ids', async () => {
      const ctx = buildFakeCtx({ params: { ids: '1,2' } })
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
