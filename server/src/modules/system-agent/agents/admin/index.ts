import { SYSTEM_PROMPT } from './prompt';
import { ADMIN_TOOL_NAMES } from './tools';

export const adminAgent = {
    name: 'admin',
    description: 'Elysia Admin 管理后台 AI 助手 Art Bot',
    systemPrompt: SYSTEM_PROMPT,
    toolNames: ADMIN_TOOL_NAMES,
};
