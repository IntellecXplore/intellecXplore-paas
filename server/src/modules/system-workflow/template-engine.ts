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

function resolvePath(path: string, ctx: WorkflowContext): unknown {
    const parts = path.split('.');
    let current: unknown;

    // 前缀路由
    if (parts[0] === 'input') {
        current = ctx.input;
        parts.shift();
    } else if (parts[0] === 'step') {
        parts.shift(); // 跳过 'step'
    } else if (parts[0] === 'global') {
        current = {
            userId: ctx.userId,
            userName: ctx.userName,
            permissions: ctx.permissions,
            roles: ctx.roles,
        };
        parts.shift();
    } else if (parts[0] === 'prev') {
        // {{prev}} = 上一个步骤的完整输出（特殊语法）
        throw new Error('{{prev}} not supported in path resolution — use {{step.stepId.output}}');
    } else {
        // 可能是 stepId 直接引用：stepId.output.field
        const stepId = parts[0];
        const stepOutput = ctx.stepOutputs[stepId];
        if (stepOutput !== undefined) {
            current = stepOutput;
            parts.shift();
        } else {
            throw new Error(`Step "${stepId}" output not found in context`);
        }
    }

    // 遍历剩余的路径段
    for (const part of parts) {
        if (current === undefined || current === null) {
            throw new Error(`Null/undefined at "${part}" in path: ${path}`);
        }
        // 处理数组索引：field[0]
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
    try {
        return JSON.stringify(val);
    } catch {
        return String(val);
    }
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
