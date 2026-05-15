import type { IRouteModule } from "@/types/route";
import { create, findList, findOne, remove, update, sortFields } from './handle';
import { CreateDto, ListDto, UpdateDto } from "./dto";

const MetadataFieldModule: IRouteModule = {
    tags: '元数据字段',
    routes: [
        {
            url: '/system/metadata/field', method: 'post', summary: '创建字段',
            dto: CreateDto, handle: create,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:field:create' },
        },
        {
            url: '/system/metadata/field/list', method: 'get', summary: '查询字段列表',
            dto: ListDto, handle: findList,
            meta: { isAuth: true, permission: 'system:metadata:field:query' },
        },
        {
            url: '/system/metadata/field/:id', method: 'get', summary: '查询单个字段详情',
            handle: findOne,
            meta: { isAuth: true, permission: 'system:metadata:field:query' },
        },
        {
            url: '/system/metadata/field', method: 'put', summary: '更新字段',
            dto: UpdateDto, handle: update,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:field:update' },
        },
        {
            url: '/system/metadata/field/sort', method: 'post', summary: '字段批量排序',
            handle: sortFields,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:field:update' },
        },
        {
            url: '/system/metadata/field/:ids', method: 'delete', summary: '删除字段',
            handle: remove,
            meta: { isAuth: true, isLog: true, permission: 'system:metadata:field:delete' },
        },
    ]
};

export default MetadataFieldModule;
