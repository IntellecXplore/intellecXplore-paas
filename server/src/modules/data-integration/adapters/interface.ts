/** 产品类型枚举 */
export const PRODUCT_TYPES = [
    'kingdee-galaxy', 'kingdee-cosmic', 'kingdee-jdy',
    'kingdee-k3-wise', 'kingdee-eas',
    'yonyou-yonsuite', 'yonyou-ncc', 'yonyou-nc',
    'yonyou-u8', 'yonyou-tplus',
    'generic-db',
] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

/** 连接类型 */
export type ConnectionType = 'api' | 'db';

/** 数据对象分类 */
export const OBJECT_TYPES = [
    'basic', 'finance', 'supply_chain', 'hr', 'manufacture', 'crm',
] as const;
export type ObjectType = typeof OBJECT_TYPES[number];

/** 同步策略 */
export type SyncMode = 'full' | 'incremental';

/** 字段映射转换规则 */
export type TransformRule = 'direct' | 'constant' | 'lookup' | 'expression' | 'composite';

export interface AdapterCapability {
    supportsFullSync: boolean;
    supportsIncrementalSync: boolean;
    supportsWebhook: boolean;
    supportsWrite: boolean;
    authType: string;
    rateLimit?: { maxPerMin: number };
}

export interface SyncResult {
    data: Record<string, any>[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
}

export interface SyncOptions {
    batchSize?: number;
    filterConfig?: Record<string, any>;
    /** 增量同步起始时间 */
    lastSyncAt?: Date;
    /** 分页游标 */
    cursor?: string;
    /** 信号量，用于取消 */
    signal?: AbortSignal;
}

export interface AuthResult {
    accessToken: string;
    expiresAt: number;
    refreshToken?: string;
    tokenType?: string;
}

export interface DataObject {
    objectCode: string;
    objectName: string;
    objectType: ObjectType;
    description?: string;
}

export interface FieldDef {
    field: string;
    label: string;
    type: string;
    nullable?: boolean;
    isKey?: boolean;
    length?: number;
    precision?: number;
    scale?: number;
}

export interface ConnectionConfig {
    connectionType: ConnectionType;
    productType: ProductType;
    // API 类型
    baseUrl?: string;
    authType?: string;
    appId?: string;
    appSecret?: string;
    accountId?: string;
    tenantId?: string;
    extraHeaders?: Record<string, string>;
    // DB 类型
    dbType?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    schema?: string;
    ssl?: boolean;
}

export interface IDataSourceAdapter {
    readonly productType: ProductType;
    readonly capabilities: AdapterCapability;

    /** 测试连接 */
    testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string; latency?: number }>;

    /** 认证授权 */
    authenticate(config: ConnectionConfig): Promise<AuthResult>;

    /** 获取可用数据对象列表 */
    getObjects(config: ConnectionConfig): Promise<DataObject[]>;

    /** 获取数据对象的字段列表 */
    getFields(config: ConnectionConfig, objectCode: string): Promise<FieldDef[]>;

    /** 全量同步（返回 AsyncIterable 流式处理大数据量） */
    fullSync(config: ConnectionConfig, objectCode: string, options?: SyncOptions): Promise<AsyncIterable<SyncResult>>;

    /** 增量同步 */
    incrementalSync(config: ConnectionConfig, objectCode: string, lastSyncAt: Date, options?: SyncOptions): Promise<AsyncIterable<SyncResult>>;

    /** 校验 Webhook 签名 */
    verifyWebhookSignature?(payload: string, signature: string, config: ConnectionConfig): boolean;
}

/** 适配器注册表 */
const adapterRegistry = new Map<ProductType, IDataSourceAdapter>();

export function registerAdapter(adapter: IDataSourceAdapter): void {
    adapterRegistry.set(adapter.productType, adapter);
}

export function getAdapter(productType: ProductType): IDataSourceAdapter | undefined {
    return adapterRegistry.get(productType);
}

export function getRegisteredProductTypes(): ProductType[] {
    return Array.from(adapterRegistry.keys());
}
