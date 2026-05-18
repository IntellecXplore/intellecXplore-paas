import { tool, jsonSchema } from 'ai';

// ============== Tool Context ==============

export interface ToolContext {
    userId: number;
    userName?: string;
    permissions: string[];
    roles: string[];
}

// ============== JSON Schema 类型 ==============

interface JSONSchemaProperty {
    type: string;
    description?: string;
    enum?: string[];
    items?: JSONSchemaProperty;
    properties?: Record<string, JSONSchemaProperty>;
    default?: unknown;
}

interface JSONSchemaDefinition {
    type: string;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
    additionalProperties?: boolean;
}

// ============== Tool Registration ==============

type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>;

export interface ToolRegistration {
    name: string;
    description: string;
    parameters: JSONSchemaDefinition;
    handler: ToolHandler;
    /** 工具是否幂等（读操作 = true，写操作 = false）。用于 workflow 重试决策 */
    idempotent?: boolean;
    /** 工具执行超时 (ms)，默认 30000 */
    timeoutMs?: number;
}

const registry = new Map<string, ToolRegistration>();

/** 当前活跃的工具上下文（在 agent loop 开始前设置） */
let activeToolContext: ToolContext | null = null;

export function setActiveToolContext(ctx: ToolContext) {
    activeToolContext = ctx;
}

export function clearActiveToolContext() {
    activeToolContext = null;
}

export function registerTool(reg: ToolRegistration) {
    if (registry.has(reg.name)) {
        throw new Error(`Tool "${reg.name}" already registered`);
    }
    registry.set(reg.name, reg);
}

export function getTool(name: string): ToolRegistration | undefined {
    return registry.get(name);
}

/** 获取所有已注册的工具（供 workflow 编辑器列出可用工具） */
export function getAllTools(): ToolRegistration[] {
    return Array.from(registry.values());
}

/** 获取工具配置 schema 摘要（供前端生成配置表单） */
export function getToolSchemas(): Record<string, {
    description: string;
    parameters: JSONSchemaDefinition;
    idempotent: boolean;
    timeoutMs: number;
}> {
    const result: Record<string, any> = {};
    for (const [name, reg] of registry) {
        result[name] = {
            description: reg.description,
            parameters: reg.parameters,
            idempotent: reg.idempotent ?? false,
            timeoutMs: reg.timeoutMs ?? 30000,
        };
    }
    return result;
}

/**
 * 将注册表中指定名称的工具转换为 AI SDK v6 tool set。
 * 使用 jsonSchema() 直接传递 JSON Schema，绕过 Zod 序列化问题。
 */
export function buildToolSet(names: string[]) {
    const tools: Record<string, ReturnType<typeof tool>> = {};

    for (const name of names) {
        const reg = registry.get(name);
        if (!reg) {
            console.warn(`[tool-registry] Tool "${name}" not found in registry, skipping`);
            continue;
        }

        tools[name] = tool({
            description: reg.description,
            inputSchema: jsonSchema(reg.parameters),
            execute: async (args: any) => {
                const ctx = activeToolContext;
                if (!ctx) {
                    throw new Error('Tool context not set — call setActiveToolContext before agent loop');
                }
                try {
                    return await reg.handler(args, ctx);
                } catch (e: any) {
                    return JSON.stringify({ error: e.message || 'Tool execution failed' });
                }
            },
        });
    }

    return tools;
}

export function getRegisteredToolNames(): string[] {
    return Array.from(registry.keys());
}
