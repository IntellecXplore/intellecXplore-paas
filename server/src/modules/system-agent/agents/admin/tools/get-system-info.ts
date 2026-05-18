import { registerTool } from '@/core/agent/tool-registry';
import config from '@/config';

registerTool({
    name: 'get_system_info',
    description: '获取系统基本信息，包括应用名称、版本、运行环境等',
    parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
    },
    handler: async () => {
        return JSON.stringify({
            appName: config.app.id,
            environment: process.env.NODE_ENV || 'development',
            prefix: config.app.prefix,
        });
    },
});
