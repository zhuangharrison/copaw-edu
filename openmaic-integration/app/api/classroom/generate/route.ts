import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { checkCredits, deductCredits, type OperationType } from '@/lib/server/credits';
import { generateClassroom } from '@/lib/classroom/scene-generator';
import { prisma } from '@/lib/server/db';
import type { GenerateClassroomOptions } from '@/lib/classroom/types';

/**
 * POST /api/classroom/generate
 *
 * 一键生成课堂（SSE 流式返回进度）
 *
 * Body: GenerateClassroomOptions
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const opts: GenerateClassroomOptions = await request.json();

  // 根据场景数量确定积分消耗
  const sceneCount = opts.sceneCount ?? 5;
  let operation: OperationType;
  if (sceneCount <= 5) {
    operation = 'classroom_basic';
  } else if (sceneCount <= 10) {
    operation = 'classroom_standard';
  } else {
    operation = 'classroom_advanced';
  }

  // 积分检查
  const creditCheck = await checkCredits(user.id, operation);
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: 'INSUFFICIENT_CREDITS', cost: creditCheck.cost, balance: creditCheck.balance },
      { status: 402 },
    );
  }

  // 获取 LLM 配置
  const llmConfig = await getLLMConfig();

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // LLM 调用函数
        const llmCall = async (prompt: string): Promise<string> => {
          const res = await fetch(`${llmConfig.apiBase}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${llmConfig.apiKey}`,
            },
            body: JSON.stringify({
              model: llmConfig.model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 4096,
            }),
          });

          if (!res.ok) {
            throw new Error(`LLM API 错误 (${res.status})`);
          }

          const data = await res.json();
          return data.choices?.[0]?.message?.content ?? '';
        };

        // 生成课堂
        const classroom = await generateClassroom(
          opts,
          llmCall,
          (stage, progress) => {
            sendEvent({ type: 'progress', stage, progress });
          },
        );

        // 扣减积分
        await deductCredits(user.id, operation, 1, {
          classroomId: classroom.id,
          topic: opts.topic,
          sceneCount,
        });

        sendEvent({ type: 'complete', classroom });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '生成失败';
        sendEvent({ type: 'error', error: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

async function getLLMConfig(): Promise<{ apiBase: string; apiKey: string; model: string }> {
  try {
    const defaults = await prisma.adminDefaultConfig.findMany();
    const defaultMap: Record<string, string> = {};
    for (const d of defaults) {
      defaultMap[d.key] = d.value;
    }

    const provider = defaultMap['default_llm_provider'] ?? 'openai';
    const model = defaultMap['default_llm_model'] ?? 'gpt-4o';

    const providerConfig = await prisma.adminProviderConfig.findFirst({
      where: { providerId: provider, category: 'llm', isEnabled: true },
    });

    if (providerConfig) {
      const { decrypt } = await import('@/lib/server/admin/encryption');
      return {
        apiBase: providerConfig.baseUrl ?? getDefaultBaseUrl(provider),
        apiKey: decrypt(providerConfig.apiKey),
        model,
      };
    }
  } catch {
    // fallback
  }

  return {
    apiBase: process.env.LLM_API_BASE ?? 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY ?? '',
    model: process.env.LLM_MODEL ?? 'gpt-4o',
  };
}

function getDefaultBaseUrl(provider: string): string {
  const urls: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    kimi: 'https://api.moonshot.cn/v1',
    glm: 'https://open.bigmodel.cn/api/paas/v4',
  };
  return urls[provider] ?? 'https://api.openai.com/v1';
}
