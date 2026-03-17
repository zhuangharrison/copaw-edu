import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { checkCredits, type OperationType } from '@/lib/server/credits';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  return NextResponse.json({ credits: user.credits, role: user.role });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { operation, quantity } = (await request.json()) as {
    operation: OperationType;
    quantity?: number;
  };

  const result = await checkCredits(user.id, operation, quantity);
  return NextResponse.json(result);
}
