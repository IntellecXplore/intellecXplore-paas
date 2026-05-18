import { afterAll, describe, expect, it, mock } from 'bun:test'
import { buildFakeCtx } from '../helper/ctx'

// 测试结束后恢复所有 mock，避免泄漏到其他测试文件
afterAll(() => {
  mock.restore()
})

// mock.module 必须在被 mock 模块被 import 之前调用
mock.module('@/core/database/repository', () => ({
  InsertOne: mock().mockResolvedValue(undefined),
  FindOneByKey: mock().mockResolvedValue({ dictId: 1, dictName: 'test', dictType: 'test_type', delFlag: false }),
  FindPage: mock().mockResolvedValue({ rows: [], total: 0 }),
  FindAll: mock().mockResolvedValue([]),
  UpdateByKey: mock().mockResolvedValue(undefined),
  SoftDeleteByKeys: mock().mockResolvedValue(undefined),
  CreateQueryBuilder: mock(() => ({
    eq: mock(() => ({ eq: mock(() => ({ like: mock(() => ({ dateRange: mock(() => ({ build: mock(() => ({})) })) })) })) })),
    like: mock(() => ({ eq: mock(() => ({ dateRange: mock(() => ({ build: mock(() => ({})) })) })) })),
    dateRange: mock(() => ({ build: mock(() => ({})) })),
    build: mock(() => ({})),
  })),
}))

mock.module('@/core/result', () => ({
  BaseResultData: {
    ok: (data: any = null, msg = '操作成功') => ({ code: 200, msg, data }),
    fail: (code = 500, msg?: any) => ({ code, msg: msg?.message ?? String(msg ?? ''), data: null }),
  },
}))

// 动态 import handler——mock 已就位
const {
  createType,
  findOneType,
  updateType,
  removeType,
} = await import('@/modules/system-dict/handle')

describe('system-dict handlers', () => {
  describe('createType', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({
        body: { dictName: '测试字典', dictType: 'test_type' },
      })

      const result = await createType(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on error', async () => {
      const { InsertOne } = await import('@/core/database/repository')
      InsertOne.mockRejectedValueOnce(new Error('DB error'))

      const ctx = buildFakeCtx({
        body: { dictName: '测试字典', dictType: 'test_type' },
      })

      const result = await createType(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findOneType', () => {
    it('should return dict type by id', async () => {
      const ctx = buildFakeCtx({ params: { id: '1' } })

      const result = await findOneType(ctx)
      expect(result.code).toBe(200)
      expect(result.data).toHaveProperty('dictId', 1)
    })

    it('should return 404 if not found', async () => {
      const { FindOneByKey } = await import('@/core/database/repository')
      FindOneByKey.mockResolvedValueOnce(null)

      const ctx = buildFakeCtx({ params: { id: '999' } })

      const result = await findOneType(ctx)
      expect(result.code).toBe(404)
    })

    it('should return 404 if soft-deleted', async () => {
      const { FindOneByKey } = await import('@/core/database/repository')
      FindOneByKey.mockResolvedValueOnce({ dictId: 1, delFlag: true })

      const ctx = buildFakeCtx({ params: { id: '1' } })

      const result = await findOneType(ctx)
      expect(result.code).toBe(404)
    })
  })

  describe('updateType', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({
        params: { id: '1' },
        body: { dictName: '更新后的字典' },
      })

      const result = await updateType(ctx)
      expect(result.code).toBe(200)
    })
  })

  describe('removeType', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({ params: { ids: '1,2,3' } })

      const result = await removeType(ctx)
      expect(result.code).toBe(200)
    })
  })
})
