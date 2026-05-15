import { t } from 'elysia';
import { InsertMetadataField, SelectMetadataField } from "@database/schema/metadata_fields";
import { CrudDto } from '@/types/dto';

export const CreateDto = CrudDto.create(
    InsertMetadataField,
    SelectMetadataField,
    ['collectionId', 'columnName', 'type']
);

export const UpdateDto = CrudDto.update(SelectMetadataField, 'id');

export const ListDto = CrudDto.list(
    SelectMetadataField,
    {
        collectionId: t.Optional(t.Number({ description: "所属 Collection ID" })),
        columnName: t.Optional(t.String({ description: "数据库列名" })),
        type: t.Optional(t.String({ description: "字段类型" })),
    }
);

export { InsertMetadataField, SelectMetadataField };
