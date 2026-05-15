import request from '@/utils/http'

export function fetchCreateCollection(data: Api.MetadataCollection.CollectionListItem) {
    return request.post({
        url: '/api/system/metadata/collection',
        data,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchGetCollectionList(params: Api.MetadataCollection.CollectionSearchParams) {
    return request.get<Api.MetadataCollection.CollectionList>({
        url: '/api/system/metadata/collection/list',
        params
    })
}

export function fetchGetCollectionDetail(id: number) {
    return request.get<Api.MetadataCollection.CollectionListItem>({
        url: `/api/system/metadata/collection/${id}`
    })
}

export function fetchUpdateCollection(data: Api.MetadataCollection.CollectionListItem) {
    return request.put({
        url: '/api/system/metadata/collection',
        data,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchPublishCollection(id: number) {
    return request.post({
        url: `/api/system/metadata/collection/${id}/publish`,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchDeployCollection(id: number) {
    return request.post({
        url: `/api/system/metadata/collection/${id}/deploy`,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchToggleCollectionStatus(id: number) {
    return request.post({
        url: `/api/system/metadata/collection/${id}/toggle-status`,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchDeleteCollection(ids: number | number[]) {
    let str = Array.isArray(ids) ? ids.join(',') : ids.toString()
    return request.del({
        url: `/api/system/metadata/collection/${str}`,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}
