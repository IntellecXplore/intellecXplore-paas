import request from '@/utils/http'

export function fetchCreateDatabaseConfig(data: Api.MetadataDatabaseConfig.DatabaseConfigItem) {
    return request.post({
        url: '/api/system/metadata/database-config',
        data,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchGetDatabaseConfigList(params: Api.MetadataDatabaseConfig.DatabaseConfigSearchParams) {
    return request.get<Api.MetadataDatabaseConfig.DatabaseConfigList>({
        url: '/api/system/metadata/database-config/list',
        params
    })
}

export function fetchGetAllDatabaseConfigs() {
    return request.get<Api.MetadataDatabaseConfig.DatabaseConfigItem[]>({
        url: '/api/system/metadata/database-config/all',
    })
}

export function fetchGetDatabaseConfigDetail(id: number) {
    return request.get<Api.MetadataDatabaseConfig.DatabaseConfigItem>({
        url: `/api/system/metadata/database-config/${id}`
    })
}

export function fetchUpdateDatabaseConfig(data: Api.MetadataDatabaseConfig.DatabaseConfigItem) {
    return request.put({
        url: '/api/system/metadata/database-config',
        data,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchDeleteDatabaseConfig(ids: number | number[]) {
    let str = Array.isArray(ids) ? ids.join(',') : ids.toString()
    return request.del({
        url: `/api/system/metadata/database-config/${str}`,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchTestDatabaseConfigConnection(config: Record<string, any>) {
    return request.post({
        url: '/api/system/metadata/database-config/test-connection',
        data: config,
        showErrorMessage: true,
    })
}
