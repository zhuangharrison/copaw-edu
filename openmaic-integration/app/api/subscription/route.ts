import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';
import { getPlanById } from '@/lib/server/subscription/plans';
import { addCredits } from '@/lib/server/credits';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({ subscription });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { planId, period } = await request.json() as { planId: string; period: 'MONTHLY' | 'YEARLY' };

  const plan = getPlanById(planId);
  if (!plan) return NextResponse.json({ error: '无效的方案' }, { status: 400 });

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

  // 创建或更新订阅
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

  // 更新用户角色
  await prisma.user.update({
    where: { id: user.id },
    data: { role: planId },
  });

  // 充值首月积分
  await addCredits(user.id, totalCredits, 'SUBSCRIPTION', `${plan.name}订阅 - 首月积分`);

  return NextResponse.json({ ok: true, creditsAdded: totalCredits });
}
