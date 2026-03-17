'use client';

/**
 * OpenMAIC 课堂页面
 *
 * 功能：
 * - 一键生成课堂（带进度条）
 * - 场景播放器（多智能体对话）
 * - 白板面板
 * - 语音控制
 * - 场景导航
 * - 导出（PPTX / PDF / Markdown）
 * - 用户提问互动
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useClassroomStore } from '@/lib/store/classroom';
import type { GenerateClassroomOptions, SceneType, Scene } from '@/lib/classroom/types';
import { SCENE_TYPE_CONFIG, ALL_SCENE_TYPES } from '@/lib/classroom/types';
import { Director, type DirectorMessage, type DirectorState } from '@/lib/classroom/director-graph';
import { WhiteboardRenderer } from '@/lib/classroom/whiteboard';
import { VoiceManager } from '@/lib/classroom/voice';
import { downloadPPTX, exportToPDF, exportToMarkdown } from '@/lib/classroom/export-pptx';

// ==================== 常量 ====================

const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '科学', '信息技术', '美术', '音乐'];
const GRADE_LEVELS = ['小学', '初中', '高中', '大学'];
const GRADES: Record<string, string[]> = {
  小学: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
  初中: ['七年级', '八年级', '九年级'],
  高中: ['高一', '高二', '高三'],
  大学: ['大一', '大二', '大三', '大四'],
};

const ROLE_AVATARS: Record<string, string> = {
  teacher: '👨‍🏫',
  student_a: '👦',
  student_b: '👧',
  moderator: '🎤',
  expert: '🧑‍🔬',
  copaw: '🐾',
  user: '🙋',
};

const ROLE_COLORS: Record<string, string> = {
  teacher: '#3b82f6',
  student_a: '#10b981',
  student_b: '#f59e0b',
  moderator: '#8b5cf6',
  expert: '#ec4899',
  copaw: '#6366f1',
  user: '#ef4444',
};

// ==================== 主页面 ====================

export default function ClassroomPage() {
  const store = useClassroomStore();
  const { classroom, isGenerating } = store;

  if (!classroom && !isGenerating) {
    return <GenerateForm />;
  }

  if (isGenerating) {
    return <GeneratingProgress />;
  }

  return <ClassroomPlayer />;
}

// ==================== 生成表单 ====================

function GenerateForm() {
  const { generateClassroom } = useClassroomStore();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('数学');
  const [gradeLevel, setGradeLevel] = useState('初中');
  const [grade, setGrade] = useState('七年级');
  const [sceneCount, setSceneCount] = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<SceneType[]>([...ALL_SCENE_TYPES]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const opts: GenerateClassroomOptions = {
      topic: topic.trim(),
      subject,
      gradeLevel,
      grade,
      sceneCount,
      sceneTypes: selectedTypes,
      additionalNotes: additionalNotes.trim() || undefined,
    };

    await generateClassroom(opts);
  };

  const toggleSceneType = (type: SceneType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        OpenMAIC 智能课堂
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        一键生成多智能体互动课堂，支持讲授、讨论、测验、活动四种场景
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 主题 */}
        <div>
          <label style={labelStyle}>课程主题 *</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：二次函数的图像与性质"
            style={inputStyle}
            required
          />
        </div>

        {/* 学科 + 学段 + 年级 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>学科</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>学段</label>
            <select
              value={gradeLevel}
              onChange={(e) => {
                setGradeLevel(e.target.value);
                setGrade(GRADES[e.target.value]?.[0] ?? '');
              }}
              style={inputStyle}
            >
              {GRADE_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>年级</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} style={inputStyle}>
              {(GRADES[gradeLevel] ?? []).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 场景数量 */}
        <div>
          <label style={labelStyle}>
            场景数量：{sceneCount}
          </label>
          <input
            type="range"
            min={3}
            max={15}
            value={sceneCount}
            onChange={(e) => setSceneCount(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
            <span>3（基础）</span>
            <span>10（标准）</span>
            <span>15（深度）</span>
          </div>
        </div>

        {/* 场景类型 */}
        <div>
          <label style={labelStyle}>场景类型</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALL_SCENE_TYPES.map((type) => {
              const config = SCENE_TYPE_CONFIG[type];
              const selected = selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleSceneType(type)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: selected ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                    backgroundColor: selected ? '#eff6ff' : '#fff',
                    color: selected ? '#3b82f6' : '#6b7280',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {config.label} ({config.description})
                </button>
              );
            })}
          </div>
        </div>

        {/* 补充说明 */}
        <div>
          <label style={labelStyle}>补充说明（可选）</label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="例如：重点讲解顶点坐标的求法，适当增加练习环节"
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          />
        </div>

        {/* 提交 */}
        <button
          type="submit"
          disabled={!topic.trim()}
          style={{
            padding: '14px 24px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: topic.trim() ? '#3b82f6' : '#d1d5db',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: topic.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          一键生成课堂
        </button>
      </form>
    </div>
  );
}

// ==================== 生成进度 ====================

function GeneratingProgress() {
  const { generateProgress, generateStage, error, clearError } = useClassroomStore();

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>生成失败</h2>
        <p style={{ color: '#ef4444', marginBottom: 24 }}>{error}</p>
        <button onClick={clearError} style={btnStyle}>
          重新生成
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>正在生成课堂...</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>{generateStage}</p>

      {/* 进度条 */}
      <div style={{ width: '100%', height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${generateProgress}%`,
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <p style={{ marginTop: 8, fontSize: 14, color: '#9ca3af' }}>{generateProgress}%</p>
    </div>
  );
}

// ==================== 课堂播放器 ====================

function ClassroomPlayer() {
  const store = useClassroomStore();
  const { classroom, currentSceneIndex, voiceEnabled, whiteboardEnabled } = store;

  const [directorState, setDirectorState] = useState<DirectorState | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const directorRef = useRef<Director | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const whiteboardRef = useRef<WhiteboardRenderer | null>(null);
  const voiceRef = useRef<VoiceManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentScene = classroom?.scenes[currentSceneIndex] ?? null;

  // 初始化语音管理器
  useEffect(() => {
    const vm = new VoiceManager();
    vm.init();
    voiceRef.current = vm;
    return () => {
      vm.stop();
    };
  }, []);

  // 白板绑定
  useEffect(() => {
    if (canvasRef.current && whiteboardEnabled) {
      const renderer = new WhiteboardRenderer();
      renderer.attach(canvasRef.current);
      whiteboardRef.current = renderer;

      if (currentScene?.whiteboard) {
        renderer.loadData(currentScene.whiteboard);
        renderer.showAll();
      }

      return () => {
        renderer.destroy();
        whiteboardRef.current = null;
      };
    }
  }, [currentSceneIndex, whiteboardEnabled, currentScene?.whiteboard]);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directorState?.messages]);

  // 播放场景
  const playScene = useCallback(async () => {
    if (!currentScene || !classroom) return;

    const llmCall = async (
      systemPrompt: string,
      messages: { role: string; content: string }[],
      onChunk: (chunk: string) => void,
    ): Promise<string> => {
      const res = await fetch('/api/copaw/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messages[messages.length - 1]?.content ?? '',
          systemPrompt,
          context: messages.slice(0, -1),
        }),
      });

      if (!res.ok || !res.body) return '';

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim().startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.trim().slice(6));
            if (data.type === 'token' && data.token) {
              result += data.token;
              onChunk(data.token);
            }
          } catch {
            // skip
          }
        }
      }

      return result;
    };

    const director = new Director(currentScene, llmCall, (state) => {
      setDirectorState({ ...state });

      // 语音播放
      if (voiceEnabled && voiceRef.current) {
        const msgs = state.messages;
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && !lastMsg.isUser && lastMsg.content.endsWith('。')) {
          // 简化：当有完整句号时读出
          // 实际场景可用更智能的分句方式
        }
      }
    });

    directorRef.current = director;
    store.setPlaying(true);
    await director.play();
    store.setPlaying(false);
  }, [currentScene, classroom, voiceEnabled, store]);

  // 用户提问
  const handleAsk = async () => {
    if (!userInput.trim() || !directorRef.current) return;
    setIsAskingQuestion(true);
    await directorRef.current.userInterject(userInput.trim());
    setUserInput('');
    setIsAskingQuestion(false);
  };

  // 导出
  const handleExport = async (format: 'pptx' | 'pdf' | 'markdown') => {
    if (!classroom) return;
    setShowExportMenu(false);

    switch (format) {
      case 'pptx':
        await downloadPPTX(classroom);
        break;
      case 'pdf':
        exportToPDF(classroom);
        break;
      case 'markdown': {
        const md = exportToMarkdown(classroom);
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${classroom.title}.md`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
    }
  };

  // 新建课堂
  const handleNewClassroom = () => {
    directorRef.current?.stop();
    store.setClassroom(null);
  };

  if (!classroom) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* 左侧：场景导航 */}
      <div style={{
        width: 240,
        borderRight: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {classroom.title}
          </h2>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            {classroom.subject} · {classroom.gradeLevel}{classroom.grade}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {classroom.scenes.map((scene, idx) => {
            const config = SCENE_TYPE_CONFIG[scene.type];
            const isActive = idx === currentSceneIndex;
            return (
              <button
                key={scene.id}
                onClick={() => {
                  directorRef.current?.stop();
                  setDirectorState(null);
                  store.goToScene(idx);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: isActive ? '#eff6ff' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: 4,
                }}
              >
                <div style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#3b82f6' : '#374151',
                  marginBottom: 2,
                }}>
                  {idx + 1}. {scene.title}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  {config.label} · {scene.duration}分钟
                </div>
              </button>
            );
          })}
        </div>

        {/* 底部操作 */}
        <div style={{ padding: 12, borderTop: '1px solid #e5e7eb' }}>
          <button onClick={handleNewClassroom} style={{ ...btnSmallStyle, width: '100%', marginBottom: 8 }}>
            新建课堂
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{ ...btnSmallStyle, width: '100%', backgroundColor: '#10b981', color: '#fff' }}
            >
              导出课堂
            </button>
            {showExportMenu && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                width: '100%',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginBottom: 4,
                overflow: 'hidden',
              }}>
                <button onClick={() => handleExport('pptx')} style={menuItemStyle}>
                  📊 导出 PPTX
                </button>
                <button onClick={() => handleExport('pdf')} style={menuItemStyle}>
                  📄 导出 PDF
                </button>
                <button onClick={() => handleExport('markdown')} style={menuItemStyle}>
                  📝 导出 Markdown
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 中间：场景播放器 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部工具栏 */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>
              {currentScene?.title ?? ''}
            </h3>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {currentScene && (
                <>
                  {SCENE_TYPE_CONFIG[currentScene.type].label} · {currentScene.duration}分钟
                  {currentScene.keyPoints.length > 0 && ` · ${currentScene.keyPoints.join('、')}`}
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* 播放控制 */}
            {!directorState?.isGenerating ? (
              <button onClick={playScene} style={toolBtnStyle} title="播放场景">
                ▶️ 播放
              </button>
            ) : directorState?.isPaused ? (
              <button onClick={() => directorRef.current?.resume()} style={toolBtnStyle} title="继续">
                ▶️ 继续
              </button>
            ) : (
              <button onClick={() => directorRef.current?.pause()} style={toolBtnStyle} title="暂停">
                ⏸️ 暂停
              </button>
            )}
            <button
              onClick={() => {
                directorRef.current?.stop();
                setDirectorState(null);
              }}
              style={toolBtnStyle}
              title="停止"
            >
              ⏹️ 停止
            </button>

            {/* 场景导航 */}
            <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb' }} />
            <button
              onClick={() => { directorRef.current?.stop(); setDirectorState(null); store.prevScene(); }}
              disabled={currentSceneIndex === 0}
              style={toolBtnStyle}
            >
              ⬅️ 上一场景
            </button>
            <button
              onClick={() => { directorRef.current?.stop(); setDirectorState(null); store.nextScene(); }}
              disabled={currentSceneIndex >= (classroom?.scenes.length ?? 0) - 1}
              style={toolBtnStyle}
            >
              下一场景 ➡️
            </button>

            <div style={{ width: 1, height: 20, backgroundColor: '#e5e7eb' }} />

            {/* 白板/语音开关 */}
            <button
              onClick={store.toggleWhiteboard}
              style={{
                ...toolBtnStyle,
                backgroundColor: whiteboardEnabled ? '#eff6ff' : undefined,
                color: whiteboardEnabled ? '#3b82f6' : undefined,
              }}
            >
              🖊️ 白板
            </button>
            <button
              onClick={store.toggleVoice}
              style={{
                ...toolBtnStyle,
                backgroundColor: voiceEnabled ? '#eff6ff' : undefined,
                color: voiceEnabled ? '#3b82f6' : undefined,
              }}
            >
              🔊 语音
            </button>
          </div>
        </div>

        {/* 播放进度条 */}
        {directorState?.isGenerating && (
          <div style={{ width: '100%', height: 3, backgroundColor: '#e5e7eb' }}>
            <div
              style={{
                width: `${directorState.progress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                transition: 'width 0.3s',
              }}
            />
          </div>
        )}

        {/* 消息区域 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {!directorState?.messages.length && currentScene && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>点击「播放」开始场景演示</p>
              <p style={{ fontSize: 13 }}>
                参与角色：{currentScene.agents.map((a) => `${ROLE_AVATARS[a.role] ?? '🤖'} ${a.name}`).join('、')}
              </p>
            </div>
          )}

          {directorState?.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 用户提问 */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          display: 'flex',
          gap: 8,
        }}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk()}
            placeholder="在课堂中提问..."
            disabled={!directorState?.isGenerating || isAskingQuestion}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleAsk}
            disabled={!userInput.trim() || !directorState?.isGenerating || isAskingQuestion}
            style={{
              ...btnStyle,
              opacity: !userInput.trim() || !directorState?.isGenerating ? 0.5 : 1,
            }}
          >
            {isAskingQuestion ? '思考中...' : '提问'}
          </button>
        </div>
      </div>

      {/* 右侧：白板面板 */}
      {whiteboardEnabled && (
        <div style={{
          width: 360,
          borderLeft: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>白板</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => whiteboardRef.current?.clearAnnotations()}
                style={toolBtnSmallStyle}
                title="清除标注"
              >
                🗑️
              </button>
              <button
                onClick={() => {
                  const url = whiteboardRef.current?.toDataURL();
                  if (url) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'whiteboard.png';
                    a.click();
                  }
                }}
                style={toolBtnSmallStyle}
                title="保存图片"
              >
                💾
              </button>
            </div>
          </div>
          <div style={{ flex: 1, padding: 8 }}>
            <canvas
              ref={canvasRef}
              width={680}
              height={510}
              style={{
                width: '100%',
                height: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                cursor: 'crosshair',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 消息气泡 ====================

function MessageBubble({ message }: { message: DirectorMessage }) {
  const isUser = message.isUser;
  const avatar = isUser ? '🙋' : (ROLE_AVATARS[message.agentRole] ?? '🤖');
  const color = isUser ? ROLE_COLORS.user : (ROLE_COLORS[message.agentRole] ?? '#6b7280');

  return (
    <div style={{
      display: 'flex',
      gap: 12,
      marginBottom: 16,
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      {/* 头像 */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        flexShrink: 0,
      }}>
        {avatar}
      </div>

      {/* 内容 */}
      <div style={{ maxWidth: '70%' }}>
        <div style={{
          fontSize: 12,
          color: color,
          fontWeight: 600,
          marginBottom: 4,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {message.agentName}
        </div>
        <div style={{
          padding: '10px 14px',
          borderRadius: 12,
          backgroundColor: isUser ? color : '#f3f4f6',
          color: isUser ? '#fff' : '#1f2937',
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content || '...'}
        </div>
      </div>
    </div>
  );
}

// ==================== 样式 ====================

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  backgroundColor: '#3b82f6',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
};

const btnSmallStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  fontSize: 13,
  cursor: 'pointer',
};

const toolBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid #e5e7eb',
  backgroundColor: '#fff',
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const toolBtnSmallStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid #e5e7eb',
  backgroundColor: '#fff',
  fontSize: 12,
  cursor: 'pointer',
};

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: 'none',
  backgroundColor: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: 13,
  borderBottom: '1px solid #f3f4f6',
};
