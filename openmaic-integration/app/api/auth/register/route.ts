import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/server/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码必填' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    const { user, token } = await registerUser(email, password, name);

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('maic_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30天
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'EMAIL_EXISTS') {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
    }
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
