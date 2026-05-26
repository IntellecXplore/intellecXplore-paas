import request from '@/utils/http'

export function fetchLogList(params: any) {
  return request.get<{ list: any[]; total: number }>({
    url: '/api/integration/log/list',
    params,
  })
}

export function fetchLogDetail(id: number) {
  return request.get<any>({
    url: `/api/integration/log/${id}`,
  })
}
