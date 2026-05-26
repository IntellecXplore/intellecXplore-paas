import type { WorkflowContext } from './types';

// ============== Template Engine ==============

const TEMPLATE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * 解析模板字符串中的变量引用。
 * 支持语法：
 *   {{input.field}}              — 工作流入参
 *   {{step.stepId.output.field}} — 上游步骤输出
 *   {{step.stepId.output}}       — 上游步骤完整输出
 *   {{global.userId}}            — 全局上下文
 *   {{value || "default"}}       — 默认值
 */
export function resolveTemplate(
    template: unknown,
    ctx: WorkflowContext,
): unknown {
    if (typeof template === 'string') {
        return template.replace(TEMPLATE_REGEX, (_, expr: string) => {
            return resolveExpression(expr.trim(), ctx);
        });
    }
    if (Array.isArray(template)) {
        return template.map(item => resolveTemplate(item, ctx));
    }
    if (template && typeof template === 'object') {
        const resolved: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(template as Record<string, unknown>)) {
            resolved[key] = resolveTemplate(value, ctx);
        }
        return resolved;
    }
    return template;
}

function resolveExpression(expr: string, ctx: WorkflowContext): string {
    // 处理 || 默认值
    if (expr.includes('||')) {
        const [path, defaultVal] = expr.split('||').map(s => s.trim());
        try {
            const val = resolvePath(path, ctx);
            if (val !== undefined && val !== null) return formatValue(val);
        } catch {
            // fall through to default
        }
        return defaultVal.replace(/^["']|["']$/g, '');
    }

    try {
        const val = resolvePath(expr, ctx);
        return formatValue(val);
    } catch {
        console.warn(`[template-engine] Unable to resolve: "${expr}", keeping placeholder`);
        return `{{${expr}}}`;
    }
}

const PATH_PREFIXES: Record<string, (ctx: WorkflowContext) => unknown> = {
    input: (ctx) => ctx.input,
    global: (ctx) => ({
        userId: ctx.userId,
        userName: ctx.userName,
        permissions: ctx.permissions,
        roles: ctx.roles,
    }),
};

function resolvePath(path: string, ctx: WorkflowContext): unknown {
    const parts = path.split('.');
    let current: unknown;

    if (parts[0] === 'prev') {
        throw new Error('{{prev}} not supported in path resolution — use {{step.stepId.output}}');
    }

    const prefixFn = PATH_PREFIXES[parts[0]];
    if (prefixFn) {
        current = prefixFn(ctx);
        parts.shift();
    } else if (parts[0] === 'step') {
        parts.shift();
    } else {
        const stepId = parts[0];
        const stepOutput = ctx.stepOutputs[stepId];
        if (stepOutput === undefined) {
            throw new Error(`Step "${stepId}" output not found in context`);
        }
        current = stepOutput;
        parts.shift();
    }

    for (const part of parts) {
        if (current === undefined || current === null) {
            throw new Error(`Null/undefined at "${part}" in path: ${path}`);
        }
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
            current = (current as any)[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
        } else {
            current = (current as any)?.[part];
        }
    }

    return current;
}

function formatValue(val: unknown): string {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'bigint') return String(val);
    return JSON.stringify(val);
}

/**
 * 判断字符串中是否包含模板变量
 */
export function hasTemplates(str: string): boolean {
    TEMPLATE_REGEX.lastIndex = 0;
    return TEMPLATE_REGEX.test(str);
}

/**
 * 提取字符串中的所有模板变量名
 */
export function extractTemplateVars(template: string): string[] {
    const vars: string[] = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = regex.exec(template)) !== null) {
        const expr = match[1].trim();
        // 去掉默认值部分
        const varName = expr.includes('||') ? expr.split('||')[0].trim() : expr;
        vars.push(varName);
    }
    return [...new Set(vars)];
}
