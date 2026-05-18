/**
 * 工作流种子数据
 *
 * 运行: bun run server/script/seed-workflow.ts
 *
 * 使用 pg 直连数据库，插入示例工作流定义，方便开发调试。
 */
import pg from '../src/core/database/pg';
import { workflowDefinitionSchema } from '../database/schema/workflow_definition';

async function seed() {
    console.log('Seeding workflow definitions...');

    // ====== 示例 1: 获取系统信息并保存 ======
    await pg.insert(workflowDefinitionSchema).values({
        name: 'system-info-report',
        description: '获取系统信息并保存到数据库',
        version: 1,
        status: 'published',
        definition: JSON.stringify({
            id: 'system-info-report',
            name: '系统信息日报',
            version: 1,
            steps: [
                {
                    id: 'get-info',
                    type: 'tool',
                    name: '获取系统信息',
                    tool: 'get_system_info',
                    input: {},
                    outputKey: 'systemInfo',
                },
                {
                    id: 'get-time',
                    type: 'tool',
                    name: '获取当前时间',
                    tool: 'get_current_time',
                    input: { timezone: 'Asia/Shanghai' },
                    outputKey: 'currentTime',
                },
                {
                    id: 'summarize',
                    type: 'llm',
                    name: '生成摘要',
                    model: 'deepseek-chat',
                    systemPrompt: '你是一个系统管理员助手，根据系统信息和时间生成简短摘要。',
                    userPrompt:
                        '系统信息: {{step.get-info.output}}\n当前时间: {{step.get-time.output}}\n请用中文生成一段简短的系统状态摘要。',
                    temperature: 0.5,
                    outputKey: 'summary',
                },
            ],
            retryPolicy: {
                maxAttempts: 3,
                initialDelayMs: 1000,
                backoffMultiplier: 2,
                maxDelayMs: 60000,
            },
            timeoutMs: 120000,
        }),
        isTemplate: false,
    } as any);

    // ====== 示例 2: 条件分支 — 根据时间问候 ======
    await pg.insert(workflowDefinitionSchema).values({
        name: 'time-greeting',
        description: '根据当前时间生成不同的问候语',
        version: 1,
        status: 'published',
        definition: JSON.stringify({
            id: 'time-greeting',
            name: '时段问候',
            version: 1,
            steps: [
                {
                    id: 'get-time',
                    type: 'tool',
                    name: '获取时间',
                    tool: 'get_current_time',
                    input: {},
                    outputKey: 'time',
                },
                {
                    id: 'check-hour',
                    type: 'conditional',
                    name: '判断时段',
                    branches: [
                        {
                            label: 'morning',
                            condition: { lt: ['step.get-time.output.hour', 12] },
                            steps: [
                                {
                                    id: 'morning-greet',
                                    type: 'llm',
                                    name: '早安问候',
                                    systemPrompt: '你是一个友好的助手。',
                                    userPrompt: '当前时间: {{step.get-time.output}}，请生成早安问候。',
                                    outputKey: 'greeting',
                                },
                            ],
                        },
                        {
                            label: 'afternoon',
                            condition: { lt: ['step.get-time.output.hour', 18] },
                            steps: [
                                {
                                    id: 'afternoon-greet',
                                    type: 'llm',
                                    name: '下午问候',
                                    systemPrompt: '你是一个友好的助手。',
                                    userPrompt: '当前时间: {{step.get-time.output}}，请生成下午问候。',
                                    outputKey: 'greeting',
                                },
                            ],
                        },
                    ],
                    defaultBranch: [
                        {
                            id: 'evening-greet',
                            type: 'llm',
                            name: '晚安问候',
                            systemPrompt: '你是一个友好的助手。',
                            userPrompt: '当前时间: {{step.get-time.output}}，请生成晚安问候。',
                            outputKey: 'greeting',
                        },
                    ],
                },
            ],
        }),
        isTemplate: false,
    } as any);

    // ====== 示例 3: 元数据表创建（完整流程） ======
    await pg.insert(workflowDefinitionSchema).values({
        name: 'create-collection-flow',
        description: '一键创建元数据表：创建→添加字段→发布→部署',
        version: 1,
        status: 'draft',
        definition: JSON.stringify({
            id: 'create-collection-flow',
            name: '创建元数据表流程',
            version: 1,
            steps: [
                {
                    id: 'create',
                    type: 'tool',
                    name: '创建元数据表',
                    tool: 'create_collection',
                    input: {
                        tableName: '{{input.tableName}}',
                        label: '{{input.label}}',
                        description: '{{input.description || "通过工作流自动创建"}}',
                    },
                    outputKey: 'collection',
                },
                {
                    id: 'add-fields',
                    type: 'tool',
                    name: '添加字段',
                    tool: 'add_fields_to_collection',
                    input: {
                        collectionId: '{{step.create.output.created.id}}',
                        fields: '{{input.fields}}',
                    },
                },
                {
                    id: 'publish',
                    type: 'tool',
                    name: '发布建表',
                    tool: 'publish_collection',
                    input: { collectionId: '{{step.create.output.created.id}}' },
                },
                {
                    id: 'deploy',
                    type: 'tool',
                    name: '部署上线',
                    tool: 'deploy_collection',
                    input: { collectionId: '{{step.create.output.created.id}}' },
                    retryPolicy: { maxAttempts: 2, initialDelayMs: 2000, backoffMultiplier: 1, maxDelayMs: 10000 },
                },
            ],
            inputSchema: {
                type: 'object',
                properties: {
                    tableName: { type: 'string', description: '英文表名' },
                    label: { type: 'string', description: '中文标签' },
                    description: { type: 'string' },
                    fields: { type: 'array', description: '字段定义数组' },
                },
                required: ['tableName', 'label', 'fields'],
            },
        }),
        isTemplate: true,
    } as any);

    console.log('✓ 工作流种子数据插入完成');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
