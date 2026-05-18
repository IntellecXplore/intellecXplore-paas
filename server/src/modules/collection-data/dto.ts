import { t } from 'elysia';

const DynamicRecord = t.Record(t.String(), t.Any());

export const ListDto = {
    query: t.Object({
        tableName: t.String({ description: '动态表名' }),
        pageNum: t.Number({ description: '页码', default: 1 }),
        pageSize: t.Number({ description: '每页数量', default: 10 }),
        orderByColumn: t.Optional(t.String({ description: '排序字段' })),
        sortRule: t.Optional(t.String({ description: '排序规则(asc/desc)', default: 'desc' })),
        fields: t.Optional(t.String({ description: '字段列表(逗号分隔)' })),
        ...Object.fromEntries(
            Array.from({ length: 20 }, (_, i) => [`filter${i}`, t.Optional(t.String({ description: `动态筛选字段${i}` }))])
        ),
    }),
    response: {
        200: t.Object({
            code: t.Number(),
            msg: t.String(),
            data: t.Object({
                list: t.Array(DynamicRecord),
                total: t.Number(),
            }),
        }),
        500: t.Object({ code: t.Number(), msg: t.String(), data: t.Null() }),
    },
};

export const FindOneDto = {
    response: {
        200: t.Object({
            code: t.Number(),
            msg: t.String(),
            data: t.Union([t.Null(), DynamicRecord]),
        }),
        500: t.Object({ code: t.Number(), msg: t.String(), data: t.Null() }),
    },
};

export const CreateDto = {
    body: t.Object({
        tableName: t.String({ description: '动态表名' }),
        data: DynamicRecord,
    }),
    response: {
        200: t.Object({
            code: t.Number(),
            msg: t.String(),
            data: DynamicRecord,
        }),
        500: t.Object({ code: t.Number(), msg: t.String(), data: t.Null() }),
    },
};

export const UpdateDto = {
    body: t.Object({
        tableName: t.String({ description: '动态表名' }),
        id: t.Number({ description: '主键ID' }),
        data: DynamicRecord,
    }),
    response: {
        200: t.Object({
            code: t.Number(),
            msg: t.String(),
            data: DynamicRecord,
        }),
        500: t.Object({ code: t.Number(), msg: t.String(), data: t.Null() }),
    },
};

export const RemoveDto = {
    response: {
        200: t.Object({
            code: t.Number(),
            msg: t.String(),
            data: t.Null(),
        }),
        500: t.Object({ code: t.Number(), msg: t.String(), data: t.Null() }),
    },
};
