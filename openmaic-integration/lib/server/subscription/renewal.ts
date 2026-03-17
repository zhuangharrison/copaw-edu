import { prisma } from '@/lib/server/db';
import { addCredits } from '@/lib/server/credits';
import { getPlanById } from './plans';

/**
 * 处理订阅续费逻辑
 * 应在定时任务（cron job）或应用启动时调用
 *
 * 检查所有活跃订阅：
 * - 到期的订阅标记为 EXPIRED
 * - 已取消但到期的订阅标记为 EXPIRED
 * - 活跃订阅在月初发放积分
 */
export async function processSubscriptionRenewals(): Promise<{
  expired: number;
  renewed: number;
  errors: string[];
}> {
  const now = new Date();
  const errors: string[] = [];
  let expired = 0;
  let renewed = 0;

  // 1. 处理到期订阅
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      endDate: { lt: now },
      status: { in: ['ACTIVE', 'CANCELLED'] },
    },
    include: { user: true },
  });

  for (const sub of expiredSubs) {
    try {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });

      // 降级用户角色
      await prisma.user.update({
        where: { id: sub.userId },
        data: { role: 'FREE' },
      });

      expired++;
    } catch (err) {
      errors.push(`Failed to expire subscription ${sub.id}: ${err}`);
    }
  }

  // 2. 发放月度积分（活跃订阅，且上次发放超过28天）
  const activeSubs = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { gt: now },
    },
  });

  for (const sub of activeSubs) {
    try {
      const plan = getPlanById(sub.plan);
      if (!plan) continue;

      // 检查本月是否已发放（查最近30天内的 SUBSCRIPTION 类型积分记录）
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 28);

      const recentGrant = await prisma.creditHistory.findFirst({
        where: {
          userId: sub.userId,
          type: 'SUBSCRIPTION',
          createdAt: { gt: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!recentGrant) {
        const totalCredits = sub.monthlyCredits + sub.bonusCredits;
        await addCredits(sub.userId, totalCredits, 'SUBSCRIPTION', `${plan.name}月度积分`);
        renewed++;
      }
    } catch (err) {
      errors.push(`Failed to renew subscription ${sub.id}: ${err}`);
    }
  }

  return { expired, renewed, errors };
}

/**
 * 检查单个用户的订阅状态
 */
export async function checkUserSubscription(userId: string): Promise<{
  isActive: boolean;
  plan: string | null;
  daysLeft: number;
}> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!sub || sub.status !== 'ACTIVE') {
    return { isActive: false, plan: null, daysLeft: 0 };
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / 86400000));

  if (daysLeft === 0) {
    // 已到期，更新状态
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'EXPIRED' },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'FREE' },
    });
    return { isActive: false, plan: null, daysLeft: 0 };
  }

  return { isActive: true, plan: sub.plan, daysLeft };
}
