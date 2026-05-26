import { afterAll, describe, expect, it, mock } from 'bun:test';
import { buildFakeCtx } from '../helper/ctx';

afterAll(() => {
    mock.restore();
});

mock.module('@/core/database/repository', () => ({
    InsertOneAndRes: mock().mockResolvedValue({
        id: 1, sourceId: 1, objectCode: 'BD_CUSTOMER', objectName: '客户',
        objectType: 'basic', delFlag: false,
    }),
    FindOneByKey: mock().mockResolvedValue({
        id: 1, sourceId: 1, objectCode: 'BD_CUSTOMER', objectName: '客户',
        objectType: 'basic', delFlag: false,
    }),
    FindPage: mock().mockResolvedValue({
        list: [{ id: 1, objectCode: 'BD_CUSTOMER', objectName: '客户', objectType: 'basic' }],
        total: 1,
    }),
    FindAll: mock().mockResolvedValue([]),
    UpdateByKey: mock().mockResolvedValue(undefined),
    UpdateByKeyAndRes: mock().mockResolvedValue(undefined),
    SoftDeleteByKeys: mock().mockResolvedValue(undefined),
    CreateQueryBuilder: mock(() => ({
        eq: mock(function (this: any) { return this; }),
        ne: mock(function (this: any) { return this; }),
        ilike: mock(function (this: any) { return this; }),
        like: mock(function (this: any) { return this; }),
        dateRange: mock(function (this: any) { return this; }),
        build: mock(() => ({})),
    })),
    InsertOne: mock().mockResolvedValue(undefined),
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
    createObject, findObjectList, findObjectOne, updateObject, removeObject,
    createMapping, findMappingList, updateMapping, removeMapping,
    createTask, findTaskList, findTaskOne, updateTask, removeTask, toggleTask,
} = await import('@/modules/data-integration/handle');

describe('data-integration object handlers', () => {
    describe('createObject', () => {
        it('should return ok with created object', async () => {
            const ctx = buildFakeCtx({
                body: { sourceId: 1, objectCode: 'BD_CUSTOMER', objectName: '客户', objectType: 'basic' },
            });
            const result = await createObject(ctx);
            expect(result.code).toBe(200);
            expect(result.data).toHaveProperty('objectCode', 'BD_CUSTOMER');
        });
    });

    describe('findObjectList', () => {
        it('should return paginated list', async () => {
            const ctx = buildFakeCtx({ query: { pageNum: 1, pageSize: 10 } });
            const result = await findObjectList(ctx);
            expect(result.code).toBe(200);
            expect(result.data.total).toBe(1);
        });

        it('should filter by sourceId', async () => {
            const ctx = buildFakeCtx({ query: { pageNum: 1, pageSize: 10, sourceId: 1 } });
            const result = await findObjectList(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('findObjectOne', () => {
        it('should return object by id', async () => {
            const ctx = buildFakeCtx({ params: { id: '1' } });
            const result = await findObjectOne(ctx);
            expect(result.code).toBe(200);
            expect(result.data).toHaveProperty('objectName', '客户');
        });
    });

    describe('updateObject', () => {
        it('should return ok on success', async () => {
            const ctx = buildFakeCtx({ body: { id: 1, objectName: '更新后的客户' } });
            const result = await updateObject(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('removeObject', () => {
        it('should soft-delete objects by ids', async () => {
            const ctx = buildFakeCtx({ params: { ids: '1,2' } });
            const result = await removeObject(ctx);
            expect(result.code).toBe(200);
        });
    });
});

describe('data-integration mapping handlers', () => {
    describe('createMapping', () => {
        it('should return ok with created mapping', async () => {
            const ctx = buildFakeCtx({
                body: { objectId: 1, sourceField: 'FName', targetField: 'name' },
            });
            const result = await createMapping(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('findMappingList', () => {
        it('should return paginated list', async () => {
            const ctx = buildFakeCtx({ query: { pageNum: 1, pageSize: 10, objectId: 1 } });
            const result = await findMappingList(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('updateMapping', () => {
        it('should return ok on success', async () => {
            const ctx = buildFakeCtx({ body: { id: 1, targetField: 'customer_name' } });
            const result = await updateMapping(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('removeMapping', () => {
        it('should soft-delete mappings by ids', async () => {
            const ctx = buildFakeCtx({ params: { ids: '1,2,3' } });
            const result = await removeMapping(ctx);
            expect(result.code).toBe(200);
        });
    });
});

describe('data-integration task handlers', () => {
    describe('createTask', () => {
        it('should return ok with created task', async () => {
            const ctx = buildFakeCtx({
                body: { name: '同步客户数据', sourceId: 1, objectId: 1 },
            });
            const result = await createTask(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('findTaskList', () => {
        it('should return paginated list', async () => {
            const ctx = buildFakeCtx({ query: { pageNum: 1, pageSize: 10 } });
            const result = await findTaskList(ctx);
            expect(result.code).toBe(200);
        });

        it('should filter by status', async () => {
            const ctx = buildFakeCtx({ query: { pageNum: 1, pageSize: 10, status: 'active' } });
            const result = await findTaskList(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('findTaskOne', () => {
        it('should return task by id', async () => {
            const ctx = buildFakeCtx({ params: { id: '1' } });
            const result = await findTaskOne(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('updateTask', () => {
        it('should return ok on success', async () => {
            const ctx = buildFakeCtx({ body: { id: 1, name: '更新后的同步任务' } });
            const result = await updateTask(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('removeTask', () => {
        it('should soft-delete tasks by ids', async () => {
            const ctx = buildFakeCtx({ params: { ids: '1,2' } });
            const result = await removeTask(ctx);
            expect(result.code).toBe(200);
        });
    });

    describe('toggleTask', () => {
        it('should toggle from active to paused', async () => {
            const { FindOneByKey } = await import('@/core/database/repository');
            FindOneByKey.mockResolvedValueOnce({
                id: 1, name: '同步客户数据', status: 'active',
            });
            const ctx = buildFakeCtx({ params: { id: '1' } });
            const result = await toggleTask(ctx);
            expect(result.code).toBe(200);
            expect(result.data).toHaveProperty('status', 'paused');
        });

        it('should toggle from paused to active', async () => {
            const { FindOneByKey } = await import('@/core/database/repository');
            FindOneByKey.mockResolvedValueOnce({
                id: 2, name: '已暂停任务', status: 'paused',
            });
            const ctx = buildFakeCtx({ params: { id: '2' } });
            const result = await toggleTask(ctx);
            expect(result.code).toBe(200);
            expect(result.data).toHaveProperty('status', 'active');
        });
    });
});
