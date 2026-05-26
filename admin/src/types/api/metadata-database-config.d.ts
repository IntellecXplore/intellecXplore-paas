declare namespace Api.MetadataDatabaseConfig {
    interface DatabaseConfigItem {
        id?: number
        name: string
        host: string
        port: number
        username: string
        password: string
        database: string
        schema: string
        description?: string
        status?: string
        tenantId?: number
        createTime?: string
        createBy?: number
        updateTime?: string
        updateBy?: number
        delFlag?: boolean
        remark?: string
    }

    interface DatabaseConfigSearchParams {
        pageNum?: number
        pageSize?: number
        name?: string
        orderByColumn?: string
        sortRule?: string
    }

    interface DatabaseConfigList {
        list: DatabaseConfigItem[]
        total: number
    }
}
