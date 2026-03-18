import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';
import { decrypt } from '@/lib/server/admin/encryption';

/**
 * POST /api/admin/test-connection
 * 测试提供商连接
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  const { providerId, category } = await request.json();

  const config = await prisma.adminProviderConfig.findUnique({
    where: { providerId_category: { providerId, category } },
  });

  if (!config) {
    return NextResponse.json({ error: '未找到提供商配置' }, { status: 404 });
  }

  try {
    const apiKey = decrypt(config.apiKey);
    const baseUrl = config.baseUrl ?? getDefaultBaseUrl(providerId);

    // 尝试发送一个简单请求测试连接
    const testUrl = `${baseUrl}/models`;
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      return NextResponse.json({ ok: true, message: '连接成功' });
    }

    const text = await res.text().catch(() => '');
    return NextResponse.json({
      ok: false,
      error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ ok: false, error: message });
  }
}

function getDefaultBaseUrl(providerId: string): string {
  const urls: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    google: 'https://generativelanguage.googleapis.com/v1beta',
    deepseek: 'https://api.deepseek.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/api/v1',
    kimi: 'https://api.moonshot.cn/v1',
    minimax: 'https://api.minimax.chat/v1',
    glm: 'https://open.bigmodel.cn/api/paas/v4',
    doubao: 'https://ark.cn-beijing.volces.com/api/v3',
  };
  return urls[providerId] ?? 'https://api.openai.com/v1';
}
