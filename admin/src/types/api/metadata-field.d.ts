declare namespace Api {
    namespace MetadataField {
        interface FieldListItem {
            id?: number;
            collectionId: number;
            columnName: string;
            label?: string;
            type: string;
            nullable?: boolean;
            default_value?: string;
            isUnique?: boolean;
            indexed?: boolean;
            isPrimaryKey?: boolean;
            length?: number;
            required?: boolean;
            customValidator?: string;
            sortOrder?: number;
            version?: number;
            status?: string;
            createTime?: Date;
            createBy?: number;
            updateTime?: Date;
            updateBy?: number;
            delFlag?: boolean;
            remark?: string;
        }

        type FieldList = Api.Common.PaginatedResponse<FieldListItem>;

        type FieldSearchParams = Partial<
            Pick<FieldListItem, 'collectionId' | 'columnName' | 'type'> &
            Api.Common.CommonSearchParams
        >;
    }
}
