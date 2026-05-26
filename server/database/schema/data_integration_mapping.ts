import { pgTable, bigserial, bigint, varchar, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

export const dataIntegrationMappingSchema = pgTable(
    'data_integration_mapping',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        objectId: bigint('object_id', { mode: 'number' }).notNull(),
        sourceField: varchar('source_field', { length: 200 }).notNull(),
        targetField: varchar('target_field', { length: 200 }).notNull(),
        targetLabel: varchar('target_label', { length: 200 }),
        transformRule: varchar('transform_rule', { length: 50 }).default('direct'),
        transformConfig: jsonb('transform_config'),
        isRequired: boolean('is_required').default(false),
        sortOrder: integer('sort_order').default(0),
        ...BaseSchema,
    }
);
export const InsertDataIntegrationMapping = createInsertSchema(dataIntegrationMappingSchema);
export const SelectDataIntegrationMapping = createSelectSchema(dataIntegrationMappingSchema);
