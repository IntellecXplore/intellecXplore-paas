import type { IRouteModule } from "@/types/route";
import { create, findList, findAll, findOne, update, remove, testConnection } from './handle';
import { CreateDto, UpdateDto, ListDto } from "./dto";

const MetadataDatabaseConfigModule: IRouteModule = {
    tags: '数据库配置管理',
    routes: [
        {
            url: '/system/metadata/database-config', method: 'post', summary: '创建数据库配置',
            dto: CreateDto, handle: create,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:database-config:create' },
        },
        {
            url: '/system/metadata/database-config/list', method: 'get', summary: '查询数据库配置列表',
            dto: ListDto, handle: findList,
            meta: { isAuth: true, permission: 'system:metadata:database-config:query' },
        },
        {
            url: '/system/metadata/database-config/all', method: 'get', summary: '查询全部启用的数据库配置（下拉选择用）',
            handle: findAll,
            meta: { isAuth: true, permission: 'system:metadata:database-config:query' },
        },
        {
            url: '/system/metadata/database-config/:id', method: 'get', summary: '查询数据库配置详情',
            handle: findOne,
            meta: { isAuth: true, permission: 'system:metadata:database-config:query' },
        },
        {
            url: '/system/metadata/database-config', method: 'put', summary: '更新数据库配置',
            dto: UpdateDto, handle: update,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:database-config:update' },
        },
        {
            url: '/system/metadata/database-config/:ids', method: 'delete', summary: '删除数据库配置',
            handle: remove,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:database-config:delete' },
        },
        {
            url: '/system/metadata/database-config/test-connection', method: 'post', summary: '测试数据库连接',
            handle: testConnection,
            meta: { isAuth: true },
        },
    ]
};

export default MetadataDatabaseConfigModule;
