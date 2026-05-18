import { t } from 'elysia';
import { CrudDto } from '@/types/dto';
import { InsertSystemTenant, SelectSystemTenant } from "@database/schema/system_tenant";

export const CreateDto = CrudDto.create(
    InsertSystemTenant,
    SelectSystemTenant,
    ['tenantName', 'tenantCode']
);

export const UpdateDto = CrudDto.update(SelectSystemTenant, 'tenantId');

export const ListDto = CrudDto.list(SelectSystemTenant, {
    tenantName: t.Optional(t.String({ description: "企业名称" })),
    tenantCode: t.Optional(t.String({ description: "租户标识" })),
    status: t.Optional(t.String({ description: "状态" })),
});
