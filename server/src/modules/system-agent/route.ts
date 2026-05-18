import type { IRouteModule } from '@/types/route';
import { SendMessageDto, ConversationListDto } from './dto';
import { sendMessage, listConversations, getConversation, deleteConversation } from './handle';

const AgentModule: IRouteModule = {
    tags: 'Agent聊天',
    routes: [
        {
            url: '/agent/chat/send',
            method: 'post',
            summary: '发送消息（SSE 流式响应）',
            dto: SendMessageDto,
            handle: sendMessage,
            meta: { isAuth: true },
        },
        {
            url: '/agent/chat/conversations',
            method: 'get',
            summary: '获取会话列表',
            dto: ConversationListDto,
            handle: listConversations,
            meta: { isAuth: true },
        },
        {
            url: '/agent/chat/conversation/:id',
            method: 'get',
            summary: '获取会话详情',
            handle: getConversation,
            meta: { isAuth: true },
        },
        {
            url: '/agent/chat/conversation/:id',
            method: 'delete',
            summary: '删除会话',
            handle: deleteConversation,
            meta: { isAuth: true },
        },
    ],
};

export default AgentModule;
