import { pgTable, bigserial, bigint, varchar, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

export const dataIntegrationLogSchema = pgTable(
    'data_integration_log',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        taskId: bigint('task_id', { mode: 'number' }).notNull(),
        startTime: timestamp('start_time', { withTimezone: true }).notNull(),
        endTime: timestamp('end_time', { withTimezone: true }),
        status: varchar('status', { length: 20 }).default('running'),
        totalCount: integer('total_count').default(0),
        insertCount: integer('insert_count').default(0),
        updateCount: integer('update_count').default(0),
        errorCount: integer('error_count').default(0),
        errorSamples: jsonb('error_samples'),
        triggerType: varchar('trigger_type', { length: 20 }).default('manual'),
        durationMs: integer('duration_ms'),
        ...BaseSchema,
    }
);
export const InsertDataIntegrationLog = createInsertSchema(dataIntegrationLogSchema);
export const SelectDataIntegrationLog = createSelectSchema(dataIntegrationLogSchema);
