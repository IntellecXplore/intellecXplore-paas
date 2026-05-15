import { pgTable, bigserial, varchar, boolean, bigint, integer, text, jsonb, unique } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';
import { metadataCollectionsSchema } from './metadata_collections';

export const metadataFieldsSchema = pgTable(
    'metadata_fields',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        collectionId: bigint('collection_id', { mode: 'number' }).notNull().references(() => metadataCollectionsSchema.id, { onDelete: 'cascade' }),
        columnName: varchar('column_name', { length: 100 }).notNull(),
        label: varchar('label', { length: 200 }),
        type: varchar('type', { length: 50 }).notNull(),
        nullable: boolean('nullable').default(true),
        default_value: text('default_value'),
        isUnique: boolean('is_unique').default(false),
        indexed: boolean('indexed').default(false),
        isPrimaryKey: boolean('is_primary_key').default(false),
        length: integer('length'),
        required: boolean('required').default(false),
        customValidator: varchar('custom_validator', { length: 200 }),
        relation: jsonb('relation'),
        uiConfig: jsonb('ui_config'),
        ai: jsonb('ai').default({}),
        sortOrder: integer('sort_order').default(0),
        version: integer('version').default(1),
        status: varchar('status', { length: 20 }).default('active'),
        ...BaseSchema,
    },
    (table) => ({
        uniqueCollectionColumn: unique().on(table.collectionId, table.columnName),
    })
);
export const InsertMetadataField = createInsertSchema(metadataFieldsSchema);
export const SelectMetadataField = createSelectSchema(metadataFieldsSchema);
