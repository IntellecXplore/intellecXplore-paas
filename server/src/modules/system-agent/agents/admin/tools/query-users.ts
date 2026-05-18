import { registerTool } from '@/core/agent/tool-registry';

async function findUserList(args: Record<string, unknown>) {
    const mod = await import('@/modules/system-user/handle');
    const fn = mod.findList;
    if (!fn) throw new Error('用户模块未加载');

    const mockCtx = {
        query: {
            pageNum: args.pageNum || 1,
            pageSize: args.pageSize || 10,
            userName: args.username || '',
            nickName: args.nickname || '',
        },
    };
    const result = await fn(mockCtx);
    if (result.code === 200 && result.data) {
        const { list, total } = result.data;
        return JSON.stringify({ list, total, pageNum: args.pageNum || 1 });
    }
    return JSON.stringify({ error: result.msg });
}

registerTool({
    name: 'query_users',
    description: '查询系统用户列表，可按用户名或昵称搜索',
    parameters: {
        type: 'object',
        properties: {
            username: { type: 'string', description: '用户名（模糊搜索）' },
            nickname: { type: 'string', description: '昵称（模糊搜索）' },
            pageNum: { type: 'integer', description: '页码，默认1', default: 1 },
            pageSize: { type: 'integer', description: '每页数量，默认10', default: 10 },
        },
        additionalProperties: false,
    },
    handler: async (args) => {
        try { return await findUserList(args); } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
});
