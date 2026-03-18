import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import { checkCredits, deductCredits } from '@/lib/server/credits';
import { getSkillById, detectSkill, getSkillsByRole } from '@/lib/skills/copaw/registry';
import { buildRoleSystemPrompt, type UserProfile, type CoPawRole } from '@/lib/skills/copaw/roles';
import { prisma } from '@/lib/server/db';
import type { CoPawSkill } from '@/lib/skills/copaw/types';

/**
 * POST /api/copaw/chat
 *
 * CoPaw 教学对话 API（流式输出）
 *
 * Body:
 * - message: string           用户消息
 * - role: CoPawRole           当前角色模式
 * - skillId?: string          强制使用某个技能
 * - history?: ChatMessage[]   对话历史
 * - profile?: UserProfile     用户资料（可选，用于个性化）
 */
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  // 积分检查
  const creditCheck = await checkCredits(user.id, 'copaw_skill');
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: 'INSUFFICIENT_CREDITS', cost: creditCheck.cost, balance: creditCheck.balance },
      { status: 402 },
    );
  }

  const body = await request.json();
  const {
    message,
    role = 'student' as CoPawRole,
    skillId,
    history = [] as { role: string; content: string }[],
    profile,
  } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
  }

  // 1. 技能检测
  let detectedSkill: CoPawSkill | null = null;
  if (skillId) {
    detectedSkill = (await getSkillById(skillId)) ?? null;
  } else {
    const detected = await detectSkill(message);
    if (detected && detected.role === role) {
      detectedSkill = detected;
    }
  }

  // 2. 构建系统提示
  const userProfile: UserProfile = profile ?? {
    name: user.name ?? '同学',
    role,
    gradeLevel: '初中',
    grade: '初二',
    subjects: ['语文', '数学', '英语'],
  };

  let systemPrompt = buildRoleSystemPrompt(userProfile);

  // 添加技能摘要
  const roleSkills = await getSkillsByRole(role);
  if (roleSkills.length > 0) {
    systemPrompt += '\n\n# 可用技能\n\n';
    systemPrompt += '你拥有以下专业技能，当用户的问题匹配时，请运用对应技能的方法论来回答：\n\n';
    for (const s of roleSkills) {
      systemPrompt += `- **${s.displayName}**：${s.description}\n`;
    }
  }

  // 注入激活技能的完整 prompt
  if (detectedSkill) {
    systemPrompt += `\n\n# 当前激活技能：${detectedSkill.displayName}\n\n`;
    systemPrompt += '请严格按照以下技能方法论来回答用户的问题：\n\n';
    systemPrompt += detectedSkill.systemPrompt;
  }

  // 3. 构建消息列表
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ];

  // 添加历史（最多 20 条）
  const recentHistory = history.slice(-20);
  messages.push(...recentHistory);

  // 添加用户消息
  let userMsg = message;
  if (detectedSkill && !skillId) {
    userMsg += `\n\n[系统提示：已自动匹配技能「${detectedSkill.displayName}」，请运用该技能的方法论来回答]`;
  }
  messages.push({ role: 'user', content: userMsg });

  // 4. 获取 LLM 配置（从后端管理配置读取）
  const llmConfig = await getLLMConfig();

  // 5. 流式调用 LLM
  try {
    const llmResponse = await fetch(`${llmConfig.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text().catch(() => '');
      return NextResponse.json(
        { error: `LLM API 错误 (${llmResponse.status}): ${errorText.slice(0, 200)}` },
        { status: 502 },
      );
    }

    // 扣减积分
    await deductCredits(user.id, 'copaw_skill', 1, {
      skillId: detectedSkill?.id,
      role,
    });

    // 返回 SSE 流
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        // 先发送技能检测结果
        if (detectedSkill) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'skill', skill: { id: detectedSkill.id, displayName: detectedSkill.displayName } })}\n\n`),
          );
        }

        const reader = llmResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`),
                  );
                }
              } catch {
                // skip
              }
            }
          }
        } finally {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '未知错误';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * 从后端管理配置中获取 LLM 配置
 */
async function getLLMConfig(): Promise<{ apiBase: string; apiKey: string; model: string }> {
  // 尝试从管理员配置中读取
  try {
    const defaults = await prisma.adminDefaultConfig.findMany();
    const defaultMap: Record<string, string> = {};
    for (const d of defaults) {
      defaultMap[d.key] = d.value;
    }

    const provider = defaultMap['default_llm_provider'] ?? 'openai';
    const model = defaultMap['default_llm_model'] ?? 'gpt-4o';

    // 查找对应的提供商配置
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
    // 配置尚未设置，使用环境变量回退
  }

  // 回退到环境变量
  return {
    apiBase: process.env.LLM_API_BASE ?? 'https://api.openai.com/v1',
    apiKey: process.env.LLM_API_KEY ?? '',
    model: process.env.LLM_MODEL ?? 'gpt-4o',
  };
}

function getDefaultBaseUrl(provider: string): string {
  const urls: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    deepseek: 'https://api.deepseek.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    kimi: 'https://api.moonshot.cn/v1',
    glm: 'https://open.bigmodel.cn/api/paas/v4',
    doubao: 'https://ark.cn-beijing.volces.com/api/v3',
  };
  return urls[provider] ?? 'https://api.openai.com/v1';
}
