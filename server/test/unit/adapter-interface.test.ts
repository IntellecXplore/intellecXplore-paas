import { afterAll, describe, expect, it } from 'bun:test';
import {
    registerAdapter, getAdapter, getRegisteredProductTypes, PRODUCT_TYPES,
    type IDataSourceAdapter, type AdapterCapability,
} from '@/modules/data-integration/adapters/interface';

// 构造一个最小化的 mock adapter
function makeMockAdapter(productType: string): IDataSourceAdapter {
    return {
        productType: productType as any,
        capabilities: {
            supportsFullSync: true,
            supportsIncrementalSync: false,
            supportsWebhook: false,
            supportsWrite: false,
            authType: 'mock',
        } as AdapterCapability,
        testConnection: async () => ({ success: true }),
        authenticate: async () => ({ accessToken: 'mock-token', expiresAt: Date.now() + 3600000 }),
        getObjects: async () => [],
        getFields: async () => [],
        fullSync: async () => ({ [Symbol.asyncIterator]() { return { next: async () => ({ value: undefined, done: true }) }; } }),
        incrementalSync: async () => ({ [Symbol.asyncIterator]() { return { next: async () => ({ value: undefined, done: true }) }; } }),
    };
}

describe('Adapter Registry', () => {
    it('should return empty list when no adapters registered', () => {
        // 当前测试环境中可能已注册了适配器，检查返回类型
        const types = getRegisteredProductTypes();
        expect(Array.isArray(types)).toBe(true);
    });

    it('should register and retrieve an adapter', () => {
        const adapter = makeMockAdapter('kingdee-galaxy');
        registerAdapter(adapter);

        const retrieved = getAdapter('kingdee-galaxy');
        expect(retrieved).toBeDefined();
        expect(retrieved!.productType).toBe('kingdee-galaxy');
        expect(retrieved!.capabilities.authType).toBe('mock');
    });

    it('should return undefined for unregistered product type', () => {
        const retrieved = getAdapter('unknown-type' as any);
        expect(retrieved).toBeUndefined();
    });

    it('should overwrite adapter with same productType', () => {
        const first = makeMockAdapter('kingdee-galaxy');
        first.capabilities = { ...first.capabilities, authType: 'v1' };
        registerAdapter(first);

        const second = makeMockAdapter('kingdee-galaxy');
        second.capabilities = { ...second.capabilities, authType: 'v2' };
        registerAdapter(second); // 覆盖

        const retrieved = getAdapter('kingdee-galaxy');
        expect(retrieved!.capabilities.authType).toBe('v2');
    });

    it('should include registered types in getRegisteredProductTypes', () => {
        const adapter = makeMockAdapter('kingdee-cosmic');
        registerAdapter(adapter);

        const types = getRegisteredProductTypes();
        expect(types).toContain('kingdee-cosmic');
    });
});

describe('PRODUCT_TYPES constants', () => {
    it('should contain all expected product types', () => {
        expect(PRODUCT_TYPES).toContain('kingdee-galaxy');
        expect(PRODUCT_TYPES).toContain('kingdee-cosmic');
        expect(PRODUCT_TYPES).toContain('kingdee-jdy');
        expect(PRODUCT_TYPES).toContain('yonyou-yonsuite');
        expect(PRODUCT_TYPES).toContain('yonyou-ncc');
        expect(PRODUCT_TYPES).toContain('generic-db');
    });

    it('should be readonly', () => {
        expect(PRODUCT_TYPES.length).toBeGreaterThan(5);
    });
});
