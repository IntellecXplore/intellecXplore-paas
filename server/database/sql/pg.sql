--
-- PostgreSQL database dump
--

\restrict fD6eWnY75puSOImzv6pU2Lp3Zpz40rvkouwVQrKo4yZ7wR1WLr58MbrVMcgrXtI

-- Dumped from database version 16.13
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.system_user_role DROP CONSTRAINT IF EXISTS system_user_role_user_id_system_user_user_id_fk;
ALTER TABLE IF EXISTS ONLY public.system_user_role DROP CONSTRAINT IF EXISTS system_user_role_role_id_system_role_role_id_fk;
ALTER TABLE IF EXISTS ONLY public."system_user" DROP CONSTRAINT IF EXISTS system_user_dept_id_system_dept_dept_id_fk;
ALTER TABLE IF EXISTS ONLY public.system_role_menu DROP CONSTRAINT IF EXISTS system_role_menu_role_id_system_role_role_id_fk;
ALTER TABLE IF EXISTS ONLY public.system_role_menu DROP CONSTRAINT IF EXISTS system_role_menu_menu_id_system_menu_menu_id_fk;
ALTER TABLE IF EXISTS ONLY public.system_role_menu DROP CONSTRAINT IF EXISTS system_role_menu_menu_btn_id_system_menu_btn_btn_id_fk;
ALTER TABLE IF EXISTS ONLY public.system_menu_btn DROP CONSTRAINT IF EXISTS system_menu_btn_menu_id_system_menu_menu_id_fk;
ALTER TABLE IF EXISTS ONLY public.metadata_relations DROP CONSTRAINT IF EXISTS metadata_relations_target_collection_id_metadata_collections_id;
ALTER TABLE IF EXISTS ONLY public.metadata_relations DROP CONSTRAINT IF EXISTS metadata_relations_source_collection_id_metadata_collections_id;
ALTER TABLE IF EXISTS ONLY public.metadata_indexes DROP CONSTRAINT IF EXISTS metadata_indexes_collection_id_metadata_collections_id_fk;
ALTER TABLE IF EXISTS ONLY public.metadata_fields DROP CONSTRAINT IF EXISTS metadata_fields_collection_id_metadata_collections_id_fk;
ALTER TABLE IF EXISTS ONLY public.system_user_tenant DROP CONSTRAINT IF EXISTS fk_sut_tenant;
ALTER TABLE IF EXISTS ONLY public.business_refund DROP CONSTRAINT IF EXISTS business_refund_payment_id_business_payments_id_fk;
ALTER TABLE IF EXISTS ONLY public.business_refund DROP CONSTRAINT IF EXISTS business_refund_order_id_business_orders_id_fk;
ALTER TABLE IF EXISTS ONLY public.business_payments DROP CONSTRAINT IF EXISTS business_payments_order_no_business_orders_order_no_fk;
ALTER TABLE IF EXISTS ONLY public.business_payments DROP CONSTRAINT IF EXISTS business_payments_order_id_business_orders_id_fk;
ALTER TABLE IF EXISTS ONLY public.business_payments DROP CONSTRAINT IF EXISTS business_payments_merchant_config_id_business_merchant_id_fk;
ALTER TABLE IF EXISTS ONLY public.business_orders DROP CONSTRAINT IF EXISTS business_orders_merchant_id_business_merchant_id_fk;
ALTER TABLE IF EXISTS ONLY public.business_merchant_configs DROP CONSTRAINT IF EXISTS business_merchant_configs_merchant_id_business_merchant_id_fk;
DROP INDEX IF EXISTS public.idx_tool_sku_tool_type;
DROP INDEX IF EXISTS public.idx_tool_sku_tool_name;
DROP INDEX IF EXISTS public.idx_tool_sku_status;
DROP INDEX IF EXISTS public.idx_tool_sku_sku_code;
DROP INDEX IF EXISTS public.idx_customer_info_phone;
ALTER TABLE IF EXISTS ONLY public.workflow_step_execution DROP CONSTRAINT IF EXISTS workflow_step_execution_pkey;
ALTER TABLE IF EXISTS ONLY public.workflow_instance DROP CONSTRAINT IF EXISTS workflow_instance_pkey;
ALTER TABLE IF EXISTS ONLY public.workflow_definition DROP CONSTRAINT IF EXISTS workflow_definition_pkey;
ALTER TABLE IF EXISTS ONLY public.system_user_tenant DROP CONSTRAINT IF EXISTS uq_user_tenant;
ALTER TABLE IF EXISTS ONLY public.tool_sku DROP CONSTRAINT IF EXISTS tool_sku_sku_code_key;
ALTER TABLE IF EXISTS ONLY public.tool_sku DROP CONSTRAINT IF EXISTS tool_sku_pkey;
ALTER TABLE IF EXISTS ONLY public.t_test DROP CONSTRAINT IF EXISTS t_test_pkey;
ALTER TABLE IF EXISTS ONLY public."system_user" DROP CONSTRAINT IF EXISTS system_user_username_unique;
ALTER TABLE IF EXISTS ONLY public.system_user_tenant DROP CONSTRAINT IF EXISTS system_user_tenant_pkey;
ALTER TABLE IF EXISTS ONLY public."system_user" DROP CONSTRAINT IF EXISTS system_user_pkey;
ALTER TABLE IF EXISTS ONLY public.system_tenant DROP CONSTRAINT IF EXISTS system_tenant_tenant_code_unique;
ALTER TABLE IF EXISTS ONLY public.system_tenant DROP CONSTRAINT IF EXISTS system_tenant_pkey;
ALTER TABLE IF EXISTS ONLY public.system_storage DROP CONSTRAINT IF EXISTS system_storage_pkey;
ALTER TABLE IF EXISTS ONLY public.system_storage DROP CONSTRAINT IF EXISTS system_storage_name_unique;
ALTER TABLE IF EXISTS ONLY public.system_role DROP CONSTRAINT IF EXISTS system_role_pkey;
ALTER TABLE IF EXISTS ONLY public.system_oper_log DROP CONSTRAINT IF EXISTS system_oper_log_pkey;
ALTER TABLE IF EXISTS ONLY public.system_menu DROP CONSTRAINT IF EXISTS system_menu_pkey;
ALTER TABLE IF EXISTS ONLY public.system_menu_btn DROP CONSTRAINT IF EXISTS system_menu_btn_pkey;
ALTER TABLE IF EXISTS ONLY public.system_login_log DROP CONSTRAINT IF EXISTS system_login_log_pkey;
ALTER TABLE IF EXISTS ONLY public.system_ip_black DROP CONSTRAINT IF EXISTS system_ip_black_pkey;
ALTER TABLE IF EXISTS ONLY public.system_ip_black DROP CONSTRAINT IF EXISTS system_ip_black_ip_address_unique;
ALTER TABLE IF EXISTS ONLY public.system_dict_type DROP CONSTRAINT IF EXISTS system_dict_type_pkey;
ALTER TABLE IF EXISTS ONLY public.system_dict_type DROP CONSTRAINT IF EXISTS system_dict_type_dict_type_unique;
ALTER TABLE IF EXISTS ONLY public.system_dict_type DROP CONSTRAINT IF EXISTS system_dict_type_dict_name_unique;
ALTER TABLE IF EXISTS ONLY public.system_dict_data DROP CONSTRAINT IF EXISTS system_dict_data_pkey;
ALTER TABLE IF EXISTS ONLY public.system_dept DROP CONSTRAINT IF EXISTS system_dept_pkey;
ALTER TABLE IF EXISTS ONLY public.system_api DROP CONSTRAINT IF EXISTS system_api_pkey;
ALTER TABLE IF EXISTS ONLY public.system_agent_config DROP CONSTRAINT IF EXISTS system_agent_config_user_id_key;
ALTER TABLE IF EXISTS ONLY public.system_agent_config DROP CONSTRAINT IF EXISTS system_agent_config_pkey;
ALTER TABLE IF EXISTS ONLY public.monitor_job DROP CONSTRAINT IF EXISTS monitor_job_pkey;
ALTER TABLE IF EXISTS ONLY public.monitor_job DROP CONSTRAINT IF EXISTS monitor_job_job_name_unique;
ALTER TABLE IF EXISTS ONLY public.metadata_relations DROP CONSTRAINT IF EXISTS metadata_relations_pkey;
ALTER TABLE IF EXISTS ONLY public.metadata_indexes DROP CONSTRAINT IF EXISTS metadata_indexes_pkey;
ALTER TABLE IF EXISTS ONLY public.metadata_fields DROP CONSTRAINT IF EXISTS metadata_fields_pkey;
ALTER TABLE IF EXISTS ONLY public.metadata_fields DROP CONSTRAINT IF EXISTS metadata_fields_collection_id_column_name_unique;
ALTER TABLE IF EXISTS ONLY public.metadata_database_configs DROP CONSTRAINT IF EXISTS metadata_database_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.metadata_database_configs DROP CONSTRAINT IF EXISTS metadata_database_configs_name_unique;
ALTER TABLE IF EXISTS ONLY public.metadata_collections DROP CONSTRAINT IF EXISTS metadata_collections_table_name_unique;
ALTER TABLE IF EXISTS ONLY public.metadata_collections DROP CONSTRAINT IF EXISTS metadata_collections_pkey;
ALTER TABLE IF EXISTS ONLY public.business_merchant_configs DROP CONSTRAINT IF EXISTS merchant_payment_configs_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_info DROP CONSTRAINT IF EXISTS customer_info_pkey;
ALTER TABLE IF EXISTS ONLY public.business_refund DROP CONSTRAINT IF EXISTS business_refund_refund_no_unique;
ALTER TABLE IF EXISTS ONLY public.business_refund DROP CONSTRAINT IF EXISTS business_refund_pkey;
ALTER TABLE IF EXISTS ONLY public.business_payments DROP CONSTRAINT IF EXISTS business_payments_pkey;
ALTER TABLE IF EXISTS ONLY public.business_payments DROP CONSTRAINT IF EXISTS business_payments_payment_no_unique;
ALTER TABLE IF EXISTS ONLY public.business_payments DROP CONSTRAINT IF EXISTS business_payments_order_no_unique;
ALTER TABLE IF EXISTS ONLY public.business_orders DROP CONSTRAINT IF EXISTS business_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.business_orders DROP CONSTRAINT IF EXISTS business_orders_order_no_unique;
ALTER TABLE IF EXISTS ONLY public.business_merchant DROP CONSTRAINT IF EXISTS business_merchant_pkey;
ALTER TABLE IF EXISTS public.workflow_step_execution ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.workflow_instance ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.workflow_definition ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tool_sku ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.t_test ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_user_tenant ALTER COLUMN user_tenant_id DROP DEFAULT;
ALTER TABLE IF EXISTS public."system_user" ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_tenant ALTER COLUMN tenant_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_storage ALTER COLUMN storage_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_role ALTER COLUMN role_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_oper_log ALTER COLUMN oper_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_menu_btn ALTER COLUMN btn_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_menu ALTER COLUMN menu_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_login_log ALTER COLUMN log_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_ip_black ALTER COLUMN ip_black_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_dict_type ALTER COLUMN dict_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_dict_data ALTER COLUMN dict_code DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_dept ALTER COLUMN dept_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_api ALTER COLUMN api_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_agent_config ALTER COLUMN config_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.monitor_job ALTER COLUMN job_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.metadata_relations ALTER COLUMN relation_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.metadata_indexes ALTER COLUMN index_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.metadata_fields ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.metadata_database_configs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.metadata_collections ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.customer_info ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.business_refund ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.business_payments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.business_orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.business_merchant_configs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.business_merchant ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.workflow_step_execution_id_seq;
DROP TABLE IF EXISTS public.workflow_step_execution;
DROP SEQUENCE IF EXISTS public.workflow_instance_id_seq;
DROP TABLE IF EXISTS public.workflow_instance;
DROP SEQUENCE IF EXISTS public.workflow_definition_id_seq;
DROP TABLE IF EXISTS public.workflow_definition;
DROP SEQUENCE IF EXISTS public.tool_sku_id_seq;
DROP TABLE IF EXISTS public.tool_sku;
DROP SEQUENCE IF EXISTS public.t_test_id_seq;
DROP TABLE IF EXISTS public.t_test;
DROP SEQUENCE IF EXISTS public.system_user_user_id_seq;
DROP SEQUENCE IF EXISTS public.system_user_tenant_user_tenant_id_seq;
DROP TABLE IF EXISTS public.system_user_tenant;
DROP TABLE IF EXISTS public.system_user_role;
DROP TABLE IF EXISTS public."system_user";
DROP SEQUENCE IF EXISTS public.system_tenant_tenant_id_seq;
DROP TABLE IF EXISTS public.system_tenant;
DROP SEQUENCE IF EXISTS public.system_storage_storage_id_seq;
DROP TABLE IF EXISTS public.system_storage;
DROP SEQUENCE IF EXISTS public.system_role_role_id_seq;
DROP TABLE IF EXISTS public.system_role_menu;
DROP TABLE IF EXISTS public.system_role;
DROP SEQUENCE IF EXISTS public.system_oper_log_oper_id_seq;
DROP TABLE IF EXISTS public.system_oper_log;
DROP SEQUENCE IF EXISTS public.system_menu_menu_id_seq;
DROP SEQUENCE IF EXISTS public.system_menu_btn_btn_id_seq;
DROP TABLE IF EXISTS public.system_menu_btn;
DROP TABLE IF EXISTS public.system_menu;
DROP SEQUENCE IF EXISTS public.system_login_log_log_id_seq;
DROP TABLE IF EXISTS public.system_login_log;
DROP SEQUENCE IF EXISTS public.system_ip_black_ip_black_id_seq;
DROP TABLE IF EXISTS public.system_ip_black;
DROP SEQUENCE IF EXISTS public.system_dict_type_dict_id_seq;
DROP TABLE IF EXISTS public.system_dict_type;
DROP SEQUENCE IF EXISTS public.system_dict_data_dict_code_seq;
DROP TABLE IF EXISTS public.system_dict_data;
DROP SEQUENCE IF EXISTS public.system_dept_dept_id_seq;
DROP TABLE IF EXISTS public.system_dept;
DROP SEQUENCE IF EXISTS public.system_api_api_id_seq;
DROP TABLE IF EXISTS public.system_api;
DROP SEQUENCE IF EXISTS public.system_agent_config_config_id_seq;
DROP TABLE IF EXISTS public.system_agent_config;
DROP SEQUENCE IF EXISTS public.monitor_job_job_id_seq;
DROP TABLE IF EXISTS public.monitor_job;
DROP SEQUENCE IF EXISTS public.metadata_relations_relation_id_seq;
DROP TABLE IF EXISTS public.metadata_relations;
DROP SEQUENCE IF EXISTS public.metadata_indexes_index_id_seq;
DROP TABLE IF EXISTS public.metadata_indexes;
DROP SEQUENCE IF EXISTS public.metadata_fields_id_seq;
DROP TABLE IF EXISTS public.metadata_fields;
DROP SEQUENCE IF EXISTS public.metadata_database_configs_id_seq;
DROP TABLE IF EXISTS public.metadata_database_configs;
DROP SEQUENCE IF EXISTS public.metadata_collections_id_seq;
DROP TABLE IF EXISTS public.metadata_collections;
DROP SEQUENCE IF EXISTS public.merchant_payment_configs_id_seq;
DROP SEQUENCE IF EXISTS public.customer_info_id_seq;
DROP TABLE IF EXISTS public.customer_info;
DROP SEQUENCE IF EXISTS public.business_refund_id_seq;
DROP TABLE IF EXISTS public.business_refund;
DROP SEQUENCE IF EXISTS public.business_payments_id_seq;
DROP TABLE IF EXISTS public.business_payments;
DROP SEQUENCE IF EXISTS public.business_orders_id_seq;
DROP TABLE IF EXISTS public.business_orders;
DROP SEQUENCE IF EXISTS public.business_merchant_id_seq;
DROP TABLE IF EXISTS public.business_merchant_configs;
DROP TABLE IF EXISTS public.business_merchant;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: business_merchant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_merchant (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    status boolean DEFAULT true,
    tenant_id bigint DEFAULT 1
);


--
-- Name: business_merchant_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_merchant_configs (
    id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    channel character varying(20) NOT NULL,
    app_id character varying(100),
    mch_id character varying(100),
    private_key text,
    public_key text,
    config jsonb,
    status boolean DEFAULT true,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: business_merchant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_merchant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: business_merchant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.business_merchant_id_seq OWNED BY public.business_merchant.id;


--
-- Name: business_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_orders (
    id bigint NOT NULL,
    order_no character varying(64) NOT NULL,
    user_id bigint NOT NULL,
    merchant_id bigint NOT NULL,
    title character varying(200) NOT NULL,
    description character varying(500),
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'CNY'::character varying,
    status character varying(20) DEFAULT '0'::character varying,
    expire_time timestamp(6) without time zone,
    extra jsonb DEFAULT '{}'::jsonb,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: business_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: business_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.business_orders_id_seq OWNED BY public.business_orders.id;


--
-- Name: business_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_payments (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    merchant_config_id bigint NOT NULL,
    payment_no character varying(64) NOT NULL,
    platform character varying(20) NOT NULL,
    amount numeric(10,2) DEFAULT 0,
    status character varying(20) DEFAULT '0'::character varying,
    third_trade_no character varying(100),
    extra jsonb DEFAULT '{}'::jsonb,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    order_no character varying(64) NOT NULL,
    payment_method character varying(20) NOT NULL,
    tenant_id bigint DEFAULT 1
);


--
-- Name: business_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: business_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.business_payments_id_seq OWNED BY public.business_payments.id;


--
-- Name: business_refund; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_refund (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    payment_id bigint NOT NULL,
    refund_no character varying(64) NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT '0'::character varying,
    third_refund_no character varying(100),
    extra jsonb DEFAULT '{}'::jsonb,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: business_refund_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.business_refund_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: business_refund_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.business_refund_id_seq OWNED BY public.business_refund.id;


--
-- Name: customer_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_info (
    id bigint NOT NULL,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    customer_name character varying(100),
    email character varying(255),
    phone character varying(20),
    register_date date,
    tenant_id bigint DEFAULT 1
);


--
-- Name: customer_info_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.customer_info_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: customer_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.customer_info_id_seq OWNED BY public.customer_info.id;


--
-- Name: merchant_payment_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.merchant_payment_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: merchant_payment_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.merchant_payment_configs_id_seq OWNED BY public.business_merchant_configs.id;


--
-- Name: metadata_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metadata_collections (
    id bigint NOT NULL,
    table_name character varying(100) NOT NULL,
    label character varying(200) NOT NULL,
    description text,
    database_type character varying(20) NOT NULL,
    namespace character varying(50),
    storage_config jsonb,
    access_control jsonb,
    table_config jsonb,
    ui_config jsonb,
    ai jsonb DEFAULT '{}'::jsonb,
    version integer DEFAULT 1,
    status character varying(20) DEFAULT 'draft'::character varying,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: metadata_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metadata_collections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metadata_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metadata_collections_id_seq OWNED BY public.metadata_collections.id;


--
-- Name: metadata_database_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metadata_database_configs (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    host character varying(255) NOT NULL,
    port integer DEFAULT 5432,
    username character varying(100) NOT NULL,
    password character varying(255) DEFAULT ''::character varying,
    database character varying(100) NOT NULL,
    schema character varying(100) DEFAULT 'public'::character varying,
    description text,
    status character varying(20) DEFAULT 'active'::character varying,
    tenant_id bigint DEFAULT 1,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255)
);


--
-- Name: metadata_database_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metadata_database_configs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metadata_database_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metadata_database_configs_id_seq OWNED BY public.metadata_database_configs.id;


--
-- Name: metadata_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metadata_fields (
    id bigint NOT NULL,
    collection_id bigint NOT NULL,
    column_name character varying(100) NOT NULL,
    label character varying(200),
    type character varying(50) NOT NULL,
    nullable boolean DEFAULT true,
    default_value text,
    is_unique boolean DEFAULT false,
    indexed boolean DEFAULT false,
    is_primary_key boolean DEFAULT false,
    length integer,
    required boolean DEFAULT false,
    custom_validator character varying(200),
    relation jsonb,
    ui_config jsonb,
    ai jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    version integer DEFAULT 1,
    status character varying(20) DEFAULT 'active'::character varying,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: metadata_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metadata_fields_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metadata_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metadata_fields_id_seq OWNED BY public.metadata_fields.id;


--
-- Name: metadata_indexes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metadata_indexes (
    index_id bigint NOT NULL,
    collection_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) DEFAULT 'btree'::character varying,
    fields jsonb NOT NULL,
    is_unique boolean DEFAULT false,
    partial_condition text,
    status character varying(20) DEFAULT 'active'::character varying,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: metadata_indexes_index_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metadata_indexes_index_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metadata_indexes_index_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metadata_indexes_index_id_seq OWNED BY public.metadata_indexes.index_id;


--
-- Name: metadata_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metadata_relations (
    relation_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    source_collection_id bigint NOT NULL,
    target_collection_id bigint NOT NULL,
    source_field character varying(100) NOT NULL,
    target_field character varying(100) NOT NULL,
    junction_table jsonb,
    cascade jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: metadata_relations_relation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metadata_relations_relation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metadata_relations_relation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metadata_relations_relation_id_seq OWNED BY public.metadata_relations.relation_id;


--
-- Name: monitor_job; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monitor_job (
    job_id bigint NOT NULL,
    job_name character varying(64) NOT NULL,
    job_cron character varying(64) NOT NULL,
    status boolean DEFAULT true,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    job_args character varying(256),
    tenant_id bigint DEFAULT 1
);


--
-- Name: monitor_job_job_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.monitor_job_job_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: monitor_job_job_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.monitor_job_job_id_seq OWNED BY public.monitor_job.job_id;


--
-- Name: system_agent_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_agent_config (
    config_id bigint NOT NULL,
    user_id bigint NOT NULL,
    provider character varying(32) DEFAULT 'openai'::character varying NOT NULL,
    api_key character varying(255),
    api_base character varying(255) DEFAULT 'https://api.deepseek.com/v1'::character varying NOT NULL,
    model character varying(64) DEFAULT 'deepseek-chat'::character varying NOT NULL,
    max_tokens integer DEFAULT 4096 NOT NULL,
    max_tool_rounds integer DEFAULT 5 NOT NULL,
    conversation_ttl integer DEFAULT 86400 NOT NULL,
    status boolean DEFAULT true,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_agent_config_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_agent_config_config_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_agent_config_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_agent_config_config_id_seq OWNED BY public.system_agent_config.config_id;


--
-- Name: system_api; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_api (
    api_id bigint NOT NULL,
    api_name character varying(64) NOT NULL,
    api_path character varying(255) NOT NULL,
    api_method character varying(10) NOT NULL,
    status boolean DEFAULT true,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255)
);


--
-- Name: system_api_api_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_api_api_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_api_api_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_api_api_id_seq OWNED BY public.system_api.api_id;


--
-- Name: system_dept; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_dept (
    dept_id bigint NOT NULL,
    dept_name character varying(64) NOT NULL,
    status boolean DEFAULT true,
    parent_id bigint,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    sort integer DEFAULT 0,
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_dept_dept_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_dept_dept_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_dept_dept_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_dept_dept_id_seq OWNED BY public.system_dept.dept_id;


--
-- Name: system_dict_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_dict_data (
    dict_code bigint NOT NULL,
    dict_sort integer DEFAULT 0 NOT NULL,
    dict_value character varying(64) NOT NULL,
    dict_label character varying(64) NOT NULL,
    dict_type character varying(64) NOT NULL,
    status boolean DEFAULT true,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tag_type character varying(64),
    custom_class character varying(64),
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_dict_data_dict_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_dict_data_dict_code_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_dict_data_dict_code_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_dict_data_dict_code_seq OWNED BY public.system_dict_data.dict_code;


--
-- Name: system_dict_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_dict_type (
    dict_id bigint NOT NULL,
    dict_name character varying(64) NOT NULL,
    dict_type character varying(64) NOT NULL,
    status boolean DEFAULT true,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_dict_type_dict_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_dict_type_dict_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_dict_type_dict_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_dict_type_dict_id_seq OWNED BY public.system_dict_type.dict_id;


--
-- Name: system_ip_black; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_ip_black (
    ip_black_id bigint NOT NULL,
    ip_address character varying(64) NOT NULL,
    status boolean DEFAULT true,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_ip_black_ip_black_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_ip_black_ip_black_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_ip_black_ip_black_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_ip_black_ip_black_id_seq OWNED BY public.system_ip_black.ip_black_id;


--
-- Name: system_login_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_login_log (
    log_id bigint NOT NULL,
    login_type character varying(32),
    client_type character varying(32),
    client_platform character varying(32),
    ipaddr character varying(128),
    login_location character varying(256),
    user_agent character varying(512),
    os character varying(64),
    message character varying(255),
    status boolean,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    login_name character varying(64),
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_login_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_login_log_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_login_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_login_log_log_id_seq OWNED BY public.system_login_log.log_id;


--
-- Name: system_menu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_menu (
    menu_id bigint NOT NULL,
    path character varying(255),
    name character varying(64),
    component character varying(255),
    title character varying(64),
    icon character varying(64),
    show_badge boolean DEFAULT false,
    show_text_badge character varying(64),
    is_hide boolean DEFAULT false,
    is_hide_tab boolean DEFAULT false,
    link character varying(255),
    is_iframe boolean DEFAULT false,
    keep_alive boolean DEFAULT true,
    fixed_tab boolean DEFAULT false,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    active_path character varying(255),
    sort integer DEFAULT 0,
    parent_id bigint,
    status boolean DEFAULT true,
    is_full_page boolean DEFAULT false,
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_menu_btn; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_menu_btn (
    menu_id bigint,
    sort integer DEFAULT 0,
    title character varying(64),
    permission character varying(64),
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    btn_id bigint NOT NULL,
    status boolean DEFAULT true,
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_menu_btn_btn_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_menu_btn_btn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_menu_btn_btn_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_menu_btn_btn_id_seq OWNED BY public.system_menu_btn.btn_id;


--
-- Name: system_menu_menu_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_menu_menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_menu_menu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_menu_menu_id_seq OWNED BY public.system_menu.menu_id;


--
-- Name: system_oper_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_oper_log (
    oper_id bigint NOT NULL,
    title character varying(255),
    request_method character varying(10),
    operator_type character varying(32),
    user_id bigint,
    oper_url character varying(256),
    oper_ip character varying(128),
    oper_location character varying(256),
    oper_param character varying(1024),
    json_result character varying(1024),
    cost_time integer,
    status boolean,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    action character varying(255),
    oper_name character varying(64),
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_oper_log_oper_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_oper_log_oper_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_oper_log_oper_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_oper_log_oper_id_seq OWNED BY public.system_oper_log.oper_id;


--
-- Name: system_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_role (
    role_id bigint NOT NULL,
    role_name character varying(64) NOT NULL,
    role_code character varying(64) NOT NULL,
    sort integer DEFAULT 0,
    status boolean DEFAULT true,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_role_menu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_role_menu (
    role_id bigint,
    menu_id bigint,
    menu_btn_id bigint
);


--
-- Name: system_role_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_role_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_role_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_role_role_id_seq OWNED BY public.system_role.role_id;


--
-- Name: system_storage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_storage (
    storage_id bigint NOT NULL,
    name character varying(64) NOT NULL,
    endpoint character varying(255),
    bucket character varying(128),
    access_key character varying(128),
    secret_key character varying(128),
    status boolean DEFAULT false,
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    region character varying(64),
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_storage_storage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_storage_storage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_storage_storage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_storage_storage_id_seq OWNED BY public.system_storage.storage_id;


--
-- Name: system_tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_tenant (
    tenant_id bigint NOT NULL,
    tenant_name character varying(100) NOT NULL,
    tenant_code character varying(50) NOT NULL,
    contact_name character varying(50),
    contact_phone character varying(20),
    status boolean DEFAULT true,
    expire_time timestamp with time zone,
    config jsonb DEFAULT '{}'::jsonb,
    create_time timestamp with time zone DEFAULT now(),
    update_time timestamp with time zone,
    del_flag boolean DEFAULT false,
    remark character varying(255)
);


--
-- Name: system_tenant_tenant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_tenant_tenant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_tenant_tenant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_tenant_tenant_id_seq OWNED BY public.system_tenant.tenant_id;


--
-- Name: system_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."system_user" (
    user_id bigint NOT NULL,
    username character varying(64) NOT NULL,
    password character varying(255) NOT NULL,
    nickname character varying(64),
    email character varying(64),
    phone character varying(11),
    sex character varying(1) DEFAULT '0'::character varying,
    avatar character varying(255),
    create_time timestamp(6) with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp(6) with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    status boolean DEFAULT true,
    dept_id bigint,
    tenant_id bigint DEFAULT 1
);


--
-- Name: system_user_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_user_role (
    role_id bigint,
    user_id bigint
);


--
-- Name: system_user_tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_user_tenant (
    user_tenant_id bigint NOT NULL,
    user_id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    is_default smallint DEFAULT 0
);


--
-- Name: system_user_tenant_user_tenant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_user_tenant_user_tenant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_user_tenant_user_tenant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_user_tenant_user_tenant_id_seq OWNED BY public.system_user_tenant.user_tenant_id;


--
-- Name: system_user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_user_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_user_user_id_seq OWNED BY public."system_user".user_id;


--
-- Name: t_test; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_test (
    id bigint NOT NULL,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    age integer,
    male character varying(4),
    name character varying(255) NOT NULL,
    tenant_id bigint DEFAULT 1
);


--
-- Name: t_test_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.t_test_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: t_test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.t_test_id_seq OWNED BY public.t_test.id;


--
-- Name: tool_sku; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tool_sku (
    id bigint NOT NULL,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    coating character varying(64),
    description text,
    material character varying(64),
    sku_code character varying(64),
    specification character varying(128),
    standard_price numeric(10,2),
    status character varying(32),
    tool_category character varying(64),
    tool_name character varying(128),
    tool_type character varying(64),
    unit character varying(16),
    tenant_id bigint DEFAULT 1
);


--
-- Name: tool_sku_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tool_sku_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tool_sku_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tool_sku_id_seq OWNED BY public.tool_sku.id;


--
-- Name: workflow_definition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_definition (
    id bigint NOT NULL,
    name character varying(128) NOT NULL,
    description character varying(512),
    version integer DEFAULT 1 NOT NULL,
    status character varying(32) DEFAULT 'draft'::character varying NOT NULL,
    definition jsonb NOT NULL,
    is_template boolean DEFAULT false,
    create_time timestamp with time zone DEFAULT now(),
    create_by bigint,
    update_time timestamp with time zone,
    update_by bigint,
    del_flag boolean DEFAULT false,
    remark character varying(255),
    tenant_id bigint DEFAULT 1
);


--
-- Name: workflow_definition_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workflow_definition_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workflow_definition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workflow_definition_id_seq OWNED BY public.workflow_definition.id;


--
-- Name: workflow_instance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_instance (
    id bigint NOT NULL,
    definition_id bigint NOT NULL,
    definition_version integer DEFAULT 1 NOT NULL,
    workflow_name character varying(128) NOT NULL,
    status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    input jsonb DEFAULT '{}'::jsonb NOT NULL,
    output jsonb,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    current_step_id character varying(128),
    completed_steps jsonb DEFAULT '[]'::jsonb,
    error_message text,
    error_step_id character varying(128),
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_at timestamp with time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    timeout_at timestamp with time zone,
    trigger_type character varying(32) DEFAULT 'manual'::character varying,
    triggered_by bigint,
    user_id bigint NOT NULL,
    agent_id character varying(100),
    tags jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    tenant_id bigint DEFAULT 1
);


--
-- Name: workflow_instance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workflow_instance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workflow_instance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workflow_instance_id_seq OWNED BY public.workflow_instance.id;


--
-- Name: workflow_step_execution; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_step_execution (
    id bigint NOT NULL,
    instance_id bigint NOT NULL,
    step_id character varying(128) NOT NULL,
    step_type character varying(32) NOT NULL,
    step_name character varying(256),
    status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    input jsonb,
    output jsonb,
    error_message text,
    attempt integer DEFAULT 1,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    duration_ms integer,
    token_usage jsonb,
    model_used character varying(100),
    llm_messages jsonb,
    created_at timestamp with time zone DEFAULT now(),
    tenant_id bigint DEFAULT 1
);


--
-- Name: workflow_step_execution_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workflow_step_execution_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workflow_step_execution_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workflow_step_execution_id_seq OWNED BY public.workflow_step_execution.id;


--
-- Name: business_merchant id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_merchant ALTER COLUMN id SET DEFAULT nextval('public.business_merchant_id_seq'::regclass);


--
-- Name: business_merchant_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_merchant_configs ALTER COLUMN id SET DEFAULT nextval('public.merchant_payment_configs_id_seq'::regclass);


--
-- Name: business_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_orders ALTER COLUMN id SET DEFAULT nextval('public.business_orders_id_seq'::regclass);


--
-- Name: business_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_payments ALTER COLUMN id SET DEFAULT nextval('public.business_payments_id_seq'::regclass);


--
-- Name: business_refund id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_refund ALTER COLUMN id SET DEFAULT nextval('public.business_refund_id_seq'::regclass);


--
-- Name: customer_info id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_info ALTER COLUMN id SET DEFAULT nextval('public.customer_info_id_seq'::regclass);


--
-- Name: metadata_collections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_collections ALTER COLUMN id SET DEFAULT nextval('public.metadata_collections_id_seq'::regclass);


--
-- Name: metadata_database_configs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_database_configs ALTER COLUMN id SET DEFAULT nextval('public.metadata_database_configs_id_seq'::regclass);


--
-- Name: metadata_fields id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_fields ALTER COLUMN id SET DEFAULT nextval('public.metadata_fields_id_seq'::regclass);


--
-- Name: metadata_indexes index_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_indexes ALTER COLUMN index_id SET DEFAULT nextval('public.metadata_indexes_index_id_seq'::regclass);


--
-- Name: metadata_relations relation_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_relations ALTER COLUMN relation_id SET DEFAULT nextval('public.metadata_relations_relation_id_seq'::regclass);


--
-- Name: monitor_job job_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monitor_job ALTER COLUMN job_id SET DEFAULT nextval('public.monitor_job_job_id_seq'::regclass);


--
-- Name: system_agent_config config_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_agent_config ALTER COLUMN config_id SET DEFAULT nextval('public.system_agent_config_config_id_seq'::regclass);


--
-- Name: system_api api_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_api ALTER COLUMN api_id SET DEFAULT nextval('public.system_api_api_id_seq'::regclass);


--
-- Name: system_dept dept_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_dept ALTER COLUMN dept_id SET DEFAULT nextval('public.system_dept_dept_id_seq'::regclass);


--
-- Name: system_dict_data dict_code; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_dict_data ALTER COLUMN dict_code SET DEFAULT nextval('public.system_dict_data_dict_code_seq'::regclass);


--
-- Name: system_dict_type dict_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_dict_type ALTER COLUMN dict_id SET DEFAULT nextval('public.system_dict_type_dict_id_seq'::regclass);


--
-- Name: system_ip_black ip_black_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_ip_black ALTER COLUMN ip_black_id SET DEFAULT nextval('public.system_ip_black_ip_black_id_seq'::regclass);


--
-- Name: system_login_log log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_login_log ALTER COLUMN log_id SET DEFAULT nextval('public.system_login_log_log_id_seq'::regclass);


--
-- Name: system_menu menu_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_menu ALTER COLUMN menu_id SET DEFAULT nextval('public.system_menu_menu_id_seq'::regclass);


--
-- Name: system_menu_btn btn_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_menu_btn ALTER COLUMN btn_id SET DEFAULT nextval('public.system_menu_btn_btn_id_seq'::regclass);


--
-- Name: system_oper_log oper_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_oper_log ALTER COLUMN oper_id SET DEFAULT nextval('public.system_oper_log_oper_id_seq'::regclass);


--
-- Name: system_role role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_role ALTER COLUMN role_id SET DEFAULT nextval('public.system_role_role_id_seq'::regclass);


--
-- Name: system_storage storage_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_storage ALTER COLUMN storage_id SET DEFAULT nextval('public.system_storage_storage_id_seq'::regclass);


--
-- Name: system_tenant tenant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_tenant ALTER COLUMN tenant_id SET DEFAULT nextval('public.system_tenant_tenant_id_seq'::regclass);


--
-- Name: system_user user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."system_user" ALTER COLUMN user_id SET DEFAULT nextval('public.system_user_user_id_seq'::regclass);


--
-- Name: system_user_tenant user_tenant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_user_tenant ALTER COLUMN user_tenant_id SET DEFAULT nextval('public.system_user_tenant_user_tenant_id_seq'::regclass);


--
-- Name: t_test id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_test ALTER COLUMN id SET DEFAULT nextval('public.t_test_id_seq'::regclass);


--
-- Name: tool_sku id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_sku ALTER COLUMN id SET DEFAULT nextval('public.tool_sku_id_seq'::regclass);


--
-- Name: workflow_definition id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_definition ALTER COLUMN id SET DEFAULT nextval('public.workflow_definition_id_seq'::regclass);


--
-- Name: workflow_instance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instance ALTER COLUMN id SET DEFAULT nextval('public.workflow_instance_id_seq'::regclass);


--
-- Name: workflow_step_execution id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_step_execution ALTER COLUMN id SET DEFAULT nextval('public.workflow_step_execution_id_seq'::regclass);


--
-- Data for Name: business_merchant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_merchant (id, name, create_time, create_by, update_time, update_by, del_flag, remark, status, tenant_id) FROM stdin;
6	梅山老妖	2026-03-31 02:27:18.421+00	1	2026-03-31 07:41:35.938+00	1	f		t	1
\.


--
-- Data for Name: business_merchant_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_merchant_configs (id, merchant_id, channel, app_id, mch_id, private_key, public_key, config, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
2	6	wechat	\N	\N	\N	\N	\N	t	2026-03-31 06:29:22.418176+00	1	\N	\N	f		1
3	6	paypal	\N	\N	\N	\N	\N	t	2026-03-31 06:29:26.17941+00	1	\N	\N	f		1
1	6	alipay		\N			{"notifyUrl": "https://www.u2920048.nyat.app:65314/api/business/payments/notify", "returnUrl": "https://www.u2920048.nyat.app:65314/api/business/payments/return"}	t	2026-03-31 05:39:10.715+00	1	2026-05-10 12:33:55.871+00	1	f		1
\.


--
-- Data for Name: business_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_orders (id, order_no, user_id, merchant_id, title, description, amount, currency, status, expire_time, extra, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
35	019dee1a67917000a0791158e7c4e27b	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	12899.00	CNY	0	2026-05-04 14:06:01	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "product": {"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, "marketing": {"couponId": null, "discountAmount": 0}}	2026-05-03 13:50:01.107075+00	1	\N	\N	f	\N	1
37	019dee3830c77000bbb4d2f7230574b6	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	12899.00	CNY	1	2026-05-03 14:38:33.159	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "product": {"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, "marketing": {"couponId": null, "discountAmount": 0}}	2026-05-03 14:22:33.161349+00	1	\N	\N	f	\N	1
36	019dee360a887000b1db1412f9c8bc32	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	12899.00	CNY	3	2026-05-03 14:36:12.296	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "product": {"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, "marketing": {"couponId": null, "discountAmount": 0}}	2026-05-03 14:20:12.302083+00	1	\N	\N	f	\N	1
38	019df29acec57000bd50bc712a8d1098	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	12899.00	CNY	3	2026-05-04 11:04:44.997	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "product": {"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, "marketing": {"couponId": null, "discountAmount": 0}}	2026-05-04 10:48:44.999016+00	1	\N	\N	f	\N	1
43	019df660189a7000b9c1f1bd13b3ce98	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	1	2026-05-05 04:39:06.138	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-05 04:23:06.13993+00	1	2026-05-05 04:23:40.217+00	\N	f	\N	1
39	019df2c9889f7000880a1f2a4969fb1d	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	0	2026-05-04 12:55:47.23	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-04 11:39:47.23226+00	1	\N	\N	f	\N	1
40	019df331e72e7000a062409a1ff45f98	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	1	2026-05-04 13:49:47.182	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-04 13:33:47.184446+00	1	2026-05-04 13:37:58.522+00	\N	f	\N	1
41	019df65a59f7700099efa7b449400cb3	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-05 04:32:49.654	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-05 04:16:49.656371+00	1	\N	\N	f	\N	1
42	019df65dd70570009f9de2fdcfa711fc	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-05 04:36:38.277	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-05 04:20:38.27881+00	1	\N	\N	f	\N	1
44	019df6f1615070008ba953889e5273eb	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-05 07:17:47.472	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-05 07:01:47.473965+00	1	\N	\N	f	\N	1
45	019df6fe64947000bf99473fb7d7594a	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-05 07:32:00.276	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-05 07:16:00.277583+00	1	\N	\N	f	\N	1
47	019df74f007a7000a745dd7d169f2933	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	1	2026-05-05 09:00:03.066	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-05 08:44:03.069063+00	1	2026-05-05 08:45:50.287+00	\N	f	\N	1
46	019df74e37f47000afec7155fd731b1d	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-05 08:59:11.732	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-05 08:43:11.733452+00	1	\N	\N	f	\N	1
48	019dfd6c0fec700089b9a4121332cc01	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-06 13:29:30.86	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-06 13:13:30.861648+00	1	\N	\N	f	\N	1
49	019dfd6e5fe97000a5e9e9fcc76ec9e3	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-06 13:32:02.41	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-06 13:16:02.413267+00	1	\N	\N	f	\N	1
50	019dfd7b48327000b1b75bc17b852b7c	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-06 13:46:08.306	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-06 13:30:08.308152+00	1	\N	\N	f	\N	1
51	019dfd7bb48770009ac152588fe6c79f	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-06 13:46:36.039	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-06 13:30:36.040551+00	1	\N	\N	f	\N	1
52	019e02599d1b7000a9e222d8848e5338	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-07 12:27:27.899	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-07 12:11:27.901084+00	1	\N	\N	f	\N	1
55	019e0cdf2ea0700099dc46c21de5137d	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	1	2026-05-09 13:29:33.6	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-09 13:13:33.602679+00	1	2026-05-09 13:14:12.72+00	\N	f	\N	1
53	019e0cd850ba7000aed3bcfd4076c7d3	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-09 13:22:03.578	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-09 13:06:03.580096+00	1	\N	\N	f	\N	1
54	019e0cdce9747000a3824c22fe0761c5	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	3	2026-05-09 13:27:04.819	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-09 13:11:04.821935+00	1	\N	\N	f	\N	1
58	019e20155a787000b8e1931cced0d7af	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	0	2026-05-13 07:01:30.872	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-13 06:45:30.87176+00	1	\N	\N	f	\N	1
56	019e101dcea4700088413b734efc7b6d	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	1	2026-05-10 04:36:49.444	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-10 04:20:49.445581+00	1	2026-05-13 06:19:06.428+00	1	f	666，不早说	1
57	019e200d95cf700085356bb647028742	1	6	DR钻戒-求婚系列	一生只送一人，真爱唯一的承诺	25698.00	CNY	0	2026-05-13 06:53:01.775	{"user": {"phone": "13800138000", "userId": 1, "address": "北京市海淀区中关村软件园二期", "nickname": "张三", "postalCode": "100000"}, "products": [{"specs": "圈口: 12号; 材质: 18K金; 主钻: 30分", "productId": 101, "productNum": 1, "productName": "DR钻戒-心形1克拉", "productPrice": 12899, "productTotal": 12899}, {"specs": "圈口: 男15号/女12号; 材质: PT950铂金", "productId": 102, "productNum": 1, "productName": "DR对戒-经典款", "productPrice": 12799, "productTotal": 12799}], "marketing": {"couponId": null, "couponName": "", "discountAmount": 0}}	2026-05-13 06:37:01.776472+00	1	\N	\N	f	\N	1
\.


--
-- Data for Name: business_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_payments (id, order_id, merchant_config_id, payment_no, platform, amount, status, third_trade_no, extra, create_time, create_by, update_time, update_by, del_flag, remark, order_no, payment_method, tenant_id) FROM stdin;
28	40	6	019df331f83e7000b2de26e4f53e62f1	pc	25698.00	1	2026050422001465370508927076	{"sign": "TFISPrP57P7n8+feY4ocqMn6SKW7fEGFueEhPOyYzjrWDpNwmwmspUQpBMJId0hwqMk65uYOstKN8sEfirPBBNCWY8h5BhQHurj1iy9e6dRVBlkDWQEEXf4Btlum8tcXN3xVPhXG6GZ7GfyCOCHJIT4PBYWfwUxjNYA6BIM+s93qFtF27iZBJXaHvjbBEToqFRDVagIOSKhNl303rAMHSLTFG7aw6pNxoHvxMX66/Fgzc9/JovFFlkzPNNM1M91b5nrrxtTRVAavF8w0tEYQjeMu71BSdkRUH9xUCSJVaZmPPWO7zieliqK50iyMz2WseWPiSsRGR/O+oj6gAvc/EQ==", "app_id": "9021000140654564", "charset": "utf-8", "subject": "DR钻戒-求婚系列", "version": "1.0", "buyer_id": "2088722043665373", "trade_no": "2026050422001465370508927076", "notify_id": "2026050401222213512165370508936369", "seller_id": "2088721043665361", "sign_type": "RSA2", "gmt_create": "2026-05-04 21:34:53", "auth_app_id": "9021000140654564", "gmt_payment": "2026-05-04 21:35:11", "notify_time": "2026-05-04 21:35:13", "notify_type": "trade_status_sync", "out_trade_no": "019df331f83e7000b2de26e4f53e62f1", "point_amount": "0.00", "total_amount": "25698.00", "trade_status": "TRADE_SUCCESS", "fund_bill_list": "[{\\"amount\\":\\"25698.00\\",\\"fundChannel\\":\\"ALIPAYACCOUNT\\"}]", "invoice_amount": "25698.00", "receipt_amount": "25698.00", "buyer_pay_amount": "25698.00"}	2026-05-04 13:33:51.552983+00	1	2026-05-04 13:37:58.52+00	\N	f	\N	019df331e72e7000a062409a1ff45f98	alipay	1
31	43	6	019df66041807000b63dc1fefaad9aea	pc	25698.00	1	2026050522001465370508933570	{"sign": "LMbysFAFxdVhwqzG95w93QPcMXSarbuh5K0lnnolB+QLebmYEnFK5WImOm9g2VQbFre650W0HX2c4653fC4i/OoFunrbV665kqfVUYMlDzwafknQXZiINWpUKMmRi4fYYKq3GqKiOYNXCrkrq6umPVI0qMSGvOcOjDrGopRA5WT//8axGCfuXlfCt7Qu0DzwN7NKwOdPLvHtoD8vec8O9wXjE52VtnvDmWXuXdqwYaBraZaT/puYrNltimnmy/q+tuPK49kPggNHN+nB99mbDOj6ZJ4fXzChkHWgQ0OigititkV8biO/JUkEuHaLj3Fr8TIP/flm+YU4i5d34wyScg==", "app_id": "9021000140654564", "charset": "utf-8", "subject": "DR钻戒-求婚系列", "version": "1.0", "buyer_id": "2088722043665373", "trade_no": "2026050522001465370508933570", "notify_id": "2026050501222122341165370508943879", "seller_id": "2088721043665361", "sign_type": "RSA2", "gmt_create": "2026-05-05 12:23:34", "auth_app_id": "9021000140654564", "gmt_payment": "2026-05-05 12:23:40", "notify_time": "2026-05-05 12:23:41", "notify_type": "trade_status_sync", "out_trade_no": "019df66041807000b63dc1fefaad9aea", "point_amount": "0.00", "total_amount": "25698.00", "trade_status": "TRADE_SUCCESS", "fund_bill_list": "[{\\"amount\\":\\"25698.00\\",\\"fundChannel\\":\\"ALIPAYACCOUNT\\"}]", "invoice_amount": "25698.00", "receipt_amount": "25698.00", "buyer_pay_amount": "25698.00"}	2026-05-05 04:23:16.611178+00	1	2026-05-05 04:23:40.213+00	\N	f	\N	019df660189a7000b9c1f1bd13b3ce98	alipay	1
29	41	6	019df65a815570009ad9c43f09f31e14	pc	0.00	3	\N	{}	2026-05-05 04:16:59.737127+00	1	\N	\N	f	\N	019df65a59f7700099efa7b449400cb3	alipay	1
30	42	6	019df65e00957000bf965e21eb36160a	pc	0.00	3	\N	{}	2026-05-05 04:20:48.919713+00	1	\N	\N	f	\N	019df65dd70570009f9de2fdcfa711fc	alipay	1
32	44	6	019df6f2df837000918ad43e6a0ebef8	pc	0.00	3	\N	{}	2026-05-05 07:03:25.317468+00	1	\N	\N	f	\N	019df6f1615070008ba953889e5273eb	alipay	1
24	35	6	019dee1d6d267000b8997a5e6eb8646c	pc	0.00	0	\N	{}	2026-05-03 13:53:19.149086+00	1	2026-05-03 14:19:50.34+00	1	f	\N	019dee1a67917000a0791158e7c4e27b	alipay	1
26	37	6	019dee38621670008284ac922a33bb46	pc	12899.00	1	2026050322001465370508924875	{"sign": "UFU/BzKWWwpu6EBW1ZatCSQP+q7aLjr7iXhsVxKTfMItPFsOVob1lgFiHNIngd9zoeu5nBRJ3xcUJZbhxHp06NieE/dNgehuJNZc7HHtAdeewwYBg+8NnN1tC+cJcXDqdffpSrgrkiGijEqdAiH1V5YifaAzynNFyRSupfG1JpDeJRCa/OPELfQ+uF29St+XPzJlgy2cgiAQg2zoi+IktQPEd5rn6ieNEtInW6SrucdZQBWsRuIswQgAPFRR5Wss2R1Q5pHHl7DaKNYTUq3yhfrpM7cnNJoUebYwCIISAQ5RN1vg5qTcF/S1kupALmSKSY+zkE7TOughqghxC4dSjw==", "app_id": "9021000140654564", "charset": "utf-8", "subject": "DR钻戒-求婚系列", "version": "1.0", "buyer_id": "2088722043665373", "trade_no": "2026050322001465370508924875", "notify_id": "2026050301222222336165370508934730", "seller_id": "2088721043665361", "sign_type": "RSA2", "gmt_create": "2026-05-03 22:23:28", "auth_app_id": "9021000140654564", "gmt_payment": "2026-05-03 22:23:36", "notify_time": "2026-05-03 22:23:37", "notify_type": "trade_status_sync", "out_trade_no": "019dee38621670008284ac922a33bb46", "point_amount": "0.00", "total_amount": "12899.00", "trade_status": "TRADE_SUCCESS", "fund_bill_list": "[{\\"amount\\":\\"12899.00\\",\\"fundChannel\\":\\"ALIPAYACCOUNT\\"}]", "invoice_amount": "12899.00", "receipt_amount": "12899.00", "buyer_pay_amount": "12899.00"}	2026-05-03 14:22:45.786859+00	1	2026-05-03 14:29:11.362+00	\N	f	\N	019dee3830c77000bbb4d2f7230574b6	alipay	1
25	36	6	019dee36250c7000bc87515e4a0e5a0f	pc	0.00	3	\N	{}	2026-05-03 14:20:19.088194+00	1	\N	\N	f	\N	019dee360a887000b1db1412f9c8bc32	alipay	1
27	39	6	019df2d98b1f700089c71e34b3934b93	pc	0.00	0	\N	{}	2026-05-04 11:57:16.450634+00	1	\N	\N	f	\N	019df2c9889f7000880a1f2a4969fb1d	alipay	1
34	47	6	019df74f123e70008736b950f82d316a	h5	25698.00	1	2026050522001465370508935287	{"sign": "f60eavHI+48CMx5MR9hUUy8TuHkoKSTEvw+wpLbpIPHv+/AJZM066TXKzVmvW9nBTUe9PrS5RO/RU7rY1yrszfkaZT/fUueFW7VOIMUKJ5jS3bSbAs6t/ja+xWO12Q+kCq4Ju0ZTloS2CiC/ZgKe9qIwWdOmbLZeeIWYbqp+Ng7IWpjZ0jrYYi0RauVl2qJsl51G6awyg2SZ5+OZ1Le0cvPAkjjR9WWoOZHK9Q6CyfMqU4KQnUj2VdgW/o6Ai7QD8D0tYMk3a0FMPoMeqt4i6rY8UvHiMt4FoqDJNiZjDewkyrVV2ld0i18V0s7YDS67keiT0/RBR2gaf+b/kwpBvw==", "app_id": "9021000140654564", "charset": "utf-8", "subject": "DR钻戒-求婚系列", "version": "1.0", "buyer_id": "2088722043665373", "trade_no": "2026050522001465370508935287", "notify_id": "2026050501222164551165370508945448", "seller_id": "2088721043665361", "sign_type": "RSA2", "gmt_create": "2026-05-05 16:45:49", "auth_app_id": "9021000140654564", "gmt_payment": "2026-05-05 16:45:50", "notify_time": "2026-05-05 16:45:52", "notify_type": "trade_status_sync", "out_trade_no": "019df74f123e70008736b950f82d316a", "point_amount": "0.00", "seller_email": "awobmv7611@sandbox.com", "total_amount": "25698.00", "trade_status": "TRADE_SUCCESS", "buyer_logon_id": "uhjhty8906@sandbox.com", "fund_bill_list": "[{\\"amount\\":\\"25698.00\\",\\"fundChannel\\":\\"ALIPAYACCOUNT\\"}]", "invoice_amount": "25698.00", "receipt_amount": "25698.00", "buyer_pay_amount": "25698.00"}	2026-05-05 08:44:07.617818+00	1	2026-05-05 08:45:50.286+00	\N	f	\N	019df74f007a7000a745dd7d169f2933	alipay	1
33	46	6	019df74e8f1b7000b38859db37fefcec	h5	0.00	3	\N	{}	2026-05-05 08:43:34.044799+00	1	\N	\N	f	\N	019df74e37f47000afec7155fd731b1d	alipay	1
35	49	6	019dfd6e886e70009018ef2cd78dedf0	app	0.00	3	\N	{}	2026-05-06 13:16:12.785779+00	1	\N	\N	f	\N	019dfd6e5fe97000a5e9e9fcc76ec9e3	alipay	1
36	50	6	019dfd7b6d077000b8b28f6170b986d9	app	0.00	3	\N	{}	2026-05-06 13:30:17.737125+00	1	\N	\N	f	\N	019dfd7b48327000b1b75bc17b852b7c	alipay	1
37	51	6	019dfd7bd7d270009b55f9a49cac94d7	app	0.00	3	\N	{}	2026-05-06 13:30:45.07556+00	1	\N	\N	f	\N	019dfd7bb48770009ac152588fe6c79f	alipay	1
38	52	6	019e0259e76170009f149d96f1987a94	app	0.00	3	\N	{}	2026-05-07 12:11:46.916557+00	1	\N	\N	f	\N	019e02599d1b7000a9e222d8848e5338	alipay	1
39	53	6	019e0cd8f59170008380f953274c36b4	pc	0.00	3	\N	{}	2026-05-09 13:06:45.784164+00	1	\N	\N	f	\N	019e0cd850ba7000aed3bcfd4076c7d3	alipay	1
40	54	6	019e0cdd045a70008c02059379a0f173	pc	0.00	3	\N	{}	2026-05-09 13:11:11.709446+00	1	\N	\N	f	\N	019e0cdce9747000a3824c22fe0761c5	alipay	1
41	55	6	019e0cdf68f270009ec91abaf58dbb31	pc	25698.00	1	2026050922001465370508958527	{"sign": "h5DCNG3XEAfQeUxAGMicbryU4ZnLbU8irMoBzncN5Pu1XppZzuP+6GWIVEqPTCYlFUIKothqCs33J+k4zAKQVLGvME8WlVV6t5ThpCWFrEWzWWt9yjLSDwCtebNKa/iyBx+dnI1oNChVh/f0ZNsGUZXkloQAYH08lx6AbM1BurJkcY9EHYVURiOgs5H9zZe8ll30X5+HZaj0s0FYS3rikBszQZ68Lpvacc6oymIgzs3siRTkNlLQbDlGZ9e0zQhUOpINyMhYAe17bWm7qwh+lPf2cLmqZH1TKfMZbP1oHW9LHEppdBffAfSI/T8dVUWhWFHWUAfN1aaLKRzxNIFGdw==", "app_id": "9021000140654564", "charset": "utf-8", "subject": "DR钻戒-求婚系列", "version": "1.0", "buyer_id": "2088722043665373", "trade_no": "2026050922001465370508958527", "notify_id": "2026050901222211411165370508967967", "seller_id": "2088721043665361", "sign_type": "RSA2", "gmt_create": "2026-05-09 21:14:01", "auth_app_id": "9021000140654564", "gmt_payment": "2026-05-09 21:14:10", "notify_time": "2026-05-09 21:14:11", "notify_type": "trade_status_sync", "out_trade_no": "019e0cdf68f270009ec91abaf58dbb31", "point_amount": "0.00", "total_amount": "25698.00", "trade_status": "TRADE_SUCCESS", "fund_bill_list": "[{\\"amount\\":\\"25698.00\\",\\"fundChannel\\":\\"ALIPAYACCOUNT\\"}]", "invoice_amount": "25698.00", "receipt_amount": "25698.00", "buyer_pay_amount": "25698.00"}	2026-05-09 13:13:48.534167+00	1	2026-05-09 13:14:12.716+00	\N	f	\N	019e0cdf2ea0700099dc46c21de5137d	alipay	1
42	56	6	019e101e5b28700081da14bc6bc1a57a	pc	25698.00	1	2026051022001465370508962984	{"sign": "iRgT/OkK/KFPhUX+jFYLWwOC5RRrWL8tt5L8IBt9mmXzf4m/WEqdVoqnD0FeFIYzttDCQ9UAoq3hEElQ4IPv/MsRcxawIm6tdivY/02AsDtizxSfvXpuD4GZs+sxcOzvLpHIBVG3c9u4wuDyv1Nrb+iyyvx55mI1Lo3kZtOqLye9zJUeGYv9n3n5AlYoEILHpJVufFyUOQ609d+SSUfAApWdxwjxSpCzd7epYkygI0xzdVzBT9F9r7Do57XzvbmPbJGmMQWzbscCJGCI2dCjL8fK01oebRTDnH5JFKcpEreZmD7aQkUWvJHo2QSsunJmROjg08LfizBrhysQ/1AZKw==", "app_id": "9021000140654564", "charset": "utf-8", "subject": "DR钻戒-求婚系列", "version": "1.0", "buyer_id": "2088722043665373", "trade_no": "2026051022001465370508962984", "notify_id": "2026051001222122204165370508973274", "seller_id": "2088721043665361", "sign_type": "RSA2", "gmt_create": "2026-05-10 12:21:57", "auth_app_id": "9021000140654564", "gmt_payment": "2026-05-10 12:22:04", "notify_time": "2026-05-10 12:22:05", "notify_type": "trade_status_sync", "out_trade_no": "019e101e5b28700081da14bc6bc1a57a", "point_amount": "0.00", "total_amount": "25698.00", "trade_status": "TRADE_SUCCESS", "fund_bill_list": "[{\\"amount\\":\\"25698.00\\",\\"fundChannel\\":\\"ALIPAYACCOUNT\\"}]", "invoice_amount": "25698.00", "receipt_amount": "25698.00", "buyer_pay_amount": "25698.00"}	2026-05-10 04:21:25.417714+00	1	2026-05-10 04:22:04.27+00	\N	f	\N	019e101dcea4700088413b734efc7b6d	alipay	1
\.


--
-- Data for Name: business_refund; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.business_refund (id, order_id, payment_id, refund_no, amount, status, third_refund_no, extra, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
\.


--
-- Data for Name: customer_info; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_info (id, create_time, create_by, update_time, update_by, del_flag, remark, customer_name, email, phone, register_date, tenant_id) FROM stdin;
1	2026-05-18 14:47:44.687471+00	1	2026-05-18 15:03:46.462+00	\N	t	\N	123	1231@qq.com	1231231	2026-04-28	1
\.


--
-- Data for Name: metadata_collections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metadata_collections (id, table_name, label, description, database_type, namespace, storage_config, access_control, table_config, ui_config, ai, version, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
3	system_user	用户表	系统用户账号，存储管理员账户信息	postgresql	_system	\N	\N	\N	\N	{"hint": "用户需要分配角色后才能获得菜单权限", "group": "用户体系"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
4	system_role	角色表	RBAC 角色定义，角色包含菜单和按钮权限集合	postgresql	_system	\N	\N	\N	\N	{"hint": "角色是菜单和按钮权限的载体，一个用户可有多个角色", "group": "权限体系"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
5	system_user_role	用户角色关联表	用户与角色的多对多关联	postgresql	_system	\N	\N	\N	\N	{"hint": "通过此表给用户分配角色", "group": "权限体系"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
6	system_menu	菜单表	系统菜单/路由定义，支持多级树形结构	postgresql	_system	\N	\N	\N	\N	{"hint": "创建菜单后需通过 system_role_menu 分配给角色才能被用户看到", "group": "权限体系"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
7	system_menu_btn	菜单按钮表	菜单页面的操作按钮权限定义	postgresql	_system	\N	\N	\N	\N	{"hint": "按钮权限绑定在菜单下，通过系统进行 RBAC 控制", "group": "权限体系"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
8	system_role_menu	角色菜单关联表	角色—菜单—按钮的权限绑定，存储角色被授予的菜单和按钮权限	postgresql	_system	\N	\N	\N	\N	{"hint": "给角色分配菜单时在此表插入记录；删除角色菜单授权时删除对应记录", "group": "权限体系"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
9	system_dept	部门表	组织架构/部门树形结构	postgresql	_system	\N	\N	\N	\N	{"hint": "部门用于用户分组的树形组织", "group": "用户体系"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
10	system_dict_type	字典类型表	字典分类，如 性别、状态 等	postgresql	_system	\N	\N	\N	\N	{"hint": "每个字典类型下包含多个字典数据项", "group": "字典"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
11	system_dict_data	字典数据表	字典具体数据值	postgresql	_system	\N	\N	\N	\N	{"hint": "与 system_dict_type 通过 dict_type 字段关联", "group": "字典"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
12	system_api	API端点表	系统 API 端点注册表，用于权限校验和熔断	postgresql	_system	\N	\N	\N	\N	{"hint": "所有后端接口在此注册，用于权限判断和 API 熔断控制", "group": "系统"}	1	system	2026-05-18 07:23:40.078054+00	\N	\N	\N	f	\N	1
13	tool_sku	刀具类型SKU	管理刀具类型和SKU编码信息，包括刀具名称、类型、规格、材质等	postgresql	production	\N	\N	\N	\N	{}	2	active	2026-05-18 14:06:16.765541+00	1	2026-05-18 14:06:49.722+00	\N	f	\N	1
14	tool_sku_info	刀具SKU信息	管理刀具SKU的基础信息，包括编码、名称、型号、规格参数、库存等	postgresql	business	\N	\N	\N	\N	{}	1	preparing	2026-05-18 14:07:36.872233+00	1	2026-05-18 14:08:18.855+00	\N	f	\N	1
2	customer_info	客户信息表	存储客户基本信息，包括姓名、手机号、邮箱、注册日期	postgresql	default	\N	\N	\N	\N	{}	2	inactive	2026-05-16 14:30:00.561754+00	\N	2026-05-20 07:09:10.399+00	1	f	\N	1
1	t_test	人员档案	测试用表单	postgresql	business	\N	\N	\N	\N	{}	2	inactive	2026-05-15 16:48:47.272595+00	1	2026-05-20 07:10:01.584+00	1	t	\N	1
17	blade_types	刀片类型	刀片类型字典数据：3寸水果刀、4寸水果刀、4.7寸牛扒刀、5寸万用刀、6寸剔骨刀、7寸三德刀等	postgresql	business	\N	\N	\N	\N	{}	1	draft	2026-05-21 07:22:03.521903+00	1	\N	\N	f	\N	1
18	_test_metadata	元数据测试表单		postgresql	business	{"ssl": false, "host": "localhost", "port": 5432, "schema": "collection", "database": "elysia-admin", "password": "postgres", "username": "postgres"}	\N	\N	\N	{}	1	draft	2026-05-21 16:05:31.543+00	13	\N	\N	f	\N	1
\.


--
-- Data for Name: metadata_database_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metadata_database_configs (id, name, host, port, username, password, database, schema, description, status, tenant_id, create_time, create_by, update_time, update_by, del_flag, remark) FROM stdin;
1	系统默认 (localhost PG)	localhost	5432	postgres	postgres	elysia-admin	public	开发环境 PostgreSQL 数据库	active	1	2026-05-19 06:20:27.434235+00	\N	\N	\N	f	\N
\.


--
-- Data for Name: metadata_fields; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metadata_fields (id, collection_id, column_name, label, type, nullable, default_value, is_unique, indexed, is_primary_key, length, required, custom_validator, relation, ui_config, ai, sort_order, version, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
4	2	customer_name	客户姓名	string	t	\N	f	f	f	100	t	\N	\N	\N	{}	1	1	active	2026-05-16 14:30:11.509401+00	\N	\N	\N	f	\N	1
5	2	phone	手机号	string	t	\N	f	t	f	20	t	\N	\N	\N	{}	2	1	active	2026-05-16 14:30:11.518037+00	\N	\N	\N	f	\N	1
6	2	email	邮箱	email	t	\N	f	f	f	255	f	\N	\N	\N	{}	3	1	active	2026-05-16 14:30:11.52021+00	\N	\N	\N	f	\N	1
7	2	register_date	注册日期	date	t	\N	f	f	f	\N	f	\N	\N	\N	{}	4	1	active	2026-05-16 14:30:11.5222+00	\N	\N	\N	f	\N	1
8	13	sku_code	SKU编码	string	t	\N	t	t	f	64	t	\N	\N	\N	{}	1	1	active	2026-05-18 14:06:35.340264+00	1	\N	\N	f	\N	1
9	13	tool_name	刀具名称	string	t	\N	f	t	f	128	t	\N	\N	\N	{}	2	1	active	2026-05-18 14:06:35.348533+00	1	\N	\N	f	\N	1
10	13	tool_type	刀具类型	string	t	\N	f	t	f	64	t	\N	\N	\N	{}	3	1	active	2026-05-18 14:06:35.35139+00	1	\N	\N	f	\N	1
11	13	tool_category	刀具分类	string	t	\N	f	f	f	64	f	\N	\N	\N	{}	4	1	active	2026-05-18 14:06:35.35424+00	1	\N	\N	f	\N	1
12	13	specification	规格型号	string	t	\N	f	f	f	128	f	\N	\N	\N	{}	5	1	active	2026-05-18 14:06:35.356936+00	1	\N	\N	f	\N	1
13	13	material	材质	string	t	\N	f	f	f	64	f	\N	\N	\N	{}	6	1	active	2026-05-18 14:06:35.359165+00	1	\N	\N	f	\N	1
14	13	coating	涂层	string	t	\N	f	f	f	64	f	\N	\N	\N	{}	7	1	active	2026-05-18 14:06:35.361803+00	1	\N	\N	f	\N	1
15	13	unit	单位	string	t	\N	f	f	f	16	f	\N	\N	\N	{}	8	1	active	2026-05-18 14:06:42.910391+00	1	\N	\N	f	\N	1
16	13	standard_price	标准价格	decimal	t	\N	f	f	f	\N	f	\N	\N	\N	{}	9	1	active	2026-05-18 14:06:42.915726+00	1	\N	\N	f	\N	1
17	13	description	描述备注	text	t	\N	f	f	f	\N	f	\N	\N	\N	{}	10	1	active	2026-05-18 14:06:42.920039+00	1	\N	\N	f	\N	1
18	13	status	状态	string	t	\N	f	t	f	32	f	\N	\N	\N	{}	11	1	active	2026-05-18 14:06:42.922469+00	1	\N	\N	f	\N	1
19	14	sku_code	SKU编码	string	t	\N	t	t	f	64	t	\N	\N	\N	{}	1	1	active	2026-05-18 14:08:01.882316+00	1	\N	\N	f	\N	1
20	14	tool_name	刀具名称	string	t	\N	f	t	f	128	t	\N	\N	\N	{}	2	1	active	2026-05-18 14:08:01.887382+00	1	\N	\N	f	\N	1
21	14	tool_model	规格型号	string	t	\N	f	f	f	128	f	\N	\N	\N	{}	3	1	active	2026-05-18 14:08:01.890091+00	1	\N	\N	f	\N	1
22	14	tool_type	刀具类型	string	t	\N	f	t	f	64	f	\N	\N	\N	{}	4	1	active	2026-05-18 14:08:01.891865+00	1	\N	\N	f	\N	1
23	14	material	材质	string	t	\N	f	f	f	64	f	\N	\N	\N	{}	5	1	active	2026-05-18 14:08:01.895332+00	1	\N	\N	f	\N	1
24	14	blade_shape	刀片形状	string	t	\N	f	f	f	64	f	\N	\N	\N	{}	6	1	active	2026-05-18 14:08:01.898807+00	1	\N	\N	f	\N	1
25	14	cutting_diameter	切削直径(mm)	decimal	t	\N	f	f	f	\N	f	\N	\N	\N	{}	7	1	active	2026-05-18 14:08:01.900622+00	1	\N	\N	f	\N	1
26	14	total_length	总长(mm)	decimal	t	\N	f	f	f	\N	f	\N	\N	\N	{}	8	1	active	2026-05-18 14:08:01.904468+00	1	\N	\N	f	\N	1
27	14	blade_diameter	刃径(mm)	decimal	t	\N	f	f	f	\N	f	\N	\N	\N	{}	9	1	active	2026-05-18 14:08:01.907439+00	1	\N	\N	f	\N	1
28	14	blade_count	刃数	integer	t	\N	f	f	f	\N	f	\N	\N	\N	{}	10	1	active	2026-05-18 14:08:15.261016+00	1	\N	\N	f	\N	1
29	14	coating	涂层	string	t	\N	f	f	f	64	f	\N	\N	\N	{}	11	1	active	2026-05-18 14:08:15.26668+00	1	\N	\N	f	\N	1
30	14	applicable_material	适用加工材料	string	t	\N	f	f	f	128	f	\N	\N	\N	{}	12	1	active	2026-05-18 14:08:15.269258+00	1	\N	\N	f	\N	1
31	14	brand	品牌	string	t	\N	f	f	f	64	f	\N	\N	\N	{}	13	1	active	2026-05-18 14:08:15.270861+00	1	\N	\N	f	\N	1
32	14	unit_price	单价(元)	decimal	t	\N	f	f	f	\N	f	\N	\N	\N	{}	14	1	active	2026-05-18 14:08:15.272278+00	1	\N	\N	f	\N	1
33	14	unit	计量单位	string	t	\N	f	f	f	16	f	\N	\N	\N	{}	15	1	active	2026-05-18 14:08:15.273916+00	1	\N	\N	f	\N	1
34	14	stock_quantity	库存数量	integer	t	\N	f	f	f	\N	f	\N	\N	\N	{}	16	1	active	2026-05-18 14:08:15.276521+00	1	\N	\N	f	\N	1
35	14	status	状态	string	t	\N	f	t	f	16	f	\N	\N	\N	{}	17	1	active	2026-05-18 14:08:15.292195+00	1	\N	\N	f	\N	1
36	14	remark	备注	text	t	\N	f	f	f	\N	f	\N	\N	\N	{}	18	1	active	2026-05-18 14:08:15.301394+00	1	\N	\N	f	\N	1
2	1	age	年龄	integer	t	\N	f	f	f	4	f	\N	\N	\N	{}	0	1	active	2026-05-15 16:48:47.296063+00	1	2026-05-20 07:10:01.572+00	\N	t	\N	1
3	1	male	性别	string	t	\N	f	f	f	4	f	\N	\N	\N	{}	0	1	active	2026-05-15 16:48:47.305238+00	1	2026-05-20 07:10:01.572+00	\N	t	\N	1
1	1	name	姓名	string	f	\N	f	f	f	255	t	\N	\N	\N	{}	0	1	active	2026-05-15 16:48:47.287381+00	1	2026-05-20 07:10:01.572+00	\N	t	\N	1
37	17	type_code	类型编码	string	t	\N	t	t	f	50	t	\N	\N	\N	{}	0	1	active	2026-05-21 07:22:21.826903+00	1	\N	\N	f	\N	1
38	17	type_name	类型名称	string	t	\N	f	t	f	100	t	\N	\N	\N	{}	1	1	active	2026-05-21 07:22:21.83287+00	1	\N	\N	f	\N	1
39	17	sort_order	排序号	integer	t	\N	f	f	f	\N	f	\N	\N	\N	{}	2	1	active	2026-05-21 07:22:21.835622+00	1	\N	\N	f	\N	1
40	17	remark	备注	string	t	\N	f	f	f	255	f	\N	\N	\N	{}	3	1	active	2026-05-21 07:22:21.837505+00	1	\N	\N	f	\N	1
41	18	column_1	自定义字段1	string	f	\N	f	f	f	255	t	\N	\N	\N	{}	0	1	active	2026-05-21 16:05:31.556+00	13	\N	\N	f	\N	1
42	18	column_2	自定义字段2	integer	t	\N	f	f	f	255	f	\N	\N	\N	{}	0	1	active	2026-05-21 16:05:31.556+00	13	\N	\N	f	\N	1
43	18	column_3	自定义字段3	boolean	t	\N	f	f	f	255	f	\N	\N	\N	{}	0	1	active	2026-05-21 16:05:31.556+00	13	\N	\N	f	\N	1
44	18	column_4	自定义字段4	date	t	\N	f	f	f	255	f	\N	\N	\N	{}	0	1	active	2026-05-21 16:05:31.556+00	13	\N	\N	f	\N	1
\.


--
-- Data for Name: metadata_indexes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metadata_indexes (index_id, collection_id, name, type, fields, is_unique, partial_condition, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
\.


--
-- Data for Name: metadata_relations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metadata_relations (relation_id, name, type, source_collection_id, target_collection_id, source_field, target_field, junction_table, cascade, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
1	用户→角色	many_to_many	3	4	user_id	role_id	{"table": "system_user_role", "sourceKey": "user_id", "targetKey": "role_id"}	{}	active	2026-05-18 07:23:40.081742+00	\N	\N	\N	f	用户通过 system_user_role 关联角色，一个用户可有多个角色	1
2	角色→菜单	many_to_many	4	6	role_id	menu_id	{"table": "system_role_menu", "sourceKey": "role_id", "targetKey": "menu_id"}	{}	active	2026-05-18 07:23:40.087152+00	\N	\N	\N	f	角色通过 system_role_menu 被授予菜单和按钮权限	1
3	菜单→按钮	has_many	6	7	menu_id	menu_id	\N	{}	active	2026-05-18 07:23:40.088867+00	\N	\N	\N	f	一个菜单下可定义多个操作按钮（增删改查等），每个按钮有对应权限标识	1
\.


--
-- Data for Name: monitor_job; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.monitor_job (job_id, job_name, job_cron, status, create_time, create_by, update_time, update_by, del_flag, remark, job_args, tenant_id) FROM stdin;
8	测试任务	0 * * * * *	t	2026-02-10 02:17:20.145+00	\N	2026-04-14 09:37:18.209+00	1	f		["乔治",19,true]	1
\.


--
-- Data for Name: system_agent_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_agent_config (config_id, user_id, provider, api_key, api_base, model, max_tokens, max_tool_rounds, conversation_ttl, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
1	1	openai	sk-aa2df11765624d8eb234d5ecd35b2dd3	https://api.deepseek.com	deepseek-v4-pro	4096	5	86400	t	2026-05-16 13:13:09.341649+00	1	\N	\N	f	\N	1
\.


--
-- Data for Name: system_api; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_api (api_id, api_name, api_path, api_method, status, create_time, create_by, update_time, update_by, del_flag, remark) FROM stdin;
341	认证模块-web账号密码登录	/api/auth/login	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
342	认证模块-刷新令牌	/api/auth/refresh	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
343	认证模块-注册用户	/api/auth/register	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
344	认证模块-忘记密码	/api/auth/forget	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
345	认证模块-重置密码	/api/auth/reset-password	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
346	支付模块-支付同步回调	/api/business/payments/return	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
347	支付模块-支付异步回调	/api/business/payments/notify	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
348	系统字典-查询所有-缓存数据	/api/system/dict/data/all	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
349	认证模块-退出登录	/api/auth/logout	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
350	商户模块-创建	/api/business/merchant	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
351	商户模块-创建商户配置	/api/business/merchant/config	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
352	商户模块-查询商户配置	/api/business/merchant/config/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
353	商户模块-查询列表	/api/business/merchant/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
354	商户模块-更新	/api/business/merchant	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
355	商户模块-更新商户配置	/api/business/merchant/config	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
356	商户模块-删除	/api/business/merchant/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
357	商户模块-删除商户配置	/api/business/merchant/config/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
358	订单模块-创建	/api/business/orders	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
359	订单模块-查询列表	/api/business/orders/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
360	订单模块-查询详情	/api/business/orders/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
361	订单模块-更新	/api/business/orders	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
362	支付模块-支付订单	/api/business/payments	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
363	支付模块-查询列表	/api/business/payments/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
364	支付模块-查询详情	/api/business/payments/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
365	缓存列表-查询类型	/api/monitor/cache/type	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
366	缓存列表-查询列表	/api/monitor/cache/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
367	缓存列表-查询详情	/api/monitor/cache/key	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
368	缓存列表-更新指定缓存	/api/monitor/cache/update-key	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
369	缓存列表-清除指定类型	/api/monitor/cache/clear-type	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
370	缓存列表-清除指定缓存	/api/monitor/cache/clear-key	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
371	定时任务-创建	/api/monitor/job	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
372	定时任务-查询列表	/api/monitor/job/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
373	定时任务-更新	/api/monitor/job	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
374	定时任务-删除	/api/monitor/job/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
375	在线用户-查询列表	/api/monitor/online/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
376	在线用户-强退	/api/monitor/online/forceLogout/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
377	系统API-创建	/api/system/api	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
378	系统API-查询列表	/api/system/api/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
379	系统API-查询详情	/api/system/api/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
380	系统API-更新	/api/system/api	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
381	系统API-删除	/api/system/api/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
382	系统部门-创建	/api/system/dept	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
383	系统部门-查询部门树	/api/system/dept/tree	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
384	系统部门-下拉选项数据	/api/system/dept/options	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
385	系统部门-更新	/api/system/dept	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
386	系统部门-删除	/api/system/dept/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
387	系统字典-创建-类型	/api/system/dict/type	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
388	系统字典-查询所有-缓存类型	/api/system/dict/type/all	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
389	系统字典-查询列表-类型	/api/system/dict/type/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
390	系统字典-查询详情-类型	/api/system/dict/type/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
391	系统字典-更新-类型	/api/system/dict/type	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
392	系统字典-删除-类型	/api/system/dict/type/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
393	系统字典-创建-数据	/api/system/dict/data	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
394	系统字典-查询列表-数据	/api/system/dict/data/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
395	系统字典-更新-数据	/api/system/dict/data	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
396	系统字典-删除-数据	/api/system/dict/data/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
397	黑名单IP-创建	/api/system/ip-black	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
398	黑名单IP-查询全部	/api/system/ip-black/all	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
399	黑名单IP-更新	/api/system/ip-black	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
400	黑名单IP-删除	/api/system/ip-black/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
401	登录日志-查询列表	/api/system/login-log/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
402	登录日志-删除	/api/system/login-log/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
403	系统菜单-创建菜单	/api/system/menu	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
404	系统菜单-查询用户菜单树	/api/system/menu/simple	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
405	系统菜单-查询完整菜单树	/api/system/menu/tree	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
406	系统菜单-查询菜单详情	/api/system/menu/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
407	系统菜单-更新菜单	/api/system/menu	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
408	系统菜单-删除菜单	/api/system/menu/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
409	系统菜单-创建按钮	/api/system/menu/btn	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
410	系统菜单-更新按钮	/api/system/menu/btn	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
411	系统菜单-删除按钮	/api/system/menu/btn/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
412	操作日志-查询列表	/api/system/oper-log/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
413	操作日志-删除	/api/system/oper-log/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
414	系统角色-创建	/api/system/role	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
415	系统角色-查询列表	/api/system/role/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
416	系统角色-下拉选项数据	/api/system/role/options	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
417	系统角色-查询角色权限	/api/system/role/permission/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
418	系统角色-查询详情	/api/system/role/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
419	系统角色-更新	/api/system/role	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
420	系统角色-更新角色权限	/api/system/role/permission	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
421	系统角色-删除	/api/system/role/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
422	存储配置-创建	/api/system/storage	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
423	存储配置-查询列表	/api/system/storage/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
424	存储配置-生成预签名URL	/api/system/storage/presign	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
425	存储配置-更新	/api/system/storage	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
426	存储配置-删除	/api/system/storage/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
427	系统用户-创建	/api/system/user	2	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
428	系统用户-查询列表	/api/system/user/list	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
429	系统用户-查询个人基本权限	/api/system/user/perm	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
430	系统用户-查询个人基本信息	/api/system/user/basic	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
431	系统用户-查询详情	/api/system/user/:id	1	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
432	系统用户-更新	/api/system/user	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
433	系统用户-更新个人基本信息	/api/system/user/basic	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
434	系统用户-更新个人密码	/api/system/user/password	3	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
435	系统用户-删除	/api/system/user/:ids	4	t	2026-05-02 07:38:12.168938+00	\N	\N	\N	f	\N
436	退款模块-创建退款申请	/api/business/refund	2	t	2026-05-11 11:11:53.494761+00	\N	\N	\N	f	\N
437	退款模块-查询退款列表	/api/business/refund/list	1	t	2026-05-11 11:11:53.494761+00	\N	\N	\N	f	\N
438	退款模块-查询退款详情	/api/business/refund/:id	1	t	2026-05-11 11:11:53.494761+00	\N	\N	\N	f	\N
439	退款模块-更新退款状态	/api/business/refund	3	t	2026-05-11 11:11:53.494761+00	\N	\N	\N	f	\N
440	订单模块-订单状态统计	/api/business/orders/stats	1	t	2026-05-13 06:11:57.637383+00	\N	\N	\N	f	\N
\.


--
-- Data for Name: system_dept; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_dept (dept_id, dept_name, status, parent_id, create_time, create_by, update_time, update_by, del_flag, remark, sort, tenant_id) FROM stdin;
1	Elysia-Admin科技	t	0	2025-12-31 05:30:19.896242+00	\N	\N	\N	f	\N	0	1
2	长沙总公司	t	1	2025-12-31 05:38:35.375031+00	\N	\N	\N	f	\N	0	1
3	杭州分公司	t	1	2025-12-31 05:38:44.9+00	\N	2025-12-31 09:23:34.735+00	\N	f		0	1
4	研发部门	t	2	2025-12-31 09:27:56.164569+00	\N	\N	\N	f	\N	0	1
5	市场部门	t	2	2026-01-06 07:57:35.255585+00	\N	\N	\N	f	\N	0	1
6	测试部门	t	2	2026-01-06 07:58:01.206845+00	\N	\N	\N	f	\N	0	1
7	财务部门	t	2	2026-01-06 07:58:15.84004+00	\N	\N	\N	f	\N	0	1
8	运维部门	t	2	2026-01-06 07:58:24.001631+00	\N	2026-01-06 08:03:57.027+00	\N	f	\N	0	1
9	测试公司	t	1	2026-04-18 01:37:38.993102+00	1	\N	\N	f		0	1
\.


--
-- Data for Name: system_dict_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_dict_data (dict_code, dict_sort, dict_value, dict_label, dict_type, status, create_time, create_by, update_time, update_by, del_flag, remark, tag_type, custom_class, tenant_id) FROM stdin;
1	0	0	未知	system_user_sex	t	2025-12-15 07:26:11.870532+00	\N	\N	\N	f	\N	\N	\N	1
2	1	1	男	system_user_sex	t	2025-12-15 07:26:20.125+00	\N	2025-12-22 07:06:06.339+00	\N	f	\N	\N	\N	1
3	2	2	女	system_user_sex	t	2025-12-15 07:26:26.649+00	\N	2025-12-22 07:06:10.191+00	\N	f	\N	\N	\N	1
4	0	0	系统通知	system_notice_type	t	2025-12-22 06:18:34.393991+00	\N	2025-12-22 07:42:26.789+00	\N	f	\N	\N	\N	1
8	0	4	DELETE	api_request_method	t	2025-12-24 07:44:27.425+00	\N	2025-12-29 03:00:48.842+00	\N	f		danger		1
7	0	3	PUT	api_request_method	t	2025-12-24 07:44:18.668+00	\N	2025-12-29 03:01:00.962+00	\N	f		warning		1
5	0	2	POST	api_request_method	t	2025-12-24 07:43:57.346+00	\N	2026-02-05 05:42:09.755+00	\N	f		success		1
6	0	1	GET	api_request_method	t	2025-12-24 07:44:11.389+00	\N	2026-02-05 05:42:15.357+00	\N	f		info		1
9	0	admin	管理员	system_user_type	t	2026-02-09 07:03:37.970308+00	\N	\N	\N	f		danger		1
10	0	user	普通用户	system_user_type	t	2026-02-09 07:03:57.351573+00	\N	\N	\N	f		info		1
18	0	pc	PC	system_pay_platform	t	2026-03-27 01:39:08.742391+00	1	\N	\N	f		primary		1
19	0	h5	H5	system_pay_platform	t	2026-03-27 01:39:28.013588+00	1	\N	\N	f		warning		1
20	0	app	APP	system_pay_platform	t	2026-03-27 01:39:47.052235+00	1	\N	\N	f		info		1
21	0	mini	小程序	system_pay_platform	t	2026-03-27 01:40:08.034721+00	1	\N	\N	f		success		1
22	0	0	待支付	system_pay_status	t	2026-03-27 01:51:08.357+00	1	2026-03-27 02:04:47.675+00	1	f		info		1
23	0	1	成功	system_pay_status	t	2026-03-27 01:51:20.684+00	1	2026-03-27 02:04:53.352+00	1	f		success		1
24	0	2	失败	system_pay_status	t	2026-03-27 01:52:29.779+00	1	2026-03-27 02:04:56.268+00	1	f		danger		1
26	0	0	退款中	system_refund_status	t	2026-03-27 02:08:08.284001+00	1	\N	\N	f		info		1
27	0	1	成功	system_refund_status	t	2026-03-27 02:08:57.338089+00	1	\N	\N	f		success		1
28	0	2	失败	system_refund_status	t	2026-03-27 02:09:06.075658+00	1	2026-03-27 02:15:50.106+00	1	f		danger		1
29	0	alipay	支付宝	system_pay_method	t	2026-03-31 01:22:12.03037+00	1	2026-03-31 06:35:36.634+00	1	f	ri:alipay-fill		text-2xl text-blue-600	1
30	1	wechat	微信支付	system_pay_method	t	2026-03-31 01:22:44.8649+00	1	2026-03-31 07:27:19.672+00	1	f	mingcute:wechat-pay-fill		text-2xl text-green-600	1
31	2	paypal	PayPal	system_pay_method	t	2026-03-31 01:23:34.30506+00	1	2026-03-31 07:27:22.768+00	1	f	logos:paypal		text-2xl	1
14	0	0	待支付	system_orders_status	t	2026-03-25 02:24:50.104892+00	1	2026-04-09 03:03:02.517+00	1	f		primary		1
15	1	1	已支付	system_orders_status	t	2026-03-25 02:25:04.34673+00	1	2026-04-09 03:03:27.915+00	1	f		success		1
16	2	2	已取消	system_orders_status	t	2026-03-25 02:25:17.546746+00	1	2026-04-09 03:03:32.613+00	1	f		warning		1
17	3	3	已过期	system_orders_status	t	2026-03-25 02:25:28.405897+00	1	2026-04-09 03:03:47.283+00	1	f		info		1
32	4	4	已退款	system_orders_status	t	2026-04-09 03:04:02.205506+00	1	\N	\N	f		danger		1
25	0	3	已关闭	system_pay_status	t	2026-03-27 01:52:41.928+00	1	2026-04-09 03:05:00.534+00	1	f		warning		1
\.


--
-- Data for Name: system_dict_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_dict_type (dict_id, dict_name, dict_type, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
1	用户性别	system_user_sex	t	2025-12-15 07:22:45.589436+00	\N	\N	\N	f	\N	1
2	通知类型	system_notice_type	t	2025-12-22 06:12:58.98+00	\N	2025-12-22 07:04:21.064+00	\N	f	\N	1
3	API请求方法	api_request_method	t	2025-12-24 07:40:36.046+00	\N	2026-01-07 03:19:12.302+00	\N	f	\N	1
4	系统用户类型	system_user_type	t	2026-02-09 07:02:58.958448+00	\N	\N	\N	f	\N	1
6	订单状态	system_orders_status	t	2026-03-25 02:24:21.477809+00	1	\N	\N	f	\N	1
7	支付平台	system_pay_platform	t	2026-03-27 01:38:19.136885+00	1	\N	\N	f	\N	1
8	支付状态	system_pay_status	t	2026-03-27 01:49:24.074547+00	1	\N	\N	f	\N	1
9	退款状态	system_refund_status	t	2026-03-27 02:04:14.939754+00	1	\N	\N	f	\N	1
10	支付类型	system_pay_method	t	2026-03-31 01:19:43.218103+00	1	\N	\N	f	\N	1
\.


--
-- Data for Name: system_ip_black; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_ip_black (ip_black_id, ip_address, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
6	192.168.2.3	t	2026-01-24 07:45:47.878+00	\N	2026-03-30 01:52:30.745+00	1	f	测试黑名单功能	1
\.


--
-- Data for Name: system_login_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_login_log (log_id, login_type, client_type, client_platform, ipaddr, login_location, user_agent, os, message, status, create_time, create_by, update_time, update_by, del_flag, remark, login_name, tenant_id) FROM stdin;
\.


--
-- Data for Name: system_menu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_menu (menu_id, path, name, component, title, icon, show_badge, show_text_badge, is_hide, is_hide_tab, link, is_iframe, keep_alive, fixed_tab, create_time, create_by, update_time, update_by, del_flag, remark, active_path, sort, parent_id, status, is_full_page, tenant_id) FROM stdin;
1	/dashboard	Dashboard	/index/index	menus.dashboard.title	ri:pie-chart-line	f	\N	f	f	\N	f	t	f	2026-01-07 06:44:03.266366+00	\N	\N	\N	f	\N	\N	0	\N	t	f	1
2	console	Console	/dashboard/console	menus.dashboard.console	ri:home-smile-2-line	f	\N	f	f	\N	f	f	t	2026-01-07 06:53:09.690864+00	\N	\N	\N	f	\N	\N	0	1	t	f	1
6	user-center	UserCenter	/system/user-center	menus.system.userCenter	ri:user-line	f	\N	t	t	\N	f	t	f	2026-01-07 07:20:40.477837+00	\N	\N	\N	f	\N	\N	0	3	t	f	1
7	menu	Menus	/system/menu	menus.system.menu	ri:menu-line	f		f	f		f	t	f	2026-01-07 07:21:53.540874+00	\N	2026-02-07 07:54:25.944+00	\N	f	\N		2	3	t	f	1
8	dept	Dept	/system/dept	menus.system.dept	material-symbols:groups-2-outline	f		f	f		f	t	f	2026-01-07 07:22:10.052595+00	\N	2026-02-07 07:54:30.697+00	\N	f	\N		3	3	t	f	1
20	loginLog	LoginLog	/system/log/loginlog	menus.system.loginLog	ri:login-circle-line	f		f	f		f	t	f	2026-01-31 08:40:46.820945+00	\N	\N	\N	f	\N		0	19	t	f	1
21	operLog	OperLog	/system/log/operlog	menus.system.operLog	ri:settings-3-line	f		f	f		f	t	f	2026-01-31 08:41:30.611732+00	\N	\N	\N	f	\N		0	19	t	f	1
9	dict	Dict	/system/dict	menus.system.dict	material-symbols:book-2-outline	f		f	f		f	t	f	2026-01-07 07:22:25.225276+00	\N	2026-02-07 07:54:36.764+00	\N	f	\N		4	3	t	f	1
10	api	Api	/system/api	menus.system.api	tabler:api	f		f	f		f	t	f	2026-01-07 07:22:39.036648+00	\N	2026-02-07 07:54:44.057+00	\N	f	\N		5	3	t	f	1
18	blacklist	Blacklist	/system/blacklist	menus.system.blacklist	material-symbols:block-outline	f		f	f		f	t	f	2026-01-24 05:35:39.52242+00	\N	2026-02-07 07:54:50.803+00	\N	f	\N		6	3	t	f	1
3	/system	System	/index/index	menus.system.title	ri:user-3-line	f		f	f		f	t	f	2026-01-07 06:57:44.645285+00	\N	2026-02-11 07:00:27.571+00	\N	f	\N		1	0	t	f	1
22	/monitor	Monitor	/index/index	menus.monitor.title	material-symbols:screenshot-monitor-outline	f		f	f		f	t	f	2026-02-07 06:54:25.075336+00	\N	2026-02-11 07:00:34.323+00	\N	f	\N		2	0	t	f	1
27	storage	Storage	/system/storage	menus.system.storage	material-symbols:folder-data-outline	f		f	f		f	t	f	2026-02-11 08:47:49.316326+00	\N	2026-02-11 08:52:33.669+00	\N	f	\N		7	3	t	f	1
28	cache	Cache	/monitor/cache	menus.monitor.cache	devicon-plain:redis	f		f	f		f	f	f	2026-03-03 01:33:32.38431+00	\N	\N	\N	f	\N		0	22	t	f	1
4	user	User	/system/user	menus.system.user	ri:user-line	f		f	f		f	t	f	2026-01-07 07:03:52.388903+00	\N	2026-02-07 07:19:41.863+00	\N	f	\N		0	3	t	f	1
23	online	Online	/monitor/online	menus.monitor.online	majesticons:status-online	f		f	f		f	t	f	2026-02-07 07:27:32.894399+00	\N	2026-02-07 07:29:04.073+00	\N	f	\N		1	22	t	f	1
24	job	Job	/monitor/job	menus.monitor.job	material-symbols:emoji-food-beverage-outline	f		f	f		f	t	f	2026-02-07 07:43:57.396393+00	\N	\N	\N	f	\N		2	22	t	f	1
5	role	Role	/system/role	menus.system.role	ri:user-settings-line	f		f	f		f	t	f	2026-01-07 07:05:15.131251+00	\N	2026-02-07 07:54:13.275+00	\N	f	\N		1	3	t	f	1
26	/outside/iframe/openapi	OpenApi		menus.outside.openapi	akar-icons:graphql-fill	f		f	f	http://localhost:3000/api/openapi	t	t	f	2026-02-11 06:55:41.405065+00	\N	2026-03-30 02:53:22.697+00	1	f	\N		4	0	t	f	1
29	/business	Business	/index/index	menus.business.title	ic:baseline-payment	f		f	f		f	t	f	2026-03-30 02:56:03.153104+00	1	2026-03-30 03:24:37.636+00	1	f	\N		3	0	t	f	1
30	merchant	Merchant	/business/merchant	menus.business.merchant	material-symbols:lock-person-outline	f		f	f		f	t	f	2026-03-30 02:57:41.733813+00	1	2026-03-30 03:25:52.057+00	1	f	\N		0	29	t	f	1
31	orders	Orders	/business/orders	menus.business.orders	material-symbols:orders-outline	f		f	f		f	t	f	2026-03-30 02:58:17.068076+00	1	2026-03-30 03:29:38.503+00	1	f	\N		1	29	t	f	1
34	/outside/iframe/bullmq	Bullmq		menus.monitor.bullmq	mdi:bullseye-arrow	f		f	f	http://localhost:3000/api/bullmq	t	t	f	2026-04-14 02:04:15.316618+00	1	2026-04-14 02:05:31.267+00	1	f	\N		3	22	t	f	1
19	log	Log		menus.system.log	ri:file-list-3-line	f		f	f		f	t	f	2026-01-31 08:39:40.82449+00	\N	2026-04-14 02:13:20.475+00	1	f	\N		9	3	t	f	1
36	payDebug	PayDebug	/business/payDebug	menus.business.payDebug	ri:wallet-3-line	f		f	f		f	t	f	2026-05-13 06:35:13.663875+00	1	\N	\N	f	\N		2	29	t	f	1
37	tenant	Tenant	/system/tenant	menus.system.tenant	ri:building-line	f		f	f		f	t	f	2026-05-18 18:00:00+00	1	\N	\N	f	\N		8	3	t	f	1
39	metadata	Metadata	/system/metadata/collection	元数据管理	ri:database-2-line	f	\N	f	f	\N	f	t	f	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	\N	10	3	t	f	1
40	collection	MetadataCollection	/system/metadata/collection	数据表管理	ri:table-line	f	\N	f	f	\N	f	t	f	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	\N	0	39	t	f	1
\.


--
-- Data for Name: system_menu_btn; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_menu_btn (menu_id, sort, title, permission, create_time, create_by, update_time, update_by, del_flag, remark, btn_id, status, tenant_id) FROM stdin;
7	0	编辑	system:menu:update	2026-01-10 06:00:05.075948+00	\N	\N	\N	f	\N	2	t	1
7	0	删除	system:menu:delete	2026-01-10 06:00:44.132664+00	\N	\N	\N	f	\N	3	t	1
7	0	查询	system:menu:query	2026-01-10 06:02:04.390263+00	\N	\N	\N	f	\N	5	t	1
7	1	新增	system:menu:create	2026-01-10 05:59:43.793701+00	\N	2026-01-10 08:23:43.01+00	\N	f	\N	1	t	1
8	0	新增	system:dept:create	2026-01-10 08:37:59.572615+00	\N	\N	\N	f	\N	9	t	1
8	0	删除	system:dept:delete	2026-01-10 08:38:57.597483+00	\N	\N	\N	f	\N	10	t	1
8	0	更新	system:dept:update	2026-01-10 08:39:12.67185+00	\N	\N	\N	f	\N	11	t	1
8	0	查询	system:dept:query	2026-01-10 08:39:27.121017+00	\N	\N	\N	f	\N	12	t	1
10	0	查询	system:api:query	2026-01-10 08:40:18.466495+00	\N	\N	\N	f	\N	14	t	1
10	0	更新	system:api:update	2026-01-10 08:40:34.207498+00	\N	\N	\N	f	\N	15	t	1
10	0	删除	system:api:delete	2026-01-10 08:40:45.232152+00	\N	\N	\N	f	\N	16	t	1
9	0	新增类型	system:dict:type:create	2026-01-10 08:41:15.252098+00	\N	\N	\N	f	\N	17	t	1
9	0	新增数据	system:dict:data:create	2026-01-10 08:41:36.205116+00	\N	\N	\N	f	\N	18	t	1
9	0	查询类型	system:dict:type:query	2026-01-10 08:41:53.691176+00	\N	2026-01-10 08:42:42.47+00	\N	f	\N	19	t	1
9	0	查询数据	system:dict:data:query	2026-01-10 08:41:53.691176+00	\N	2026-01-10 08:42:42.47+00	\N	f	\N	20	t	1
9	0	更新类型	system:dict:type:update	2026-01-10 08:45:27.870497+00	\N	\N	\N	f	\N	21	t	1
9	0	更新数据	system:dict:data:update	2026-01-10 08:45:45.848287+00	\N	\N	\N	f	\N	22	t	1
9	0	删除类型	system:dict:type:delete	2026-01-10 08:46:09.840199+00	\N	\N	\N	f	\N	23	t	1
9	0	删除数据	system:dict:data:delete	2026-01-10 08:46:22.050204+00	\N	\N	\N	f	\N	24	t	1
10	0	新增	system:api:create	2026-01-10 08:40:02.457593+00	\N	2026-01-10 08:47:05.708+00	\N	f	\N	13	t	1
4	0	新增	system:user:create	2026-01-31 08:25:15.877116+00	\N	\N	\N	f	\N	25	t	1
4	0	查询	system:user:query	2026-01-31 08:25:34.533779+00	\N	\N	\N	f	\N	26	t	1
4	0	编辑	system:user:update	2026-01-31 08:25:46.97912+00	\N	\N	\N	f	\N	27	t	1
4	0	删除	system:user:delete	2026-01-31 08:25:59.978634+00	\N	\N	\N	f	\N	28	t	1
5	0	新增	system:role:create	2026-01-31 08:26:58.242896+00	\N	\N	\N	f	\N	29	t	1
5	0	查询	system:role:query	2026-01-31 08:27:15.553667+00	\N	\N	\N	f	\N	30	t	1
5	0	编辑	system:role:update	2026-01-31 08:27:28.725263+00	\N	\N	\N	f	\N	31	t	1
5	0	删除	system:role:delete	2026-01-31 08:27:47.884927+00	\N	\N	\N	f	\N	32	t	1
18	0	新增	system:ip-black:create	2026-01-31 08:31:53.257359+00	\N	\N	\N	f	\N	33	t	1
18	0	查询	system:ip-black:query	2026-01-31 08:32:10.402536+00	\N	\N	\N	f	\N	34	t	1
18	0	编辑	system:ip-black:update	2026-01-31 08:32:24.058834+00	\N	\N	\N	f	\N	35	t	1
18	0	删除	system:ip-black:delete	2026-01-31 08:32:37.241391+00	\N	\N	\N	f	\N	36	t	1
20	0	查询	system:login-log:query	2026-01-31 08:42:39.4695+00	\N	\N	\N	f	\N	37	t	1
20	0	删除	system:login-log:delete	2026-01-31 08:42:56.434237+00	\N	\N	\N	f	\N	38	t	1
21	0	查询	system:oper-log:query	2026-01-31 08:43:23.224565+00	\N	\N	\N	f	\N	39	t	1
21	0	删除	system:oper-log:delete	2026-01-31 08:43:40.619376+00	\N	\N	\N	f	\N	40	t	1
23	0	查询	monitor:online:query	2026-02-09 06:59:11.207295+00	\N	\N	\N	f	\N	41	t	1
23	0	强退	monitor:online:forceLogout	2026-02-09 06:59:35.503879+00	\N	\N	\N	f	\N	42	t	1
24	0	新增	monitor:job:create	2026-02-11 05:48:22.486126+00	\N	\N	\N	f	\N	43	t	1
24	0	查询	monitor:job:query	2026-02-11 05:48:34.775951+00	\N	\N	\N	f	\N	44	t	1
24	0	编辑	monitor:job:update	2026-02-11 05:48:46.819656+00	\N	\N	\N	f	\N	45	t	1
24	0	删除	monitor:job:delete	2026-02-11 05:48:56.613909+00	\N	\N	\N	f	\N	46	t	1
27	0	新增	system:storage:create	2026-02-11 08:53:02.046018+00	\N	\N	\N	f	\N	47	t	1
27	0	查询	system:storage:query	2026-02-11 08:53:17.118081+00	\N	\N	\N	f	\N	48	t	1
27	0	编辑	system:storage:update	2026-02-11 08:53:31.450493+00	\N	\N	\N	f	\N	49	t	1
27	0	删除	system:storage:delete	2026-02-11 08:53:45.693872+00	\N	\N	\N	f	\N	50	t	1
28	0	查询	monitor:cache:query	2026-03-03 01:35:55.431547+00	\N	\N	\N	f	\N	51	t	1
28	0	编辑	monitor:cache:update	2026-03-03 01:36:10.389632+00	\N	\N	\N	f	\N	52	t	1
28	0	删除	monitor:cache:delete	2026-03-03 01:36:27.703191+00	\N	\N	\N	f	\N	53	t	1
30	0	新增	business:merchant:create	2026-03-31 01:28:29.717474+00	1	\N	\N	f	\N	54	t	1
30	0	查询	business:merchant:query	2026-03-31 01:28:47.817944+00	1	\N	\N	f	\N	55	t	1
30	0	删除	business:merchant:delete	2026-03-31 01:29:16.295828+00	1	\N	\N	f	\N	57	t	1
30	0	编辑	business:merchant:update	2026-03-31 01:29:04.494807+00	1	2026-03-31 01:29:23.831+00	1	f	\N	56	t	1
31	0	查询	business:orders:query	2026-04-01 01:19:23.595395+00	1	\N	\N	f	\N	58	t	1
31	0	更新	business:orders:update	2026-04-01 01:19:40.919376+00	1	\N	\N	f	\N	59	t	1
37	0	新增	system:tenant:create	2026-05-18 18:00:00+00	1	\N	\N	f	\N	61	t	1
37	0	查询	system:tenant:query	2026-05-18 18:00:00+00	1	\N	\N	f	\N	62	t	1
37	0	编辑	system:tenant:update	2026-05-18 18:00:00+00	1	\N	\N	f	\N	63	t	1
37	0	删除	system:tenant:delete	2026-05-18 18:00:00+00	1	\N	\N	f	\N	64	t	1
39	0	新增	system:metadata:collection:create	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	69	t	1
39	0	查询	system:metadata:collection:query	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	70	t	1
39	0	编辑	system:metadata:collection:update	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	71	t	1
39	0	删除	system:metadata:collection:delete	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	72	t	1
40	0	新增	system:metadata:field:create	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	73	t	1
40	0	查询	system:metadata:field:query	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	74	t	1
40	0	编辑	system:metadata:field:update	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	75	t	1
40	0	删除	system:metadata:field:delete	2026-05-22 05:06:49.394837+00	\N	\N	\N	f	\N	76	t	1
\.


--
-- Data for Name: system_oper_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_oper_log (oper_id, title, request_method, operator_type, user_id, oper_url, oper_ip, oper_location, oper_param, json_result, cost_time, status, create_time, create_by, update_time, update_by, del_flag, remark, action, oper_name, tenant_id) FROM stdin;
\.


--
-- Data for Name: system_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_role (role_id, role_name, role_code, sort, status, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
1	超级管理员	SYS_ADMIN	0	t	2026-01-06 09:26:09.913+00	\N	2026-01-26 07:47:22.124+00	\N	f	拥有所有权限	1
2	普通用户	SYS_USER	1	t	2026-01-26 07:49:34.217+00	\N	2026-01-26 07:51:24.879+00	\N	f	拥有普通用户权限	1
3	财务	SYS_FINANCE	2	t	2026-01-26 07:58:12.195+00	\N	2026-01-26 07:58:22.786+00	\N	f	拥有财务权限	1
\.


--
-- Data for Name: system_role_menu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_role_menu (role_id, menu_id, menu_btn_id) FROM stdin;
2	1	\N
2	2	\N
1	1	\N
1	2	\N
1	3	\N
1	4	\N
1	4	25
1	4	26
1	4	27
1	4	28
1	6	\N
1	5	\N
1	5	29
1	5	30
1	5	31
1	5	32
1	7	\N
1	7	2
1	7	3
1	7	5
1	7	1
1	8	\N
1	8	9
1	8	10
1	8	11
1	8	12
1	9	\N
1	9	17
1	9	18
1	9	19
1	9	20
1	9	21
1	9	22
1	9	23
1	9	24
1	10	\N
1	10	14
1	10	15
1	10	16
1	10	13
1	18	\N
1	18	33
1	18	34
1	18	35
1	18	36
1	27	\N
1	27	47
1	27	48
1	27	49
1	27	50
1	19	\N
1	20	\N
1	20	37
1	20	38
1	21	\N
1	21	39
1	21	40
1	22	\N
1	28	\N
1	28	51
1	28	52
1	28	53
1	23	\N
1	23	41
1	23	42
1	24	\N
1	24	43
1	24	44
1	24	45
1	24	46
1	34	\N
1	29	\N
1	30	\N
1	30	54
1	30	55
1	30	57
1	30	56
1	31	\N
1	31	58
1	31	59
1	37	\N
1	37	61
1	37	62
1	37	63
1	37	64
1	36	\N
1	26	\N
1	39	\N
1	40	\N
1	39	69
1	39	70
1	39	71
1	39	72
1	40	73
1	40	74
1	40	75
1	40	76
\.


--
-- Data for Name: system_storage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_storage (storage_id, name, endpoint, bucket, access_key, secret_key, status, create_time, create_by, update_time, update_by, del_flag, remark, region, tenant_id) FROM stdin;
3	OSS	\N	\N	\N	\N	f	2026-02-11 09:02:14.601+00	\N	2026-02-11 09:19:00.464+00	\N	f	阿里云	\N	1
4	Kodo	\N	\N	\N	\N	f	2026-02-11 09:02:30.982+00	\N	2026-02-11 09:19:00.937+00	\N	f	七牛云	\N	1
2	COS					f	2026-02-11 09:01:42.312+00	\N	\N	\N	f	腾讯云	ap-shanghai	1
1	RustFS	192.168.2.22:9000	public	rustfsadmin	rustfsadmin	t	2026-02-11 09:01:32.285+00	\N	\N	\N	f	该方案为本地文件服务，使用RustFS。前端拿到预签名url，需要在Header中传递Content-Type值，否则文件会直接下载无法预览。	us-east-1	1
\.


--
-- Data for Name: system_tenant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_tenant (tenant_id, tenant_name, tenant_code, contact_name, contact_phone, status, expire_time, config, create_time, update_time, del_flag, remark) FROM stdin;
1	IntellecXplore	default	系统管理员	\N	t	\N	{}	2026-05-18 15:55:03.838765+00	\N	f	\N
2	海联刀具	hl	冯总	13071881952	t	\N	{}	2026-05-21 15:28:15.361792+00	\N	t	海联刀具
\.


--
-- Data for Name: system_user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."system_user" (user_id, username, password, nickname, email, phone, sex, avatar, create_time, create_by, update_time, update_by, del_flag, remark, status, dept_id, tenant_id) FROM stdin;
13	xiaomei	$2b$10$ZVclyurmYrDZqiZE.L2/H.PCKgTENOM9u0Hh2zNv/QjvtnMrNgxhy	罗德风	2652365944@qq.com	\N	0	\N	2025-12-16 02:36:49.177028+00	\N	\N	\N	f	\N	t	\N	1
20	admin123	$2b$10$a5yygkWI2t3HZxGDqP3Ifej15jK/OyZ6eC4iL.c4x/QpmrLfeEbOa	老妖	423235235@qq.com	19890987675	1	\N	2026-02-04 06:39:33.443815+00	\N	\N	\N	f	\N	t	1	1
14	qiaozhi	$2b$10$6OiXvq9fYO.WS214b3m79e0UC4yk9cCftFUc4AKKBW/EcGuXxKwRu	乔治	43242@qq.com	19898767656	1	\N	2026-02-03 06:19:16.744+00	\N	\N	\N	f	\N	t	8	1
1	admin	$2b$10$YfJS21FBqTmpM4pc8I0j.uXX5rnhEiDM76Bm4u2h0mLzStfdFXgTi	梅山老妖	1360658549@qq.com	19899999999	0		2025-12-12 08:41:41.858+00	\N	2026-02-06 03:34:28.268+00	1765869150583	f	专注于用户体验跟视觉设计	t	4	1
\.


--
-- Data for Name: system_user_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_user_role (role_id, user_id) FROM stdin;
3	20
2	20
2	14
3	14
1	1
2	1
3	1
\.


--
-- Data for Name: system_user_tenant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_user_tenant (user_tenant_id, user_id, tenant_id, is_default) FROM stdin;
3	20	1	1
4	14	1	1
5	1	1	1
6	21	1	1
8	13	1	1
\.


--
-- Data for Name: t_test; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.t_test (id, create_time, create_by, update_time, update_by, del_flag, remark, age, male, name, tenant_id) FROM stdin;
\.


--
-- Data for Name: tool_sku; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tool_sku (id, create_time, create_by, update_time, update_by, del_flag, remark, coating, description, material, sku_code, specification, standard_price, status, tool_category, tool_name, tool_type, unit, tenant_id) FROM stdin;
\.


--
-- Data for Name: workflow_definition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workflow_definition (id, name, description, version, status, definition, is_template, create_time, create_by, update_time, update_by, del_flag, remark, tenant_id) FROM stdin;
1	system-info-report	获取系统信息并保存到数据库	1	published	"{\\"id\\":\\"system-info-report\\",\\"name\\":\\"系统信息日报\\",\\"version\\":1,\\"steps\\":[{\\"id\\":\\"get-info\\",\\"type\\":\\"tool\\",\\"name\\":\\"获取系统信息\\",\\"tool\\":\\"get_system_info\\",\\"input\\":{},\\"outputKey\\":\\"systemInfo\\"},{\\"id\\":\\"get-time\\",\\"type\\":\\"tool\\",\\"name\\":\\"获取当前时间\\",\\"tool\\":\\"get_current_time\\",\\"input\\":{\\"timezone\\":\\"Asia/Shanghai\\"},\\"outputKey\\":\\"currentTime\\"},{\\"id\\":\\"summarize\\",\\"type\\":\\"llm\\",\\"name\\":\\"生成摘要\\",\\"model\\":\\"deepseek-chat\\",\\"systemPrompt\\":\\"你是一个系统管理员助手，根据系统信息和时间生成简短摘要。\\",\\"userPrompt\\":\\"系统信息: {{step.get-info.output}}\\\\n当前时间: {{step.get-time.output}}\\\\n请用中文生成一段简短的系统状态摘要。\\",\\"temperature\\":0.5,\\"outputKey\\":\\"summary\\"}],\\"retryPolicy\\":{\\"maxAttempts\\":3,\\"initialDelayMs\\":1000,\\"backoffMultiplier\\":2,\\"maxDelayMs\\":60000},\\"timeoutMs\\":120000}"	f	2026-05-18 14:34:49.364469+00	\N	\N	\N	f	\N	1
2	time-greeting	根据当前时间生成不同的问候语	1	published	"{\\"id\\":\\"time-greeting\\",\\"name\\":\\"时段问候\\",\\"version\\":1,\\"steps\\":[{\\"id\\":\\"get-time\\",\\"type\\":\\"tool\\",\\"name\\":\\"获取时间\\",\\"tool\\":\\"get_current_time\\",\\"input\\":{},\\"outputKey\\":\\"time\\"},{\\"id\\":\\"check-hour\\",\\"type\\":\\"conditional\\",\\"name\\":\\"判断时段\\",\\"branches\\":[{\\"label\\":\\"morning\\",\\"condition\\":{\\"lt\\":[\\"step.get-time.output.hour\\",12]},\\"steps\\":[{\\"id\\":\\"morning-greet\\",\\"type\\":\\"llm\\",\\"name\\":\\"早安问候\\",\\"systemPrompt\\":\\"你是一个友好的助手。\\",\\"userPrompt\\":\\"当前时间: {{step.get-time.output}}，请生成早安问候。\\",\\"outputKey\\":\\"greeting\\"}]},{\\"label\\":\\"afternoon\\",\\"condition\\":{\\"lt\\":[\\"step.get-time.output.hour\\",18]},\\"steps\\":[{\\"id\\":\\"afternoon-greet\\",\\"type\\":\\"llm\\",\\"name\\":\\"下午问候\\",\\"systemPrompt\\":\\"你是一个友好的助手。\\",\\"userPrompt\\":\\"当前时间: {{step.get-time.output}}，请生成下午问候。\\",\\"outputKey\\":\\"greeting\\"}]}],\\"defaultBranch\\":[{\\"id\\":\\"evening-greet\\",\\"type\\":\\"llm\\",\\"name\\":\\"晚安问候\\",\\"systemPrompt\\":\\"你是一个友好的助手。\\",\\"userPrompt\\":\\"当前时间: {{step.get-time.output}}，请生成晚安问候。\\",\\"outputKey\\":\\"greeting\\"}]}]}"	f	2026-05-18 14:34:49.367333+00	\N	\N	\N	f	\N	1
3	create-collection-flow	一键创建元数据表：创建→添加字段→发布→部署	1	draft	"{\\"id\\":\\"create-collection-flow\\",\\"name\\":\\"创建元数据表流程\\",\\"version\\":1,\\"steps\\":[{\\"id\\":\\"create\\",\\"type\\":\\"tool\\",\\"name\\":\\"创建元数据表\\",\\"tool\\":\\"create_collection\\",\\"input\\":{\\"tableName\\":\\"{{input.tableName}}\\",\\"label\\":\\"{{input.label}}\\",\\"description\\":\\"{{input.description || \\\\\\"通过工作流自动创建\\\\\\"}}\\"},\\"outputKey\\":\\"collection\\"},{\\"id\\":\\"add-fields\\",\\"type\\":\\"tool\\",\\"name\\":\\"添加字段\\",\\"tool\\":\\"add_fields_to_collection\\",\\"input\\":{\\"collectionId\\":\\"{{step.create.output.created.id}}\\",\\"fields\\":\\"{{input.fields}}\\"}},{\\"id\\":\\"publish\\",\\"type\\":\\"tool\\",\\"name\\":\\"发布建表\\",\\"tool\\":\\"publish_collection\\",\\"input\\":{\\"collectionId\\":\\"{{step.create.output.created.id}}\\"}},{\\"id\\":\\"deploy\\",\\"type\\":\\"tool\\",\\"name\\":\\"部署上线\\",\\"tool\\":\\"deploy_collection\\",\\"input\\":{\\"collectionId\\":\\"{{step.create.output.created.id}}\\"},\\"retryPolicy\\":{\\"maxAttempts\\":2,\\"initialDelayMs\\":2000,\\"backoffMultiplier\\":1,\\"maxDelayMs\\":10000}}],\\"inputSchema\\":{\\"type\\":\\"object\\",\\"properties\\":{\\"tableName\\":{\\"type\\":\\"string\\",\\"description\\":\\"英文表名\\"},\\"label\\":{\\"type\\":\\"string\\",\\"description\\":\\"中文标签\\"},\\"description\\":{\\"type\\":\\"string\\"},\\"fields\\":{\\"type\\":\\"array\\",\\"description\\":\\"字段定义数组\\"}},\\"required\\":[\\"tableName\\",\\"label\\",\\"fields\\"]}}"	t	2026-05-18 14:34:49.371422+00	\N	\N	\N	f	\N	1
\.


--
-- Data for Name: workflow_instance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workflow_instance (id, definition_id, definition_version, workflow_name, status, input, output, context, current_step_id, completed_steps, error_message, error_step_id, retry_count, max_retries, scheduled_at, started_at, completed_at, timeout_at, trigger_type, triggered_by, user_id, agent_id, tags, metadata, created_at, updated_at, tenant_id) FROM stdin;
\.


--
-- Data for Name: workflow_step_execution; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.workflow_step_execution (id, instance_id, step_id, step_type, step_name, status, input, output, error_message, attempt, started_at, completed_at, duration_ms, token_usage, model_used, llm_messages, created_at, tenant_id) FROM stdin;
\.


--
-- Name: business_merchant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.business_merchant_id_seq', 8, true);


--
-- Name: business_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.business_orders_id_seq', 58, true);


--
-- Name: business_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.business_payments_id_seq', 42, true);


--
-- Name: business_refund_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.business_refund_id_seq', 1, false);


--
-- Name: customer_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_info_id_seq', 1, true);


--
-- Name: merchant_payment_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.merchant_payment_configs_id_seq', 4, true);


--
-- Name: metadata_collections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metadata_collections_id_seq', 37, true);


--
-- Name: metadata_database_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metadata_database_configs_id_seq', 1, true);


--
-- Name: metadata_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metadata_fields_id_seq', 44, true);


--
-- Name: metadata_indexes_index_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metadata_indexes_index_id_seq', 1, false);


--
-- Name: metadata_relations_relation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metadata_relations_relation_id_seq', 3, true);


--
-- Name: monitor_job_job_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.monitor_job_job_id_seq', 8, true);


--
-- Name: system_agent_config_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_agent_config_config_id_seq', 1, true);


--
-- Name: system_api_api_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_api_api_id_seq', 440, true);


--
-- Name: system_dept_dept_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_dept_dept_id_seq', 9, true);


--
-- Name: system_dict_data_dict_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_dict_data_dict_code_seq', 32, true);


--
-- Name: system_dict_type_dict_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_dict_type_dict_id_seq', 10, true);


--
-- Name: system_ip_black_ip_black_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_ip_black_ip_black_id_seq', 6, true);


--
-- Name: system_login_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_login_log_log_id_seq', 214, true);


--
-- Name: system_menu_btn_btn_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_menu_btn_btn_id_seq', 68, true);


--
-- Name: system_menu_menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_menu_menu_id_seq', 38, true);


--
-- Name: system_oper_log_oper_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_oper_log_oper_id_seq', 347, true);


--
-- Name: system_role_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_role_role_id_seq', 6, true);


--
-- Name: system_storage_storage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_storage_storage_id_seq', 4, true);


--
-- Name: system_tenant_tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_tenant_tenant_id_seq', 2, true);


--
-- Name: system_user_tenant_user_tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_user_tenant_user_tenant_id_seq', 8, true);


--
-- Name: system_user_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_user_user_id_seq', 20, true);


--
-- Name: t_test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.t_test_id_seq', 1, false);


--
-- Name: tool_sku_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tool_sku_id_seq', 1, false);


--
-- Name: workflow_definition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workflow_definition_id_seq', 3, true);


--
-- Name: workflow_instance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workflow_instance_id_seq', 1, false);


--
-- Name: workflow_step_execution_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.workflow_step_execution_id_seq', 1, false);


--
-- Name: business_merchant business_merchant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_merchant
    ADD CONSTRAINT business_merchant_pkey PRIMARY KEY (id);


--
-- Name: business_orders business_orders_order_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_orders
    ADD CONSTRAINT business_orders_order_no_unique UNIQUE (order_no);


--
-- Name: business_orders business_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_orders
    ADD CONSTRAINT business_orders_pkey PRIMARY KEY (id);


--
-- Name: business_payments business_payments_order_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_payments
    ADD CONSTRAINT business_payments_order_no_unique UNIQUE (order_no);


--
-- Name: business_payments business_payments_payment_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_payments
    ADD CONSTRAINT business_payments_payment_no_unique UNIQUE (payment_no);


--
-- Name: business_payments business_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_payments
    ADD CONSTRAINT business_payments_pkey PRIMARY KEY (id);


--
-- Name: business_refund business_refund_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_refund
    ADD CONSTRAINT business_refund_pkey PRIMARY KEY (id);


--
-- Name: business_refund business_refund_refund_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_refund
    ADD CONSTRAINT business_refund_refund_no_unique UNIQUE (refund_no);


--
-- Name: customer_info customer_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_info
    ADD CONSTRAINT customer_info_pkey PRIMARY KEY (id);


--
-- Name: business_merchant_configs merchant_payment_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_merchant_configs
    ADD CONSTRAINT merchant_payment_configs_pkey PRIMARY KEY (id);


--
-- Name: metadata_collections metadata_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_collections
    ADD CONSTRAINT metadata_collections_pkey PRIMARY KEY (id);


--
-- Name: metadata_collections metadata_collections_table_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_collections
    ADD CONSTRAINT metadata_collections_table_name_unique UNIQUE (table_name);


--
-- Name: metadata_database_configs metadata_database_configs_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_database_configs
    ADD CONSTRAINT metadata_database_configs_name_unique UNIQUE (name);


--
-- Name: metadata_database_configs metadata_database_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_database_configs
    ADD CONSTRAINT metadata_database_configs_pkey PRIMARY KEY (id);


--
-- Name: metadata_fields metadata_fields_collection_id_column_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_fields
    ADD CONSTRAINT metadata_fields_collection_id_column_name_unique UNIQUE (collection_id, column_name);


--
-- Name: metadata_fields metadata_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_fields
    ADD CONSTRAINT metadata_fields_pkey PRIMARY KEY (id);


--
-- Name: metadata_indexes metadata_indexes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_indexes
    ADD CONSTRAINT metadata_indexes_pkey PRIMARY KEY (index_id);


--
-- Name: metadata_relations metadata_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_relations
    ADD CONSTRAINT metadata_relations_pkey PRIMARY KEY (relation_id);


--
-- Name: monitor_job monitor_job_job_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monitor_job
    ADD CONSTRAINT monitor_job_job_name_unique UNIQUE (job_name);


--
-- Name: monitor_job monitor_job_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monitor_job
    ADD CONSTRAINT monitor_job_pkey PRIMARY KEY (job_id);


--
-- Name: system_agent_config system_agent_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_agent_config
    ADD CONSTRAINT system_agent_config_pkey PRIMARY KEY (config_id);


--
-- Name: system_agent_config system_agent_config_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_agent_config
    ADD CONSTRAINT system_agent_config_user_id_key UNIQUE (user_id);


--
-- Name: system_api system_api_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_api
    ADD CONSTRAINT system_api_pkey PRIMARY KEY (api_id);


--
-- Name: system_dept system_dept_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_dept
    ADD CONSTRAINT system_dept_pkey PRIMARY KEY (dept_id);


--
-- Name: system_dict_data system_dict_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_dict_data
    ADD CONSTRAINT system_dict_data_pkey PRIMARY KEY (dict_code);


--
-- Name: system_dict_type system_dict_type_dict_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_dict_type
    ADD CONSTRAINT system_dict_type_dict_name_unique UNIQUE (dict_name);


--
-- Name: system_dict_type system_dict_type_dict_type_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_dict_type
    ADD CONSTRAINT system_dict_type_dict_type_unique UNIQUE (dict_type);


--
-- Name: system_dict_type system_dict_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_dict_type
    ADD CONSTRAINT system_dict_type_pkey PRIMARY KEY (dict_id);


--
-- Name: system_ip_black system_ip_black_ip_address_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_ip_black
    ADD CONSTRAINT system_ip_black_ip_address_unique UNIQUE (ip_address);


--
-- Name: system_ip_black system_ip_black_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_ip_black
    ADD CONSTRAINT system_ip_black_pkey PRIMARY KEY (ip_black_id);


--
-- Name: system_login_log system_login_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_login_log
    ADD CONSTRAINT system_login_log_pkey PRIMARY KEY (log_id);


--
-- Name: system_menu_btn system_menu_btn_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_menu_btn
    ADD CONSTRAINT system_menu_btn_pkey PRIMARY KEY (btn_id);


--
-- Name: system_menu system_menu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_menu
    ADD CONSTRAINT system_menu_pkey PRIMARY KEY (menu_id);


--
-- Name: system_oper_log system_oper_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_oper_log
    ADD CONSTRAINT system_oper_log_pkey PRIMARY KEY (oper_id);


--
-- Name: system_role system_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_role
    ADD CONSTRAINT system_role_pkey PRIMARY KEY (role_id);


--
-- Name: system_storage system_storage_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_storage
    ADD CONSTRAINT system_storage_name_unique UNIQUE (name);


--
-- Name: system_storage system_storage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_storage
    ADD CONSTRAINT system_storage_pkey PRIMARY KEY (storage_id);


--
-- Name: system_tenant system_tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_tenant
    ADD CONSTRAINT system_tenant_pkey PRIMARY KEY (tenant_id);


--
-- Name: system_tenant system_tenant_tenant_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_tenant
    ADD CONSTRAINT system_tenant_tenant_code_unique UNIQUE (tenant_code);


--
-- Name: system_user system_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."system_user"
    ADD CONSTRAINT system_user_pkey PRIMARY KEY (user_id);


--
-- Name: system_user_tenant system_user_tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_user_tenant
    ADD CONSTRAINT system_user_tenant_pkey PRIMARY KEY (user_tenant_id);


--
-- Name: system_user system_user_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."system_user"
    ADD CONSTRAINT system_user_username_unique UNIQUE (username);


--
-- Name: t_test t_test_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_test
    ADD CONSTRAINT t_test_pkey PRIMARY KEY (id);


--
-- Name: tool_sku tool_sku_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_sku
    ADD CONSTRAINT tool_sku_pkey PRIMARY KEY (id);


--
-- Name: tool_sku tool_sku_sku_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tool_sku
    ADD CONSTRAINT tool_sku_sku_code_key UNIQUE (sku_code);


--
-- Name: system_user_tenant uq_user_tenant; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_user_tenant
    ADD CONSTRAINT uq_user_tenant UNIQUE (user_id, tenant_id);


--
-- Name: workflow_definition workflow_definition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_definition
    ADD CONSTRAINT workflow_definition_pkey PRIMARY KEY (id);


--
-- Name: workflow_instance workflow_instance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instance
    ADD CONSTRAINT workflow_instance_pkey PRIMARY KEY (id);


--
-- Name: workflow_step_execution workflow_step_execution_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_step_execution
    ADD CONSTRAINT workflow_step_execution_pkey PRIMARY KEY (id);


--
-- Name: idx_customer_info_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customer_info_phone ON public.customer_info USING btree (phone);


--
-- Name: idx_tool_sku_sku_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_sku_sku_code ON public.tool_sku USING btree (sku_code);


--
-- Name: idx_tool_sku_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_sku_status ON public.tool_sku USING btree (status);


--
-- Name: idx_tool_sku_tool_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_sku_tool_name ON public.tool_sku USING btree (tool_name);


--
-- Name: idx_tool_sku_tool_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tool_sku_tool_type ON public.tool_sku USING btree (tool_type);


--
-- Name: business_merchant_configs business_merchant_configs_merchant_id_business_merchant_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_merchant_configs
    ADD CONSTRAINT business_merchant_configs_merchant_id_business_merchant_id_fk FOREIGN KEY (merchant_id) REFERENCES public.business_merchant(id);


--
-- Name: business_orders business_orders_merchant_id_business_merchant_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_orders
    ADD CONSTRAINT business_orders_merchant_id_business_merchant_id_fk FOREIGN KEY (merchant_id) REFERENCES public.business_merchant(id);


--
-- Name: business_payments business_payments_merchant_config_id_business_merchant_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_payments
    ADD CONSTRAINT business_payments_merchant_config_id_business_merchant_id_fk FOREIGN KEY (merchant_config_id) REFERENCES public.business_merchant(id);


--
-- Name: business_payments business_payments_order_id_business_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_payments
    ADD CONSTRAINT business_payments_order_id_business_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.business_orders(id);


--
-- Name: business_payments business_payments_order_no_business_orders_order_no_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_payments
    ADD CONSTRAINT business_payments_order_no_business_orders_order_no_fk FOREIGN KEY (order_no) REFERENCES public.business_orders(order_no);


--
-- Name: business_refund business_refund_order_id_business_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_refund
    ADD CONSTRAINT business_refund_order_id_business_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.business_orders(id);


--
-- Name: business_refund business_refund_payment_id_business_payments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_refund
    ADD CONSTRAINT business_refund_payment_id_business_payments_id_fk FOREIGN KEY (payment_id) REFERENCES public.business_payments(id);


--
-- Name: system_user_tenant fk_sut_tenant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_user_tenant
    ADD CONSTRAINT fk_sut_tenant FOREIGN KEY (tenant_id) REFERENCES public.system_tenant(tenant_id);


--
-- Name: metadata_fields metadata_fields_collection_id_metadata_collections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_fields
    ADD CONSTRAINT metadata_fields_collection_id_metadata_collections_id_fk FOREIGN KEY (collection_id) REFERENCES public.metadata_collections(id) ON DELETE CASCADE;


--
-- Name: metadata_indexes metadata_indexes_collection_id_metadata_collections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_indexes
    ADD CONSTRAINT metadata_indexes_collection_id_metadata_collections_id_fk FOREIGN KEY (collection_id) REFERENCES public.metadata_collections(id) ON DELETE CASCADE;


--
-- Name: metadata_relations metadata_relations_source_collection_id_metadata_collections_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_relations
    ADD CONSTRAINT metadata_relations_source_collection_id_metadata_collections_id FOREIGN KEY (source_collection_id) REFERENCES public.metadata_collections(id) ON DELETE CASCADE;


--
-- Name: metadata_relations metadata_relations_target_collection_id_metadata_collections_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metadata_relations
    ADD CONSTRAINT metadata_relations_target_collection_id_metadata_collections_id FOREIGN KEY (target_collection_id) REFERENCES public.metadata_collections(id) ON DELETE CASCADE;


--
-- Name: system_menu_btn system_menu_btn_menu_id_system_menu_menu_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_menu_btn
    ADD CONSTRAINT system_menu_btn_menu_id_system_menu_menu_id_fk FOREIGN KEY (menu_id) REFERENCES public.system_menu(menu_id);


--
-- Name: system_role_menu system_role_menu_menu_btn_id_system_menu_btn_btn_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_role_menu
    ADD CONSTRAINT system_role_menu_menu_btn_id_system_menu_btn_btn_id_fk FOREIGN KEY (menu_btn_id) REFERENCES public.system_menu_btn(btn_id);


--
-- Name: system_role_menu system_role_menu_menu_id_system_menu_menu_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_role_menu
    ADD CONSTRAINT system_role_menu_menu_id_system_menu_menu_id_fk FOREIGN KEY (menu_id) REFERENCES public.system_menu(menu_id);


--
-- Name: system_role_menu system_role_menu_role_id_system_role_role_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_role_menu
    ADD CONSTRAINT system_role_menu_role_id_system_role_role_id_fk FOREIGN KEY (role_id) REFERENCES public.system_role(role_id);


--
-- Name: system_user system_user_dept_id_system_dept_dept_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."system_user"
    ADD CONSTRAINT system_user_dept_id_system_dept_dept_id_fk FOREIGN KEY (dept_id) REFERENCES public.system_dept(dept_id);


--
-- Name: system_user_role system_user_role_role_id_system_role_role_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_user_role
    ADD CONSTRAINT system_user_role_role_id_system_role_role_id_fk FOREIGN KEY (role_id) REFERENCES public.system_role(role_id);


--
-- Name: system_user_role system_user_role_user_id_system_user_user_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_user_role
    ADD CONSTRAINT system_user_role_user_id_system_user_user_id_fk FOREIGN KEY (user_id) REFERENCES public."system_user"(user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict fD6eWnY75puSOImzv6pU2Lp3Zpz40rvkouwVQrKo4yZ7wR1WLr58MbrVMcgrXtI

