import { pgTable, bigserial, varchar, integer, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

export const metadataDatabaseConfigsSchema = pgTable(
    'metadata_database_configs',
    {
        id: bigserial('id', { mode: 'number' }).primaryKey(),
        name: varchar('name', { length: 100 }).notNull().unique(),
        host: varchar('host', { length: 255 }).notNull(),
        port: integer('port').default(5432),
        username: varchar('username', { length: 100 }).notNull(),
        password: varchar('password', { length: 255 }).default(''),
        database: varchar('database', { length: 100 }).notNull(),
        schema: varchar('schema', { length: 100 }).default('public'),
        description: text('description'),
        status: varchar('status', { length: 20 }).default('active'),
        ...BaseSchema,
    }
);
export const InsertMetadataDatabaseConfig = createInsertSchema(metadataDatabaseConfigsSchema);
export const SelectMetadataDatabaseConfig = createSelectSchema(metadataDatabaseConfigsSchema);
