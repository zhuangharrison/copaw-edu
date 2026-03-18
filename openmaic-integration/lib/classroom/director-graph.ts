/**
 * OpenMAIC 多智能体编排系统 - Director Graph
 *
 * 管理课堂中多个AI智能体的交互：
 * - 控制发言顺序
 * - 管理上下文传递
 * - 协调讨论流程
 * - 支持用户实时插入互动
 */

import type { Scene, SceneAgent, AgentRole } from './types';

export interface DirectorMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  avatar: string;
  content: string;
  timestamp: number;
  /** 是否为用户真人发言 */
  isUser?: boolean;
}

export interface DirectorState {
  /** 当前场景 */
  scene: Scene;
  /** 对话历史 */
  messages: DirectorMessage[];
  /** 当前发言者 */
  currentSpeaker: string | null;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 是否暂停 */
  isPaused: boolean;
  /** 进度（0-100） */
  progress: number;
}

interface LLMStreamCallFn {
  (
    systemPrompt: string,
    messages: { role: string; content: string }[],
    onChunk: (chunk: string) => void,
  ): Promise<string>;
}

/**
 * Director - 多智能体编排器
 *
 * 解析场景脚本，按顺序驱动多智能体发言
 */
export class Director {
  private state: DirectorState;
  private llmCall: LLMStreamCallFn;
  private onUpdate: (state: DirectorState) => void;
  private abortController: AbortController | null = null;

  constructor(
    scene: Scene,
    llmCall: LLMStreamCallFn,
    onUpdate: (state: DirectorState) => void,
  ) {
    this.state = {
      scene,
      messages: [],
      currentSpeaker: null,
      isGenerating: false,
      isPaused: false,
      progress: 0,
    };
    this.llmCall = llmCall;
    this.onUpdate = onUpdate;
  }

  /**
   * 开始播放场景
   */
  async play(): Promise<void> {
    this.state.isGenerating = true;
    this.state.isPaused = false;
    this.abortController = new AbortController();
    this.notify();

    try {
      // 解析脚本中的发言段落
      const segments = this.parseScript(this.state.scene.content);

      for (let i = 0; i < segments.length; i++) {
        // 检查是否暂停或停止
        if (this.abortController?.signal.aborted) break;
        while (this.state.isPaused) {
          await new Promise((r) => setTimeout(r, 200));
          if (this.abortController?.signal.aborted) return;
        }

        const segment = segments[i];
        const agent = this.findAgent(segment.role);

        this.state.currentSpeaker = agent?.id ?? null;
        this.state.progress = Math.floor((i / segments.length) * 100);
        this.notify();

        // 生成该智能体的发言
        const messageId = `msg_${Date.now()}_${i}`;
        const directorMsg: DirectorMessage = {
          id: messageId,
          agentId: agent?.id ?? 'unknown',
          agentName: agent?.name ?? segment.role,
          agentRole: agent?.role ?? 'teacher',
          avatar: agent?.avatar ?? '🤖',
          content: '',
          timestamp: Date.now(),
        };

        this.state.messages.push(directorMsg);
        this.notify();

        // 如果脚本有预设内容，直接使用；否则调用 LLM 生成
        if (segment.content.trim()) {
          // 模拟逐字输出
          const chars = segment.content.split('');
          for (let c = 0; c < chars.length; c++) {
            if (this.abortController?.signal.aborted) return;
            directorMsg.content += chars[c];
            if (c % 3 === 0) {
              this.notify();
              await new Promise((r) => setTimeout(r, 30));
            }
          }
          this.notify();
        } else {
          // 需要 LLM 生成
          const context = this.buildContext(agent);
          const generated = await this.llmCall(
            agent?.systemPrompt ?? '',
            context,
            (chunk) => {
              directorMsg.content += chunk;
              this.notify();
            },
          );
          directorMsg.content = generated;
          this.notify();
        }

        // 段落间停顿
        await new Promise((r) => setTimeout(r, 500));
      }
    } finally {
      this.state.isGenerating = false;
      this.state.currentSpeaker = null;
      this.state.progress = 100;
      this.notify();
    }
  }

  /**
   * 暂停
   */
  pause(): void {
    this.state.isPaused = true;
    this.notify();
  }

  /**
   * 继续
   */
  resume(): void {
    this.state.isPaused = false;
    this.notify();
  }

  /**
   * 停止
   */
  stop(): void {
    this.abortController?.abort();
    this.state.isGenerating = false;
    this.state.isPaused = false;
    this.state.currentSpeaker = null;
    this.notify();
  }

  /**
   * 用户插入发言/提问
   */
  async userInterject(content: string): Promise<void> {
    const wasPaused = this.state.isPaused;
    this.state.isPaused = true;

    // 添加用户消息
    this.state.messages.push({
      id: `user_${Date.now()}`,
      agentId: 'user',
      agentName: '你',
      agentRole: 'student_a',
      avatar: '🙋',
      content,
      timestamp: Date.now(),
      isUser: true,
    });
    this.notify();

    // 教师智能体回应
    const teacher = this.state.scene.agents.find((a) => a.role === 'teacher');
    if (teacher) {
      const responseMsg: DirectorMessage = {
        id: `resp_${Date.now()}`,
        agentId: teacher.id,
        agentName: teacher.name,
        agentRole: 'teacher',
        avatar: teacher.avatar ?? '👨‍🏫',
        content: '',
        timestamp: Date.now(),
      };
      this.state.messages.push(responseMsg);
      this.notify();

      const context = this.buildContext(teacher);
      context.push({ role: 'user', content });

      await this.llmCall(
        teacher.systemPrompt + '\n\n学生刚才提了一个问题，请耐心回答。',
        context,
        (chunk) => {
          responseMsg.content += chunk;
          this.notify();
        },
      );
    }

    if (!wasPaused) {
      this.state.isPaused = false;
    }
  }

  /**
   * 获取当前状态
   */
  getState(): DirectorState {
    return { ...this.state };
  }

  /**
   * 获取所有消息
   */
  getMessages(): DirectorMessage[] {
    return [...this.state.messages];
  }

  // ==================== 内部方法 ====================

  private notify(): void {
    this.onUpdate({ ...this.state });
  }

  private findAgent(roleOrName: string): SceneAgent | undefined {
    const normalized = roleOrName.toLowerCase().replace(/[【】\[\]]/g, '').trim();

    // 按角色名匹配
    const nameMap: Record<string, AgentRole> = {
      '教师': 'teacher', '老师': 'teacher', 'teacher': 'teacher',
      '学生a': 'student_a', '小明': 'student_a', 'student_a': 'student_a',
      '学生b': 'student_b', '小红': 'student_b', 'student_b': 'student_b',
      '主持人': 'moderator', 'moderator': 'moderator',
      '专家': 'expert', 'expert': 'expert',
      'copaw': 'copaw', 'copaw助手': 'copaw',
    };

    const role = nameMap[normalized];
    if (role) {
      return this.state.scene.agents.find((a) => a.role === role);
    }

    // 按名字直接匹配
    return this.state.scene.agents.find(
      (a) => a.name.toLowerCase() === normalized || a.id === normalized,
    );
  }

  private parseScript(content: string): { role: string; content: string }[] {
    const segments: { role: string; content: string }[] = [];

    // 匹配 【角色】：内容 格式
    const lines = content.split('\n');
    let currentRole = '教师';
    let currentContent = '';

    for (const line of lines) {
      const match = line.match(/^【(.+?)】[：:]\s*(.*)/);
      if (match) {
        // 保存前一段
        if (currentContent.trim()) {
          segments.push({ role: currentRole, content: currentContent.trim() });
        }
        currentRole = match[1];
        currentContent = match[2] ?? '';
      } else if (line.trim().startsWith('[板书]') || line.trim().startsWith('[活动步骤]')) {
        // 板书和活动步骤归入当前角色
        currentContent += '\n' + line;
      } else {
        currentContent += '\n' + line;
      }
    }

    // 保存最后一段
    if (currentContent.trim()) {
      segments.push({ role: currentRole, content: currentContent.trim() });
    }

    // 如果解析结果为空，把整段内容作为教师发言
    if (segments.length === 0 && content.trim()) {
      segments.push({ role: '教师', content: content.trim() });
    }

    return segments;
  }

  private buildContext(agent: SceneAgent | undefined): { role: string; content: string }[] {
    // 取最近 10 条消息作为上下文
    return this.state.messages.slice(-10).map((m) => ({
      role: m.agentId === agent?.id ? 'assistant' : 'user',
      content: `[${m.agentName}] ${m.content}`,
    }));
  }
}
