import { t } from 'elysia';
import { CrudDto } from '@/types/dto';
import { InsertSystemAgentConfig, SelectSystemAgentConfig } from '@database/schema/system_agent_config';

export const SaveConfigDto = {
    body: t.Object({
        provider: t.Optional(t.String({ description: 'LLM 提供商', default: 'openai' })),
        apiKey: t.Optional(t.String({ description: 'API 密钥' })),
        apiBase: t.Optional(t.String({ description: 'API 地址' })),
        model: t.Optional(t.String({ description: '模型名称' })),
        maxTokens: t.Optional(t.Number({ description: '最大 Token 数' })),
        maxToolRounds: t.Optional(t.Number({ description: '最大工具调用轮次' })),
        conversationTTL: t.Optional(t.Number({ description: '会话过期时间(秒)' })),
        status: t.Optional(t.Boolean({ description: '启用状态' })),
    }),
};

export const GetConfigDto = CrudDto.findOne(SelectSystemAgentConfig);
