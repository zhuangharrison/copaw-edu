import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { addMemory, getDueMemories, reviewMemory } from '@/lib/server/learning';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const dueMemories = await getDueMemories(user.id);
  return NextResponse.json({ memories: dueMemories, count: dueMemories.length });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();

  // 复习已有记忆
  if (body.action === 'review' && body.id) {
    const updated = await reviewMemory(body.id);
    return NextResponse.json({ record: updated });
  }

  // 添加新记忆
  const record = await addMemory(user.id, body);
  return NextResponse.json({ record }, { status: 201 });
}
