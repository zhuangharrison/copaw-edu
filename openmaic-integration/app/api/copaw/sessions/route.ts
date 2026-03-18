import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

/**
 * GET /api/copaw/sessions
 * 获取用户的对话会话列表
 */
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const progress = await prisma.learningProgress.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({
    sessions: progress.map((p) => ({
      id: p.id,
      skillId: p.skillId,
      data: JSON.parse(p.data),
      updatedAt: p.updatedAt,
    })),
  });
}

/**
 * POST /api/copaw/sessions
 * 保存对话会话
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { skillId, data } = await request.json();

  const session = await prisma.learningProgress.upsert({
    where: { userId_skillId: { userId: user.id, skillId: skillId ?? 'general' } },
    create: {
      userId: user.id,
      skillId: skillId ?? 'general',
      data: JSON.stringify(data),
    },
    update: {
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json({ id: session.id });
}
