-- ============================================
-- 元数据系统 DDL（Metadata System）
-- 迁移自 intellecXplore-paas-old 设计方案
-- 执行方式：psql -U postgres -d elysia-admin -f metadata.sql
-- ============================================

-- 序列
CREATE SEQUENCE IF NOT EXISTS "metadata_collections_collection_id_seq"
    INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "metadata_fields_field_id_seq"
    INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "metadata_relations_relation_id_seq"
    INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "metadata_indexes_index_id_seq"
    INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1;

-- ============================================
-- 1. metadata_collections — Collection 元数据
-- ============================================
CREATE TABLE IF NOT EXISTS "metadata_collections" (
    "collection_id"      int8 NOT NULL DEFAULT nextval('metadata_collections_collection_id_seq'::regclass),
    "name"               varchar(100) NOT NULL,
    "title"              varchar(200) NOT NULL,
    "description"        text,
    "database_type"      varchar(20)  NOT NULL,
    "table_name"         varchar(100) NOT NULL,
    "namespace"          varchar(50),
    "storage_config"     jsonb,
    "access_control"     jsonb,
    "table_config"       jsonb,
    "ui_config"          jsonb,
    "ai"                 jsonb        DEFAULT '{}'::jsonb,
    "version"            int4         DEFAULT 1,
    "status"             varchar(20)  DEFAULT 'draft',
    "create_time"        timestamptz  DEFAULT now(),
    "create_by"          int8,
    "update_time"        timestamptz,
    "update_by"          int8,
    "del_flag"           bool         DEFAULT false,
    "remark"             varchar(255)
);

ALTER TABLE "metadata_collections" ADD CONSTRAINT "metadata_collections_pkey" PRIMARY KEY ("collection_id");
ALTER TABLE "metadata_collections" ADD CONSTRAINT "metadata_collections_name_unique" UNIQUE ("name");
ALTER TABLE "metadata_collections" ADD CONSTRAINT "metadata_collections_table_name_unique" UNIQUE ("table_name");
ALTER SEQUENCE "metadata_collections_collection_id_seq" OWNED BY "metadata_collections"."collection_id";

-- ============================================
-- 2. metadata_fields — Field 元数据
-- ============================================
CREATE TABLE IF NOT EXISTS "metadata_fields" (
    "field_id"           int8 NOT NULL DEFAULT nextval('metadata_fields_field_id_seq'::regclass),
    "collection_id"      int8         NOT NULL,
    "key"                varchar(100) NOT NULL,
    "type"               varchar(50)  NOT NULL,
    "column_name"        varchar(100),
    "nullable"           bool         DEFAULT true,
    "default_value"      text,
    "is_unique"          bool         DEFAULT false,
    "indexed"            bool         DEFAULT false,
    "is_primary_key"     bool         DEFAULT false,
    "length"             int4,
    "precision"          int4,
    "scale"              int4,
    "required"           bool         DEFAULT false,
    "min"                numeric,
    "max"                numeric,
    "pattern"            varchar(500),
    "custom_validator"   varchar(200),
    "relation"           jsonb,
    "ui_config"          jsonb,
    "ai"                 jsonb        DEFAULT '{}'::jsonb,
    "sort_order"         int4         DEFAULT 0,
    "version"            int4         DEFAULT 1,
    "status"             varchar(20)  DEFAULT 'active',
    "create_time"        timestamptz  DEFAULT now(),
    "create_by"          int8,
    "update_time"        timestamptz,
    "update_by"          int8,
    "del_flag"           bool         DEFAULT false,
    "remark"             varchar(255)
);

ALTER TABLE "metadata_fields" ADD CONSTRAINT "metadata_fields_pkey" PRIMARY KEY ("field_id");
ALTER TABLE "metadata_fields" ADD CONSTRAINT "metadata_fields_collection_key_unique" UNIQUE ("collection_id", "key");
ALTER TABLE "metadata_fields" ADD CONSTRAINT "metadata_fields_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "metadata_collections" ("collection_id") ON DELETE CASCADE;
ALTER SEQUENCE "metadata_fields_field_id_seq" OWNED BY "metadata_fields"."field_id";

-- ============================================
-- 3. metadata_relations — Relation 元数据
-- ============================================
CREATE TABLE IF NOT EXISTS "metadata_relations" (
    "relation_id"            int8 NOT NULL DEFAULT nextval('metadata_relations_relation_id_seq'::regclass),
    "name"                   varchar(100) NOT NULL,
    "type"                   varchar(20)  NOT NULL,
    "source_collection_id"   int8         NOT NULL,
    "target_collection_id"   int8         NOT NULL,
    "source_field"           varchar(100) NOT NULL,
    "target_field"           varchar(100) NOT NULL,
    "junction_table"         jsonb,
    "cascade"               jsonb,
    "status"                 varchar(20)  DEFAULT 'active',
    "create_time"            timestamptz  DEFAULT now(),
    "create_by"              int8,
    "update_time"            timestamptz,
    "update_by"              int8,
    "del_flag"               bool         DEFAULT false,
    "remark"                 varchar(255)
);

ALTER TABLE "metadata_relations" ADD CONSTRAINT "metadata_relations_pkey" PRIMARY KEY ("relation_id");
ALTER TABLE "metadata_relations" ADD CONSTRAINT "metadata_relations_source_fk" FOREIGN KEY ("source_collection_id") REFERENCES "metadata_collections" ("collection_id") ON DELETE CASCADE;
ALTER TABLE "metadata_relations" ADD CONSTRAINT "metadata_relations_target_fk" FOREIGN KEY ("target_collection_id") REFERENCES "metadata_collections" ("collection_id") ON DELETE CASCADE;
ALTER SEQUENCE "metadata_relations_relation_id_seq" OWNED BY "metadata_relations"."relation_id";

-- ============================================
-- 4. metadata_indexes — Index 元数据
-- ============================================
CREATE TABLE IF NOT EXISTS "metadata_indexes" (
    "index_id"           int8 NOT NULL DEFAULT nextval('metadata_indexes_index_id_seq'::regclass),
    "collection_id"      int8         NOT NULL,
    "name"               varchar(100) NOT NULL,
    "type"               varchar(20)  DEFAULT 'btree',
    "fields"             jsonb        NOT NULL,
    "is_unique"          bool         DEFAULT false,
    "partial_condition"  text,
    "status"             varchar(20)  DEFAULT 'active',
    "create_time"        timestamptz  DEFAULT now(),
    "create_by"          int8,
    "update_time"        timestamptz,
    "update_by"          int8,
    "del_flag"           bool         DEFAULT false,
    "remark"             varchar(255)
);

ALTER TABLE "metadata_indexes" ADD CONSTRAINT "metadata_indexes_pkey" PRIMARY KEY ("index_id");
ALTER TABLE "metadata_indexes" ADD CONSTRAINT "metadata_indexes_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "metadata_collections" ("collection_id") ON DELETE CASCADE;
ALTER SEQUENCE "metadata_indexes_index_id_seq" OWNED BY "metadata_indexes"."index_id";
