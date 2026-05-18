import {
    pgTable,
    bigserial,
    varchar,
    integer,
    jsonb,
    text,
    timestamp,
    bigint,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox';

/**
 * 工作流步骤执行记录表
 * 每一步执行均记录 input / output / 耗时 / 错误，提供完整的执行追踪
 */
export const workflowStepExecutionSchema = pgTable('workflow_step_execution', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),

    /** 关联的工作流实例 */
    instanceId: bigint('instance_id', { mode: 'number' }).notNull(),

    /** 步骤标识 */
    stepId: varchar('step_id', { length: 128 }).notNull(),
    stepType: varchar('step_type', { length: 32 }).notNull(),
    stepName: varchar('step_name', { length: 256 }),

    /** 执行状态 */
    status: varchar('status', { length: 32 }).notNull().default('pending'),

    /** 入参（变量已解析） + 出参 */
    input: jsonb('input'),
    output: jsonb('output'),

    /** 错误信息 */
    errorMessage: text('error_message'),

    /** 重试信息 */
    attempt: integer('attempt').default(1),

    /** 耗时 */
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),

    /** LLM 节点额外追踪 */
    tokenUsage: jsonb('token_usage'),
    modelUsed: varchar('model_used', { length: 100 }),
    llmMessages: jsonb('llm_messages'),

    /** 多租户 */
    tenantId: bigint('tenant_id', { mode: 'number' }).default(1),

    /** 时间戳 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const InsertWorkflowStepExecution = createInsertSchema(workflowStepExecutionSchema);
export const SelectWorkflowStepExecution = createSelectSchema(workflowStepExecutionSchema);
