import { afterAll, describe, expect, it, mock } from 'bun:test'
import { buildFakeCtx } from '../helper/ctx'
import { createRepositoryMock, createResultMock, createMockSchema } from '../helper/mocks'

afterAll(() => {
  mock.restore()
})

const repoMock = createRepositoryMock()
repoMock.FindAll.mockResolvedValue([
  { deptId: 1, deptName: '技术部', parentId: 0, sort: 1, delFlag: false },
  { deptId: 2, deptName: '前端组', parentId: 1, sort: 1, delFlag: false },
  { deptId: 3, deptName: '后端组', parentId: 1, sort: 2, delFlag: false },
])

mock.module('@/core/database/repository', () => repoMock)

mock.module('@/core/cache', () => ({
  WithCache: mock(async (_key: string, fn: () => any) => fn()),
}))

mock.module('@/core/function', () => ({
  ListToTree: mock((data: any[]) => {
    const map = new Map<number, any>()
    const roots: any[] = []
    for (const item of data) {
      const node = { ...item, children: [] }
      map.set(item.deptId || item.id, node)
    }
    for (const item of data) {
      const node = map.get(item.deptId || item.id)
      if (!item.parentId || item.parentId === 0) {
        roots.push(node)
      } else {
        const parent = map.get(item.parentId)
        if (parent) parent.children.push(node)
        else roots.push(node)
      }
    }
    return roots
  }),
}))

mock.module('@/core/result', () => createResultMock())

mock.module('@/constants/enum', () => ({
  CacheEnum: { BASE_OPTIONS: 'base:options:' },
}))

mock.module('@database/schema/system_dept', () => ({
  systemDeptSchema: createMockSchema('systemDept'),
}))

const {
  create,
  findTree,
  findOptions,
  update,
  remove,
} = await import('@/modules/system-dept/handle')

describe('system-dept handlers', () => {
  describe('create', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({
        body: { deptName: '测试部门', parentId: 0, sort: 1 },
      })
      const result = await create(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.InsertOne.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { deptName: 'x' } })
      const result = await create(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findTree', () => {
    it('should return tree structure', async () => {
      const ctx = buildFakeCtx({ query: {} })
      const result = await findTree(ctx)
      expect(result.code).toBe(200)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should filter by deptName', async () => {
      const ctx = buildFakeCtx({ query: { deptName: '技术' } })
      const result = await findTree(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.FindAll.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ query: {} })
      const result = await findTree(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('findOptions', () => {
    it('should return cached tree options', async () => {
      const ctx = buildFakeCtx()
      const result = await findOptions(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on error', async () => {
      repoMock.FindAll.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx()
      const result = await findOptions(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('update', () => {
    it('should return ok on success', async () => {
      const ctx = buildFakeCtx({
        body: { deptId: 1, deptName: '更新后的部门' },
      })
      const result = await update(ctx)
      expect(result.code).toBe(200)
    })

    it('should return fail on DB error', async () => {
      repoMock.UpdateByKey.mockRejectedValueOnce(new Error('DB error'))
      const ctx = buildFakeCtx({ body: { deptId: 1 } })
      const result = await update(ctx)
      expect(result.code).toBe(500)
    })
  })

  describe('remove', () => {
    it('should soft-delete by ids', async () => {
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
