import { pgTable, bigserial, bigint, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { BaseSchema } from '@database/base-schema';

export const systemAgentConfigSchema = pgTable(
    'system_agent_config',
    {
        configId: bigserial('config_id', { mode: 'number' }).primaryKey(),
        userId: bigint('user_id', { mode: 'number' }).notNull().unique(),
        provider: varchar('provider', { length: 32 }).notNull().default('openai'),
        apiKey: varchar('api_key', { length: 255 }),
        apiBase: varchar('api_base', { length: 255 }).notNull().default('https://api.deepseek.com/v1'),
        model: varchar('model', { length: 64 }).notNull().default('deepseek-chat'),
        maxTokens: integer('max_tokens').notNull().default(4096),
        maxToolRounds: integer('max_tool_rounds').notNull().default(5),
        conversationTTL: integer('conversation_ttl').notNull().default(86400),
        status: boolean('status').default(true),
        ...BaseSchema,
    }
);

export const InsertSystemAgentConfig = createInsertSchema(systemAgentConfigSchema);
export const SelectSystemAgentConfig = createSelectSchema(systemAgentConfigSchema);
