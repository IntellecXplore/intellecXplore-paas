declare namespace Api {
    namespace CollectionData {
        interface DynamicDataItem {
            id: number;
            [key: string]: any;
        }

        type DynamicDataList = Api.Common.PaginatedResponse<DynamicDataItem>;

        interface DynamicDataSearchParams extends Api.Common.CommonSearchParams {
            tableName: string;
            pageNum?: number;
            pageSize?: number;
            orderByColumn?: string;
            sortRule?: string;
            filters?: Record<string, any>;
        }
    }
}
