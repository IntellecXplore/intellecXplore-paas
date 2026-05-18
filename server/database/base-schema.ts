import { bigint, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

/**
 * 基础字段（所有表通用）
 * tenant_id 默认 1，确保平滑迁移：存量数据归属到默认租户
 */
export const BaseSchema = {
    tenantId: bigint('tenant_id', { mode: 'number' }).default(1), // 租户ID
    createTime: timestamp('create_time', { withTimezone: true }).defaultNow(), // 创建时间
    createBy: bigint('create_by', { mode: 'number' }), // 创建人
    updateTime: timestamp('update_time', { withTimezone: true }), // 更新时间
    updateBy: bigint('update_by', { mode: 'number' }), // 更新人
    delFlag: boolean('del_flag').default(false), // 删除标志
    remark: varchar('remark', { length: 255 }), // 备注
};

/** 动态建表时使用的公共字段 DDL，与 BaseSchema 保持同步 */
export const BASE_COLUMNS_SQL = [
    'id BIGSERIAL PRIMARY KEY',
    'tenant_id BIGINT DEFAULT 1',
    'create_time TIMESTAMPTZ DEFAULT now()',
    'create_by BIGINT',
    'update_time TIMESTAMPTZ',
    'update_by BIGINT',
    'del_flag BOOLEAN DEFAULT false',
    'remark VARCHAR(255)',
] as const;