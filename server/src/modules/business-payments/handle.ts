import { Context } from 'elysia';
import { and, eq } from 'drizzle-orm';
import pg from '@/core/database/pg';
import { BaseResultData } from '@/core/result';
import {
    InsertOne,
    CreateQueryBuilder,
    FindAll,
    FindOneByKey,
} from '@/core/database/repository';
import { Pay } from '@/infrastructure/clients/payment';
import { RunTransaction } from '@/core/database/transaction';
import { businessOrdersSchema } from '@database/schema/business_orders';
import { businessPaymentsSchema } from '@database/schema/business_payments';
import { businessMerchantSchema, businessMerchantConfigsSchema } from '@database/schema/business_merchant';
import type { PaymentChannel, PaymentPlatform, } from '@/types/pay';

// 不可支付的订单状态 → 错误消息
const ORDER_NONPAYABLE_STATUS: Record<string, string> = {
    '1': '订单已支付',
    '2': '订单已取消',
    '3': '订单已过期',
    '4': '订单已退款',
};

// 已有支付记录时不可继续的状态
const ORDER_COMPLETED_STATUS: Record<string, string> = {
    '1': '订单已完成',
    '2': '订单已失败',
    '3': '订单已关闭',
};

async function validateOrderForPayment(orderNo: string, userId: string, tenantId: string) {
    const orderInfo = await FindOneByKey(businessOrdersSchema, 'orderNo', orderNo, tenantId);
    if (!orderInfo || orderInfo.delFlag) return { code: 404, msg: '订单不存在' };
    if (userId != orderInfo.createBy) return { code: 403, msg: '您没有权限支付该订单' };
    const nowTime = new Date().getTime();
    if (nowTime > new Date(orderInfo?.expireTime || '').getTime()) return { code: 400, msg: '订单已过期' };
    const statusMsg = ORDER_NONPAYABLE_STATUS[orderInfo.status];
    if (statusMsg) return { code: 400, msg: statusMsg };
    return { orderInfo };
}

async function validateMerchantForPayment(merchantId: number, tenantId: string) {
    const merchantInfo = await FindOneByKey(businessMerchantSchema, 'id', merchantId, tenantId);
    if (!merchantInfo || merchantInfo.delFlag) return { code: 404, msg: '商家不存在' };
    if (!merchantInfo.status) return { code: 400, msg: '商家已禁用' };
    return {};
}

async function getMerchantConfig(merchantId: number, paymentMethod: string, tenantId: string) {
    const where = CreateQueryBuilder(businessMerchantConfigsSchema, tenantId)
        .eq('delFlag', false)
        .eq('status', true)
        .eq('channel', paymentMethod)
        .eq('merchantId', merchantId)
        .build();
    const arr = await FindAll(businessMerchantConfigsSchema, where);
    const config = arr[0] || null;
    if (!config || config.delFlag || !config.status) return { error: { code: 404, msg: '商家配置不存在' } };
    return { config };
}

function buildGoodsList(orderInfo: any) {
    return ((orderInfo.extra as any)?.products || []).map((item: any) => ({
        goods_id: item.productId,
        goods_name: item.productName || '',
        quantity: item.productNum || 0,
        price: item.productPrice || 0,
    }));
}

export async function payOrder(ctx: Context) {
    try {
        const userId = (ctx as any)?.user?.userId;
        const tenantId = (ctx as any)?.tenantId;
        const { orderNo, paymentMethod, platform } = ctx.body as {
            orderNo: string; paymentMethod: PaymentChannel; platform: PaymentPlatform;
        };

        const orderResult = await validateOrderForPayment(orderNo, userId, tenantId);
        if ('code' in orderResult) return BaseResultData.fail(orderResult.code, orderResult.msg);
        const orderInfo = orderResult.orderInfo;

        const merchantResult = await validateMerchantForPayment(orderInfo.merchantId, tenantId);
        if ('code' in merchantResult) return BaseResultData.fail(merchantResult.code, merchantResult.msg);

        const { config: merchantConfig, error: configError } = await getMerchantConfig(orderInfo.merchantId, paymentMethod, tenantId);
        if (configError) return BaseResultData.fail(configError.code, configError.msg);

        const { notifyUrl, returnUrl } = merchantConfig.config as any;
        const payment = await FindOneByKey(businessPaymentsSchema, 'orderNo', orderInfo.orderNo, tenantId);
        const goodsList = buildGoodsList(orderInfo);

        const result = await Pay(paymentMethod, platform).create(merchantConfig, {
            paymentNo: payment?.paymentNo,
            title: orderInfo.title,
            amount: orderInfo.amount + '',
            currency: orderInfo.currency,
            orderNo,
            notifyUrl,
            returnUrl,
            goodsList,
        });

        if (payment) {
            if (payment.delFlag) return BaseResultData.fail(404, '支付记录不存在');
            const completedMsg = ORDER_COMPLETED_STATUS[orderInfo.status];
            if (completedMsg) return BaseResultData.fail(400, completedMsg);
            if (orderInfo.status === '0') {
                await pg.update(businessPaymentsSchema)
                    .set({ paymentMethod, platform, updateBy: userId, updateTime: new Date() })
                    .where(and(eq(businessPaymentsSchema.orderNo, orderInfo.orderNo), eq(businessPaymentsSchema.tenantId, tenantId)));
            }
        } else {
            await InsertOne(businessPaymentsSchema, ctx, {
                orderId: orderInfo.id,
                orderNo: orderInfo.orderNo,
                merchantConfigId: orderInfo.merchantId,
                paymentMethod,
                platform,
                createBy: userId,
                paymentNo: result.paymentNo,
            });
        }
        return BaseResultData.ok(result);
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

export async function payOrderReturn(ctx: Context) {
    try {
        /**
         * 1.查订单状态
         * 2.网页端：302重定向到前端结果页
         */
        // console.log('同步通知', ctx.query);
        return 'success';
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};

/** 从支付网关回调结果中提取统一的支付更新字段 */
function extractNotifyResult(res: any) {
    return {
        thirdTradeNo: res.thirdTradeNo || '',
        status: res.status === 'success' ? '1' : '2',
        amount: Number(res.amount || 0),
    };
}

export async function payOrderNotify(ctx: Context) {
    try {
        const data: any = ctx.body;
        console.log('异步通知', data);
        const paymentNo = data?.out_trade_no || '';
        if (!paymentNo) return 'success';

        const payment = await FindOneByKey(businessPaymentsSchema, 'paymentNo', paymentNo);
        if (!payment || payment.delFlag || payment.status !== '0' || !payment.merchantConfigId || !payment.paymentMethod) {
            return 'success';
        }

        const tenantId = payment.tenantId;
        const configArr = await pg.select().from(businessMerchantConfigsSchema).where(
            and(
                eq(businessMerchantConfigsSchema.merchantId, payment.merchantConfigId),
                eq(businessMerchantConfigsSchema.channel, payment.paymentMethod),
                eq(businessMerchantConfigsSchema.status, true),
                eq(businessMerchantConfigsSchema.delFlag, false),
                eq(businessMerchantConfigsSchema.tenantId, tenantId),
            )
        );
        const merchantConfig = configArr[0] || null;
        if (!merchantConfig) return 'success';

        const res = await Pay(payment.paymentMethod as PaymentChannel, payment.platform as PaymentPlatform)
            .notify(merchantConfig, { rawBody: data, headers: ctx.headers as any });
        if (!res) return 'success';

        const { thirdTradeNo, status, amount } = extractNotifyResult(res);
        const safeExtra = res.extra ? JSON.parse(JSON.stringify(res.extra)) : {};

        await RunTransaction(async (tx) => {
            await tx.update(businessPaymentsSchema)
                .set({ amount, status, thirdTradeNo, extra: safeExtra, updateTime: new Date() })
                .where(and(eq(businessPaymentsSchema.paymentNo, paymentNo), eq(businessPaymentsSchema.tenantId, tenantId)));
            await tx.update(businessOrdersSchema)
                .set({ status: '1', updateTime: new Date() })
                .where(and(
                    eq(businessOrdersSchema.orderNo, payment.orderNo),
                    eq(businessOrdersSchema.status, '0'),
                    eq(businessOrdersSchema.delFlag, false),
                    eq(businessOrdersSchema.tenantId, tenantId),
                ));
        });

        return 'success';
    } catch (error) {
        return BaseResultData.fail(500, error);
    }
};