import type { IRouteModule } from "@/types/route";
import { SaveConfigDto, GetConfigDto } from './dto';
import { getConfig, saveConfig } from './handle';

const SystemAgentConfigModule: IRouteModule = {
    tags: '智能体配置',
    routes: [
        {
            url: '/system/agent-config',
            method: 'get',
            summary: '获取当前用户的智能体配置',
            dto: GetConfigDto,
            handle: getConfig,
            meta: { isAuth: true },
        },
        {
            url: '/system/agent-config',
            method: 'post',
            summary: '保存智能体配置',
            dto: SaveConfigDto,
            handle: saveConfig,
            meta: { isAuth: true },
        },
    ],
};

export default SystemAgentConfigModule;
