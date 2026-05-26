-- ============================================
-- 数据库连接配置管理 DDL
-- 执行方式：psql -U postgres -d elysia-admin -f metadata_database_configs.sql
-- ============================================

CREATE SEQUENCE IF NOT EXISTS "metadata_database_configs_id_seq"
    INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

CREATE TABLE IF NOT EXISTS "metadata_database_configs" (
    "id"              int8 NOT NULL DEFAULT nextval('metadata_database_configs_id_seq'::regclass),
    "name"            varchar(100) NOT NULL,
    "host"            varchar(255) NOT NULL,
    "port"            int4         DEFAULT 5432,
    "username"        varchar(100) NOT NULL,
    "password"        varchar(255) DEFAULT '',
    "database"        varchar(100) NOT NULL,
    "schema"          varchar(100) DEFAULT 'public',
    "description"     text,
    "status"          varchar(20)  DEFAULT 'active',
    "tenant_id"       int8         DEFAULT 1,
    "create_time"     timestamptz  DEFAULT now(),
    "create_by"       int8,
    "update_time"     timestamptz,
    "update_by"       int8,
    "del_flag"        bool         DEFAULT false,
    "remark"          varchar(255)
);

ALTER TABLE "metadata_database_configs" ADD CONSTRAINT "metadata_database_configs_pkey" PRIMARY KEY ("id");
ALTER TABLE "metadata_database_configs" ADD CONSTRAINT "metadata_database_configs_name_unique" UNIQUE ("name");
ALTER SEQUENCE "metadata_database_configs_id_seq" OWNED BY "metadata_database_configs"."id";
