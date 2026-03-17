import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

/**
 * POST /api/copaw/tts
 *
 * TTS 语音合成代理接口
 * 将请求转发到配置的 TTS 提供商
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { text, voice = 'alloy', speed = 1.0 } = await request.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: '缺少文本参数' }, { status: 400 });
  }

  // 获取 TTS 配置
  const config = await getTTSConfig();

  if (!config.apiKey) {
    return NextResponse.json({ error: 'TTS 未配置' }, { status: 503 });
  }

  try {
    const res = await fetch(`${config.apiBase}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: text.slice(0, 4096),
        voice,
        speed: Math.max(0.25, Math.min(4.0, speed)),
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `TTS API 错误 (${res.status})` },
        { status: 502 },
      );
    }

    const audioData = await res.arrayBuffer();

    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'TTS 请求失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function getTTSConfig(): Promise<{ apiBase: string; apiKey: string; model: string }> {
  try {
    const defaults = await prisma.adminDefaultConfig.findMany();
    const defaultMap: Record<string, string> = {};
    for (const d of defaults) {
      defaultMap[d.key] = d.value;
    }

    const apiBase = defaultMap['default_tts_base'] ?? '';
    const model = defaultMap['default_tts_model'] ?? 'tts-1';

    if (apiBase) {
      const providerConfig = await prisma.adminProviderConfig.findFirst({
        where: { category: 'tts', isEnabled: true },
      });

      if (providerConfig) {
        const { decrypt } = await import('@/lib/server/admin/encryption');
        return {
          apiBase,
          apiKey: decrypt(providerConfig.apiKey),
          model,
        };
      }
    }
  } catch {
    // fallback
  }

  return {
    apiBase: process.env.TTS_API_BASE ?? 'https://api.openai.com/v1',
    apiKey: process.env.TTS_API_KEY ?? '',
    model: process.env.TTS_MODEL ?? 'tts-1',
  };
}
