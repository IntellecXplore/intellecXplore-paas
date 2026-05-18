import type { IRouteModule } from '@/types/route';
import { findList, findOne, create, update, remove } from './handle';
import { ListDto, FindOneDto, CreateDto, UpdateDto, RemoveDto } from './dto';

const CollectionDataModule: IRouteModule = {
    tags: '动态数据',
    routes: [
        {
            url: '/collection/:tableName/list',
            method: 'get',
            summary: '查询动态表数据列表',
            dto: ListDto,
            handle: findList,
            meta: { isAuth: true },
        },
        {
            url: '/collection/:tableName/:id',
            method: 'get',
            summary: '查询动态表数据详情',
            dto: FindOneDto,
            handle: findOne,
            meta: { isAuth: true },
        },
        {
            url: '/collection/:tableName',
            method: 'post',
            summary: '新增动态表数据',
            dto: CreateDto,
            handle: create,
            meta: { isAuth: true, isLog: true },
        },
        {
            url: '/collection/:tableName',
            method: 'put',
            summary: '更新动态表数据',
            dto: UpdateDto,
            handle: update,
            meta: { isAuth: true, isLog: true },
        },
        {
            url: '/collection/:tableName/:ids',
            method: 'delete',
            summary: '删除动态表数据（软删除）',
            dto: RemoveDto,
            handle: remove,
            meta: { isAuth: true, isLog: true },
        },
    ],
};

export default CollectionDataModule;
