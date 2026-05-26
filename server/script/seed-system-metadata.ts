import pg from '@/core/database/pg';
import { sql } from 'drizzle-orm';
import { logger } from '@/shared/logger';

/**
 * 将系统表注册为 metadata_collections + metadata_relations，
 * 供 Agent 通过 trace_relation_path 等工具发现系统表结构与关系。
 */
export async function seedSystemMetadata() {
    try {
        const existing = await pg.execute(sql`SELECT COUNT(*) as count FROM "metadata_collections" WHERE "namespace" = 'system'`);
        if (existing[0] && Number(existing[0].count) > 0) {
            logger.info('系统表元数据已存在，跳过 seed');
            return;
        }
    } catch {
        // 表可能不存在，继续尝试
    }

    logger.info('开始写入系统表元数据...');

    // ============ metadata_collections ============
    await pg.execute(sql`
        INSERT INTO "metadata_collections" ("table_name", "label", "description", "namespace", "database_type", "status", "ai")
        VALUES
        ('system_user',          '用户表',       '系统用户账号，存储管理员账户信息',                           'system', 'postgresql', 'system', '{"group":"用户体系","hint":"用户需要分配角色后才能获得菜单权限"}'::jsonb),
        ('system_role',          '角色表',       'RBAC 角色定义，角色包含菜单和按钮权限集合',                    'system', 'postgresql', 'system', '{"group":"权限体系","hint":"角色是菜单和按钮权限的载体，一个用户可有多个角色"}'::jsonb),
        ('system_user_role',     '用户角色关联表', '用户与角色的多对多关联',                                   'system', 'postgresql', 'system', '{"group":"权限体系","hint":"通过此表给用户分配角色"}'::jsonb),
        ('system_menu',          '菜单表',       '系统菜单/路由定义，支持多级树形结构',                         'system', 'postgresql', 'system', '{"group":"权限体系","hint":"创建菜单后需通过 system_role_menu 分配给角色才能被用户看到"}'::jsonb),
        ('system_menu_btn',      '菜单按钮表',    '菜单页面的操作按钮权限定义',                                'system', 'postgresql', 'system', '{"group":"权限体系","hint":"按钮权限绑定在菜单下，通过系统进行 RBAC 控制"}'::jsonb),
        ('system_role_menu',     '角色菜单关联表', '角色—菜单—按钮的权限绑定，存储角色被授予的菜单和按钮权限',      'system', 'postgresql', 'system', '{"group":"权限体系","hint":"给角色分配菜单时在此表插入记录；删除角色菜单授权时删除对应记录"}'::jsonb),
        ('system_dept',          '部门表',       '组织架构/部门树形结构',                                     'system', 'postgresql', 'system', '{"group":"用户体系","hint":"部门用于用户分组的树形组织"}'::jsonb),
        ('system_dict_type',     '字典类型表',    '字典分类，如 性别、状态 等',                                 'system', 'postgresql', 'system', '{"group":"字典","hint":"每个字典类型下包含多个字典数据项"}'::jsonb),
        ('system_dict_data',     '字典数据表',    '字典具体数据值',                                          'system', 'postgresql', 'system', '{"group":"字典","hint":"与 system_dict_type 通过 dict_type 字段关联"}'::jsonb),
        ('system_api',           'API端点表',    '系统 API 端点注册表，用于权限校验和熔断',                     'system', 'postgresql', 'system', '{"group":"系统","hint":"所有后端接口在此注册，用于权限判断和 API 熔断控制"}'::jsonb)
    `);

    // ============ metadata_relations ============
    // 先查回 collection ID
    const cols = await pg.execute(sql`SELECT "id", "table_name" FROM "metadata_collections" WHERE "namespace" = 'system'`);
    const idMap: Record<string, number> = {};
    for (const r of cols) {
        idMap[r.table_name as string] = Number(r.id);
    }

    const relations = [
        // 用户 → 用户角色关联
        { name: '用户→角色', type: 'many_to_many', src: 'system_user', tgt: 'system_role',
          srcKey: 'user_id', tgtKey: 'role_id',
          junction: { table: 'system_user_role', sourceKey: 'user_id', targetKey: 'role_id' },
          desc: '用户通过 system_user_role 关联角色，一个用户可有多个角色' },

        // 角色 → 角色菜单关联 → 菜单
        { name: '角色→菜单', type: 'many_to_many', src: 'system_role', tgt: 'system_menu',
          srcKey: 'role_id', tgtKey: 'menu_id',
          junction: { table: 'system_role_menu', sourceKey: 'role_id', targetKey: 'menu_id' },
          desc: '角色通过 system_role_menu 被授予菜单和按钮权限' },

        // 菜单 → 菜单按钮
        { name: '菜单→按钮', type: 'has_many', src: 'system_menu', tgt: 'system_menu_btn',
          srcKey: 'menu_id', tgtKey: 'menu_id',
          junction: null,
          desc: '一个菜单下可定义多个操作按钮（增删改查等），每个按钮有对应权限标识' },
    ];

    for (const rel of relations) {
        await pg.execute(sql`
            INSERT INTO "metadata_relations" ("name", "type", "source_collection_id", "target_collection_id",
                "source_field", "target_field", "junction_table", "cascade", "remark")
            VALUES (
                ${rel.name}, ${rel.type},
                ${idMap[rel.src]}, ${idMap[rel.tgt]},
                ${rel.srcKey}, ${rel.tgtKey},
                ${rel.junction ? JSON.stringify(rel.junction) : null}::jsonb,
                '{}'::jsonb,
                ${rel.desc}
            )
        `);
    }

    logger.success(`系统表元数据 seed 完成: ${Object.keys(idMap).length} 个表, ${relations.length} 条关系`);
}
