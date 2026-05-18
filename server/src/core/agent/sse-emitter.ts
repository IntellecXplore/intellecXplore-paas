export interface SSEEventMap {
    'meta': { conversationId: string };
    'text-delta': { content: string };
    'reasoning-delta': { content: string };
    'tool-call': { toolCallId: string; toolName: string; args: unknown };
    'tool-result': { toolCallId: string; toolName: string; result: unknown };
    'step-finish': { step: number; usage?: { promptTokens: number; completionTokens: number } };
    'error': { message: string };
    'done': Record<string, never>;
}

/**
 * v6 语义事件发射器。
 * 替代旧的 sendSSE()——从简单的 text/tool_start 升级为语义事件。
 */
export function createSSEEmitter(controller: ReadableStreamDefaultController<Uint8Array>) {
    function emit<K extends keyof SSEEventMap>(event: K, data: SSEEventMap[K]) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
            controller.enqueue(new TextEncoder().encode(payload));
        } catch {
            // controller closed (client disconnected)
        }
    }

    return { emit };
}
