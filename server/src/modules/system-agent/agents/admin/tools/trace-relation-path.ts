import { registerTool } from '@/core/agent/tool-registry';
import { FindAll, CreateQueryBuilder } from '@/core/database/repository';
import { metadataCollectionsSchema } from '@database/schema/metadata_collections';
import { metadataRelationsSchema } from '@database/schema/metadata_relations';

interface Edge {
    relationId: number; name: string; type: string;
    sourceField: string; targetField: string;
    junctionTable: Record<string, unknown> | null; remark: string; targetId: number;
}

function addEdge(g: Map<number, Edge[]>, f: number, t: number, base: Omit<Edge, 'targetId'>) {
    if (!g.has(f)) g.set(f, []);
    g.get(f)!.push({ ...base, targetId: t });
}

async function traceRelationPath(args: Record<string, unknown>) {
    const sourceTable = args.sourceTable as string;
    const targetTable = (args.targetTable as string) || null;
    const maxDepth = (args.maxDepth as number) || 5;

    const collections = await FindAll(metadataCollectionsSchema,
        CreateQueryBuilder(metadataCollectionsSchema).eq('delFlag', false).build());
    const tableToId = new Map<string, number>();
    const idToTable = new Map<number, string>();
    const tableLabels = new Map<string, string>();
    for (const c of collections) {
        tableToId.set(c.tableName, c.id);
        idToTable.set(c.id, c.tableName);
        tableLabels.set(c.tableName, (c as any).label || c.tableName);
    }

    const startId = tableToId.get(sourceTable);
    if (!startId) {
        return JSON.stringify({ error: `未在元数据中找到表: ${sourceTable}` });
    }

    const endId = targetTable ? tableToId.get(targetTable) : null;
    if (targetTable && !endId) {
        return JSON.stringify({ error: `未在元数据中找到表: ${targetTable}` });
    }

    const relations = await FindAll(metadataRelationsSchema,
        CreateQueryBuilder(metadataRelationsSchema).eq('delFlag', false).eq('status', 'active').build());

    const graph = new Map<number, Edge[]>();
    for (const rel of relations) {
        const r = rel as any;
        const srcId = Number(r.sourceCollectionId);
        const tgtId = Number(r.targetCollectionId);
        const jt = r.junctionTable as Record<string, unknown> | null;
        addEdge(graph, srcId, tgtId, {
            relationId: Number(r.relationId), name: r.name as string, type: r.type as string,
            sourceField: r.sourceField as string, targetField: r.targetField as string,
            junctionTable: jt, remark: (r.remark as string) || '',
        });
        addEdge(graph, tgtId, srcId, {
            relationId: Number(r.relationId), name: r.name as string,
            type: r.type === 'many_to_many' ? 'many_to_many' : 'belongs_to',
            sourceField: r.targetField as string, targetField: r.sourceField as string,
            junctionTable: jt, remark: (r.remark as string) || '',
        });
    }

    const paths: { steps: { from: string; relation: string; to: string; label: string; }[]; description: string }[] = [];
    const queue: { nodeId: number; steps: any[]; visited: Set<number> }[] = [
        { nodeId: startId, steps: [], visited: new Set([startId]) },
    ];

    while (queue.length > 0 && paths.length < 10) {
        const { nodeId, steps, visited } = queue.shift()!;
        if (steps.length >= maxDepth) continue;
        const neighbors = graph.get(nodeId) || [];
        for (const edge of neighbors) {
            if (visited.has(edge.targetId)) continue;
            const step = { from: idToTable.get(nodeId)!, relation: edge.type, to: idToTable.get(edge.targetId)!, label: edge.name };
            const newSteps = [...steps, step];
            const newVisited = new Set(visited);
            newVisited.add(edge.targetId);
            if (endId && edge.targetId === endId) {
                paths.push({ steps: newSteps, description: newSteps.map(s => `${s.label} → ${s.to}`).join('；') });
            } else {
                queue.push({ nodeId: edge.targetId, steps: newSteps, visited: newVisited });
            }
        }
    }

    if (!endId) {
        const reachable = new Set<string>();
        for (const [, edges] of graph) {
            for (const e of edges) {
                if (e.targetId !== startId) reachable.add(idToTable.get(e.targetId)!);
            }
        }
        return JSON.stringify({
            sourceTable,
            reachableFromSource: [...reachable].map(t => ({ table: t, label: tableLabels.get(t) || t })),
            paths: paths.length > 0 ? paths.slice(0, 5) : undefined,
        });
    }

    return JSON.stringify({
        sourceTable, targetTable,
        paths: paths.slice(0, 5),
        ...(paths.length === 0 ? { message: `从 ${sourceTable} 到 ${targetTable} 在深度 ${maxDepth} 内未找到路径` } : {}),
    });
}

registerTool({
    name: 'trace_relation_path',
    description: '链式查询系统表间的关联关系。给定起点表和可选终点表，BFS 遍历 metadata_relations 图，返回所有可达路径',
    parameters: {
        type: 'object',
        properties: {
            sourceTable: { type: 'string', description: '起点表名，如 system_menu' },
            targetTable: { type: 'string', description: '可选终点表名，如 system_user' },
            maxDepth: { type: 'integer', description: '最大遍历深度，默认 5', default: 5 },
        },
        required: ['sourceTable'],
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await traceRelationPath(args); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
