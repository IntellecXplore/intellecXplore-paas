import { afterAll, describe, expect, it, mock } from 'bun:test';
import { buildFakeCtx } from '../helper/ctx';

afterAll(() => {
    mock.restore();
});

// Mock 必须在被 mock 模块 import 之前调用
mock.module('@/core/database/repository', () => ({
    InsertOneAndRes: mock().mockResolvedValue({
        id: 1, name: '测试数据源', productType: 'kingdee-galaxy',
        connectionType: 'api', connectionConfig: { encrypted: true },
        status: 'active', delFlag: false,
    }),
    InsertOne: mock().mockResolvedValue(undefined),
    FindOneByKey: mock().mockResolvedValue({
        id: 1, name: '测试数据源', productType: 'kingdee-galaxy',
        connectionType: 'api', connectionConfig: { encrypted: true },
        status: 'active', delFlag: false,
    }),
    FindPage: mock().mockResolvedValue({
        list: [{ id: 1, name: '测试数据源', productType: 'kingdee-galaxy', status: 'active' }],
        total: 1,
    }),
    FindAll: mock().mockResolvedValue([]),
    UpdateByKey: mock().mockResolvedValue(undefined),
    UpdateByKeyAndRes: mock().mockResolvedValue({ id: 1, status: 'active' }),
    SoftDeleteByKeys: mock().mockResolvedValue(undefined),
    CreateQueryBuilder: mock(() => ({
        eq: mock(function (this: any) { return this; }),
        ne: mock(function (this: any) { return this; }),
        ilike: mock(function (this: any) { return this; }),
        like: mock(function (this: any) { return this; }),
        gt: mock(function (this: any) { return this; }),
        gte: mock(function (this: any) { return this; }),
        lt: mock(function (this: any) { return this; }),
        lte: mock(function (this: any) { return this; }),
        in: mock(function (this: any) { return this; }),
        notIn: mock(function (this: any) { return this; }),
        dateRange: mock(function (this: any) { return this; }),
        or: mock(function (this: any) { return this; }),
        not: mock(function (this: any) { return this; }),
        build: mock(() => ({})),
    })),
    db: {},
}));

mock.module('@/core/result', () => ({
    BaseResultData: {
        ok: (data: any = null, msg = '操作成功') => ({ code: 200, msg, data }),
        fail: (code = 500, msg?: any) => ({
            code,
            msg: typeof msg === 'string' ? msg : (msg?.message ?? String(msg ?? '')),
            data: null,
        }),
    },
}));

const {
    createSource, findSourceList, findSourceOne, updateSource, removeSource,
} = await import('@/modules/data-integration/handle');

describe('data-integration source handlers', () => {
    describe('createSource', () => {
        it('should return ok with created record', async () => {
            const ctx = buildFakeCtx({
                body: {
                    name: '星空生产环境',
                    productType: 'kingdee-galaxy',
                    connectionType: 'api',
                    connectionConfig: { baseUrl: 'https://api.example.com', appSecret: 'secret123' },
                },
            });

            const result = await createSource(ctx);
            expect(result.code).toBe(200);
            expect(result.data).toHaveProperty('id', 1);
            expect(result.data).toHaveProperty('name', '测试数据源');
        });
    });

    describe('findSourceList', () => {
        it('should return paginated list', async () => {
            const ctx = buildFakeCtx({
                query: { pageNum: 1, pageSize: 10 },
            });

            const result = await findSourceList(ctx);
            expect(result.code).toBe(200);
            expect(result.data).toHaveProperty('list');
            expect(result.data).toHaveProperty('total', 1);
        });

        it('should apply filters', async () => {
            const ctx = buildFakeCtx({
                query: { pageNum: 1, pageSize: 10, name: '星空', productType: 'kingdee-galaxy' },
            });

            const result = await findSourceList(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('findSourceOne', () => {
        it('should return source by id', async () => {
            const ctx = buildFakeCtx({ params: { id: '1' } });

            const result = await findSourceOne(ctx);
            expect(result.code).toBe(200);
            expect(result.data).toHaveProperty('productType', 'kingdee-galaxy');
        });

        it('should return null if not found', async () => {
            const { FindOneByKey } = await import('@/core/database/repository');
            FindOneByKey.mockResolvedValueOnce(null);

            const ctx = buildFakeCtx({ params: { id: '999' } });
            const result = await findSourceOne(ctx);
            expect(result.code).toBe(200);
            expect(result.data).toBeNull();
        });
    });

    describe('updateSource', () => {
        it('should return ok on success', async () => {
            const ctx = buildFakeCtx({
                body: {
                    id: 1,
                    name: '更新后的数据源',
                    connectionConfig: { baseUrl: 'https://new-api.example.com', appSecret: 'new-secret' },
                },
            });

            const result = await updateSource(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('removeSource', () => {
        it('should soft-delete sources by ids', async () => {
            const ctx = buildFakeCtx({ params: { ids: '1,2,3' } });

            const result = await removeSource(ctx);
            expect(result.code).toBe(200);
        });
    });
});
