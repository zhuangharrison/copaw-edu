import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';

/**
 * Admin 权限检查
 * 返回用户信息或 403 响应
 */
export async function requireAdmin(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return { error: NextResponse.json({ error: '未登录' }, { status: 401 }) };
  }

  if (user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: '无管理员权限' }, { status: 403 }) };
  }

  return { user };
}
