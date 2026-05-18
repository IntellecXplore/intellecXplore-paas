// Admin Agent 的工具名称列表
// 核心层按此列表从注册表动态加载工具
export const ADMIN_TOOL_NAMES = [
    // 系统工具
    'get_current_time',
    'get_system_info',

    // 查询工具
    'query_users',
    'list_menus',
    'query_dict_data',

    // 元数据表管理
    'list_collections',
    'get_collection_detail',
    'create_collection',
    'add_fields_to_collection',
    'publish_collection',
    'deploy_collection',

    // 动态数据 CRUD
    'query_collection_data',
    'insert_collection_data',
    'update_collection_data',
    'delete_collection_data',

    // Schema 遍历
    'trace_relation_path',

    // 权限与菜单
    'get_user_permissions',
    'create_menu',
    'get_dynamic_page_info',

    // 表管理
    'delete_collection',
];
