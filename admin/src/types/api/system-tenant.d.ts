declare namespace Api {
  namespace SystemTenant {
    interface TenantRecord {
      tenantId: number
      tenantName: string
      tenantCode: string
      contactName?: string
      contactPhone?: string
      status: boolean
      expireTime?: string
      config?: Record<string, any>
      createTime?: string
      updateTime?: string
      remark?: string
    }
  }
}
