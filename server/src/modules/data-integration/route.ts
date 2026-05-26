import type { IRouteModule } from "@/types/route";
import {
    createSource, findSourceList, findSourceOne, updateSource, removeSource, testConnection, discoverObjects,
    createObject, findObjectList, findObjectOne, updateObject, removeObject, getObjectFields,
    createMapping, findMappingList, updateMapping, removeMapping,
    createTask, findTaskList, findTaskOne, updateTask, removeTask, triggerSync, toggleTask, previewData,
    findLogList, findLogOne,
    getProductTypes, webhookReceive,
} from './handle';
import {
    CreateSourceDto, UpdateSourceDto, ListSourceDto,
    CreateObjectDto, UpdateObjectDto, ListObjectDto,
    CreateMappingDto, UpdateMappingDto, ListMappingDto,
    CreateTaskDto, UpdateTaskDto, ListTaskDto,
    ListLogDto, TestConnectionDto, DiscoverObjectsDto, TriggerSyncDto, PreviewDto,
} from "./dto";

const DataIntegrationModule: IRouteModule = {
    tags: '数据集成',
    routes: [
        // ===== Source =====
        {
            url: '/integration/source', method: 'post', summary: '创建数据源',
            dto: CreateSourceDto, handle: createSource,
            meta: { isAuth: true, isLog: true, permission: 'integration:source:create' },
        },
        {
            url: '/integration/source/list', method: 'get', summary: '数据源列表',
            dto: ListSourceDto, handle: findSourceList,
            meta: { isAuth: true, permission: 'integration:source:query' },
        },
        {
            url: '/integration/source/product-types', method: 'get', summary: '支持的产品类型',
            handle: getProductTypes,
            meta: { isAuth: true },
        },
        {
            url: '/integration/source/:id', method: 'get', summary: '数据源详情',
            handle: findSourceOne,
            meta: { isAuth: true, permission: 'integration:source:query' },
        },
        {
            url: '/integration/source', method: 'put', summary: '更新数据源',
            dto: UpdateSourceDto, handle: updateSource,
            meta: { isAuth: true, isLog: true, permission: 'integration:source:update' },
        },
        {
            url: '/integration/source/:ids', method: 'delete', summary: '删除数据源',
            handle: removeSource,
            meta: { isAuth: true, isLog: true, permission: 'integration:source:delete' },
        },
        {
            url: '/integration/source/test-connection', method: 'post', summary: '测试连接',
            dto: TestConnectionDto, handle: testConnection,
            meta: { isAuth: true },
        },
        {
            url: '/integration/source/:id/objects', method: 'get', summary: '发现数据对象',
            dto: DiscoverObjectsDto, handle: discoverObjects,
            meta: { isAuth: true, permission: 'integration:source:query' },
        },

        // ===== Object =====
        {
            url: '/integration/object', method: 'post', summary: '创建数据对象',
            dto: CreateObjectDto, handle: createObject,
            meta: { isAuth: true, isLog: true, permission: 'integration:object:create' },
        },
        {
            url: '/integration/object/list', method: 'get', summary: '数据对象列表',
            dto: ListObjectDto, handle: findObjectList,
            meta: { isAuth: true, permission: 'integration:object:query' },
        },
        {
            url: '/integration/object/:id', method: 'get', summary: '数据对象详情',
            handle: findObjectOne,
            meta: { isAuth: true, permission: 'integration:object:query' },
        },
        {
            url: '/integration/object', method: 'put', summary: '更新数据对象',
            dto: UpdateObjectDto, handle: updateObject,
            meta: { isAuth: true, isLog: true, permission: 'integration:object:update' },
        },
        {
            url: '/integration/object/:ids', method: 'delete', summary: '删除数据对象',
            handle: removeObject,
            meta: { isAuth: true, isLog: true, permission: 'integration:object:delete' },
        },
        {
            url: '/integration/object/:id/fields', method: 'get', summary: '获取对象字段列表',
            handle: getObjectFields,
            meta: { isAuth: true, permission: 'integration:object:query' },
        },

        // ===== Mapping =====
        {
            url: '/integration/mapping', method: 'post', summary: '创建字段映射',
            dto: CreateMappingDto, handle: createMapping,
            meta: { isAuth: true, isLog: true, permission: 'integration:mapping:create' },
        },
        {
            url: '/integration/mapping/list', method: 'get', summary: '字段映射列表',
            dto: ListMappingDto, handle: findMappingList,
            meta: { isAuth: true, permission: 'integration:mapping:query' },
        },
        {
            url: '/integration/mapping', method: 'put', summary: '更新字段映射',
            dto: UpdateMappingDto, handle: updateMapping,
            meta: { isAuth: true, isLog: true, permission: 'integration:mapping:update' },
        },
        {
            url: '/integration/mapping/:ids', method: 'delete', summary: '删除字段映射',
            handle: removeMapping,
            meta: { isAuth: true, isLog: true, permission: 'integration:mapping:delete' },
        },

        // ===== Task =====
        {
            url: '/integration/task', method: 'post', summary: '创建同步任务',
            dto: CreateTaskDto, handle: createTask,
            meta: { isAuth: true, isLog: true, permission: 'integration:task:create' },
        },
        {
            url: '/integration/task/list', method: 'get', summary: '同步任务列表',
            dto: ListTaskDto, handle: findTaskList,
            meta: { isAuth: true, permission: 'integration:task:query' },
        },
        {
            url: '/integration/task/:id', method: 'get', summary: '同步任务详情',
            handle: findTaskOne,
            meta: { isAuth: true, permission: 'integration:task:query' },
        },
        {
            url: '/integration/task', method: 'put', summary: '更新同步任务',
            dto: UpdateTaskDto, handle: updateTask,
            meta: { isAuth: true, isLog: true, permission: 'integration:task:update' },
        },
        {
            url: '/integration/task/:ids', method: 'delete', summary: '删除同步任务',
            handle: removeTask,
            meta: { isAuth: true, isLog: true, permission: 'integration:task:delete' },
        },
        {
            url: '/integration/task/:id/trigger', method: 'post', summary: '手动触发同步',
            dto: TriggerSyncDto, handle: triggerSync,
            meta: { isAuth: true, isLog: true, permission: 'integration:task:execute' },
        },
        {
            url: '/integration/task/:id/toggle', method: 'post', summary: '启用/停用任务',
            handle: toggleTask,
            meta: { isAuth: true, isLog: true, permission: 'integration:task:update' },
        },
        {
            url: '/integration/task/:id/preview', method: 'get', summary: '预览同步数据',
            dto: PreviewDto, handle: previewData,
            meta: { isAuth: true, permission: 'integration:task:query' },
        },

        // ===== Log =====
        {
            url: '/integration/log/list', method: 'get', summary: '同步日志列表',
            dto: ListLogDto, handle: findLogList,
            meta: { isAuth: true, permission: 'integration:log:query' },
        },
        {
            url: '/integration/log/:id', method: 'get', summary: '同步日志详情',
            handle: findLogOne,
            meta: { isAuth: true, permission: 'integration:log:query' },
        },

        // ===== Webhook =====
        {
            url: '/integration/webhook/:sourceId', method: 'post', summary: '接收第三方事件推送',
            handle: webhookReceive,
            meta: { isAuth: false },
        },
    ]
};

export default DataIntegrationModule;
