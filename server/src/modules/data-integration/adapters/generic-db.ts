import { connectionManager, type StorageConfig } from '@/core/database/connection-manager';
import type {
    IDataSourceAdapter, AdapterCapability, ConnectionConfig,
    AuthResult, DataObject, ObjectType, FieldDef, SyncResult, SyncOptions,
} from './interface';
import { logger } from '@/shared/logger';

// ========================
// GenericDBAdapter — 通用数据库直读适配器
// ========================
//
// 支持通过 JDBC/ODBC 类连接直接读取数据库表数据。
// 当前完整支持 PostgreSQL（复用 ConnectionManager）。
// MySQL / SQL Server / Oracle 需安装对应驱动后启用。
//
// 适用场景：
//   - 金蝶 K/3 WISE (SQL Server)
//   - 用友 U8+ (SQL Server)
//   - 金蝶 EAS (Oracle / SQL Server)
//   - 用友 NC (Oracle / SQL Server)
//   - 自建业务数据库
//
// 安全约束：仅执行只读 SELECT 查询，严禁 INSERT/UPDATE/DELETE。

function toStorageConfig(config: ConnectionConfig): StorageConfig {
    return {
        host: config.host || 'localhost',
        port: config.port || 5432,
        username: config.username || '',
        password: config.password || '',
        database: config.database || '',
        schema: config.schema || 'public',
        connectTimeout: 15,
    };
}

function pgTypeToFieldType(pgType: string): string {
    const lc = pgType.toLowerCase();
    if (/int|bigint|smallint|serial|bigserial|numeric|decimal|real|double|float|money/.test(lc)) return 'number';
    if (/bool/.test(lc)) return 'boolean';
    if (/timestamp|date|time|interval/.test(lc)) return 'datetime';
    if (/json|jsonb/.test(lc)) return 'json';
    if (/text|clob/.test(lc)) return 'text';
    return 'string';
}

function safeIdent(name: string): string {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error(`Invalid identifier: ${name}`);
    }
    return name;
}

/** 普通表对象分类推测 */
function guessObjectType(tableName: string): ObjectType {
    const lower = tableName.toLowerCase();
    if (/customer|client|cust|organization|t_organization/.test(lower)) return 'basic';
    if (/supplier|vendor|t_supplier/.test(lower)) return 'basic';
    if (/material|item|icitem|t_icitem|inventory/.test(lower)) return 'basic';
    if (/account|subject|t_account/.test(lower)) return 'basic';
    if (/dept|department/.test(lower)) return 'basic';
    if (/emp|employee|staff|hr_/.test(lower)) return 'hr';
    if (/voucher|gl_|t_voucher|t_balance|receivable|payable|ar_|ap_/.test(lower)) return 'finance';
    if (/order|po_|pur_|seorder|sale|purchase|stock|icstock|receipt|delivery/.test(lower)) return 'supply_chain';
    if (/bom|mo_|prd_|mrp|production|workorder/.test(lower)) return 'manufacture';
    if (/opportunity|lead|quote|campaign/.test(lower)) return 'crm';
    return 'basic';
}

export const GenericDBAdapter: IDataSourceAdapter = {
    productType: 'generic-db',

    capabilities: {
        supportsFullSync: true,
        supportsIncrementalSync: true,
        supportsWebhook: false,
        supportsWrite: false,
        authType: 'username_password',
    } as AdapterCapability,

    async authenticate(config: ConnectionConfig): Promise<AuthResult> {
        if (config.dbType && config.dbType !== 'postgresql') {
            throw new Error(`当前仅支持 PostgreSQL。数据库类型 "${config.dbType}" 需要安装对应驱动后启用`);
        }
        const sc = toStorageConfig(config);
        const result = await connectionManager.testConnection(sc);
        if (!result.success) {
            throw new Error(`数据库认证失败: ${result.error}`);
        }
        return {
            accessToken: '',
            expiresAt: Date.now() + 3600000,
        };
    },

    async testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string; latency?: number }> {
        if (config.dbType && config.dbType !== 'postgresql') {
            return {
                success: false,
                error: `当前仅支持 PostgreSQL。数据库类型 "${config.dbType}" 需要安装对应驱动后启用`,
            };
        }
        const sc = toStorageConfig(config);
        return connectionManager.testConnection(sc);
    },

    async getObjects(config: ConnectionConfig): Promise<DataObject[]> {
        const sc = toStorageConfig(config);
        const client = await connectionManager.getClient(sc);
        try {
            const schema = sc.schema || 'public';
            const rows = await client`
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = ${schema}
                  AND table_type = 'BASE TABLE'
                  AND table_name NOT LIKE '_prisma_%'
                  AND table_name NOT LIKE 'pg_%'
                ORDER BY table_name
            ` as { table_name: string }[];

            return rows.map(r => ({
                objectCode: r.table_name,
                objectName: r.table_name,
                objectType: guessObjectType(r.table_name),
                description: `数据库表: ${schema}.${r.table_name}`,
            }));
        } finally {
            connectionManager.releaseByConfig(sc);
        }
    },

    async getFields(config: ConnectionConfig, objectCode: string): Promise<FieldDef[]> {
        const sc = toStorageConfig(config);
        const client = await connectionManager.getClient(sc);
        try {
            const schema = sc.schema || 'public';
            const rows = await client`
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale,
                    ordinal_position
                FROM information_schema.columns
                WHERE table_schema = ${schema}
                  AND table_name = ${objectCode}
                ORDER BY ordinal_position
            ` as any[];

            return rows.map(r => ({
                field: r.column_name,
                label: r.column_name,
                type: pgTypeToFieldType(r.data_type),
                nullable: r.is_nullable === 'YES',
                isKey: r.column_name === 'id' || r.column_name.toLowerCase().endsWith('_id'),
                length: r.character_maximum_length || undefined,
                precision: r.numeric_precision || undefined,
                scale: r.numeric_scale || undefined,
            }));
        } finally {
            connectionManager.releaseByConfig(sc);
        }
    },

    async fullSync(config: ConnectionConfig, objectCode: string, options?: SyncOptions): Promise<AsyncIterable<SyncResult>> {
        const self = this;
        const batchSize = options?.batchSize || 500;
        const filterConfig = options?.filterConfig || {};
        const signal = options?.signal;
        const sc = toStorageConfig(config);

        return {
            [Symbol.asyncIterator]() {
                let offset = 0;
                let done = false;
                let totalCount: number | null = null;
                let client: any = null;
                let released = false;

                async function ensureClient() {
                    if (!client) client = await connectionManager.getClient(sc);
                    return client;
                }

                function release() {
                    if (!released) {
                        released = true;
                        connectionManager.releaseByConfig(sc);
                    }
                }

                return {
                    async next(): Promise<IteratorResult<SyncResult>> {
                        if (done || signal?.aborted) {
                            release();
                            return { value: undefined, done: true };
                        }

                        try {
                            const c = await ensureClient();
                            const tableName = safeIdent(objectCode);
                            const schemaName = safeIdent(sc.schema || 'public');
                            const qualified = schemaName === 'public'
                                ? `"${tableName}"`
                                : `"${schemaName}"."${tableName}"`;

                            // 首次查询获取总数
                            if (totalCount === null) {
                                const countResult = await c`SELECT COUNT(*) as cnt FROM ${c.unsafe(qualified)}`;
                                totalCount = Number(countResult[0]?.cnt || 0);
                            }

                            // 构建过滤条件
                            const conditions: string[] = [];
                            const params: any[] = [];
                            let pi = 1;
                            for (const [key, value] of Object.entries(filterConfig)) {
                                if (key.endsWith('_gt')) {
                                    conditions.push(`"${safeIdent(key.replace('_gt', ''))}" > $${pi++}`);
                                    params.push(value);
                                } else if (key.endsWith('_gte')) {
                                    conditions.push(`"${safeIdent(key.replace('_gte', ''))}" >= $${pi++}`);
                                    params.push(value);
                                } else if (key.endsWith('_lt')) {
                                    conditions.push(`"${safeIdent(key.replace('_lt', ''))}" < $${pi++}`);
                                    params.push(value);
                                } else {
                                    conditions.push(`"${safeIdent(key)}" = $${pi++}`);
                                    params.push(value);
                                }
                            }
                            const whereClause = conditions.length > 0
                                ? `WHERE ${conditions.join(' AND ')}`
                                : '';

                            // 分页查询
                            const limitIdx = pi++;
                            const offsetIdx = pi++;
                            params.push(batchSize, offset);

                            const sql = `SELECT * FROM ${qualified} ${whereClause} LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
                            const rows = await c.unsafe(sql, params);

                            offset += batchSize;
                            const hasMore = rows.length >= batchSize
                                && offset < (totalCount || 0);

                            if (!hasMore) {
                                done = true;
                                release();
                            }

                            return {
                                value: { data: rows, total: totalCount || rows.length, hasMore },
                                done: false,
                            };
                        } catch (error: any) {
                            done = true;
                            release();
                            throw error;
                        }
                    },
                };
            },
        };
    },

    async incrementalSync(config: ConnectionConfig, objectCode: string, lastSyncAt: Date, options?: SyncOptions): Promise<AsyncIterable<SyncResult>> {
        // 使用 modify_time / update_time 作为增量字段
        // 调用方应将 incremental_key 存入 object.incrementalKey，此处默认 modify_time
        const mergedConfig = {
            ...options,
            filterConfig: {
                ...options?.filterConfig,
                modify_time_gt: lastSyncAt.toISOString(),
            },
        };
        return this.fullSync(config, objectCode, mergedConfig);
    },
};
