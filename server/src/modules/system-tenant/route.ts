import type { IRouteModule } from "@/types/route";
import { CreateDto, UpdateDto, ListDto } from "./dto";
import { create, findList, findOne, update, remove, findOptions } from './handle';
import config from '@/config';

const multiTenant = config.multiTenant ?? false;

const SystemTenantModule: IRouteModule = {
    tags: '系统租户',
    routes: multiTenant ? [
        { url: '/system/tenant', method: 'post', summary: '创建租户', dto: CreateDto, handle: create, meta: { isAuth: true, isLog: true, permission: 'system:tenant:create', } },
        { url: '/system/tenant/list', method: 'get', summary: '查询租户列表', dto: ListDto, handle: findList, meta: { isAuth: true, permission: 'system:tenant:query', } },
        { url: '/system/tenant/options', method: 'get', summary: '租户下拉选项', handle: findOptions, meta: { isAuth: true, permission: 'system:tenant:query', } },
        { url: '/system/tenant/:id', method: 'get', summary: '查询租户详情', handle: findOne, meta: { isAuth: true, permission: 'system:tenant:query', } },
        { url: '/system/tenant', method: 'put', summary: '更新租户', dto: UpdateDto, handle: update, meta: { isAuth: true, isLog: true, permission: 'system:tenant:update', } },
        { url: '/system/tenant/:ids', method: 'delete', summary: '删除租户', handle: remove, meta: { isAuth: true, isLog: true, permission: 'system:tenant:delete', } },
    ] : [],
};

export default SystemTenantModule;
