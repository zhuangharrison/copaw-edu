import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

/**
 * POST /api/subscription/cancel
 * 取消订阅（到期后不再续费，当前周期积分保留）
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  if (!subscription) {
    return NextResponse.json({ error: '未找到订阅' }, { status: 404 });
  }

  if (subscription.status !== 'ACTIVE') {
    return NextResponse.json({ error: '订阅已取消或过期' }, { status: 400 });
  }

  await prisma.subscription.update({
    where: { userId: user.id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ ok: true, message: '订阅已取消，当前周期积分仍可使用' });
}
