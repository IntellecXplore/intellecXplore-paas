import request from '@/utils/http'

export function fetchObjectList(params: any) {
  return request.get<{ list: any[]; total: number }>({
    url: '/api/integration/object/list',
    params,
  })
}

export function fetchObjectDetail(id: number) {
  return request.get<any>({
    url: `/api/integration/object/${id}`,
  })
}

export function fetchObjectFields(id: number) {
  return request.get<any[]>({
    url: `/api/integration/object/${id}/fields`,
  })
}

export function createObject(data: any) {
  return request.post({
    url: '/api/integration/object',
    data,
    showSuccessMessage: true,
  })
}

export function updateObject(data: any) {
  return request.put({
    url: '/api/integration/object',
    data,
    showSuccessMessage: true,
  })
}

export function deleteObject(ids: string) {
  return request.del({
    url: `/api/integration/object/${ids}`,
    showSuccessMessage: true,
  })
}
