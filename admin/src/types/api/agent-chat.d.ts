declare namespace Api {
    namespace AgentChat {
        /** 会话摘要 */
        interface ConversationSummary {
            id: string
            title: string
            updatedAt: string
        }

        /** 会话列表 */
        type ConversationList = Api.Common.PaginatedResponse<ConversationSummary>

        /** 会话详情 */
        interface Conversation {
            id: string
            title: string
            messages: Record<string, unknown>[]
            createdAt: string
            updatedAt: string
        }

        // ======== SSE 事件 ========

        /** SSE 事件 - 文本增量 */
        interface SSETextDeltaEvent {
            content: string
        }

        /** SSE 事件 - 推理过程增量 */
        interface SSEReasoningDeltaEvent {
            content: string
        }

        /** SSE 事件 - 工具调用 */
        interface SSEToolCallEvent {
            toolCallId: string
            toolName: string
            args: unknown
        }

        /** SSE 事件 - 工具结果 */
        interface SSEToolResultEvent {
            toolCallId: string
            toolName: string
            result: unknown
        }

        /** SSE 事件 - 步骤完成 */
        interface SSEStepFinishEvent {
            step: number
            usage?: { promptTokens: number; completionTokens: number }
        }

        /** SSE 事件 - 错误 */
        interface SSEErrorEvent {
            message: string
        }
    }
}
