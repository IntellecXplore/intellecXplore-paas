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
 * 工作流实例表
 * 每一次工作流触发执行对应一条记录，记录完整执行状态
 */
export const workflowInstanceSchema = pgTable('workflow_instance', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),

    /** 关联的工作流定义 */
    definitionId: bigint('definition_id', { mode: 'number' }).notNull(),
    definitionVersion: integer('definition_version').notNull().default(1),
    workflowName: varchar('workflow_name', { length: 128 }).notNull(),

    /** 执行状态 */
    status: varchar('status', { length: 32 }).notNull().default('pending'),

    /** 入参 + 出参 */
    input: jsonb('input').notNull().default({}),
    output: jsonb('output'),

    /** 执行上下文（步骤输出 + 中间变量，崩溃恢复用） */
    context: jsonb('context').notNull().default({}),

    /** 执行进度 */
    currentStepId: varchar('current_step_id', { length: 128 }),
    completedSteps: jsonb('completed_steps').default([]),

    /** 错误信息 */
    errorMessage: text('error_message'),
    errorStepId: varchar('error_step_id', { length: 128 }),

    /** 重试状态 */
    retryCount: integer('retry_count').default(0),
    maxRetries: integer('max_retries').default(3),

    /** 调度 */
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    timeoutAt: timestamp('timeout_at', { withTimezone: true }),

    /** 触发信息 */
    triggerType: varchar('trigger_type', { length: 32 }).default('manual'),
    triggeredBy: bigint('triggered_by', { mode: 'number' }),

    /** 关联 */
    userId: bigint('user_id', { mode: 'number' }).notNull(),
    agentId: varchar('agent_id', { length: 100 }),

    /** 元数据 */
    tags: jsonb('tags').default([]),
    metadata: jsonb('metadata').default({}),

    /** 多租户 */
    tenantId: bigint('tenant_id', { mode: 'number' }).default(1),

    /** 时间戳 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const InsertWorkflowInstance = createInsertSchema(workflowInstanceSchema);
export const SelectWorkflowInstance = createSelectSchema(workflowInstanceSchema);
