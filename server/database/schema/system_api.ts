import { pgTable, bigserial, varchar, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

const { tenantId: _, ...AuditSchema } = BaseSchema;

export const systemApiSchema = pgTable(
    'system_api',
    {
        apiId: bigserial('api_id', { mode: 'number' }).primaryKey(), // API ID
        apiName: varchar('api_name', { length: 64 }).notNull(), // API名称
        apiPath: varchar('api_path', { length: 255 }).notNull(), // API路径
        apiMethod: varchar('api_method', { length: 10 }).notNull(), // API方法
        status: boolean('status').default(true), // 状态
        ...AuditSchema, // BaseSchema 去除 tenant_id，system_api 为全局表
    }
);

export const InsertSystemApi = createInsertSchema(systemApiSchema);
export const SelectSystemApi = createSelectSchema(systemApiSchema);