import { registerTool } from '@/core/agent/tool-registry';

registerTool({
    name: 'get_current_time',
    description: '获取当前服务器时间',
    parameters: {
        type: 'object',
        properties: {
            timezone: { type: 'string', description: '时区，如 Asia/Shanghai，默认服务器时区' },
        },
        additionalProperties: false,
    },
    handler: async () => {
        return JSON.stringify({
            time: new Date().toISOString(),
            timestamp: Date.now(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
    },
});
