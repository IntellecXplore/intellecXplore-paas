import { z } from 'zod';

// ============== Workflow Definition DTOs ==============

export const CreateWorkflowDto = {
    body: z.object({
        name: z.string().min(1, '名称不能为空').max(128),
        description: z.string().optional(),
        definition: z.object({
            steps: z.array(z.any()),
            retryPolicy: z.object({
                maxAttempts: z.number().optional().default(3),
                initialDelayMs: z.number().optional().default(1000),
                backoffMultiplier: z.number().optional().default(2),
                maxDelayMs: z.number().optional().default(60000),
            }).optional(),
            timeoutMs: z.number().optional(),
        }),
        isTemplate: z.boolean().optional().default(false),
    }),
};

export const UpdateWorkflowDto = {
    body: z.object({
        name: z.string().min(1).max(128).optional(),
        description: z.string().optional(),
        definition: z.object({
            steps: z.array(z.any()),
            retryPolicy: z.any().optional(),
            timeoutMs: z.number().optional(),
        }).optional(),
        isTemplate: z.boolean().optional(),
    }),
};

export const WorkflowListDto = {
    query: z.object({
        pageNum: z.coerce.number().optional().default(1),
        pageSize: z.coerce.number().optional().default(20),
        status: z.string().optional(), // draft | published
        keyword: z.string().optional(),
    }),
};

// ============== Workflow Instance DTOs ==============

export const RunWorkflowDto = {
    body: z.object({
        definitionId: z.number(),
        input: z.record(z.unknown()).default({}),
        scheduledAt: z.string().optional(), // ISO timestamp
        triggerType: z.enum(['manual', 'cron', 'api', 'sub_workflow']).optional().default('manual'),
        agentId: z.string().optional(),
    }),
};

export const ResumeWorkflowDto = {
    body: z.object({
        event: z.record(z.unknown()).optional(), // 审批结果等
    }),
};

export const InstanceListDto = {
    query: z.object({
        pageNum: z.coerce.number().optional().default(1),
        pageSize: z.coerce.number().optional().default(20),
        status: z.string().optional(),
        userId: z.coerce.number().optional(),
        definitionId: z.coerce.number().optional(),
    }),
};

export const InstanceTracesDto = {
    query: z.object({
        stepId: z.string().optional(),
    }),
};

// ============== SSE Stream DTO ==============

export const StreamWorkflowDto = {
    params: z.object({
        id: z.coerce.number(),
    }),
};

// ============== Node Types DTO ==============

export const NodeTypesDto = {
    query: z.object({
        category: z.string().optional(), // ai | tool | logic | data | flow
    }),
};
