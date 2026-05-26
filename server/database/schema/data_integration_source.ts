import { pgTable, bigserial, varchar, text, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

export const dataIntegrationSourceSchema = pgTable(
    'data_integration_source',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        name: varchar('name', { length: 200 }).notNull(),
        productType: varchar('product_type', { length: 50 }).notNull(),
        connectionType: varchar('connection_type', { length: 20 }).notNull().default('api'),
        connectionConfig: jsonb('connection_config').notNull(),
        status: varchar('status', { length: 20 }).default('active'),
        healthCheck: jsonb('health_check'),
        ...BaseSchema,
    }
);
export const InsertDataIntegrationSource = createInsertSchema(dataIntegrationSourceSchema);
export const SelectDataIntegrationSource = createSelectSchema(dataIntegrationSourceSchema);
