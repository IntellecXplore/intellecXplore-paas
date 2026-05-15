import { t } from 'elysia';
import { InsertMetadataCollection, SelectMetadataCollection } from "@database/schema/metadata_collections";
import { CrudDto } from '@/types/dto';

export const CreateDto = CrudDto.create(
    InsertMetadataCollection,
    SelectMetadataCollection,
    ['label', 'databaseType', 'tableName']
);

export const UpdateDto = CrudDto.update(SelectMetadataCollection, 'id');

export const ListDto = CrudDto.list(
    SelectMetadataCollection,
    {
        tableName: t.Optional(t.String({ description: "物理表名" })),
        label: t.Optional(t.String({ description: "显示名称" })),
        databaseType: t.Optional(t.String({ description: "存储类型" })),
        namespace: t.Optional(t.String({ description: "命名空间" })),
        status: t.Optional(t.String({ description: "状态" })),
    }
);

export { InsertMetadataCollection, SelectMetadataCollection };
