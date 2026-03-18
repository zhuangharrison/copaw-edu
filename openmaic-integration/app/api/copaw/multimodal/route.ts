import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { checkCredits, deductCredits } from '@/lib/server/credits';
import { prisma } from '@/lib/server/db';

/**
 * POST /api/copaw/multimodal
 *
 * 多模态内容生成（图片/视频/思维导图）
 *
 * Body:
 * - type: 'image' | 'video' | 'mindmap'
 * - prompt: string
 * - size?: string (e.g., '1024x1024')
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { type, prompt, size = '1024x1024' } = await request.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: '描述不能为空' }, { status: 400 });
  }

  // 确定操作类型和积分消耗
  const operationMap = {
    image: 'image_gen' as const,
    video: 'video_gen' as const,
    mindmap: 'image_gen' as const,
  };

  const operation = operationMap[type as keyof typeof operationMap];
  if (!operation) {
    return NextResponse.json({ error: '无效的生成类型' }, { status: 400 });
  }

  // 积分检查
  const check = await checkCredits(user.id, operation);
  if (!check.allowed) {
    return NextResponse.json(
      { error: 'INSUFFICIENT_CREDITS', cost: check.cost, balance: check.balance },
      { status: 402 },
    );
  }

  // 获取图片生成提供商配置
  const category = type === 'video' ? 'video' : 'image';
  const providerConfig = await getMultimodalConfig(category);

  if (!providerConfig) {
    return NextResponse.json(
      { error: '多模态生成尚未配置，请联系管理员在后台配置图片/视频生成提供商' },
      { status: 503 },
    );
  }

  try {
    let result;

    if (type === 'image' || type === 'mindmap') {
      // 图片生成（OpenAI DALL-E 兼容接口）
      const educationalPrompt = type === 'mindmap'
        ? `Create a clear, educational mind map diagram for: ${prompt}. Use clean layout, clear hierarchy, colorful nodes, and Chinese labels where appropriate.`
        : `Create an educational illustration for: ${prompt}. Make it clear, informative, and suitable for students.`;

      const response = await fetch(`${providerConfig.apiBase}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${providerConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: providerConfig.model,
          prompt: educationalPrompt,
          n: 1,
          size,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return NextResponse.json(
          { error: `图片生成失败 (${response.status}): ${errorText.slice(0, 200)}` },
          { status: 502 },
        );
      }

      const data = await response.json();
      result = {
        type: 'image',
        url: data.data?.[0]?.url,
        revisedPrompt: data.data?.[0]?.revised_prompt,
      };
    } else if (type === 'video') {
      // 视频生成（预留接口）
      result = {
        type: 'video',
        status: 'pending',
        message: '视频生成已提交，预计 2-5 分钟完成',
      };
    }

    // 扣减积分
    await deductCredits(user.id, operation, 1, { type, prompt: prompt.slice(0, 100) });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function getMultimodalConfig(category: string): Promise<{
  apiBase: string;
  apiKey: string;
  model: string;
} | null> {
  try {
    const config = await prisma.adminProviderConfig.findFirst({
      where: { category, isEnabled: true },
      orderBy: { priority: 'desc' },
    });

    if (config) {
      const { decrypt } = await import('@/lib/server/admin/encryption');
      return {
        apiBase: config.baseUrl ?? 'https://api.openai.com/v1',
        apiKey: decrypt(config.apiKey),
        model: config.models ? JSON.parse(config.models)[0] : 'dall-e-3',
      };
    }
  } catch {
    // 未配置
  }

  // 回退到环境变量
  if (process.env.IMAGE_API_KEY) {
    return {
      apiBase: process.env.IMAGE_API_BASE ?? 'https://api.openai.com/v1',
      apiKey: process.env.IMAGE_API_KEY,
      model: process.env.IMAGE_MODEL ?? 'dall-e-3',
    };
  }

  return null;
}
