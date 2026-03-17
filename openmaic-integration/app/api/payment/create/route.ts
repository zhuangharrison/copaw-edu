import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { addCredits } from '@/lib/server/credits';
import { CREDIT_PACKS, getPlanById } from '@/lib/server/subscription/plans';
import { prisma } from '@/lib/server/db';
import { randomBytes } from 'crypto';

/**
 * POST /api/payment/create
 * 创建支付订单
 *
 * 支持两种模式:
 * 1. 积分包购买: { type: 'credit_pack', packId: 'pack_100' }
 * 2. 订阅支付: { type: 'subscription', planId: 'TEACHER', period: 'MONTHLY' }
 *
 * 开发/测试模式下自动模拟支付成功
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const body = await request.json();
  const { type } = body;

  const orderId = `ord_${randomBytes(12).toString('hex')}`;

  // === 积分包购买 ===
  if (type === 'credit_pack') {
    const { packId } = body;
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: '无效的积分包' }, { status: 400 });
    }

    // 开发模式：直接模拟支付成功
    if (process.env.PAYMENT_MODE !== 'production') {
      await addCredits(user.id, pack.credits, 'PURCHASE', `购买${pack.label}`);
      return NextResponse.json({
        orderId,
        status: 'completed',
        credits: pack.credits,
      });
    }

    // 生产模式：创建待支付订单（对接支付网关后返回支付链接）
    return NextResponse.json({
      orderId,
      status: 'pending',
      amount: pack.price,
      description: `购买${pack.label}`,
      // qrUrl: '...', // 支付网关返回的二维码URL
    });
  }

  // === 订阅支付 ===
  if (type === 'subscription') {
    const { planId, period } = body;
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: '无效的方案' }, { status: 400 });
    }

    const price = period === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

    // 开发模式：直接激活订阅
    if (process.env.PAYMENT_MODE !== 'production') {
      const startDate = new Date();
      const endDate = new Date();
      if (period === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const monthlyCredits = plan.monthlyCredits;
      const bonusCredits = period === 'YEARLY' ? plan.yearlyBonusCredits : 0;
      const totalCredits = monthlyCredits + bonusCredits;

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          plan: planId,
          period,
          status: 'ACTIVE',
          monthlyCredits,
          bonusCredits,
          startDate,
          endDate,
        },
        update: {
          plan: planId,
          period,
          status: 'ACTIVE',
          monthlyCredits,
          bonusCredits,
          startDate,
          endDate,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { role: planId },
      });

      await addCredits(user.id, totalCredits, 'SUBSCRIPTION', `${plan.name}订阅 - 首月积分`);

      return NextResponse.json({
        orderId,
        status: 'completed',
        creditsAdded: totalCredits,
      });
    }

    return NextResponse.json({
      orderId,
      status: 'pending',
      amount: price,
      description: `${plan.name}${period === 'YEARLY' ? '年付' : '月付'}订阅`,
    });
  }

  return NextResponse.json({ error: '无效的支付类型' }, { status: 400 });
}
