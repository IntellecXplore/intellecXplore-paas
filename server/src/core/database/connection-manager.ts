import postgres from 'postgres';
import { logger } from '@/shared/logger';

export interface StorageConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    schema?: string;
    poolMax?: number;
    idleTimeout?: number;
    connectTimeout?: number;
    ssl?: boolean;
    lastTestTime?: string;
    testResult?: 'success' | 'failed' | null;
    testError?: string;
}

interface PoolEntry {
    client: postgres.Sql;
    refCount: number;
}

class ConnectionManager {
    private pools = new Map<string, PoolEntry>();

    private hashConfig(config: StorageConfig): string {
        return `${config.host}:${config.port}:${config.username}:${config.password}:${config.database}`;
    }

    async getClient(config: StorageConfig): Promise<postgres.Sql> {
        const key = this.hashConfig(config);
        const existing = this.pools.get(key);
        if (existing) {
            try {
                await existing.client`SELECT 1`;
                existing.refCount++;
                return existing.client;
            } catch {
                logger.warn(`[ConnectionManager] Health check failed for pool ${key}, recreating...`);
                existing.client.end({ timeout: 3 }).catch(() => {});
                this.pools.delete(key);
            }
        }

        const client = postgres({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            database: config.database,
            max: config.poolMax || 10,
            idle_timeout: config.idleTimeout || 30,
            connect_timeout: config.connectTimeout || 10,
            ssl: config.ssl || false,
            transform: { undefined: null },
            onnotice: () => {},
        });

        this.pools.set(key, { client, refCount: 1 });
        logger.info(`[ConnectionManager] Created new connection pool for ${config.host}:${config.port}/${config.database}`);
        return client;
    }

    releaseClient(key: string): void {
        const entry = this.pools.get(key);
        if (!entry) return;

        entry.refCount--;
        if (entry.refCount <= 0) {
            entry.client.end({ timeout: 5 }).catch(() => {});
            this.pools.delete(key);
            logger.info(`[ConnectionManager] Closed connection pool: ${key}`);
        }
    }

    releaseByConfig(config: StorageConfig): void {
        const key = this.hashConfig(config);
        this.releaseClient(key);
    }

    async testConnection(config: StorageConfig): Promise<{ success: boolean; error?: string; latency?: number }> {
        let client: postgres.Sql | null = null;
        const start = Date.now();
        try {
            client = postgres({
                host: config.host,
                port: config.port,
                username: config.username,
                password: config.password,
                database: config.database,
                max: 1,
                idle_timeout: 5,
                connect_timeout: config.connectTimeout || 10,
                ssl: config.ssl || false,
                onnotice: () => {},
            });
            await client`SELECT 1`;
            const latency = Date.now() - start;
            return { success: true, latency };
        } catch (error: any) {
            const latency = Date.now() - start;
            return { success: false, error: error?.message || String(error), latency };
        } finally {
            if (client) {
                client.end({ timeout: 3 }).catch(() => {});
            }
        }
    }

    async schemaExists(config: StorageConfig): Promise<boolean> {
        const schema = config.schema || 'public';
        const client = await this.getClient(config);
        try {
            const result = await client`
                SELECT EXISTS(
                    SELECT 1 FROM information_schema.schemata WHERE schema_name = ${schema}
                ) as exists
            `;
            return result[0]?.exists === true;
        } finally {
            this.releaseByConfig(config);
        }
    }

    async createSchema(config: StorageConfig): Promise<void> {
        const schema = config.schema || 'public';
        if (schema === 'public') return; // public always exists
        if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(schema)) {
            throw new Error(`无效的 Schema 名称: "${schema}"，仅允许字母、数字、下划线，以字母或下划线开头，最长 63 字符`);
        }
        const client = await this.getClient(config);
        try {
            await client.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
        } finally {
            this.releaseByConfig(config);
        }
    }

    /** Get qualified table name with schema prefix */
    getQualifiedName(config: StorageConfig, tableName: string): string {
        const schema = config.schema || 'public';
        // 分别校验 schema 和 table 部分
        for (const part of [schema, tableName]) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(part)) {
                throw new Error(`Invalid SQL identifier: ${part}`);
            }
        }
        return schema !== 'public' ? `"${schema}"."${tableName}"` : `"${tableName}"`;
    }

    /** Get just the schema identifier from config */
    getSchema(config: StorageConfig): string {
        return config.schema || 'public';
    }
}

export const connectionManager = new ConnectionManager();
