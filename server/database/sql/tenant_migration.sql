-- ============================================
-- 多租户迁移 DDL
-- 执行方式：psql -U postgres -d elysia-admin -f tenant_migration.sql
-- ============================================

-- 1. 创建 system_tenant 表
CREATE SEQUENCE IF NOT EXISTS "system_tenant_tenant_id_seq"
    INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

CREATE TABLE IF NOT EXISTS "system_tenant" (
    "tenant_id"      int8 NOT NULL DEFAULT nextval('system_tenant_tenant_id_seq'::regclass),
    "tenant_name"    varchar(100) NOT NULL,
    "tenant_code"    varchar(50) NOT NULL,
    "contact_name"   varchar(50),
    "contact_phone"  varchar(20),
    "status"         bool DEFAULT true,
    "expire_time"    timestamptz,
    "config"         jsonb DEFAULT '{}'::jsonb,
    "create_time"    timestamptz DEFAULT now(),
    "update_time"    timestamptz,
    "del_flag"       bool DEFAULT false,
    "remark"         varchar(255)
);

ALTER TABLE "system_tenant" ADD CONSTRAINT "system_tenant_pkey" PRIMARY KEY ("tenant_id");
ALTER TABLE "system_tenant" ADD CONSTRAINT "system_tenant_tenant_code_unique" UNIQUE ("tenant_code");
ALTER SEQUENCE "system_tenant_tenant_id_seq" OWNED BY "system_tenant"."tenant_id";

-- 插入默认租户
INSERT INTO "system_tenant" ("tenant_id", "tenant_name", "tenant_code", "contact_name", "status")
VALUES (1, '默认租户', 'default', '系统管理员', true)
ON CONFLICT ("tenant_id") DO NOTHING;

SELECT setval('"system_tenant_tenant_id_seq"', COALESCE((SELECT MAX("tenant_id") FROM "system_tenant"), 1), true);

-- 2. 给所有使用 BaseSchema 的业务表添加 tenant_id 列
ALTER TABLE "system_user" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_role" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_menu" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_menu_btn" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_dept" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_dict_type" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_dict_data" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
-- system_api 为全局表，不需要 tenant_id（已回滚）
ALTER TABLE "system_storage" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_login_log" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_oper_log" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_ip_black" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "system_agent_config" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "monitor_job" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "business_merchant" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "business_merchant_configs" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "business_orders" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "business_payments" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "business_refund" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "metadata_collections" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "metadata_fields" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "metadata_indexes" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "metadata_relations" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "workflow_definition" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "workflow_instance" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
ALTER TABLE "workflow_step_execution" ADD COLUMN IF NOT EXISTS "tenant_id" int8 DEFAULT 1;
