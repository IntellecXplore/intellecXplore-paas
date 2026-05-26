import request from '@/utils/http'

export function fetchSourceList(params: any) {
  return request.get<{ list: any[]; total: number }>({
    url: '/api/integration/source/list',
    params,
  })
}

export function fetchSourceDetail(id: number) {
  return request.get<any>({
    url: `/api/integration/source/${id}`,
  })
}

export function fetchProductTypes() {
  return request.get<string[]>({
    url: '/api/integration/source/product-types',
  })
}

export function createSource(data: any) {
  return request.post({
    url: '/api/integration/source',
    data,
    showSuccessMessage: true,
  })
}

export function updateSource(data: any) {
  return request.put({
    url: '/api/integration/source',
    data,
    showSuccessMessage: true,
  })
}

export function deleteSource(ids: string) {
  return request.del({
    url: `/api/integration/source/${ids}`,
    showSuccessMessage: true,
  })
}

export function testConnection(data: any) {
  return request.post<any>({
    url: '/api/integration/source/test-connection',
    data,
  })
}

export function fetchSourceObjects(id: number) {
  return request.get<any[]>({
    url: `/api/integration/source/${id}/objects`,
  })
}
