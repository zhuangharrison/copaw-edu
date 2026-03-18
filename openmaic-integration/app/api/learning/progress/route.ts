import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { getProgress, updateProgress } from '@/lib/server/learning';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get('skillId');
  if (!skillId) return NextResponse.json({ error: 'skillId 必填' }, { status: 400 });

  const progress = await getProgress(user.id, skillId);
  return NextResponse.json({ progress });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { skillId, data } = await request.json();
  if (!skillId) return NextResponse.json({ error: 'skillId 必填' }, { status: 400 });

  const progress = await updateProgress(user.id, skillId, data);
  return NextResponse.json({ progress });
}
