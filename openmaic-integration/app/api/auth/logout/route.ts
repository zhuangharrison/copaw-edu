import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/server/auth';

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie');
  const match = cookie?.match(/maic_token=([^;]+)/);

  if (match) {
    await destroySession(match[1]);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('maic_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
