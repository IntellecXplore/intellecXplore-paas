import crypto from 'node:crypto';
import type {
    IDataSourceAdapter, AdapterCapability, ConnectionConfig,
    AuthResult, DataObject, ObjectType, FieldDef, SyncResult, SyncOptions,
} from './interface';

// ========================
// 金蝶云·星空 (Kingdee Cloud Galaxy) 适配器
// ========================
//
// 认证方式: 增强型 Token
//   Step 1: POST {baseUrl}/ierp/api/getAppToken.do → appToken
//   Step 2: 使用 appToken 调用业务 API
//
// 业务 API 格式:
//   {baseUrl}/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService.{Method}.common.kdsvc
//
// 关键请求头:
//   access_token: "xxx"
//   x-acgw-identity: "xxx" (必传，身份标识)
//   Content-Type: application/json

const GALAXY_API_BASE = '/Kingdee.BOS.WebApi.ServicesStub.DynamicFormService';

/** 星空常用业务对象 */
const GALAXY_OBJECTS: DataObject[] = [
    { objectCode: 'BD_CUSTOMER', objectName: '客户', objectType: 'basic', description: '基础资料-客户' },
    { objectCode: 'BD_Supplier', objectName: '供应商', objectType: 'basic', description: '基础资料-供应商' },
    { objectCode: 'BD_MATERIAL', objectName: '物料', objectType: 'basic', description: '基础资料-物料' },
    { objectCode: 'BD_Currency', objectName: '币别', objectType: 'basic', description: '基础资料-币别' },
    { objectCode: 'BD_Account', objectName: '科目', objectType: 'basic', description: '基础资料-科目' },
    { objectCode: 'BD_Department', objectName: '部门', objectType: 'basic', description: '基础资料-部门' },
    { objectCode: 'BD_EmpInfo', objectName: '员工', objectType: 'hr', description: '基础资料-员工信息' },
    { objectCode: 'BD_Stock', objectName: '仓库', objectType: 'basic', description: '基础资料-仓库' },
    { objectCode: 'SAL_SaleOrder', objectName: '销售订单', objectType: 'supply_chain', description: '供应链-销售订单' },
    { objectCode: 'PUR_PurchaseOrder', objectName: '采购订单', objectType: 'supply_chain', description: '供应链-采购订单' },
    { objectCode: 'STK_InStock', objectName: '采购入库单', objectType: 'supply_chain', description: '供应链-采购入库单' },
    { objectCode: 'STK_OutStock', objectName: '销售出库单', objectType: 'supply_chain', description: '供应链-销售出库单' },
    { objectCode: 'GL_Voucher', objectName: '总账凭证', objectType: 'finance', description: '财务-总账凭证' },
    { objectCode: 'AR_receivable', objectName: '应收单', objectType: 'finance', description: '财务-应收单' },
    { objectCode: 'AP_payable', objectName: '应付单', objectType: 'finance', description: '财务-应付单' },
    { objectCode: 'FA_Card', objectName: '固定资产卡片', objectType: 'finance', description: '财务-固定资产' },
    { objectCode: 'ENG_BOM', objectName: '物料清单(BOM)', objectType: 'manufacture', description: '制造-BOM' },
    { objectCode: 'PRD_MO', objectName: '生产订单', objectType: 'manufacture', description: '制造-生产订单' },
];

/** 星空常用字段类型映射 */
function galaxyFieldType(field: any): string {
    const lc = (field?.FieldType || field?.type || '').toLowerCase();
    if (/varchar|nvarchar|char|text/.test(lc)) return 'string';
    if (/int|bigint|decimal|numeric|float|money/.test(lc)) return 'number';
    if (/datetime|timestamp|date/.test(lc)) return 'datetime';
    if (/bit|bool/.test(lc)) return 'boolean';
    return 'string';
}

export const KingdeeGalaxyAdapter: IDataSourceAdapter = {
    productType: 'kingdee-galaxy',

    capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: true,
        supportsWebhook: true,
        supportsWrite: true,
        authType: 'enhanced_token',
        rateLimit: { maxPerMin: 60 },
    } as AdapterCapability,

    async authenticate(config: ConnectionConfig): Promise<AuthResult> {
        const baseUrl = config.baseUrl!.replace(/\/+$/, '');
        const identity = buildIdentity(config);

        // Step 1: 获取 appToken
        const tokenResp = await fetch(`${baseUrl}/ierp/api/getAppToken.do`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-acgw-identity': identity,
            },
            body: JSON.stringify({
                accountId: config.accountId,
                appId: config.appId,
                appSecret: config.appSecret,
            }),
        });

        if (!tokenResp.ok) {
            const err = await tokenResp.text().catch(() => '');
            throw new Error(`金蝶星空获取Token失败 (HTTP ${tokenResp.status}): ${err}`);
        }

        const tokenData = await tokenResp.json() as any;

        // 金蝶 Token 默认有效期 2 小时
        const expiresIn = (tokenData.expires_in || 7200) * 1000;
        const expiresAt = Date.now() + expiresIn;

        const result: AuthResult = {
            accessToken: tokenData.access_token || tokenData.appToken || tokenData.token,
            expiresAt,
            tokenType: tokenData.token_type || 'Bearer',
            refreshToken: tokenData.refresh_token,
        };

        // 金蝶可能还需要用 appToken 二次换取 access_token
        if (tokenData.appToken && !result.accessToken) {
            const step2Resp = await fetch(`${baseUrl}/ierp/api/getAccessToken.do`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-acgw-identity': identity,
                },
                body: JSON.stringify({
                    accountId: config.accountId,
                    appId: config.appId,
                    appSecret: config.appSecret,
                    appToken: tokenData.appToken,
                }),
            });
            const step2Data = await step2Resp.json() as any;
            result.accessToken = step2Data.access_token || step2Data.token;
        }

        if (!result.accessToken) {
            throw new Error('金蝶星空认证响应中未找到 access_token');
        }

        return result;
    },

    async testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string; latency?: number }> {
        const start = Date.now();
        try {
            const auth = await this.authenticate(config);
            const latency = Date.now() - start;
            return { success: !!auth.accessToken, latency };
        } catch (error: any) {
            return { success: false, error: error.message, latency: Date.now() - start };
        }
    },

    async getObjects(_config: ConnectionConfig): Promise<DataObject[]> {
        return GALAXY_OBJECTS;
    },

    async getFields(config: ConnectionConfig, objectCode: string): Promise<FieldDef[]> {
        const auth = await this.authenticate(config);
        const baseUrl = config.baseUrl!.replace(/\/+$/, '');
        const identity = buildIdentity(config);

        // 通过 ExecuteBillQuery 拉取一条数据，从响应中推导字段
        // 更好的方式是调用 View 接口获取元数据，这里先用单据查询推导
        try {
            const resp = await fetch(
                `${baseUrl}${GALAXY_API_BASE}/ExecuteBillQuery.common.kdsvc`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'access_token': auth.accessToken,
                        'x-acgw-identity': identity,
                    },
                    body: JSON.stringify({
                        FormId: objectCode,
                        FieldKeys: '*',
                        FilterString: '',
                        OrderString: '',
                        TopRowCount: 1,
                        StartRow: 0,
                        Limit: 1,
                    }),
                },
            );

            const raw = await resp.json() as any;
            const rows: any[] = Array.isArray(raw) ? raw : raw?.Result?.ResponseStatus?.IsSuccess === false ? [] : (raw?.data || raw?.rows || []);

            if (rows.length > 0 && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
                return Object.entries(rows[0]).map(([key, val]) => ({
                    field: key,
                    label: key,
                    type: typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'boolean' : 'string',
                    nullable: val === null,
                }));
            }
        } catch {
            // 元数据查询失败时返回空列表
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
                let startRow = 0;
                let done = false;

                return {
                    async next(): Promise<IteratorResult<SyncResult>> {
                        if (done || signal?.aborted) return { value: undefined, done: true };

                        try {
                            const auth = await self.authenticate(config);
                            const baseUrl = config.baseUrl!.replace(/\/+$/, '');
                            const identity = buildIdentity(config);

                            const filterStr = buildGalaxyFilter(filterConfig);

                            const resp = await fetch(
                                `${baseUrl}${GALAXY_API_BASE}/ExecuteBillQuery.common.kdsvc`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'access_token': auth.accessToken,
                                        'x-acgw-identity': identity,
                                    },
                                    body: JSON.stringify({
                                        FormId: objectCode,
                                        FieldKeys: '*',
                                        FilterString: filterStr,
                                        OrderString: 'FID ASC',
                                        TopRowCount: batchSize,
                                        StartRow: startRow,
                                        Limit: batchSize,
                                    }),
                                    signal,
                                },
                            );

                            if (!resp.ok) {
                                throw new Error(`ExecuteBillQuery failed: HTTP ${resp.status}`);
                            }

                            const raw = await resp.json() as any;
                            const rows: any[] = Array.isArray(raw)
                                ? raw
                                : (raw?.data || raw?.rows || raw?.Result?.ResponseStatus?.ErrorCode ? [] : []);

                            // 如果响应是嵌套数组格式（金蝶特有），取第一维作为行
                            const normalized = rows.length > 0 && Array.isArray(rows[0]) && rows.length === 1
                                ? rows[0].map((row: any[]) => {
                                    // 如果内层也是数组，尝试构建 key-value
                                    return row;
                                })
                                : rows;

                            startRow += batchSize;
                            const hasMore = normalized.length >= batchSize;

                            if (!hasMore) done = true;

                            return {
                                value: { data: normalized, total: normalized.length, hasMore },
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
        // 增量同步 = 全量 + 时间过滤
        const mergedConfig = {
            ...options,
            filterConfig: {
                ...options?.filterConfig,
                FModifyDate_GT: lastSyncAt.toISOString(),
            },
        };
        return this.fullSync(config, objectCode, mergedConfig);
    },

    verifyWebhookSignature(payload: string, signature: string, config: ConnectionConfig): boolean {
        // 金蝶 OpenEvent 使用 HMAC_SHA256 签名
        // signature = Base64(HMAC_SHA256(payload, appSecret))
        const computed = crypto.createHmac('sha256', config.appSecret || '')
            .update(payload, 'utf8')
            .digest('base64');
        return crypto.timingSafeEqual
            ? crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
            : computed === signature;
    },
};

function buildIdentity(config: ConnectionConfig): string {
    // x-acgw-identity 格式: {appId}_{accountId}
    return `${config.appId}_${config.accountId}`;
}

function buildGalaxyFilter(filterConfig?: Record<string, any>): string {
    if (!filterConfig || Object.keys(filterConfig).length === 0) return '';
    const parts: string[] = [];
    for (const [key, value] of Object.entries(filterConfig)) {
        if (key.endsWith('_GT')) {
            // 大于
            const field = key.replace('_GT', '');
            const dateVal = typeof value === 'string' ? value : new Date(value).toISOString().replace('T', ' ').substring(0, 19);
            parts.push(`${field} > '${dateVal}'`);
        } else if (key.endsWith('_GTE')) {
            const field = key.replace('_GTE', '');
            const dateVal = typeof value === 'string' ? value : new Date(value).toISOString().replace('T', ' ').substring(0, 19);
            parts.push(`${field} >= '${dateVal}'`);
        } else if (key.endsWith('_LT')) {
            const field = key.replace('_LT', '');
            const dateVal = typeof value === 'string' ? value : new Date(value).toISOString().replace('T', ' ').substring(0, 19);
            parts.push(`${field} < '${dateVal}'`);
        } else if (typeof value === 'string') {
            parts.push(`${key} = '${value.replace(/'/g, "''")}'`);
        } else {
            parts.push(`${key} = ${value}`);
        }
    }
    return parts.join(' AND ');
}
