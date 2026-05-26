import { pgTable, bigserial, bigint, varchar, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

export const dataIntegrationTaskSchema = pgTable(
    'data_integration_task',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        name: varchar('name', { length: 200 }).notNull(),
        sourceId: bigint('source_id', { mode: 'number' }).notNull(),
        objectId: bigint('object_id', { mode: 'number' }).notNull(),
        syncMode: varchar('sync_mode', { length: 20 }).default('full'),
        scheduleCron: varchar('schedule_cron', { length: 50 }),
        filterConfig: jsonb('filter_config'),
        targetType: varchar('target_type', { length: 20 }).default('collection'),
        targetCollectionId: bigint('target_collection_id', { mode: 'number' }),
        batchSize: integer('batch_size').default(500),
        timeoutMs: integer('timeout_ms').default(300000),
        status: varchar('status', { length: 20 }).default('draft'),
        lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
        lastSyncStatus: varchar('last_sync_status', { length: 20 }),
        ...BaseSchema,
    }
);
export const InsertDataIntegrationTask = createInsertSchema(dataIntegrationTaskSchema);
export const SelectDataIntegrationTask = createSelectSchema(dataIntegrationTaskSchema);
