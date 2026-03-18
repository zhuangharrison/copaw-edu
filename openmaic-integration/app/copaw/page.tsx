'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { CreditsBadge } from '@/components/credits/CreditsBadge';
import { InsufficientDialog } from '@/components/credits/InsufficientDialog';
import { PurchaseDialog } from '@/components/credits/PurchaseDialog';
import { SkillSelector } from '@/components/skills/SkillSelector';
import {
  Send,
  Trash2,
  Sparkles,
  GraduationCap,
  Users,
  BookOpen,
  ChevronDown,
  Image,
  Loader2,
  User,
} from 'lucide-react';

type CoPawRole = 'student' | 'parent' | 'teacher';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  skillName?: string;
}

const ROLES: { id: CoPawRole; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'student', label: '学生模式', icon: <GraduationCap className="h-4 w-4" />, description: '学习伙伴，引导思考' },
  { id: 'parent', label: '家长模式', icon: <Users className="h-4 w-4" />, description: '教育顾问，学情分析' },
  { id: 'teacher', label: '教师模式', icon: <BookOpen className="h-4 w-4" />, description: '教学助手，提高效率' },
];

const EXAMPLE_PROMPTS: Record<CoPawRole, string[]> = {
  student: [
    '帮我记住：光合作用的原料、条件、产物',
    '老师讲的惯性我没听懂',
    '记录错题：2x+5=13，我算的x=9',
    '还有2周期中考，帮我规划复习计划',
    '用SWOT分析一下我的英语学习情况',
  ],
  parent: [
    '请帮我分析孩子这周的学习情况',
    '推荐一些适合初二的数学辅导书',
    '孩子最近不想学习，该怎么沟通？',
    '帮我制定孩子的暑期学习计划',
  ],
  teacher: [
    '帮我设计一堂初二物理「牛顿第一定律」的教案',
    '出一份初三化学单元测试卷',
    '分析班级最近的月考数据',
    '帮我写一封家长沟通函',
  ],
};

const WELCOME_MESSAGES: Record<CoPawRole, string> = {
  student: '你好！我是你的学习伙伴！有什么我可以帮你的吗？',
  parent: '您好！我是您的教育顾问！有什么我可以帮您的吗？',
  teacher: '老师好！我是您的教学助手！有什么我可以帮您的吗？',
};

export default function CoPawPage() {
  const { user, loading: authLoading, fetchSession } = useAuthStore();
  const [role, setRole] = useState<CoPawRole>('student');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [activeSkill, setActiveSkill] = useState<{ id: string; displayName: string } | null>(null);
  const [forceSkillId, setForceSkillId] = useState<string | undefined>();
  const [insufficientCredits, setInsufficientCredits] = useState<{ cost: number; balance: number } | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showMultimodal, setShowMultimodal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 切换角色时清空对话
  const handleRoleChange = (newRole: CoPawRole) => {
    setRole(newRole);
    setMessages([]);
    setActiveSkill(null);
    setForceSkillId(undefined);
    setShowRoleMenu(false);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    if (!user) {
      setShowAuth(true);
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setStreaming(true);
    setActiveSkill(null);

    const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, assistantMessage]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const historyForAPI = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/copaw/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          role,
          skillId: forceSkillId,
          history: historyForAPI,
        }),
        signal: controller.signal,
      });

      if (res.status === 402) {
        const data = await res.json();
        setInsufficientCredits({ cost: data.cost, balance: data.balance });
        setMessages((prev) => prev.slice(0, -1)); // Remove empty assistant message
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '请求失败' }));
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `错误: ${data.error ?? '请求失败'}`,
          };
          return updated;
        });
        return;
      }

      // 读取 SSE 流
      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.type === 'skill') {
              setActiveSkill(data.skill);
            } else if (data.type === 'content') {
              fullContent += data.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: fullContent,
                  skillName: activeSkill?.displayName,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }

      // 刷新积分
      fetchSession();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `错误: ${err instanceof Error ? err.message : '请求失败'}`,
        };
        return updated;
      });
    } finally {
      setStreaming(false);
      setForceSkillId(undefined);
      abortRef.current = null;
    }
  }, [user, streaming, messages, role, forceSkillId, activeSkill, fetchSession]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSkillSelect = (skillId: string) => {
    setForceSkillId(skillId);
    setShowSkills(false);
    inputRef.current?.focus();
  };

  const handleMultimodalGen = async (type: 'image' | 'mindmap', prompt: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: `[${type === 'mindmap' ? '思维导图' : '图片'}生成] ${prompt}` },
      { role: 'assistant', content: '正在生成中...' },
    ]);

    try {
      const res = await fetch('/api/copaw/multimodal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, prompt }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setInsufficientCredits({ cost: data.cost, balance: data.balance });
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const data = await res.json();

      if (data.url) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `![生成的${type === 'mindmap' ? '思维导图' : '图片'}](${data.url})\n\n${data.revisedPrompt ?? ''}`,
          };
          return updated;
        });
      } else if (data.error) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: `生成失败: ${data.error}` };
          return updated;
        });
      }

      fetchSession();
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: '生成失败，请重试' };
        return updated;
      });
    }
  };

  const currentRole = ROLES.find((r) => r.id === role)!;

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="shrink-0 border-b bg-white/60 backdrop-blur-md dark:bg-gray-800/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">CoPaw-Edu</h1>

            {/* Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {currentRole.icon}
                {currentRole.label}
                <ChevronDown className="h-3 w-3" />
              </button>

              {showRoleMenu && (
                <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border bg-white p-1 shadow-lg dark:bg-gray-800">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleChange(r.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        role === r.id
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {r.icon}
                      <div>
                        <div className="font-medium">{r.label}</div>
                        <div className="text-muted-foreground text-xs">{r.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active Skill Badge */}
            {activeSkill && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3" />
                {activeSkill.displayName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <CreditsBadge credits={user.credits} />
                <div className="flex items-center gap-1.5 text-sm">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">{user.name}</span>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 text-sm font-medium"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState
              role={role}
              onExampleClick={sendMessage}
              onToggleSkills={() => setShowSkills(!showSkills)}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/70 text-foreground'
                    }`}
                  >
                    {msg.skillName && (
                      <div className="mb-1 flex items-center gap-1 text-xs opacity-70">
                        <Sparkles className="h-3 w-3" />
                        {msg.skillName}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content || (streaming && i === messages.length - 1 ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          思考中...
                        </span>
                      ) : '')}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Skill Selector Drawer */}
      {showSkills && (
        <div className="shrink-0 border-t bg-white/90 backdrop-blur-md dark:bg-gray-800/90">
          <div className="mx-auto max-w-3xl px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">选择技能</h3>
              <button
                onClick={() => setShowSkills(false)}
                className="text-muted-foreground text-xs hover:underline"
              >
                关闭
              </button>
            </div>
            <SkillSelector
              onSelect={(id) => handleSkillSelect(id)}
              selectedSkillId={forceSkillId}
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 border-t bg-white/80 backdrop-blur-md dark:bg-gray-800/80">
        <div className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3">
          {/* Tool buttons */}
          <div className="flex shrink-0 gap-1 pb-1">
            <button
              onClick={() => setShowSkills(!showSkills)}
              className={`rounded-lg p-2 text-sm transition-colors ${
                forceSkillId
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title="选择技能"
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                const prompt = window.prompt('请描述要生成的教学图片/思维导图：');
                if (prompt) handleMultimodalGen('image', prompt);
              }}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 text-sm transition-colors"
              title="生成图片"
            >
              <Image className="h-4 w-4" />
            </button>
          </div>

          {/* Text input */}
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                forceSkillId
                  ? '已选择技能，输入你的问题...'
                  : '输入你的问题...（技能会自动检测）'
              }
              rows={1}
              className="border-input bg-background w-full resize-none rounded-xl border px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            {forceSkillId && (
              <button
                onClick={() => setForceSkillId(undefined)}
                className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/20"
              >
                取消技能
              </button>
            )}
          </div>

          {/* Send / Clear */}
          <div className="flex shrink-0 gap-1 pb-1">
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl p-2.5 transition-colors disabled:opacity-30"
            >
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([]);
                  setActiveSkill(null);
                }}
                className="text-muted-foreground hover:text-destructive rounded-xl p-2.5 transition-colors"
                title="清空对话"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
      {insufficientCredits && (
        <InsufficientDialog
          open={!!insufficientCredits}
          onClose={() => setInsufficientCredits(null)}
          cost={insufficientCredits.cost}
          balance={insufficientCredits.balance}
          onPurchase={() => setShowPurchase(true)}
        />
      )}
      <PurchaseDialog open={showPurchase} onClose={() => setShowPurchase(false)} />

      {/* Click outside to close role menu */}
      {showRoleMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
      )}
    </div>
  );
}

// ==================== Empty State ====================

function EmptyState({
  role,
  onExampleClick,
  onToggleSkills,
}: {
  role: CoPawRole;
  onExampleClick: (text: string) => void;
  onToggleSkills: () => void;
}) {
  const examples = EXAMPLE_PROMPTS[role];
  const welcome = WELCOME_MESSAGES[role];

  return (
    <div className="flex flex-col items-center pt-12">
      <div className="bg-primary/10 mb-4 rounded-2xl p-4">
        <GraduationCap className="text-primary h-10 w-10" />
      </div>
      <h2 className="mb-2 text-xl font-bold">CoPaw-Edu</h2>
      <p className="text-muted-foreground mb-8 max-w-md text-center text-sm">{welcome}</p>

      <div className="mb-6 w-full max-w-lg">
        <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
          试试这些问题
        </h3>
        <div className="space-y-2">
          {examples.map((example) => (
            <button
              key={example}
              onClick={() => onExampleClick(example)}
              className="hover:bg-muted/80 w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onToggleSkills}
        className="text-primary flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <Sparkles className="h-4 w-4" />
        浏览所有技能
      </button>
    </div>
  );
}
