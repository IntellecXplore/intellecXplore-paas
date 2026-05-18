declare namespace Api {
    namespace MetadataCollection {
        interface StorageConfig {
            host: string;
            port: number;
            username: string;
            password: string;
            database: string;
            schema?: string;
            poolMax?: number;
            idleTimeout?: number;
            connectTimeout?: number;
            ssl?: boolean;
            lastTestTime?: string;
            testResult?: 'success' | 'failed' | null;
            testError?: string;
        }

        interface CollectionListItem {
            id?: number;
            tableName: string;
            label: string;
            description?: string;
            databaseType: string;
            namespace?: string;
            storageConfig?: StorageConfig | null;
            status?: string;
            version?: number;
            createTime?: Date;
            createBy?: number;
            updateTime?: Date;
            updateBy?: number;
            delFlag?: boolean;
            remark?: string;
        }

        type CollectionList = Api.Common.PaginatedResponse<CollectionListItem>;

        type CollectionSearchParams = Partial<
            Pick<CollectionListItem, 'tableName' | 'label' | 'databaseType' | 'namespace' | 'status'> &
            Api.Common.CommonSearchParams
        >;
    }
}
