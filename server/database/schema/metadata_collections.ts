import { pgTable, bigserial, varchar, integer, text, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

export const metadataCollectionsSchema = pgTable(
    'metadata_collections',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        tableName: varchar('table_name', { length: 100 }).notNull().unique(),
        label: varchar('label', { length: 200 }).notNull(),
        description: text('description'),
        databaseType: varchar('database_type', { length: 20 }).notNull(),
        namespace: varchar('namespace', { length: 50 }),
        storageConfig: jsonb('storage_config'),
        accessControl: jsonb('access_control'),
        tableConfig: jsonb('table_config'),
        uiConfig: jsonb('ui_config'),
        ai: jsonb('ai').default({}),
        version: integer('version').default(1),
        status: varchar('status', { length: 20 }).default('draft'),
        ...BaseSchema,
    }
);
export const InsertMetadataCollection = createInsertSchema(metadataCollectionsSchema);
export const SelectMetadataCollection = createSelectSchema(metadataCollectionsSchema);
