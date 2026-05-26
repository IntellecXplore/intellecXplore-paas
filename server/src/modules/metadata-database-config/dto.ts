import { t } from 'elysia';
import { InsertMetadataDatabaseConfig, SelectMetadataDatabaseConfig } from "@database/schema/metadata_database_configs";
import { CrudDto } from '@/types/dto';

export const CreateDto = CrudDto.create(
    InsertMetadataDatabaseConfig,
    SelectMetadataDatabaseConfig,
    ['name', 'host', 'username', 'database']
);

export const UpdateDto = CrudDto.update(SelectMetadataDatabaseConfig, 'id');

export const ListDto = CrudDto.list(
    SelectMetadataDatabaseConfig,
    {
        name: t.Optional(t.String({ description: "配置名称" })),
    }
);

export { InsertMetadataDatabaseConfig, SelectMetadataDatabaseConfig };
