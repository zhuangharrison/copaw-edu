import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { getCreditHistory } from '@/lib/server/credits';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const result = await getCreditHistory(user.id, { limit, offset });
  return NextResponse.json(result);
}
