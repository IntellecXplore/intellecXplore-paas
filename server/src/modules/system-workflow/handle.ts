import type { Context } from 'elysia';
import pg from '@/core/database/pg';
import { eq, and, desc, or, like, sql } from 'drizzle-orm';

import { workflowDefinitionSchema } from '@database/schema/workflow_definition';
import { workflowInstanceSchema } from '@database/schema/workflow_instance';
import { workflowStepExecutionSchema } from '@database/schema/workflow_step_execution';

import { FindPage, FindOneByKey, SoftDeleteByKeys } from '@/core/database/repository';
import { getToolSchemas } from '../agent/core/tool-registry';
import { workflowExecutor } from './executor';
import { getWorkflowById } from './registry';
import { createSSEEmitter } from '../agent/core/sse-emitter';
import { logger } from '@/shared/logger';

// ============== Helpers ==============

function extractUser(ctx: Context): { userId: number; userName?: string } {
    const user = (ctx as any).user || {};
    return {
        userId: Number(user.userId) || 0,
        userName: user.username || user.userName,
    };
}

function success(data: unknown = null, msg = '操作成功') {
    return { code: 200, msg, data };
}

function fail(msg: string, code = 500) {
    return { code, msg, data: null };
}

// ============== Definition CRUD ==============

/** 创建工作流定义 */
export async function createDefinition(ctx: Context): Promise<object> {
    try {
        const body = ctx.body as any;
        const user = extractUser(ctx);
        const tenantId = (ctx as any)?.tenantId ?? 1;

        const def = {
            id: '', // will be set from name
            name: body.name,
            description: body.description || '',
            version: 1,
            steps: body.definition?.steps || [],
            retryPolicy: body.definition?.retryPolicy,
            timeoutMs: body.definition?.timeoutMs,
        };

        const rows = await pg
            .insert(workflowDefinitionSchema)
            .values({
                name: body.name,
                description: body.description || '',
                version: 1,
                status: 'draft',
                definition: def as any,
                isTemplate: body.isTemplate || false,
                createBy: user.userId,
                tenantId,
            } as any)
            .returning();

        return success(rows[0]);
    } catch (e: any) {
        logger.error('createDefinition error:', e);
        return fail(e.message);
    }
}

/** 获取工作流定义列表 */
export async function listDefinitions(ctx: Context): Promise<object> {
    try {
        const { pageNum = 1, pageSize = 20, status, keyword } = ctx.query as any;
        const tenantId = (ctx as any)?.tenantId ?? 1;

        const conditions: any[] = [];
        conditions.push(eq(workflowDefinitionSchema.tenantId, tenantId));
        if (status) conditions.push(eq(workflowDefinitionSchema.status, status));
        if (keyword) {
            conditions.push(
                or(
                    like(workflowDefinitionSchema.name, `%${keyword}%`),
                    like(workflowDefinitionSchema.description, `%${keyword}%`),
                ),
            );
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const result = await FindPage(workflowDefinitionSchema, where, {
            pageNum,
            pageSize,
            orderByColumn: 'id',
            sortRule: 'desc',
        });

        return success(result);
    } catch (e: any) {
        logger.error('listDefinitions error:', e);
        return fail(e.message);
    }
}

/** 获取工作流定义详情 */
export async function getDefinition(ctx: Context): Promise<object> {
    try {
        const id = Number((ctx.params as any).id);
        const row = await FindOneByKey(workflowDefinitionSchema, 'id', id, (ctx as any)?.tenantId);
        if (!row) return fail('工作流定义不存在', 404);
        return success(row);
    } catch (e: any) {
        logger.error('getDefinition error:', e);
        return fail(e.message);
    }
}

/** 更新工作流定义 */
export async function updateDefinition(ctx: Context): Promise<object> {
    try {
        const id = Number((ctx.params as any).id);
        const body = ctx.body as any;
        const user = extractUser(ctx);
        const tenantId = (ctx as any)?.tenantId ?? 1;

        const existing = await FindOneByKey(workflowDefinitionSchema, 'id', id, tenantId);
        if (!existing) return fail('工作流定义不存在', 404);

        const updateData: any = { updateBy: user.userId };

        if (body.name) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.isTemplate !== undefined) updateData.isTemplate = body.isTemplate;

        if (body.definition) {
            const currentDef = (existing as any).definition || {};
            updateData.definition = {
                ...currentDef,
                name: body.name || existing.name,
                steps: body.definition.steps || currentDef.steps,
                retryPolicy: body.definition.retryPolicy ?? currentDef.retryPolicy,
                timeoutMs: body.definition.timeoutMs ?? currentDef.timeoutMs,
                version: (existing.version || 1) + 1,
            };
            updateData.version = (existing.version || 1) + 1;
        }

        await pg
            .update(workflowDefinitionSchema)
            .set(updateData as any)
            .where(and(eq(workflowDefinitionSchema.id, id), eq(workflowDefinitionSchema.tenantId, tenantId)));

        return success(null, '更新成功');
    } catch (e: any) {
        logger.error('updateDefinition error:', e);
        return fail(e.message);
    }
}

/** 删除工作流定义（软删除） */
export async function deleteDefinition(ctx: Context): Promise<object> {
    try {
        const ids = (ctx.params as any).ids;
        await SoftDeleteByKeys(workflowDefinitionSchema, 'id', ctx);
        return success(null, '删除成功');
    } catch (e: any) {
        logger.error('deleteDefinition error:', e);
        return fail(e.message);
    }
}

/** 发布工作流定义 */
export async function publishDefinition(ctx: Context): Promise<object> {
    try {
        const id = Number((ctx.params as any).id);
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const existing = await FindOneByKey(workflowDefinitionSchema, 'id', id, tenantId);
        if (!existing) return fail('工作流定义不存在', 404);
        if ((existing as any).definition?.steps?.length === 0) {
            return fail('工作流至少需要一个步骤才能发布', 400);
        }

        await pg
            .update(workflowDefinitionSchema)
            .set({ status: 'published' } as any)
            .where(and(eq(workflowDefinitionSchema.id, id), eq(workflowDefinitionSchema.tenantId, tenantId)));

        return success(null, '发布成功');
    } catch (e: any) {
        logger.error('publishDefinition error:', e);
        return fail(e.message);
    }
}

// ============== Instance / Execution ==============

/** 触发工作流执行 */
export async function runWorkflow(ctx: Context): Promise<object> {
    try {
        const body = ctx.body as any;
        const user = extractUser(ctx);

        // 验证定义存在且已发布
        const def = await FindOneByKey(workflowDefinitionSchema, 'id', body.definitionId, (ctx as any)?.tenantId);
        if (!def) return fail('工作流定义不存在', 404);
        if ((def as any).status !== 'published' && (def as any).status !== 'draft') {
            return fail('工作流未发布', 400);
        }

        const instanceId = await workflowExecutor.submit(
            body.definitionId,
            body.input || {},
            user.userId,
            {
                scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
                triggerType: body.triggerType || 'manual',
                agentId: body.agentId,
            },
        );

        // 尝试通过 BullMQ 队列异步执行，失败则内联执行
        let queued = false;
        try {
            const { queueManager } = await import('@/infrastructure/queue/core');
            const queue = queueManager.getQueue('workflow-execution-queue');
            if (queue) {
                await queue.add('workflow-execution-queue', { instanceId });
                queued = true;
            }
        } catch (e: any) {
            logger.warn('BullMQ 队列不可用，使用内联执行:', e.message);
        }

        if (!queued) {
            workflowExecutor.execute(instanceId).catch(err => {
                logger.error(`Workflow instance ${instanceId} execute error:`, err);
            });
        }

        return success({ instanceId, status: 'running', queued }, '工作流已触发');
    } catch (e: any) {
        logger.error('runWorkflow error:', e);
        return fail(e.message);
    }
}

/** 获取工作流实例详情 */
export async function getInstance(ctx: Context): Promise<object> {
    try {
        const id = Number((ctx.params as any).id);
        const row = await FindOneByKey(workflowInstanceSchema, 'id', id, (ctx as any)?.tenantId);
        if (!row) return fail('工作流实例不存在', 404);
        return success(row);
    } catch (e: any) {
        logger.error('getInstance error:', e);
        return fail(e.message);
    }
}

/** 获取工作流实例列表 */
export async function listInstances(ctx: Context): Promise<object> {
    try {
        const { pageNum = 1, pageSize = 20, status, userId, definitionId } = ctx.query as any;
        const tenantId = (ctx as any)?.tenantId ?? 1;

        const conditions: any[] = [];
        conditions.push(eq(workflowInstanceSchema.tenantId, tenantId));
        if (status) conditions.push(eq(workflowInstanceSchema.status, status));
        if (userId) conditions.push(eq(workflowInstanceSchema.userId, Number(userId)));
        if (definitionId)
            conditions.push(eq(workflowInstanceSchema.definitionId, Number(definitionId)));

        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const result = await FindPage(workflowInstanceSchema, where, {
            pageNum,
            pageSize,
            orderByColumn: 'id',
            sortRule: 'desc',
        });

        return success(result);
    } catch (e: any) {
        logger.error('listInstances error:', e);
        return fail(e.message);
    }
}

/** 暂停工作流执行 */
export async function pauseInstance(ctx: Context): Promise<object> {
    try {
        const id = Number((ctx.params as any).id);
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const existing = await FindOneByKey(workflowInstanceSchema, 'id', id, tenantId);
        if (!existing) return fail('工作流实例不存在', 404);
        if (existing.status !== 'running') return fail('只能暂停运行中的工作流', 400);

        await pg
            .update(workflowInstanceSchema)
            .set({ status: 'paused', updatedAt: new Date() } as any)
            .where(and(eq(workflowInstanceSchema.id, id), eq(workflowInstanceSchema.tenantId, tenantId)));

        return success(null, '已暂停');
    } catch (e: any) {
        logger.error('pauseInstance error:', e);
        return fail(e.message);
    }
}

/** 恢复工作流执行 */
export async function resumeInstance(ctx: Context): Promise<object> {
    try {
        const id = Number((ctx.params as any).id);
        const body = (ctx.body as any) || {};
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const existing = await FindOneByKey(workflowInstanceSchema, 'id', id, tenantId);
        if (!existing) return fail('工作流实例不存在', 404);

        const resumableStatuses = ['paused', 'waiting_approval', 'waiting_event'];
        if (!resumableStatuses.includes(existing.status || '')) {
            return fail('当前状态不可恢复', 400);
        }

        // 恢复为 running
        await pg
            .update(workflowInstanceSchema)
            .set({ status: 'running', updatedAt: new Date() } as any)
            .where(and(eq(workflowInstanceSchema.id, id), eq(workflowInstanceSchema.tenantId, tenantId)));

        // 异步继续执行
        workflowExecutor.execute(id).catch(err => {
            logger.error(`Workflow instance ${id} resume error:`, err);
        });

        return success(null, '已恢复执行');
    } catch (e: any) {
        logger.error('resumeInstance error:', e);
        return fail(e.message);
    }
}

/** 取消工作流执行 */
export async function cancelInstance(ctx: Context): Promise<object> {
    try {
        const id = Number((ctx.params as any).id);
        const tenantId = (ctx as any)?.tenantId ?? 1;
        const existing = await FindOneByKey(workflowInstanceSchema, 'id', id, tenantId);
        if (!existing) return fail('工作流实例不存在', 404);

        const cancellableStatuses = ['pending', 'running', 'paused', 'waiting_approval', 'waiting_event'];
        if (!cancellableStatuses.includes(existing.status || '')) {
            return fail('当前状态不可取消', 400);
        }

        await pg
            .update(workflowInstanceSchema)
            .set({ status: 'cancelled', completedAt: new Date(), updatedAt: new Date() } as any)
            .where(and(eq(workflowInstanceSchema.id, id), eq(workflowInstanceSchema.tenantId, tenantId)));

        return success(null, '已取消');
    } catch (e: any) {
        logger.error('cancelInstance error:', e);
        return fail(e.message);
    }
}

// ============== Traces ==============

/** 获取工作流步骤执行追踪 */
export async function getInstanceTraces(ctx: Context): Promise<object> {
    try {
        const instanceId = Number((ctx.params as any).id);
        const { stepId } = ctx.query as any;
        const tenantId = (ctx as any)?.tenantId ?? 1;

        const conditions: any[] = [eq(workflowStepExecutionSchema.instanceId, instanceId)];
        conditions.push(eq(workflowStepExecutionSchema.tenantId, tenantId));
        if (stepId) conditions.push(eq(workflowStepExecutionSchema.stepId, stepId));

        const rows = await pg
            .select()
            .from(workflowStepExecutionSchema)
            .where(and(...conditions))
            .orderBy(workflowStepExecutionSchema.id);

        return success(rows);
    } catch (e: any) {
        logger.error('getInstanceTraces error:', e);
        return fail(e.message);
    }
}

// ============== SSE Streaming ==============

/**
 * SSE 流式推送工作流执行状态
 */
export async function streamWorkflowExecution(ctx: Context): Promise<Response> {
    const instanceId = Number((ctx.params as any).id);

    const stream = new ReadableStream({
        async start(controller) {
            const sseEmitter = createSSEEmitter(controller);

            // 触发执行
            workflowExecutor.execute(instanceId, {
                emit(type: string, data: Record<string, unknown>) {
                    try {
                        sseEmitter.emit(type as any, data);
                    } catch {
                        // stream might be closed
                    }
                },
            }).catch(err => {
                logger.error(`SSE workflow ${instanceId} error:`, err);
                try {
                    sseEmitter.emit('error' as any, { message: err.message });
                    sseEmitter.emit('done' as any, {});
                } catch {
                    // stream closed
                }
            }).finally(() => {
                try {
                    controller.close();
                } catch {
                    // already closed
                }
            });
        },
        cancel() {
            // browser disconnected
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

// ============== Node Types ==============

/** 获取可用的节点/工具类型目录 */
export async function listNodeTypes(ctx: Context): Promise<object> {
    try {
        const toolSchemas = getToolSchemas();

        const builtinNodeTypes = [
            {
                type: 'start',
                label: '开始',
                description: '工作流入口，定义输入变量',
                icon: 'Play',
                category: 'flow',
                configSchema: {
                    type: 'object',
                    properties: {
                        variables: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    type: { type: 'string', enum: ['string', 'number', 'boolean', 'object', 'array'] },
                                    required: { type: 'boolean' },
                                    default: {},
                                    description: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
            {
                type: 'end',
                label: '结束',
                description: '工作流出口，返回最终结果',
                icon: 'StopCircle',
                category: 'flow',
                configSchema: {
                    type: 'object',
                    properties: {
                        output: { type: 'string', description: '输出变量名，默认返回所有步骤输出' },
                    },
                },
            },
            {
                type: 'llm',
                label: 'LLM 调用',
                description: '调用大语言模型生成文本或结构化输出',
                icon: 'Brain',
                category: 'ai',
                configSchema: {
                    type: 'object',
                    properties: {
                        model: { type: 'string', description: '模型标识，默认使用系统配置' },
                        systemPrompt: { type: 'string', description: '系统提示词，支持 {{}} 变量' },
                        userPrompt: { type: 'string', description: '用户提示词，支持 {{}} 变量' },
                        tools: { type: 'array', items: { type: 'string' }, description: '可用工具列表' },
                        maxToolRounds: { type: 'number', description: '最大工具调用轮数' },
                        temperature: { type: 'number', minimum: 0, maximum: 2 },
                        outputSchema: { type: 'object', description: '结构化输出 JSON Schema' },
                        outputKey: { type: 'string', description: '输出变量名' },
                    },
                    required: ['userPrompt'],
                },
            },
            {
                type: 'tool',
                label: '工具调用',
                description: '调用已注册的工具/函数',
                icon: 'Wrench',
                category: 'tool',
                configSchema: {
                    type: 'object',
                    properties: {
                        tool: { type: 'string', description: '工具名称' },
                        input: { type: 'object', description: '工具参数，支持 {{}} 变量' },
                        outputKey: { type: 'string', description: '输出变量名' },
                    },
                    required: ['tool'],
                },
            },
            {
                type: 'condition',
                label: '条件分支',
                description: '根据条件选择执行路径',
                icon: 'GitBranch',
                category: 'logic',
                configSchema: {
                    type: 'object',
                    properties: {
                        branches: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string' },
                                    condition: { type: 'object', description: '条件表达式，支持 eq/neq/gt/lt/in/and/or/not' },
                                    steps: { type: 'array', items: { type: 'object' } },
                                },
                            },
                        },
                        defaultBranch: { type: 'array', items: { type: 'object' } },
                    },
                },
            },
            {
                type: 'parallel',
                label: '并行执行',
                description: '同时执行多个分支',
                icon: 'SplitSquareVertical',
                category: 'flow',
                configSchema: {
                    type: 'object',
                    properties: {
                        branches: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    label: { type: 'string' },
                                    steps: { type: 'array', items: { type: 'object' } },
                                },
                            },
                        },
                        strategy: { type: 'string', enum: ['all', 'race'] },
                    },
                },
            },
            {
                type: 'wait',
                label: '等待',
                description: '延迟执行或等待审批/webhook',
                icon: 'Clock',
                category: 'flow',
                configSchema: {
                    type: 'object',
                    properties: {
                        waitType: { type: 'string', enum: ['delay', 'approval', 'webhook'] },
                        config: {
                            type: 'object',
                            properties: {
                                delayMs: { type: 'number' },
                                approvalPrompt: { type: 'string' },
                                webhookToken: { type: 'string' },
                            },
                        },
                    },
                },
            },
            {
                type: 'sub_workflow',
                label: '子工作流',
                description: '调用另一个工作流作为子流程',
                icon: 'Workflow',
                category: 'flow',
                configSchema: {
                    type: 'object',
                    properties: {
                        workflowId: { type: 'string', description: '子工作流 ID/名称' },
                        input: { type: 'object', description: '传入参数' },
                        outputKey: { type: 'string' },
                    },
                    required: ['workflowId'],
                },
            },
        ];

        // 将已注册的工具作为 tool 类型节点列出
        const toolNodes = Object.entries(toolSchemas).map(([name, info]) => ({
            type: `tool:${name}`,
            label: info.description?.split('\n')[0] || name,
            description: info.description || `调用工具: ${name}`,
            icon: 'Wrench',
            category: 'tool',
            configSchema: {
                type: 'object',
                properties: {
                    tool: { type: 'string', const: name },
                    input: { type: 'object', description: '参数同工具定义' },
                    outputKey: { type: 'string' },
                },
                required: ['tool'],
            },
        }));

        return success({
            builtin: builtinNodeTypes,
            tools: toolNodes,
            toolSchemas,
        });
    } catch (e: any) {
        logger.error('listNodeTypes error:', e);
        return fail(e.message);
    }
}
