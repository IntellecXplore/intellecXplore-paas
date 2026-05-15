declare namespace Api {
    namespace MetadataCollection {
        interface CollectionListItem {
            id?: number;
            tableName: string;
            label: string;
            description?: string;
            databaseType: string;
            namespace?: string;
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
