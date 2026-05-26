import { t } from 'elysia';
import { CrudDto, BaseListQueryDto, BaseResultDto, BaseResultListDto } from '@/types/dto';
import { InsertDataIntegrationSource, SelectDataIntegrationSource } from '@database/schema/data_integration_source';
import { InsertDataIntegrationObject, SelectDataIntegrationObject } from '@database/schema/data_integration_object';
import { InsertDataIntegrationMapping, SelectDataIntegrationMapping } from '@database/schema/data_integration_mapping';
import { InsertDataIntegrationTask, SelectDataIntegrationTask } from '@database/schema/data_integration_task';
import { InsertDataIntegrationLog, SelectDataIntegrationLog } from '@database/schema/data_integration_log';

// ========== Source DTO ==========
export const CreateSourceDto = CrudDto.create(
    InsertDataIntegrationSource, SelectDataIntegrationSource,
    ['name', 'productType', 'connectionConfig']
);
export const UpdateSourceDto = CrudDto.update(SelectDataIntegrationSource, 'id');
export const ListSourceDto = CrudDto.list(SelectDataIntegrationSource, {
    name: t.Optional(t.String({ description: "数据源名称" })),
    productType: t.Optional(t.String({ description: "产品类型" })),
    connectionType: t.Optional(t.String({ description: "连接类型" })),
    status: t.Optional(t.String({ description: "状态" })),
});

// ========== Object DTO ==========
export const CreateObjectDto = CrudDto.create(
    InsertDataIntegrationObject, SelectDataIntegrationObject,
    ['sourceId', 'objectCode', 'objectName', 'objectType']
);
export const UpdateObjectDto = CrudDto.update(SelectDataIntegrationObject, 'id');
export const ListObjectDto = CrudDto.list(SelectDataIntegrationObject, {
    sourceId: t.Optional(t.Number({ description: "数据源ID" })),
    objectCode: t.Optional(t.String({ description: "对象编码" })),
    objectType: t.Optional(t.String({ description: "对象类型" })),
});

// ========== Mapping DTO ==========
export const CreateMappingDto = CrudDto.create(
    InsertDataIntegrationMapping, SelectDataIntegrationMapping,
    ['objectId', 'sourceField', 'targetField']
);
export const UpdateMappingDto = CrudDto.update(SelectDataIntegrationMapping, 'id');
export const ListMappingDto = CrudDto.list(SelectDataIntegrationMapping, {
    objectId: t.Optional(t.Number({ description: "数据对象ID" })),
});

// ========== Task DTO ==========
export const CreateTaskDto = CrudDto.create(
    InsertDataIntegrationTask, SelectDataIntegrationTask,
    ['name', 'sourceId', 'objectId']
);
export const UpdateTaskDto = CrudDto.update(SelectDataIntegrationTask, 'id');
export const ListTaskDto = CrudDto.list(SelectDataIntegrationTask, {
    name: t.Optional(t.String({ description: "任务名称" })),
    sourceId: t.Optional(t.Number({ description: "数据源ID" })),
    status: t.Optional(t.String({ description: "状态" })),
});

// ========== Log DTO ==========
export const ListLogDto = CrudDto.list(SelectDataIntegrationLog, {
    taskId: t.Optional(t.Number({ description: "任务ID" })),
    status: t.Optional(t.String({ description: "状态" })),
});

// ========== Action DTO ==========
export const TestConnectionDto = {
    body: t.Object({
        productType: t.String({ description: "产品类型" }),
        connectionType: t.String({ description: "连接类型" }),
        connectionConfig: t.Any({ description: "连接配置" }),
    }),
    ...BaseResultDto(t.Object({ success: t.Boolean(), error: t.Optional(t.String()), latency: t.Optional(t.Number()) })),
};

export const DiscoverObjectsDto = {
    params: t.Object({ id: t.String({ description: "数据源ID" }) }),
    ...BaseResultDto(t.Array(t.Any())),
};

export const TriggerSyncDto = {
    params: t.Object({ id: t.String({ description: "任务ID" }) }),
    ...BaseResultDto(t.Object({ logId: t.Number() })),
};

export const PreviewDto = {
    params: t.Object({ id: t.String({ description: "任务ID" }) }),
    query: t.Object({
        limit: t.Optional(t.Number({ description: "预览条数", default: 10 })),
    }),
    ...BaseResultListDto(t.Any()),
};

export { InsertDataIntegrationSource, SelectDataIntegrationSource };
export { InsertDataIntegrationObject, SelectDataIntegrationObject };
export { InsertDataIntegrationMapping, SelectDataIntegrationMapping };
export { InsertDataIntegrationTask, SelectDataIntegrationTask };
export { InsertDataIntegrationLog, SelectDataIntegrationLog };
