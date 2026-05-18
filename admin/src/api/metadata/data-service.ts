import request from '@/utils/http'

export function fetchCollectionDataList(params: {
    tableName: string
    pageNum?: number
    pageSize?: number
    orderByColumn?: string
    sortRule?: string
    [key: string]: any
}) {
    return request.get({
        url: `/api/collection/${params.tableName}/list`,
        params,
    })
}

export function fetchCollectionDataDetail(tableName: string, id: number) {
    return request.get({
        url: `/api/collection/${tableName}/${id}`,
    })
}

export function fetchCreateCollectionData(tableName: string, data: Record<string, any>) {
    return request.post({
        url: `/api/collection/${tableName}`,
        data: { tableName, data },
        showSuccessMessage: true,
        showErrorMessage: true,
    })
}

export function fetchUpdateCollectionData(tableName: string, id: number, data: Record<string, any>) {
    return request.put({
        url: `/api/collection/${tableName}`,
        data: { tableName, id, data },
        showSuccessMessage: true,
        showErrorMessage: true,
    })
}

export function fetchDeleteCollectionData(tableName: string, ids: number | number[]) {
    const str = Array.isArray(ids) ? ids.join(',') : ids.toString()
    return request.del({
        url: `/api/collection/${tableName}/${str}`,
        showSuccessMessage: true,
        showErrorMessage: true,
    })
}
