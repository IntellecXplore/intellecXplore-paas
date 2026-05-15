import { pgTable, bigserial, varchar, bigint, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';
import { metadataCollectionsSchema } from './metadata_collections';

export const metadataRelationsSchema = pgTable(
    'metadata_relations',
    {
        relationId: bigserial('relation_id', { mode: 'number' }).primaryKey(),
        name: varchar('name', { length: 100 }).notNull(),
        type: varchar('type', { length: 20 }).notNull(),
        sourceCollectionId: bigint('source_collection_id', { mode: 'number' }).notNull().references(() => metadataCollectionsSchema.id, { onDelete: 'cascade' }),
        targetCollectionId: bigint('target_collection_id', { mode: 'number' }).notNull().references(() => metadataCollectionsSchema.id, { onDelete: 'cascade' }),
        sourceField: varchar('source_field', { length: 100 }).notNull(),
        targetField: varchar('target_field', { length: 100 }).notNull(),
        junctionTable: jsonb('junction_table'),
        cascade: jsonb('cascade'),
        status: varchar('status', { length: 20 }).default('active'),
        ...BaseSchema,
    }
);
export const InsertMetadataRelation = createInsertSchema(metadataRelationsSchema);
export const SelectMetadataRelation = createSelectSchema(metadataRelationsSchema);
