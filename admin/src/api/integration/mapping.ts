import request from '@/utils/http'

export function fetchMappingList(params: any) {
  return request.get<{ list: any[]; total: number }>({
    url: '/api/integration/mapping/list',
    params,
  })
}

export function createMapping(data: any) {
  return request.post({
    url: '/api/integration/mapping',
    data,
    showSuccessMessage: true,
  })
}

export function updateMapping(data: any) {
  return request.put({
    url: '/api/integration/mapping',
    data,
    showSuccessMessage: true,
  })
}

export function deleteMapping(ids: string) {
  return request.del({
    url: `/api/integration/mapping/${ids}`,
    showSuccessMessage: true,
  })
}
