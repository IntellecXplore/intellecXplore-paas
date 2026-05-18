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
        for await (const part of result.fullStream) {
            if (abortSignal.aborted) break;

            switch (part.type) {
                case 'text-delta': {
                    const text = (part as any).text ?? (part as any).delta ?? '';
                    if (text) {
                        emitter.emit('text-delta', { content: text });
                    }
                    break;
                }

                case 'reasoning-delta': {
                    const text = (part as any).text ?? (part as any).delta ?? '';
                    if (text) {
                        emitter.emit('reasoning-delta', { content: text });
                    }
                    break;
                }

                case 'tool-call': {
                    emitter.emit('tool-call', {
                        toolCallId: part.toolCallId,
                        toolName: part.toolName,
                        args: (part as any).input,
                    });
                    break;
                }

                case 'tool-result': {
                    emitter.emit('tool-result', {
                        toolCallId: part.toolCallId,
                        toolName: part.toolName,
                        result: (part as any).output,
                    });
                    break;
                }

                case 'tool-error': {
                    const errMsg = (part as any).errorText || 'Tool execution error';
                    emitter.emit('tool-result', {
                        toolCallId: part.toolCallId,
                        toolName: part.toolName,
                        result: { error: errMsg },
                    });
                    break;
                }

                case 'error': {
                    // 提取尽可能多的错误信息
                    const err = part as any;
                    streamError = err.errorText || err.message || err.error || JSON.stringify(err);
                    emitter.emit('error', { message: streamError });
                    break;
                }

                // text-start, text-end, reasoning-start, reasoning-end,
                // step-start, finish, tool-input-* — 不需要 SSE 事件
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
