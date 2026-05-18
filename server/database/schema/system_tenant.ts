import { pgTable, bigserial, varchar, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox';

/**
 * 租户表（全局表，不继承 BaseSchema，无 tenant_id）
 */
export const systemTenantSchema = pgTable(
    'system_tenant',
    {
        tenantId: bigserial('tenant_id', { mode: 'number' }).primaryKey(), // 租户ID
        tenantName: varchar('tenant_name', { length: 100 }).notNull(), // 企业名称
        tenantCode: varchar('tenant_code', { length: 50 }).notNull().unique(), // 租户标识（子域名等）
        contactName: varchar('contact_name', { length: 50 }), // 联系人
        contactPhone: varchar('contact_phone', { length: 20 }), // 联系电话
        status: boolean('status').default(true), // 状态
        expireTime: timestamp('expire_time', { withTimezone: true }), // 租期截止，NULL=永久
        config: jsonb('config').default({}), // 租户级配置（logo、主题、配额等）
        createTime: timestamp('create_time', { withTimezone: true }).defaultNow(), // 创建时间
        updateTime: timestamp('update_time', { withTimezone: true }), // 更新时间
        delFlag: boolean('del_flag').default(false), // 删除标志
        remark: varchar('remark', { length: 255 }), // 备注
    }
);
export const InsertSystemTenant = createInsertSchema(systemTenantSchema);
export const SelectSystemTenant = createSelectSchema(systemTenantSchema);
