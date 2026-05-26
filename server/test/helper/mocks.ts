import { mock } from 'bun:test'

/**
 * 共享 Mock 工厂函数，确保所有 test file 使用相同的 mock 结构，
 * 避免 mock.module 在同一 process 中泄漏导致 "Export not found" 错误。
 */

// --- repository mock (所有 handler test 共用) ---
export function createRepositoryMock() {
  return {
    InsertOne: mock().mockResolvedValue(undefined),
    InsertOneAndRes: mock().mockResolvedValue({}),
    FindOneByKey: mock().mockResolvedValue({}),
    FindPage: mock().mockResolvedValue({ list: [], total: 0 }),
    FindAll: mock().mockResolvedValue([]),
    FindAllWithJoin: mock().mockResolvedValue([]),
    UpdateByKey: mock().mockResolvedValue(undefined),
    UpdateByKeyAndRes: mock().mockResolvedValue({}),
    SoftDeleteByKeys: mock().mockResolvedValue(undefined),
    CreateQueryBuilder: mock(() => createQueryBuilderMock()),
    db: {},
  }
}

// --- QueryBuilder mock (所有 handler test 共用) ---
export function createQueryBuilderMock() {
  return {
    eq: mock(function (this: any) { return this }),
    ne: mock(function (this: any) { return this }),
    in: mock(function (this: any) { return this }),
    ilike: mock(function (this: any) { return this }),
    like: mock(function (this: any) { return this }),
    dateRange: mock(function (this: any) { return this }),
    join: mock(function (this: any) { return this }),
    build: mock(() => ({})),
  }
}

// --- result mock (所有 handler test 共用) ---
export function createResultMock() {
  return {
    BaseResultData: {
      ok: (data: any = null, msg = '操作成功') => ({ code: 200, msg, data }),
      fail: (code = 500, msg?: any) => ({
        code,
        msg: typeof msg === 'string' ? msg : (msg?.message ?? String(msg ?? '')),
        data: null,
      }),
    },
  }
}

// --- 用 Proxy 创建 mock schema（使 drizzle-orm eq/and 能正常工作） ---
export function createMockSchema(name: string) {
  return new Proxy({ _schema: name }, {
    get: (_target, prop) => {
      if (prop === '_schema') return name
      // 返回 truthy 对象，使 drizzle-orm 的 Column 类型检查通过
      return { name: `${name}.${String(prop)}`, table: { _name: name } }
    },
  })
}
