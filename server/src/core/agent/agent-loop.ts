import { streamText, smoothStream, stepCountIs } from 'ai';
import type { LanguageModel, ModelMessage, ToolSet } from 'ai';
import { createSSEEmitter } from '@/core/agent/sse-emitter';
import { buildToolSet, setActiveToolContext, clearActiveToolContext } from '@/core/agent/tool-registry';
import type { ToolContext } from '@/core/agent/tool-registry';

// ============== Types ==============

export interface AgentLoopConfig {
    model: LanguageModel;
    systemPrompt: string;
    messages: ModelMessage[];
    toolNames: string[];
    maxSteps: number;
    temperature?: number;
    abortSignal: AbortSignal;
    toolContext: ToolContext;
}

export interface AgentLoopResult {
    messages: ModelMessage[];
    usage?: { promptTokens: number; completionTokens: number };
}

// ============== Agent Loop ==============

/**
 * 基于 AI SDK v6 streamText 的 Agent 循环。
 * 替代手写的 runAgentLoop() — AI SDK 自动处理 tool-call → execute → result 循环。
 */
export async function runAgentLoop(
    config: AgentLoopConfig,
    controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<AgentLoopResult> {
    const emitter = createSSEEmitter(controller);
    const { model, systemPrompt, messages, toolNames, maxSteps, abortSignal, toolContext, temperature } = config;

    // 设置工具上下文，供工具 execute 函数通过闭包访问
    setActiveToolContext(toolContext);

    // 按 Agent 类型动态加载工具
    const tools = buildToolSet(toolNames) as ToolSet;

    let stepCount = 0;

    try {
        const result = streamText({
            model,
            system: systemPrompt,
            messages,
            tools: Object.keys(tools).length > 0 ? tools : undefined,
            maxSteps,
            temperature: temperature ?? 0.7,
            abortSignal,
            stopWhen: stepCountIs(maxSteps),
            // v6: 平滑流式输出，提供更自然的打字体验
            experimental_transform: smoothStream(),
            onStepFinish: ({ usage }) => {
                stepCount++;
                emitter.emit('step-finish', {
                    step: stepCount,
                    usage: usage ? {
                        promptTokens: usage.promptTokens,
                        completionTokens: usage.completionTokens,
                    } : undefined,
                });
            },
        });

        let streamError: string | null = null;

        // 消费 fullStream — AI SDK 自动处理 tool-call / tool-result 循环
        const partHandlers: Record<string, (part: any) => void> = {
            'text-delta': (part) => {
                const text = part.text ?? part.delta ?? '';
                if (text) emitter.emit('text-delta', { content: text });
            },
            'reasoning-delta': (part) => {
                const text = part.text ?? part.delta ?? '';
                if (text) emitter.emit('reasoning-delta', { content: text });
            },
            'tool-call': (part) => {
                emitter.emit('tool-call', {
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    args: part.input,
                });
            },
            'tool-result': (part) => {
                emitter.emit('tool-result', {
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    result: part.output,
                });
            },
            'tool-error': (part) => {
                const errMsg = part.errorText || 'Tool execution error';
                emitter.emit('tool-result', {
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    result: { error: errMsg },
                });
            },
            'error': (part) => {
                const msg = part.errorText || part.message || part.error || JSON.stringify(part);
                streamError = msg;
                emitter.emit('error', { message: msg });
            },
        };

        for await (const part of result.fullStream) {
            if (abortSignal.aborted) break;
            const handler = partHandlers[part.type];
            if (handler) {
                handler(part);
            }
        }

        if (abortSignal.aborted) {
            return { messages: config.messages };
        }

        // 如果 stream 中有错误，result.response 会抛异常，先检查
        if (streamError) {
            throw new Error(streamError);
        }

        // 获取最终结果
        let finalMessages: ModelMessage[];
        let usage: { promptTokens: number; completionTokens: number } | undefined;

        try {
            const response = await result.response;
            finalMessages = response.messages;
            const usageResult = await result.usage;
            usage = usageResult ? {
                promptTokens: usageResult.promptTokens,
                completionTokens: usageResult.completionTokens,
            } : undefined;
        } catch (e: any) {
            const detail = e.message || e.errorText || String(e);
            throw new Error(detail || 'LLM 调用失败，请检查 API Key 和模型配置');
        }

        emitter.emit('done', {});

        return { messages: finalMessages, usage };
    } finally {
        clearActiveToolContext();
    }
}
