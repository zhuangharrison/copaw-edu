import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/server/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码必填' }, { status: 400 });
    }

    const { user, token } = await loginUser(email, password);

    const response = NextResponse.json({ user });
    response.cookies.set('maic_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'INVALID_CREDENTIALS') {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}
