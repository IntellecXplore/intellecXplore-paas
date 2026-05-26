import crypto from 'node:crypto';
import type {
    IDataSourceAdapter, AdapterCapability, ConnectionConfig,
    AuthResult, DataObject, FieldDef, SyncResult, SyncOptions,
} from './interface';

// ========================
// 用友 YonSuite 适配器
// ========================
//
// 认证方式: MD5 签名（安全模式）
//   签名算法: MD5(timestamp + appKey + appSecret)
//   请求头:
//     X-Ca-Key:         appKey
//     X-Ca-Timestamp:   13位毫秒时间戳
//     X-Ca-Md5:         签名值
//
// 业务 API 格式:
//   {baseUrl}/api/{service}/{resource}/{action}
//
// 注意事项:
//   - 必须先在 YonSuite 管理后台对接口进行 API 授权
//   - 时间戳与服务器偏差 > 60s 则签名过期
//   - Webhook: 先 VALIDATE 验证 → 返回 200 → 正式推送

/** YonSuite 常用业务对象 */
const YONSUITE_OBJECTS: DataObject[] = [
    { objectCode: 'customer', objectName: '客户', objectType: 'basic', description: '基础数据-客户' },
    { objectCode: 'supplier', objectName: '供应商', objectType: 'basic', description: '基础数据-供应商' },
    { objectCode: 'material', objectName: '物料', objectType: 'basic', description: '基础数据-物料' },
    { objectCode: 'currency', objectName: '币种', objectType: 'basic', description: '基础数据-币种' },
    { objectCode: 'account', objectName: '会计科目', objectType: 'basic', description: '基础数据-科目' },
    { objectCode: 'department', objectName: '部门', objectType: 'basic', description: '基础数据-部门' },
    { objectCode: 'employee', objectName: '员工', objectType: 'hr', description: '基础数据-员工' },
    { objectCode: 'warehouse', objectName: '仓库', objectType: 'basic', description: '基础数据-仓库' },
    { objectCode: 'u8bp', objectName: '客商', objectType: 'basic', description: '基础数据-客商档案' },
    { objectCode: 'saleOrder', objectName: '销售订单', objectType: 'supply_chain', description: '供应链-销售订单' },
    { objectCode: 'purchaseOrder', objectName: '采购订单', objectType: 'supply_chain', description: '供应链-采购订单' },
    { objectCode: 'receipt', objectName: '采购入库单', objectType: 'supply_chain', description: '供应链-采购入库单' },
    { objectCode: 'delivery', objectName: '销售出库单', objectType: 'supply_chain', description: '供应链-销售出库单' },
    { objectCode: 'voucher', objectName: '总账凭证', objectType: 'finance', description: '财务-总账凭证' },
    { objectCode: 'receivable', objectName: '应收单', objectType: 'finance', description: '财务-应收单' },
    { objectCode: 'payable', objectName: '应付单', objectType: 'finance', description: '财务-应付单' },
    { objectCode: 'fixedAsset', objectName: '固定资产', objectType: 'finance', description: '财务-固定资产' },
    { objectCode: 'bom', objectName: '物料清单(BOM)', objectType: 'manufacture', description: '制造-BOM' },
    { objectCode: 'productionOrder', objectName: '生产订单', objectType: 'manufacture', description: '制造-生产订单' },
    { objectCode: 'expenseReport', objectName: '费用报销单', objectType: 'finance', description: '财务-费用报销' },
    { objectCode: 'invoice', objectName: '发票', objectType: 'finance', description: '财务-发票' },
    { objectCode: 'project', objectName: '项目', objectType: 'basic', description: '项目管理-项目' },
];

function md5(data: string): string {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex');
}

function buildYonSuiteAuth(config: ConnectionConfig): Record<string, string> {
    const timestamp = String(Date.now());
    const signature = md5(timestamp + (config.appId || '') + (config.appSecret || ''));
    return {
        'Content-Type': 'application/json',
        'X-Ca-Key': config.appId || '',
        'X-Ca-Timestamp': timestamp,
        'X-Ca-Md5': signature,
        ...(config.extraHeaders || {}),
    };
}

export const YonyouYonSuiteAdapter: IDataSourceAdapter = {
    productType: 'yonyou-yonsuite',

    capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: true,
        supportsWebhook: true,
        supportsWrite: true,
        authType: 'md5_signature',
        rateLimit: { maxPerMin: 120 },
    } as AdapterCapability,

    async authenticate(config: ConnectionConfig): Promise<AuthResult> {
        // YonSuite 安全模式: 每次请求用签名鉴权，无需获取独立 Token
        // 我们通过调用一个轻量接口来验证凭证是否有效
        const headers = buildYonSuiteAuth(config);
        const baseUrl = config.baseUrl!.replace(/\/+$/, '');

        const resp = await fetch(`${baseUrl}/api/common/ping`, {
            method: 'GET',
            headers,
        });

        if (!resp.ok) {
            const err = await resp.text().catch(() => '');
            throw new Error(`YonSuite认证失败 (HTTP ${resp.status}): ${err}`);
        }

        // YonSuite 签名模式无独立 token，返回 session-level 凭证
        // expiresAt 设为 30 分钟后（实际由签名时间戳控制）
        return {
            accessToken: JSON.stringify({ appKey: config.appId, timestamp: headers['X-Ca-Timestamp'] }),
            expiresAt: Date.now() + 30 * 60 * 1000,
        };
    },

    async testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string; latency?: number }> {
        const start = Date.now();
        try {
            const headers = buildYonSuiteAuth(config);
            const baseUrl = config.baseUrl!.replace(/\/+$/, '');
            const resp = await fetch(`${baseUrl}/api/common/ping`, { method: 'GET', headers });
            const latency = Date.now() - start;
            if (resp.ok) return { success: true, latency };
            const text = await resp.text().catch(() => '');
            return { success: false, error: `HTTP ${resp.status}: ${text}`, latency };
        } catch (error: any) {
            return { success: false, error: error.message, latency: Date.now() - start };
        }
    },

    async getObjects(_config: ConnectionConfig): Promise<DataObject[]> {
        return YONSUITE_OBJECTS;
    },

    async getFields(config: ConnectionConfig, objectCode: string): Promise<FieldDef[]> {
        const headers = buildYonSuiteAuth(config);
        const baseUrl = config.baseUrl!.replace(/\/+$/, '');

        try {
            // 尝试获取对象的元数据/字段定义
            const resp = await fetch(
                `${baseUrl}/api/metadata/${objectCode}/fields`,
                { method: 'GET', headers },
            );

            if (resp.ok) {
                const data = await resp.json() as any;
                const fields = data?.data || data?.fields || [];
                return fields.map((f: any) => ({
                    field: f.field || f.name || f.code,
                    label: f.label || f.name || f.title || f.field,
                    type: mapYonSuiteType(f.type || f.dataType),
                    nullable: f.nullable !== false,
                    isKey: f.isKey || f.primaryKey || false,
                    length: f.length,
                    precision: f.precision,
                    scale: f.scale,
                }));
            }
        } catch {
            // 元数据接口不存在则返回空
        }

        return [];
    },

    async fullSync(config: ConnectionConfig, objectCode: string, options?: SyncOptions): Promise<AsyncIterable<SyncResult>> {
        const self = this;
        const batchSize = options?.batchSize || 500;
        const filterConfig = options?.filterConfig || {};
        const signal = options?.signal;

        return {
            [Symbol.asyncIterator]() {
                let pageIndex = 1;
                let done = false;

                return {
                    async next(): Promise<IteratorResult<SyncResult>> {
                        if (done || signal?.aborted) return { value: undefined, done: true };

                        try {
                            const headers = buildYonSuiteAuth(config);
                            const baseUrl = config.baseUrl!.replace(/\/+$/, '');

                            const params = new URLSearchParams({
                                pageIndex: String(pageIndex),
                                pageSize: String(batchSize),
                                ...Object.fromEntries(
                                    Object.entries(filterConfig).map(([k, v]) => [k, String(v)])
                                ),
                            });

                            const resp = await fetch(
                                `${baseUrl}/api/${objectCode}/list?${params}`,
                                { method: 'GET', headers, signal },
                            );

                            if (!resp.ok) {
                                throw new Error(`YonSuite API failed: HTTP ${resp.status}`);
                            }

                            const raw = await resp.json() as any;
                            const rows: any[] = raw?.data || raw?.records || raw?.list || [];
                            const total = raw?.total || raw?.totalCount || rows.length;

                            pageIndex++;
                            const hasMore = rows.length >= batchSize && total > (pageIndex - 1) * batchSize;

                            if (!hasMore) done = true;

                            return {
                                value: { data: rows, total, hasMore },
                                done: false,
                            };
                        } catch (error: any) {
                            done = true;
                            throw error;
                        }
                    },
                };
            },
        };
    },

    async incrementalSync(config: ConnectionConfig, objectCode: string, lastSyncAt: Date, options?: SyncOptions): Promise<AsyncIterable<SyncResult>> {
        const mergedConfig = {
            ...options,
            filterConfig: {
                ...options?.filterConfig,
                modifyTime_gt: lastSyncAt.toISOString(),
            },
        };
        return this.fullSync(config, objectCode, mergedConfig);
    },

    verifyWebhookSignature(payload: string, signature: string, config: ConnectionConfig): boolean {
        // YonSuite 事件中心签名验证
        // 使用与请求签名相同的 MD5 算法
        try {
            const timestamp = String(Date.now());
            const computed = md5(timestamp + (config.appId || '') + (config.appSecret || ''));
            // 注意：实际 YonSuite webhook 签名机制可能不同，需根据具体文档调整
            return crypto.timingSafeEqual
                ? crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
                : computed === signature;
        } catch {
            return false;
        }
    },
};

function mapYonSuiteType(typeStr: string): string {
    const lc = (typeStr || '').toLowerCase();
    if (/varchar|nvarchar|char|text|string/.test(lc)) return 'string';
    if (/int|bigint|decimal|numeric|float|double|number|money/.test(lc)) return 'number';
    if (/datetime|timestamp|date|time/.test(lc)) return 'datetime';
    if (/bit|bool|boolean/.test(lc)) return 'boolean';
    return 'string';
}
