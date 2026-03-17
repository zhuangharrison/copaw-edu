import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { addMistake, getMistakes } from '@/lib/server/learning';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const subject = searchParams.get('subject') ?? undefined;
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const result = await getMistakes(user.id, { subject, limit, offset });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();
  const record = await addMistake(user.id, body);
  return NextResponse.json({ record }, { status: 201 });
}
