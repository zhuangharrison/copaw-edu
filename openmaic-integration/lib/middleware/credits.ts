import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { checkCredits, deductCredits, type OperationType } from '@/lib/server/credits';

/**
 * 积分扣费中间件
 *
 * 在需要消耗积分的 API 路由中使用：
 *
 * ```ts
 * import { withCredits } from '@/lib/middleware/credits';
 *
 * export const POST = withCredits('classroom_basic', async (request, user) => {
 *   // 进入此处时积分已扣除
 *   return NextResponse.json({ ok: true });
 * });
 * ```
 */
export function withCredits(
  operation: OperationType,
  handler: (request: Request, user: { id: string; credits: number }, deducted: { cost: number; balance: number }) => Promise<NextResponse>,
  options?: { quantity?: number; metadata?: Record<string, unknown> },
) {
  return async (request: Request) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const quantity = options?.quantity ?? 1;

    // 检查积分
    const check = await checkCredits(user.id, operation, quantity);
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          message: '积分不足',
          cost: check.cost,
          balance: check.balance,
        },
        { status: 402 },
      );
    }

    // 扣减积分
    const result = await deductCredits(user.id, operation, quantity, options?.metadata);

    return handler(request, { id: user.id, credits: result.balance }, result);
  };
}

/**
 * 手动检查积分的辅助函数（用于更灵活的场景）
 */
export async function requireCredits(
  request: Request,
  operation: OperationType,
  quantity: number = 1,
): Promise<
  | { ok: true; userId: string; cost: number }
  | { ok: false; response: NextResponse }
> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: '未登录' }, { status: 401 }) };
  }

  const check = await checkCredits(user.id, operation, quantity);
  if (!check.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          message: '积分不足',
          cost: check.cost,
          balance: check.balance,
        },
        { status: 402 },
      ),
    };
  }

  return { ok: true, userId: user.id, cost: check.cost };
}
