import type { IRouteModule } from '@/types/route';
import {
    CreateWorkflowDto,
    UpdateWorkflowDto,
    WorkflowListDto,
    RunWorkflowDto,
    ResumeWorkflowDto,
    InstanceListDto,
    InstanceTracesDto,
    NodeTypesDto,
} from './dto';
import {
    createDefinition,
    listDefinitions,
    getDefinition,
    updateDefinition,
    deleteDefinition,
    publishDefinition,
    runWorkflow,
    getInstance,
    listInstances,
    pauseInstance,
    resumeInstance,
    cancelInstance,
    getInstanceTraces,
    streamWorkflowExecution,
    listNodeTypes,
} from './handle';

const WorkflowModule: IRouteModule = {
    tags: '工作流引擎',
    routes: [
        // === 工作流定义 ===
        {
            url: '/workflow/definitions',
            method: 'post',
            summary: '创建工作流定义',
            dto: CreateWorkflowDto,
            handle: createDefinition,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/definitions',
            method: 'get',
            summary: '获取工作流定义列表',
            dto: WorkflowListDto,
            handle: listDefinitions,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/definitions/:id',
            method: 'get',
            summary: '获取工作流定义详情',
            handle: getDefinition,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/definitions/:id',
            method: 'put',
            summary: '更新工作流定义',
            dto: UpdateWorkflowDto,
            handle: updateDefinition,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/definitions/:ids',
            method: 'delete',
            summary: '删除工作流定义',
            handle: deleteDefinition,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/definitions/:id/publish',
            method: 'post',
            summary: '发布工作流定义',
            handle: publishDefinition,
            meta: { isAuth: true },
        },

        // === 工作流执行 ===
        {
            url: '/workflow/instances/run',
            method: 'post',
            summary: '触发工作流执行',
            dto: RunWorkflowDto,
            handle: runWorkflow,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/instances',
            method: 'get',
            summary: '获取工作流执行历史列表',
            dto: InstanceListDto,
            handle: listInstances,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/instances/:id',
            method: 'get',
            summary: '获取工作流实例详情',
            handle: getInstance,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/instances/:id/traces',
            method: 'get',
            summary: '获取工作流步骤执行追踪',
            dto: InstanceTracesDto,
            handle: getInstanceTraces,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/instances/:id/stream',
            method: 'get',
            summary: 'SSE 流式推送工作流执行状态',
            handle: streamWorkflowExecution,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/instances/:id/pause',
            method: 'post',
            summary: '暂停工作流执行',
            handle: pauseInstance,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/instances/:id/resume',
            method: 'post',
            summary: '恢复工作流执行',
            dto: ResumeWorkflowDto,
            handle: resumeInstance,
            meta: { isAuth: true },
        },
        {
            url: '/workflow/instances/:id/cancel',
            method: 'post',
            summary: '取消工作流执行',
            handle: cancelInstance,
            meta: { isAuth: true },
        },

        // === 节点类型目录 ===
        {
            url: '/workflow/node-types',
            method: 'get',
            summary: '获取可用节点类型目录',
            dto: NodeTypesDto,
            handle: listNodeTypes,
            meta: { isAuth: true },
        },
    ],
};

export default WorkflowModule;
