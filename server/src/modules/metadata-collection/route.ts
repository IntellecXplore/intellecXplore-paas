import type { IRouteModule } from "@/types/route";
import { create, findList, findOne, remove, update, publish, deploy, toggleStatus } from './handle';
import { CreateDto, ListDto, UpdateDto } from "./dto";

const MetadataCollectionModule: IRouteModule = {
    tags: '元数据数据表',
    routes: [
        {
            url: '/system/metadata/collection', method: 'post', summary: '创建数据表',
            dto: CreateDto, handle: create,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:collection:create' },
        },
        {
            url: '/system/metadata/collection/list', method: 'get', summary: '查询数据表列表',
            dto: ListDto, handle: findList,
            meta: { isAuth: true, permission: 'system:metadata:collection:query' },
        },
        {
            url: '/system/metadata/collection/:id', method: 'get', summary: '查询数据表详情',
            handle: findOne,
            meta: { isAuth: true, permission: 'system:metadata:collection:query' },
        },
        {
            url: '/system/metadata/collection', method: 'put', summary: '更新数据表',
            dto: UpdateDto, handle: update,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:collection:update' },
        },
        {
            url: '/system/metadata/collection/:id/publish', method: 'post', summary: '发布数据表（建表DDL）',
            handle: publish,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:collection:update' },
        },
        {
            url: '/system/metadata/collection/:id/deploy', method: 'post', summary: '部署上线',
            handle: deploy,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:collection:update' },
        },
        {
            url: '/system/metadata/collection/:id/toggle-status', method: 'post', summary: '切换数据表状态（停用/激活）',
            handle: toggleStatus,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:collection:update' },
        },
        {
            url: '/system/metadata/collection/:ids', method: 'delete', summary: '删除数据表',
            handle: remove,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:collection:delete' },
        },
    ]
};

export default MetadataCollectionModule;
