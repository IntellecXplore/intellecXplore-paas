import pg from '@/core/database/pg';
import { workflowDefinitionSchema } from '@database/schema/workflow_definition';
import { eq, and, isNull } from 'drizzle-orm';
import type { WorkflowDefinition } from './types';

// ============== Workflow Registry ==============

/** 内存中代码注册的工作流 */
const codeRegistry = new Map<string, WorkflowDefinition>();

/**
 * 从代码注册工作流定义（开发者使用，不走 DB）
 */
export function registerWorkflow(def: WorkflowDefinition): void {
    if (codeRegistry.has(def.id)) {
        throw new Error(`Workflow "${def.id}" already registered`);
    }
    codeRegistry.set(def.id, def);
}

/**
 * 获取工作流定义（优先代码注册，其次 DB）
 */
export async function getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    const codeDef = codeRegistry.get(id);
    if (codeDef) return codeDef;

    // 尝试从 DB 加载已发布版本
    try {
        const rows = await pg
            .select()
            .from(workflowDefinitionSchema)
            .where(
                and(
                    eq(workflowDefinitionSchema.name, id),
                    eq(workflowDefinitionSchema.status, 'published'),
                )
            )
            .orderBy(workflowDefinitionSchema.version.desc())
            .limit(1);

        if (rows.length > 0) {
            return {
                ...(rows[0].definition as WorkflowDefinition),
                version: rows[0].version,
            };
        }
    } catch (e: any) {
        console.warn(`[workflow-registry] DB lookup failed for "${id}":`, e.message);
    }

    return null;
}

/**
 * 通过 DB 主键获取工作流定义
 */
export async function getWorkflowById(id: number): Promise<WorkflowDefinition | null> {
    try {
        const rows = await pg
            .select()
            .from(workflowDefinitionSchema)
            .where(eq(workflowDefinitionSchema.id, id))
            .limit(1);

        if (rows.length > 0) {
            return {
                ...(rows[0].definition as WorkflowDefinition),
                version: rows[0].version,
            };
        }
    } catch (e: any) {
        console.warn(`[workflow-registry] DB lookup failed for id=${id}:`, e.message);
    }
    return null;
}

/**
 * 列出所有可用工作流定义
 */
export async function listWorkflows(): Promise<WorkflowDefinition[]> {
    const result: WorkflowDefinition[] = [];

    // 代码注册的
    for (const [id, def] of codeRegistry) {
        result.push(def);
    }

    // DB 中已发布的
    try {
        const rows = await pg
            .select()
            .from(workflowDefinitionSchema)
            .where(eq(workflowDefinitionSchema.status, 'published'))
            .orderBy(workflowDefinitionSchema.name.asc());

        for (const row of rows) {
            // 避免与代码注册的重名
            if (!codeRegistry.has(row.name)) {
                result.push({
                    ...(row.definition as WorkflowDefinition),
                    version: row.version,
                });
            }
        }
    } catch (e: any) {
        console.warn('[workflow-registry] DB listing failed:', e.message);
    }

    return result;
}

/**
 * 检查工作流是否存在
 */
export async function workflowExists(name: string): Promise<boolean> {
    if (codeRegistry.has(name)) return true;
    try {
        const rows = await pg
            .select({ id: workflowDefinitionSchema.id })
            .from(workflowDefinitionSchema)
            .where(
                and(
                    eq(workflowDefinitionSchema.name, name),
                    eq(workflowDefinitionSchema.status, 'published'),
                )
            )
            .limit(1);
        return rows.length > 0;
    } catch {
        return false;
    }
}
