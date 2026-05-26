import { pgTable, bigserial, bigint, varchar, text, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

export const dataIntegrationObjectSchema = pgTable(
    'data_integration_object',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        sourceId: bigint('source_id', { mode: 'number' }).notNull(),
        objectCode: varchar('object_code', { length: 100 }).notNull(),
        objectName: varchar('object_name', { length: 200 }).notNull(),
        objectType: varchar('object_type', { length: 50 }).notNull(),
        apiMeta: jsonb('api_meta'),
        dbMeta: jsonb('db_meta'),
        fieldSchema: jsonb('field_schema'),
        incrementalKey: varchar('incremental_key', { length: 100 }),
        ...BaseSchema,
    }
);
export const InsertDataIntegrationObject = createInsertSchema(dataIntegrationObjectSchema);
export const SelectDataIntegrationObject = createSelectSchema(dataIntegrationObjectSchema);
