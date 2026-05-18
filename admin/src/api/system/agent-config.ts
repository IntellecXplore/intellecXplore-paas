import request from '@/utils/http'

/** 获取当前用户的智能体配置 */
export function fetchGetAgentConfig() {
    return request.get<Api.SystemAgentConfig.ConfigData>({
        url: '/api/system/agent-config',
    })
}

/** 保存智能体配置 */
export function fetchSaveAgentConfig(data: Api.SystemAgentConfig.SaveConfigParams) {
    return request.post({
        url: '/api/system/agent-config',
        data,
        showSuccessMessage: true,
        showErrorMessage: true,
    })
}
