import { pgTable, bigserial, varchar, boolean, bigint, text, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';
import { metadataCollectionsSchema } from './metadata_collections';

export const metadataIndexesSchema = pgTable(
    'metadata_indexes',
    {
        indexId: bigserial('index_id', { mode: 'number' }).primaryKey(),
        collectionId: bigint('collection_id', { mode: 'number' }).notNull().references(() => metadataCollectionsSchema.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 100 }).notNull(),
        type: varchar('type', { length: 20 }).default('btree'),
        fields: jsonb('fields').notNull(),
        isUnique: boolean('is_unique').default(false),
        partialCondition: text('partial_condition'),
        status: varchar('status', { length: 20 }).default('active'),
        ...BaseSchema,
    }
);
export const InsertMetadataIndex = createInsertSchema(metadataIndexesSchema);
export const SelectMetadataIndex = createSelectSchema(metadataIndexesSchema);
