/**
 * CoPaw-Edu 核心教学引擎
 * 对应原始 Python 版 app.py + llm_client.py
 *
 * 负责：
 * - 构建系统提示词（角色 + 技能）
 * - 技能自动检测与路由
 * - 调用 LLM（通过后端 provider）
 * - 管理对话上下文
 */

import { getAllSkills, getSkillsByRole, getSkillById, detectSkill } from './registry';
import { buildRoleSystemPrompt, type UserProfile, type CoPawRole } from './roles';
import type { CoPawSkill } from './types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface EngineConfig {
  /** 后端提供商 API 地址 (OpenAI-compatible) */
  apiBase: string;
  /** API Key（后端管理模式下由服务端注入，无需前端传递） */
  apiKey?: string;
  /** 模型名称 */
  model: string;
  /** temperature */
  temperature?: number;
  /** max_tokens */
  maxTokens?: number;
}

export interface ChatResult {
  /** 检测到的技能 */
  detectedSkill: CoPawSkill | null;
  /** 完整的 system prompt */
  systemPrompt: string;
  /** 发送给 LLM 的消息列表 */
  messages: ChatMessage[];
}

/**
 * 核心教学引擎
 */
export class CoPawEngine {
  private conversationHistory: ChatMessage[] = [];
  private maxHistorySize = 20; // 保留最近20条消息（10轮对话）

  constructor(
    private profile: UserProfile,
    private config: EngineConfig,
  ) {}

  /**
   * 构建完整的系统提示词（角色 + 所有可用技能摘要）
   */
  async buildSystemPrompt(activeSkill?: CoPawSkill): Promise<string> {
    let prompt = buildRoleSystemPrompt(this.profile);

    // 获取当前角色的所有技能
    const skills = await getSkillsByRole(this.profile.role);

    // 添加技能摘要（不是完整 prompt，避免 token 过多）
    if (skills.length > 0) {
      prompt += '\n\n# 可用技能\n\n';
      prompt += '你拥有以下专业技能，当用户的问题匹配时，请运用对应技能的方法论来回答：\n\n';
      for (const skill of skills) {
        prompt += `- **${skill.displayName}**：${skill.description}\n`;
      }
    }

    // 如果有激活的特定技能，注入其完整 systemPrompt
    if (activeSkill) {
      prompt += `\n\n# 当前激活技能：${activeSkill.displayName}\n\n`;
      prompt += '请严格按照以下技能方法论来回答用户的问题：\n\n';
      prompt += activeSkill.systemPrompt;
    }

    return prompt;
  }

  /**
   * 准备对话消息（检测技能 + 构建 prompt）
   */
  async prepareChat(userMessage: string, forceSkillId?: string): Promise<ChatResult> {
    // 1. 技能检测
    let detectedSkill: CoPawSkill | null = null;

    if (forceSkillId) {
      detectedSkill = (await getSkillById(forceSkillId)) ?? null;
    } else {
      detectedSkill = (await detectSkill(userMessage)) ?? null;
      // 检查技能是否属于当前角色
      if (detectedSkill && detectedSkill.role !== this.profile.role) {
        detectedSkill = null;
      }
    }

    // 2. 构建系统提示
    const systemPrompt = await this.buildSystemPrompt(detectedSkill ?? undefined);

    // 3. 构建消息列表
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // 添加历史对话
    messages.push(...this.conversationHistory.slice(-this.maxHistorySize));

    // 添加用户消息（带技能提示）
    let finalUserMessage = userMessage;
    if (detectedSkill && !forceSkillId) {
      finalUserMessage += `\n\n[系统提示：已自动匹配技能「${detectedSkill.displayName}」，请运用该技能的方法论来回答]`;
    }

    messages.push({ role: 'user', content: finalUserMessage });

    return { detectedSkill, systemPrompt, messages };
  }

  /**
   * 流式调用 LLM
   * 返回 ReadableStream 用于 SSE 传输
   */
  async chatStream(userMessage: string, forceSkillId?: string): Promise<{
    stream: ReadableStream<string>;
    detectedSkill: CoPawSkill | null;
  }> {
    const { detectedSkill, messages } = await this.prepareChat(userMessage, forceSkillId);

    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const apiBase = this.config.apiBase;
    const apiKey = this.config.apiKey ?? '';
    const model = this.config.model;
    const temperature = this.config.temperature ?? 0.7;
    const maxTokens = this.config.maxTokens ?? 4096;

    // 记录用户消息到历史
    this.conversationHistory.push({ role: 'user', content: userMessage });

    let fullResponse = '';

    const stream = new ReadableStream<string>({
      async start(controller) {
        try {
          const response = await fetch(`${apiBase}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: formattedMessages,
              stream: true,
              temperature,
              max_tokens: maxTokens,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            controller.enqueue(`[错误] API 请求失败 (${response.status}): ${errorText.slice(0, 200)}`);
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.enqueue('[错误] 无法读取响应流');
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

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
                  fullResponse += content;
                  controller.enqueue(content);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }

          controller.close();
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '未知错误';
          controller.enqueue(`[错误] ${msg}`);
          controller.close();
        }
      },
    });

    // 异步保存助手回复到历史（stream 完成后）
    const engineRef = this;
    const originalStream = stream;
    const wrappedStream = new ReadableStream<string>({
      async start(controller) {
        const reader = originalStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // stream 完成，保存到历史
              if (fullResponse) {
                engineRef.conversationHistory.push({ role: 'assistant', content: fullResponse });
              }
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return { stream: wrappedStream, detectedSkill };
  }

  /**
   * 同步调用 LLM（非流式）
   */
  async chat(userMessage: string, forceSkillId?: string): Promise<{
    content: string;
    detectedSkill: CoPawSkill | null;
  }> {
    const { detectedSkill, messages } = await this.prepareChat(userMessage, forceSkillId);

    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch(`${this.config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey ?? ''}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: formattedMessages,
        stream: false,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败 (${response.status})`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // 保存到历史
    this.conversationHistory.push({ role: 'user', content: userMessage });
    this.conversationHistory.push({ role: 'assistant', content });

    return { content, detectedSkill };
  }

  /** 清空对话历史 */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /** 获取对话历史 */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /** 更新用户资料 */
  updateProfile(profile: Partial<UserProfile>): void {
    Object.assign(this.profile, profile);
  }

  /** 更新引擎配置 */
  updateConfig(config: Partial<EngineConfig>): void {
    Object.assign(this.config, config);
  }
}
