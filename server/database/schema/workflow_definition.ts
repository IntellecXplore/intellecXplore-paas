import {
    pgTable,
    bigserial,
    varchar,
    integer,
    jsonb,
    boolean,
    timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox';
import { BaseSchema } from '@database/base-schema';

/**
 * 工作流定义表
 * 存储用户/开发者创建的工作流模板，核心 graph 以 JSONB 存储
 */
export const workflowDefinitionSchema = pgTable('workflow_definition', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 128 }).notNull(),
    description: varchar('description', { length: 512 }),
    version: integer('version').notNull().default(1),
    status: varchar('status', { length: 32 }).notNull().default('draft'),

    /** 工作流定义 JSON（WorkflowDefinition 类型序列化） */
    definition: jsonb('definition').notNull(),

    /** 是否为模板（可被其他用户复制） */
    isTemplate: boolean('is_template').default(false),

    ...BaseSchema,
});

export const InsertWorkflowDefinition = createInsertSchema(workflowDefinitionSchema);
export const SelectWorkflowDefinition = createSelectSchema(workflowDefinitionSchema);
