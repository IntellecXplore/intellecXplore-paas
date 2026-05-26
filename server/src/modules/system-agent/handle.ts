import type { Context } from 'elysia';
import type { ModelMessage } from 'ai';
import config from '@/config';
import { FindOneByKey } from '@/core/database/repository';
import { systemAgentConfigSchema } from '@database/schema/system_agent_config';
import { logger } from '@/shared/logger';

import { createProvider } from '@/core/agent/llm-provider';
import { runAgentLoop } from '@/core/agent/agent-loop';
import { createSSEEmitter } from '@/core/agent/sse-emitter';
import {
    createConversation,
    loadConversation,
    saveConversation,
    listConversationIds,
    deleteConversationById,
} from '@/core/agent/session-store';
import type { Conversation } from '@/core/agent/session-store';
import type { ToolContext } from '@/core/agent/tool-registry';
import { adminAgent } from './agents/admin';

// 导入工具文件以触发 registerTool 副作用
import './agents/admin/tools/index';

// ============== Agent Config ==============

interface AgentConfig {
    provider: string;
    apiKey: string;
    apiBase: string;
    model: string;
    maxTokens: number;
    maxToolRounds: number;
    conversationTTL: number;
}

async function loadUserAgentConfig(userId: number): Promise<AgentConfig> {
    try {
        const row = await FindOneByKey(systemAgentConfigSchema, 'userId', userId);
        if (row && (row as any).status !== false) {
            return {
                provider: (row as any).provider || config.agent.provider,
                apiKey: (row as any).apiKey || config.agent.apiKey || process.env.AGENT_API_KEY || '',
                apiBase: (row as any).apiBase || config.agent.apiBase,
                model: (row as any).model || config.agent.model,
                maxTokens: (row as any).maxTokens ?? config.agent.maxTokens,
                maxToolRounds: (row as any).maxToolRounds ?? config.agent.maxToolRounds,
                conversationTTL: (row as any).conversationTTL ?? config.agent.conversationTTL,
            };
        }
    } catch (e) {
        logger.warn('加载用户智能体配置失败，使用默认配置', e);
    }
    return {
        provider: config.agent.provider,
        apiKey: config.agent.apiKey || process.env.AGENT_API_KEY || '',
        apiBase: config.agent.apiBase,
        model: config.agent.model,
        maxTokens: config.agent.maxTokens,
        maxToolRounds: config.agent.maxToolRounds,
        conversationTTL: config.agent.conversationTTL,
    };
}

// ============== Helpers ==============

function extractUser(ctx: Context): { userId: number; userName?: string; permissions: string[]; roles: string[] } {
    const user = (ctx as any).user || {};
    return {
        userId: Number(user.userId) || 0,
        userName: user.username || user.userName,
        permissions: user.permissions || [],
        roles: (user.roles || []).map((r: any) => r.roleCode || r.roleName || r),
    };
}

// ============== Route Handlers ==============

export async function sendMessage(ctx: Context): Promise<Response> {
    const body = ctx.body as { message: string; conversationId?: string };
    const user = extractUser(ctx);
    const userId = user.userId;

    const toolCtx: ToolContext = {
        userId,
        userName: user.userName,
        permissions: user.permissions,
        roles: user.roles,
    };

    const agentCfg = await loadUserAgentConfig(userId);
    if (!agentCfg.apiKey) {
        return new Response(
            JSON.stringify({ code: 500, msg: 'Agent API Key 未配置，请在系统配置中设置或在 config 中设置 agent.apiKey', data: null }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }

    // 加载或创建会话
    let conv: Conversation;
    if (body.conversationId) {
        const existing = await loadConversation(body.conversationId);
        if (!existing) {
            // 会话已过期或 Redis 重启丢失，静默创建新会话
            logger.warn(`会话 ${body.conversationId} 不存在，创建新会话`);
            conv = createConversation(body.message, userId);
        } else {
            conv = existing;
        }
    } else {
        conv = createConversation(body.message, userId);
    }

    // 添加用户消息（system prompt 由 agent-loop 的 system 选项注入，不存入消息数组）
    conv.messages.push({ role: 'user', content: body.message } as ModelMessage);
    conv.updatedAt = new Date().toISOString();

    const model = createProvider({
        provider: agentCfg.provider,
        apiKey: agentCfg.apiKey,
        apiBase: agentCfg.apiBase,
        model: agentCfg.model,
    });

    const stream = new ReadableStream({
        async start(controller) {
            const emitter = createSSEEmitter(controller);
            const abortController = new AbortController();

            try {
                emitter.emit('meta', { conversationId: conv.id });

                const result = await runAgentLoop({
                    model,
                    systemPrompt: adminAgent.systemPrompt,
                    messages: conv.messages,
                    toolNames: adminAgent.toolNames,
                    maxSteps: agentCfg.maxToolRounds,
                    temperature: 0.7,
                    abortSignal: abortController.signal,
                    toolContext: toolCtx,
                }, controller);

                // 更新会话消息
                conv.messages = result.messages;
                conv.title = conv.messages.find((m: any) => m.role === 'user')?.content?.slice(0, 30) || conv.title;
                await saveConversation(conv, agentCfg.conversationTTL);
            } catch (e: any) {
                // AI SDK 错误可能有多种结构，提取最有用的信息
                let errorMsg = e.message || String(e);
                if (e.responseBody) {
                    errorMsg = `LLM API 错误 (${e.statusCode || '?'}): ${JSON.stringify(e.responseBody)}`;
                } else if (e.data?.error) {
                    errorMsg = `LLM 错误: ${JSON.stringify(e.data.error)}`;
                }
                logger.error('Agent loop error:', { message: errorMsg, name: e.name, url: e.url, statusCode: e.statusCode });
                emitter.emit('error', { message: errorMsg });
                emitter.emit('done', {});
            } finally {
                try { controller.close(); } catch { /* ignore */ }
            }
        },
        cancel() {
            // stream 被取消时浏览器会自动 abort
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

export async function listConversations(ctx: Context): Promise<object> {
    const { pageNum = 1, pageSize = 20 } = ctx.query as { pageNum?: number; pageSize?: number };

    try {
        const { ids, total } = await listConversationIds(pageNum, pageSize);
        const conversations: Pick<Conversation, 'id' | 'title' | 'updatedAt'>[] = [];

        for (const id of ids) {
            const conv = await loadConversation(id);
            if (conv) {
                conversations.push({ id: conv.id, title: conv.title, updatedAt: conv.updatedAt });
            }
        }

        return { code: 200, msg: '操作成功', data: { list: conversations, total } };
    } catch (e: any) {
        return { code: 500, msg: e.message, data: null };
    }
}

export async function getConversation(ctx: Context): Promise<object> {
    const id = (ctx.params as any).id;

    try {
        const conv = await loadConversation(id);
        if (!conv) return { code: 404, msg: '会话不存在', data: null };
        return { code: 200, msg: '操作成功', data: conv };
    } catch (e: any) {
        return { code: 500, msg: e.message, data: null };
    }
}

export async function deleteConversation(ctx: Context): Promise<object> {
    const id = (ctx.params as any).id;

    try {
        await deleteConversationById(id);
        return { code: 200, msg: '删除成功', data: null };
    } catch (e: any) {
        return { code: 500, msg: e.message, data: null };
    }
}
