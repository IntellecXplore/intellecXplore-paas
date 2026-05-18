import request from '@/utils/http'

export function fetchTenantList(params: any) {
  return request.get<{ list: Api.SystemTenant.TenantRecord[]; total: number }>({
    url: '/api/system/tenant/list',
    params
  })
}

export function fetchTenantDetail(tenantId: number) {
  return request.get<Api.SystemTenant.TenantRecord>({
    url: `/api/system/tenant/${tenantId}`
  })
}

export function createTenant(params: any) {
  return request.post({
    url: '/api/system/tenant',
    params
  })
}

export function updateTenant(params: any) {
  return request.put({
    url: '/api/system/tenant',
    params
  })
}

export function deleteTenant(ids: string) {
  return request.delete({
    url: `/api/system/tenant/${ids}`
  })
}

export function fetchTenantOptions() {
  return request.get<{ tenantId: number; tenantName: string }[]>({
    url: '/api/system/tenant/options'
  })
}
