import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { addCredits } from '@/lib/server/credits';
import { getPlanById, CREDIT_PACKS } from '@/lib/server/subscription/plans';

/**
 * POST /api/payment/webhook
 * 支付网关回调
 *
 * 处理支付成功通知：
 * - 积分包购买 → 充值积分
 * - 订阅支付 → 激活订阅 + 充值积分
 * - 订阅续费 → 续费积分
 *
 * 注意：实际生产中需验证回调签名
 */
export async function POST(request: Request) {
  // 验证回调签名（生产环境需实现）
  const signature = request.headers.get('x-payment-signature');
  if (process.env.PAYMENT_MODE === 'production' && !signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const body = await request.json();
  const {
    orderId,
    status,
    type,       // 'credit_pack' | 'subscription' | 'renewal'
    userId,
    metadata,   // { packId, planId, period }
  } = body;

  if (status !== 'success') {
    // 非成功状态，记录日志后直接返回
    console.log(`[webhook] Order ${orderId} status: ${status}`);
    return NextResponse.json({ received: true });
  }

  // === 积分包购买成功 ===
  if (type === 'credit_pack') {
    const pack = CREDIT_PACKS.find((p) => p.id === metadata?.packId);
    if (!pack) {
      return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });
    }

    await addCredits(userId, pack.credits, 'PURCHASE', `购买${pack.label}（订单${orderId}）`);
    return NextResponse.json({ received: true, credits: pack.credits });
  }

  // === 订阅支付成功 ===
  if (type === 'subscription') {
    const plan = getPlanById(metadata?.planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const period = metadata?.period ?? 'MONTHLY';
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
      where: { userId },
      create: {
        userId,
        plan: plan.id,
        period,
        status: 'ACTIVE',
        monthlyCredits,
        bonusCredits,
        startDate,
        endDate,
      },
      update: {
        plan: plan.id,
        period,
        status: 'ACTIVE',
        monthlyCredits,
        bonusCredits,
        startDate,
        endDate,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { role: plan.id },
    });

    await addCredits(userId, totalCredits, 'SUBSCRIPTION', `${plan.name}订阅激活`);

    return NextResponse.json({ received: true, creditsAdded: totalCredits });
  }

  // === 订阅续费 ===
  if (type === 'renewal') {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub) {
      return NextResponse.json({ error: 'No subscription' }, { status: 400 });
    }

    const plan = getPlanById(sub.plan);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const totalCredits = sub.monthlyCredits + sub.bonusCredits;

    // 延长到期时间
    const newEndDate = new Date(sub.endDate);
    if (sub.period === 'YEARLY') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    await prisma.subscription.update({
      where: { userId },
      data: { endDate: newEndDate, status: 'ACTIVE' },
    });

    await addCredits(userId, totalCredits, 'SUBSCRIPTION', `${plan.name}续费积分`);

    return NextResponse.json({ received: true, creditsAdded: totalCredits });
  }

  return NextResponse.json({ received: true });
}
