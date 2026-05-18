import request from '@/utils/http'
import { useUserStore } from '@/store/modules/user'

const { VITE_API_URL } = import.meta.env

/** 获取会话列表 */
export function fetchGetConversationList(params?: { pageNum?: number; pageSize?: number }) {
    return request.get<Api.Common.PaginatedResponse<Api.AgentChat.ConversationSummary>>({
        url: '/api/agent/chat/conversations',
        params,
    })
}

/** 获取会话详情 */
export function fetchGetConversation(id: string) {
    return request.get<Api.AgentChat.Conversation>({
        url: `/api/agent/chat/conversation/${id}`,
    })
}

/** 删除会话 */
export function fetchDeleteConversation(id: string) {
    return request.del({
        url: `/api/agent/chat/conversation/${id}`,
    })
}

/** SSE 聊天流连接 — 返回 Promise，resolve 时 stream 已就绪 */
export async function connectChatStream(
    message: string,
    conversationId?: string,
): Promise<{
    abort: () => void
    stream: ReadableStream<Uint8Array>
}> {
    const abortController = new AbortController()
    const { accessToken } = useUserStore()

    const response = await fetch(`${VITE_API_URL}/api/agent/chat/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({ message, conversationId }),
        signal: abortController.signal,
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `HTTP ${response.status}`)
    }

    return {
        abort: () => abortController.abort(),
        stream: response.body!,
    }
}
