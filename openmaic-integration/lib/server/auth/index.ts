import { prisma } from '@/lib/server/db';
import { hashSync, compareSync } from 'bcryptjs';
import { randomBytes } from 'crypto';

const SESSION_EXPIRY_DAYS = 30;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  credits: number;
  avatarUrl: string | null;
}

export async function registerUser(
  email: string,
  password: string,
  name?: string,
): Promise<{ user: AuthUser; token: string }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = hashSync(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? email.split('@')[0],
      credits: 200, // 新用户赠送200积分
    },
  });

  // 记录赠送积分流水
  await prisma.creditHistory.create({
    data: {
      userId: user.id,
      amount: 200,
      balance: 200,
      type: 'INITIAL_GRANT',
      description: '新用户注册赠送',
    },
  });

  const token = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      credits: user.credits,
      avatarUrl: user.avatarUrl,
    },
    token,
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  if (!compareSync(password, user.passwordHash)) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      credits: user.credits,
      avatarUrl: user.avatarUrl,
    },
    token,
  };
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  const { user } = session;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    credits: user.credits,
    avatarUrl: user.avatarUrl,
  };
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

/**
 * 从请求头中提取并验证用户
 */
export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  const match = cookie.match(/maic_token=([^;]+)/);
  if (!match) return null;

  return validateSession(match[1]);
}
