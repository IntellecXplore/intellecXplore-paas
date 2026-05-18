// ============== Workflow Core Types ==============

// === 重试策略 ===
export interface RetryPolicy {
    maxAttempts: number       // 最大尝试次数（默认 3）
    initialDelayMs: number    // 首次重试延迟（默认 1000）
    backoffMultiplier: number // 退避倍数（默认 2）
    maxDelayMs: number        // 最大延迟（默认 60000）
    retryableErrors?: string[] // 可重试的错误类型
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 60000,
}

// === 步骤类型 ===
export type StepType = 'tool' | 'llm' | 'conditional' | 'parallel' | 'wait' | 'sub_workflow'

export interface BaseStep {
    id: string
    name: string
    description?: string
    retryPolicy?: RetryPolicy
    timeoutMs?: number
}

export interface ToolStep extends BaseStep {
    type: 'tool'
    tool: string                                  // ToolRegistry 中的工具名
    input: Record<string, unknown>                // 工具参数，支持 {{}} 模板
    outputKey?: string
}

export interface LLMStep extends BaseStep {
    type: 'llm'
    model?: string                                // 默认用 config 中的 agent.model
    systemPrompt: string
    userPrompt: string
    tools?: string[]                              // 可选工具列表
    maxToolRounds?: number
    outputSchema?: Record<string, unknown>        // JSON Schema for structured output
    temperature?: number
    outputKey?: string
}

export type Condition =
    | { eq: [string, unknown] }
    | { neq: [string, unknown] }
    | { gt: [string, number] }
    | { lt: [string, number] }
    | { gte: [string, number] }
    | { lte: [string, number] }
    | { in: [string, unknown[]] }
    | { contains: [string, string] }
    | { and: Condition[] }
    | { or: Condition[] }
    | { not: Condition }

export interface ConditionBranch {
    condition: Condition
    label: string
    steps: Step[]         // 该分支内的步骤
}

export interface ConditionalStep extends BaseStep {
    type: 'conditional'
    branches: ConditionBranch[]
    defaultBranch?: Step[] // 无匹配时执行
}

export interface ParallelBranch {
    label?: string
    steps: Step[]
}

export interface ParallelStep extends BaseStep {
    type: 'parallel'
    branches: ParallelBranch[]
    strategy?: 'all' | 'any'  // 等待策略
}

export interface WaitStep extends BaseStep {
    type: 'wait'
    waitType: 'delay' | 'approval' | 'webhook'
    config: {
        delayMs?: number
        until?: string           // ISO 时间戳或 cron
        approvalPrompt?: string
        webhookToken?: string
    }
}

export interface SubWorkflowStep extends BaseStep {
    type: 'sub_workflow'
    workflowId: string
    input: Record<string, unknown>
    outputKey?: string
}

export type Step =
    | ToolStep
    | LLMStep
    | ConditionalStep
    | ParallelStep
    | WaitStep
    | SubWorkflowStep

// === 工作流定义（存储在 DB JSONB 中） ===
export interface WorkflowDefinition {
    id: string
    name: string
    description?: string
    version: number
    steps: Step[]
    retryPolicy?: RetryPolicy
    timeoutMs?: number
    inputSchema?: Record<string, unknown>  // JSON Schema
}

// === 工作流状态 ===

export type WorkflowStatus =
    | 'pending'
    | 'running'
    | 'paused'
    | 'waiting_approval'
    | 'waiting_event'
    | 'completed'
    | 'failed'
    | 'cancelled'

export type StepStatus =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'retrying'
    | 'skipped'

// === 执行上下文 ===
export interface WorkflowContext {
    input: Record<string, unknown>
    stepOutputs: Record<string, Record<string, unknown>>
    userId: number
    userName?: string
    permissions?: string[]
    roles?: string[]
}

// === 步骤执行结果 ===
export interface StepResult {
    output: unknown
    durationMs?: number
    usage?: {
        promptTokens: number
        completionTokens: number
    }
}

// === 工作流执行事件（SSE） ===
export type WorkflowEventType =
    | 'step-start'
    | 'step-progress'
    | 'step-complete'
    | 'step-failed'
    | 'step-retrying'
    | 'workflow-complete'
    | 'workflow-failed'
    | 'workflow-paused'
    | 'workflow-cancelled'

export interface WorkflowEvent {
    type: WorkflowEventType
    instanceId: string
    stepId?: string
    data: Record<string, unknown>
    timestamp: string
}
