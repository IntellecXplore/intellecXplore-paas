import pg from '@/core/database/pg';
import { eq } from 'drizzle-orm';
import { generateText, jsonSchema as aiJsonSchema } from 'ai';

import { workflowInstanceSchema } from '@database/schema/workflow_instance';
import { workflowStepExecutionSchema } from '@database/schema/workflow_step_execution';

import { getWorkflow, getWorkflowById } from './registry';
import { resolveTemplate } from './template-engine';
import { getTool, setActiveToolContext, clearActiveToolContext } from '../agent/core/tool-registry';
import { createProvider } from '../agent/core/llm-provider';
import config from '@/config';

import type {
    WorkflowDefinition,
    WorkflowStatus,
    WorkflowContext,
    Step,
    ToolStep,
    LLMStep,
    ConditionalStep,
    ParallelStep,
    WaitStep,
    SubWorkflowStep,
    Condition,
    RetryPolicy,
    StepResult,
    ConditionBranch,
} from './types';
import { DEFAULT_RETRY_POLICY } from './types';

// ============== SSE Event Emitter Interface ==============

export interface WorkflowEventEmitter {
    emit(type: string, data: Record<string, unknown>): void;
}

// ============== Helpers ==============

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function nowISO(): string {
    return new Date().toISOString();
}

function calcDelay(retryPolicy: RetryPolicy, attempt: number): number {
    return Math.min(
        retryPolicy.initialDelayMs * Math.pow(retryPolicy.backoffMultiplier, attempt - 1),
        retryPolicy.maxDelayMs,
    );
}

// ============== Executor ==============

export class WorkflowExecutor {
    private emitter?: WorkflowEventEmitter;

    constructor(emitter?: WorkflowEventEmitter) {
        this.emitter = emitter;
    }

    // ========== Submit ==========

    /**
     * 提交工作流实例到数据库，返回 instanceId
     */
    async submit(
        definitionId: number,
        input: Record<string, unknown>,
        userId: number,
        options?: {
            scheduledAt?: Date;
            triggerType?: string;
            agentId?: string;
        },
    ): Promise<number> {
        const def = await getWorkflowById(definitionId);
        if (!def) {
            throw new Error(`Workflow definition id=${definitionId} not found`);
        }

        const [instance] = await pg
            .insert(workflowInstanceSchema)
            .values({
                definitionId,
                definitionVersion: def.version,
                workflowName: def.name,
                status: 'pending',
                input: input as any,
                context: { input },
                scheduledAt: options?.scheduledAt || new Date(),
                triggerType: options?.triggerType || 'manual',
                triggeredBy: userId,
                userId,
                agentId: options?.agentId || null,
                maxRetries: def.retryPolicy?.maxAttempts ?? 3,
            })
            .returning({ id: workflowInstanceSchema.id });

        return instance.id;
    }

    // ========== Execute ==========

    /**
     * 执行一个工作流实例到完成、失败或挂起。
     * 支持崩溃恢复：如果实例已有完成的步骤，会从断点继续。
     */
    async execute(instanceId: number, sseEmitter?: WorkflowEventEmitter): Promise<void> {
        const emit = sseEmitter || this.emitter;

        // 1. 加载实例
        const [instance] = await pg
            .select()
            .from(workflowInstanceSchema)
            .where(eq(workflowInstanceSchema.id, instanceId))
            .limit(1);

        if (!instance) {
            throw new Error(`Workflow instance ${instanceId} not found`);
        }

        // 不可执行的状态
        const terminalStatuses: WorkflowStatus[] = ['completed', 'failed', 'cancelled'];
        if (terminalStatuses.includes(instance.status as WorkflowStatus)) {
            return;
        }

        // 2. 加载定义
        const def = await getWorkflowById(instance.definitionId);
        if (!def) {
            await this.failInstance(instanceId, 'Workflow definition not found');
            return;
        }

        // 3. 乐观锁竞争执行权
        try {
            const updateResult = await pg
                .update(workflowInstanceSchema)
                .set({
                    status: 'running',
                    startedAt: instance.startedAt || new Date(),
                    updatedAt: new Date(),
                } as any)
                .where(
                    eq(workflowInstanceSchema.id, instanceId),
                );

            // Already claimed by another worker — exit silently
            if (updateResult.count === 0) return;
        } catch (e: any) {
            console.warn(`[executor] Failed to acquire instance ${instanceId}:`, e.message);
            return;
        }

        emit?.emit('workflow-started', { instanceId, workflowName: def.name });

        // 4. 构建执行上下文（从 DB 恢复）
        const ctx: WorkflowContext = {
            input: (instance.input as Record<string, unknown>) || {},
            stepOutputs: (instance.context as any)?.stepOutputs || {},
            userId: instance.userId,
            permissions: [],
            roles: [],
        };

        // 5. 计算已完成的步骤
        const completedSteps: Set<string> = new Set(
            (instance.completedSteps as string[]) || [],
        );

        const globalRetry = def.retryPolicy || DEFAULT_RETRY_POLICY;
        const globalTimeout = def.timeoutMs || 300_000;

        try {
            // 6. 递归执行步骤树
            await this.executeSteps(
                def.steps,
                ctx,
                instanceId,
                completedSteps,
                globalRetry,
                emit,
            );

            // 7. 完成
            await pg
                .update(workflowInstanceSchema)
                .set({
                    status: 'completed',
                    output: ctx.stepOutputs as any,
                    context: { stepOutputs: ctx.stepOutputs } as any,
                    completedAt: new Date(),
                    updatedAt: new Date(),
                } as any)
                .where(eq(workflowInstanceSchema.id, instanceId));

            emit?.emit('workflow-complete', {
                instanceId,
                output: ctx.stepOutputs,
            });

        } catch (e: any) {
            // 挂起类错误（WaitStep）不是真正的失败
            if (e?.name === 'WorkflowPausedError') {
                await this.persistProgress(instanceId, e.stepId, completedSteps, ctx);
                emit?.emit('workflow-paused', {
                    instanceId,
                    stepId: e.stepId,
                    reason: e.message,
                });
                return;
            }

            // 真失败
            await this.failInstance(instanceId, e.message, e.stepId);
            emit?.emit('workflow-failed', {
                instanceId,
                error: e.message,
                stepId: e.stepId,
            });
        }
    }

    // ========== Steps Execution (Recursive) ==========

    private async executeSteps(
        steps: Step[],
        ctx: WorkflowContext,
        instanceId: number,
        completedSteps: Set<string>,
        parentRetry: RetryPolicy,
        emit?: WorkflowEventEmitter,
    ): Promise<void> {
        for (const step of steps) {
            // 检查实例是否被取消/暂停
            await this.checkInstanceStatus(instanceId);

            // 跳过已完成的步骤（崩溃恢复）
            if (completedSteps.has(step.id)) continue;

            const stepRetry = step.retryPolicy || parentRetry;
            const stepTimeout = step.timeoutMs || 30_000;

            emit?.emit('step-start', {
                instanceId,
                stepId: step.id,
                stepName: step.name,
                stepType: step.type,
            });

            const startedAt = Date.now();

            try {
                const output = await this.executeStepWithRetry(
                    step,
                    ctx,
                    instanceId,
                    stepRetry,
                    stepTimeout,
                    emit,
                );

                // 记录步骤完成
                const durationMs = Date.now() - startedAt;
                await this.recordStepExecution(instanceId, step, 'completed', {
                    output: output.output,
                    durationMs,
                    usage: output.usage,
                });

                // 更新上下文
                if (step.type !== 'conditional' && step.type !== 'parallel') {
                    const key = (step as any).outputKey || step.id;
                    ctx.stepOutputs[key] = (output.output as Record<string, unknown>) || {
                        result: output.output,
                    };
                }

                completedSteps.add(step.id);

                emit?.emit('step-complete', {
                    instanceId,
                    stepId: step.id,
                    output: output.output,
                    durationMs,
                });

                // 条件分支：递归执行匹配分支的步骤
                if (step.type === 'conditional') {
                    const condStep = step as ConditionalStep;
                    const selectedOutput = (output.output as Record<string, unknown>) || {};
                    const selectedBranch = selectedOutput._selectedBranch as string;

                    let branchSteps: Step[] | undefined;
                    for (const branch of condStep.branches) {
                        if (branch.label === selectedBranch) {
                            branchSteps = branch.steps;
                            break;
                        }
                    }

                    if (!branchSteps) {
                        branchSteps = condStep.defaultBranch;
                    }

                    if (branchSteps && branchSteps.length > 0) {
                        // 为分支创建新的 completedSteps 上下文
                        const branchCompleted = new Set<string>();
                        await this.executeSteps(
                            branchSteps,
                            ctx,
                            instanceId,
                            branchCompleted,
                            stepRetry,
                            emit,
                        );
                        // 将分支完成的步骤也标记
                        for (const sid of branchCompleted) {
                            completedSteps.add(sid);
                        }
                    }
                }
            } catch (e: any) {
                // 挂起不在此层处理，重新抛出
                if (e?.name === 'WorkflowPausedError') throw e;

                await this.recordStepExecution(instanceId, step, 'failed', {
                    error: e.message,
                    durationMs: Date.now() - startedAt,
                });

                emit?.emit('step-failed', {
                    instanceId,
                    stepId: step.id,
                    error: e.message,
                });

                throw Object.assign(e, { stepId: step.id });
            }

            // 每步完成后持久化进度
            await this.persistProgress(instanceId, step.id, completedSteps, ctx);
        }
    }

    // ========== Single Step with Retry ==========

    private async executeStepWithRetry(
        step: Step,
        ctx: WorkflowContext,
        instanceId: number,
        retryPolicy: RetryPolicy,
        timeoutMs: number,
        emit?: WorkflowEventEmitter,
    ): Promise<StepResult> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
            try {
                const result = await this.withTimeout(
                    this.dispatchStep(step, ctx),
                    timeoutMs,
                );
                return { output: result, usage: (result as any)?.usage };
            } catch (e: any) {
                lastError = e;

                if (e?.name === 'WorkflowPausedError') throw e;
                if (e?.name === 'TimeoutError') {
                    lastError = new Error(`Step "${step.id}" timed out after ${timeoutMs}ms`);
                }

                const isRetryable = this.isRetryable(step, e, retryPolicy);

                if (attempt < retryPolicy.maxAttempts && isRetryable) {
                    const delay = calcDelay(retryPolicy, attempt);
                    emit?.emit('step-retrying', {
                        instanceId,
                        stepId: step.id,
                        attempt: attempt + 1,
                        maxAttempts: retryPolicy.maxAttempts,
                        delayMs: delay,
                        error: lastError.message,
                    });
                    await sleep(delay);
                    continue;
                }
                break;
            }
        }

        throw lastError || new Error(`Step "${step.id}" failed`);
    }

    // ========== Step Dispatch ==========

    private async dispatchStep(step: Step, ctx: WorkflowContext): Promise<unknown> {
        switch (step.type) {
            case 'tool':
                return this.executeToolStep(step as ToolStep, ctx);
            case 'llm':
                return this.executeLLMStep(step as LLMStep, ctx);
            case 'conditional':
                return this.executeConditionalStep(step as ConditionalStep, ctx);
            case 'parallel':
                return this.executeParallelStep(step as ParallelStep, ctx);
            case 'wait':
                return this.executeWaitStep(step as WaitStep);
            case 'sub_workflow':
                return this.executeSubWorkflowStep(step as SubWorkflowStep, ctx);
            default:
                throw new Error(`Unknown step type: ${(step as any).type}`);
        }
    }

    // ========== Tool Step ==========

    private async executeToolStep(step: ToolStep, ctx: WorkflowContext): Promise<unknown> {
        const reg = getTool(step.tool);
        if (!reg) {
            throw new Error(`Tool "${step.tool}" not registered`);
        }

        // 解析 input 中的模板变量
        const resolvedInput = resolveTemplate(step.input, ctx) as Record<string, unknown>;

        // 设置工具上下文
        setActiveToolContext({
            userId: ctx.userId,
            userName: ctx.userName,
            permissions: ctx.permissions || [],
            roles: ctx.roles || [],
        });

        try {
            const result = await reg.handler(resolvedInput, {
                userId: ctx.userId,
                userName: ctx.userName,
                permissions: ctx.permissions || [],
                roles: ctx.roles || [],
            });

            // 尝试解析 JSON
            try {
                return JSON.parse(result);
            } catch {
                return { result };
            }
        } finally {
            clearActiveToolContext();
        }
    }

    // ========== LLM Step ==========

    private async executeLLMStep(step: LLMStep, ctx: WorkflowContext): Promise<unknown> {
        const agentCfg = config.agent;

        // 解析模板
        const systemPrompt = resolveTemplate(step.systemPrompt, ctx) as string;
        const userPrompt = resolveTemplate(step.userPrompt, ctx) as string;

        const provider = createProvider({
            provider: 'openai',
            apiKey: agentCfg.apiKey || process.env.AGENT_API_KEY || '',
            apiBase: agentCfg.apiBase,
            model: step.model || agentCfg.model,
        });

        // 构建工具集
        let tools: Record<string, any> | undefined;
        if (step.tools && step.tools.length > 0) {
            // 复用 ToolRegistry 的 buildToolSet
            const { buildToolSet } = await import('../agent/core/tool-registry');
            tools = buildToolSet(step.tools) as any;
        }

        try {
            const result = await generateText({
                model: provider,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
                tools: tools && Object.keys(tools).length > 0 ? tools : undefined,
                maxSteps: step.maxToolRounds || 3,
                temperature: step.temperature ?? 0.7,
                ...(step.outputSchema
                    ? { experimental_output: aiJsonSchema(step.outputSchema as any) }
                    : {}),
            });

            return {
                text: result.text,
                usage: result.usage
                    ? {
                        promptTokens: result.usage.promptTokens,
                        completionTokens: result.usage.completionTokens,
                    }
                    : undefined,
            };
        } catch (e: any) {
            if (e.responseBody) {
                throw new Error(
                    `LLM API error (${e.statusCode || '?'}): ${JSON.stringify(e.responseBody)}`,
                );
            }
            throw e;
        }
    }

    // ========== Conditional Step ==========

    private async executeConditionalStep(
        step: ConditionalStep,
        ctx: WorkflowContext,
    ): Promise<unknown> {
        for (const branch of step.branches) {
            const matched = evaluateCondition(branch.condition, ctx);
            if (matched) {
                return {
                    _selectedBranch: branch.label,
                    matched: true,
                };
            }
        }

        // 默认分支
        if (step.defaultBranch) {
            return {
                _selectedBranch: '_default',
                matched: true,
            };
        }

        return {
            _selectedBranch: '_none',
            matched: false,
        };
    }

    // ========== Parallel Step ==========

    private async executeParallelStep(
        step: ParallelStep,
        ctx: WorkflowContext,
    ): Promise<unknown> {
        const strategy = step.strategy || 'all';

        const branchPromises = step.branches.map(async (branch, i) => {
            // 每个分支独立执行其子步骤
            const branchCtx: WorkflowContext = {
                ...ctx,
                stepOutputs: { ...ctx.stepOutputs },
            };
            const branchCompleted = new Set<string>();
            const branchRetry = DEFAULT_RETRY_POLICY;

            // 简化处理：直接执行步骤（非递归 executeSteps 以保持独立）
            const results: unknown[] = [];
            for (const s of branch.steps) {
                if (branchCompleted.has(s.id)) continue;
                const output = await this.executeStepWithRetry(
                    s,
                    branchCtx,
                    0, // 并行分支不写入 instance
                    branchRetry,
                    s.timeoutMs || 30_000,
                );
                results.push(output.output);
                branchCompleted.add(s.id);
                const key = (s as any).outputKey || s.id;
                branchCtx.stepOutputs[key] = (output.output as Record<string, unknown>) || {
                    result: output.output,
                };
            }

            return {
                label: branch.label || `branch-${i}`,
                results,
                outputs: branchCtx.stepOutputs,
            };
        });

        if (strategy === 'race') {
            const result = await Promise.race(branchPromises);
            return { winner: result.label, ...result };
        }

        // 'all' — 等待所有分支完成
        const allResults = await Promise.all(branchPromises);

        // 合并所有分支的输出
        const mergedOutputs: Record<string, unknown> = {};
        for (const r of allResults) {
            mergedOutputs[r.label] = { results: r.results, outputs: r.outputs };
        }

        return mergedOutputs;
    }

    // ========== Wait Step ==========

    private async executeWaitStep(step: WaitStep): Promise<unknown> {
        switch (step.waitType) {
            case 'delay':
                if (step.config.delayMs) {
                    await sleep(step.config.delayMs);
                    return { waited: step.config.delayMs };
                }
                return { waited: 0 };

            case 'approval':
            case 'webhook': {
                // 挂起工作流，等待外部 resume
                const err = new Error(
                    step.config.approvalPrompt || `Waiting for ${step.waitType}`,
                );
                (err as any).name = 'WorkflowPausedError';
                (err as any).stepId = step.id;
                throw err;
            }

            default:
                throw new Error(`Unknown wait type: ${(step as any).waitType}`);
        }
    }

    // ========== Sub-Workflow Step ==========

    private async executeSubWorkflowStep(
        step: SubWorkflowStep,
        ctx: WorkflowContext,
    ): Promise<unknown> {
        const resolvedInput = resolveTemplate(step.input, ctx) as Record<string, unknown>;

        // 创建子工作流实例
        const subInstanceId = await this.submit(
            // 查找子工作流定义 — 通过 name
            0, // placeholder; 实际应通过 registry 查找
            resolvedInput,
            ctx.userId,
            { triggerType: 'sub_workflow' },
        );

        // TODO: 等待子工作流完成
        // 简化实现：直接执行
        const subDef = await getWorkflow(step.workflowId);
        if (!subDef) {
            throw new Error(`Sub-workflow "${step.workflowId}" not found`);
        }

        // 这里需要等待子工作流，但为了避免循环依赖，返回简单结果
        return {
            subWorkflowId: step.workflowId,
            subInstanceId,
            status: 'submitted',
        };
    }

    // ========== Persistence ==========

    private async persistProgress(
        instanceId: number,
        currentStepId: string,
        completedSteps: Set<string>,
        ctx: WorkflowContext,
    ): Promise<void> {
        await pg
            .update(workflowInstanceSchema)
            .set({
                currentStepId,
                completedSteps: [...completedSteps] as any,
                context: { stepOutputs: ctx.stepOutputs } as any,
                updatedAt: new Date(),
            } as any)
            .where(eq(workflowInstanceSchema.id, instanceId));
    }

    private async recordStepExecution(
        instanceId: number,
        step: Step,
        status: string,
        opts: {
            output?: unknown;
            error?: string;
            durationMs?: number;
            usage?: { promptTokens: number; completionTokens: number };
        },
    ): Promise<void> {
        await pg.insert(workflowStepExecutionSchema).values({
            instanceId,
            stepId: step.id,
            stepType: step.type,
            stepName: step.name || '',
            status,
            output: opts.output ? (opts.output as any) : null,
            errorMessage: opts.error || null,
            durationMs: opts.durationMs || null,
            tokenUsage: opts.usage ? (opts.usage as any) : null,
            modelUsed: step.type === 'llm' ? ((step as LLMStep).model || config.agent.model) : null,
            startedAt: new Date(Date.now() - (opts.durationMs || 0)).toISOString() as any,
            completedAt: new Date().toISOString() as any,
        } as any);
    }

    private async failInstance(
        instanceId: number,
        errorMessage: string,
        errorStepId?: string,
    ): Promise<void> {
        await pg
            .update(workflowInstanceSchema)
            .set({
                status: 'failed',
                errorMessage,
                errorStepId: errorStepId || null,
                completedAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .where(eq(workflowInstanceSchema.id, instanceId));
    }

    private async checkInstanceStatus(instanceId: number): Promise<void> {
        const [instance] = await pg
            .select({ status: workflowInstanceSchema.status })
            .from(workflowInstanceSchema)
            .where(eq(workflowInstanceSchema.id, instanceId))
            .limit(1);

        if (!instance) throw new Error(`Instance ${instanceId} not found`);
        if (instance.status === 'cancelled') throw new Error('Workflow was cancelled');
        if (instance.status === 'paused') {
            const err = new Error('Workflow is paused');
            (err as any).name = 'WorkflowPausedError';
            throw err;
        }
    }

    // ========== Helpers ==========

    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        if (timeoutMs <= 0) return promise;

        let timer: any;
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
                const err = new Error(`Operation timed out after ${timeoutMs}ms`);
                (err as any).name = 'TimeoutError';
                reject(err);
            }, timeoutMs);
        });

        try {
            return await Promise.race([promise, timeout]);
        } finally {
            clearTimeout(timer);
        }
    }

    private isRetryable(
        step: Step,
        error: Error,
        retryPolicy: RetryPolicy,
    ): boolean {
        // Schema 校验错误不重试
        if (error.message?.includes('Schema') || error.message?.includes('validation')) {
            return false;
        }
        // 权限错误不重试
        if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
            return false;
        }
        // 工具不存在不重试
        if (error.message?.includes('not registered')) {
            return false;
        }
        // 白名单匹配
        if (retryPolicy.retryableErrors && retryPolicy.retryableErrors.length > 0) {
            return retryPolicy.retryableErrors.some(pattern =>
                error.message?.includes(pattern),
            );
        }

        // 默认可重试：网络错误、超时、LLM API 错误
        return true;
    }
}

// ============== Condition Evaluator ==============

function evaluateCondition(cond: Condition, ctx: WorkflowContext): boolean {
    if ('eq' in cond) {
        const [path, expected] = cond.eq;
        const val = resolveConditionValue(path, ctx);
        return val === expected;
    }
    if ('neq' in cond) {
        const [path, expected] = cond.neq;
        const val = resolveConditionValue(path, ctx);
        return val !== expected;
    }
    if ('gt' in cond) {
        const [path, expected] = cond.gt;
        const val = Number(resolveConditionValue(path, ctx));
        return val > expected;
    }
    if ('lt' in cond) {
        const [path, expected] = cond.lt;
        const val = Number(resolveConditionValue(path, ctx));
        return val < expected;
    }
    if ('gte' in cond) {
        const [path, expected] = cond.gte;
        const val = Number(resolveConditionValue(path, ctx));
        return val >= expected;
    }
    if ('lte' in cond) {
        const [path, expected] = cond.lte;
        const val = Number(resolveConditionValue(path, ctx));
        return val <= expected;
    }
    if ('in' in cond) {
        const [path, values] = cond.in;
        const val = resolveConditionValue(path, ctx);
        return values.includes(val);
    }
    if ('contains' in cond) {
        const [path, substr] = cond.contains;
        const val = String(resolveConditionValue(path, ctx));
        return val.includes(substr);
    }
    if ('and' in cond) {
        return cond.and.every(c => evaluateCondition(c, ctx));
    }
    if ('or' in cond) {
        return cond.or.some(c => evaluateCondition(c, ctx));
    }
    if ('not' in cond) {
        return !evaluateCondition(cond.not, ctx);
    }
    return false;
}

function resolveConditionValue(path: string, ctx: WorkflowContext): unknown {
    // 直接值（数字、布尔、字符串）
    if (path.startsWith('"') || path.startsWith("'")) {
        return path.slice(1, -1);
    }
    if (path === 'true') return true;
    if (path === 'false') return false;
    const num = Number(path);
    if (!isNaN(num) && path.trim() !== '') return num;

    // 否则当作模板路径解析
    try {
        const { resolveTemplate } = require('./template-engine');
        return resolveTemplate(`{{${path}}}`, ctx);
    } catch {
        return path; // 返回原始值
    }
}

// ============== Singleton ==============

export const workflowExecutor = new WorkflowExecutor();
