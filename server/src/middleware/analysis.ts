import { Context } from 'elysia';
import config from '@/config';
import { RouteMap, RouteList } from '@/modules';
import { BaseResultData } from '@/core/result';

/**
 * 解析路由信息
 */
export async function AnalysisRoute(ctx: Context) {
    // [WORKAROUND] Elysia scoped plugin 的 onError 存在泄漏 bug，BullMQ 插件路由不在业务 RouteMap 中，
    // 必须在此直接放行，否则 AnalysisRoute 会返回 404 导致 BullMQ UI 不可用。
    // 上游 issue: https://github.com/elysiajs/elysia/issues/469
    const bullmqPath = `${config.app.prefix}/bullmq`;
    if (ctx.route?.startsWith(bullmqPath)) return;
    const routeKey = `${ctx.request.method}:${ctx.route}`;
    (ctx as any).routeKey = routeKey;
    const routeIndex = RouteMap.get(routeKey);
    if (routeIndex === undefined || routeIndex === null) return BaseResultData.fail(404);
    const route = RouteList[routeIndex];
    const routeInfo = {
        tags: route.tags[0],
        summary: route.route.summary,
        meta: route.route.meta
    };
    (ctx as any).routeInfo = routeInfo;
};