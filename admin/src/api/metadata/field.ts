import request from '@/utils/http'

export function fetchCreateField(data: Api.MetadataField.FieldListItem) {
    return request.post({
        url: '/api/system/metadata/field',
        data,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchGetFieldList(params: Api.MetadataField.FieldSearchParams) {
    return request.get<Api.MetadataField.FieldList>({
        url: '/api/system/metadata/field/list',
        params
    })
}

export function fetchGetFieldDetail(id: number) {
    return request.get<Api.MetadataField.FieldListItem>({
        url: `/api/system/metadata/field/${id}`
    })
}

export function fetchUpdateField(data: Api.MetadataField.FieldListItem) {
    return request.put({
        url: '/api/system/metadata/field',
        data,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchSortFields(data: { fields: { id: number; sortOrder: number }[] }) {
    return request.post({
        url: '/api/system/metadata/field/sort',
        data,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}

export function fetchDeleteField(ids: number | number[]) {
    let str = Array.isArray(ids) ? ids.join(',') : ids.toString()
    return request.del({
        url: `/api/system/metadata/field/${str}`,
        showSuccessMessage: true,
        showErrorMessage: true
    })
}
