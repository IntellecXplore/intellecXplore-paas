import { z } from 'zod';

export const SendMessageDto = {
    body: z.object({
        message: z.string().min(1, '消息不能为空'),
        conversationId: z.string().optional(),
    }),
};

export const ConversationListDto = {
    query: z.object({
        pageNum: z.coerce.number().optional().default(1),
        pageSize: z.coerce.number().optional().default(20),
    }),
};
