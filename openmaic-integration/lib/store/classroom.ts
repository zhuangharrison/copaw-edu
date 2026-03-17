/**
 * 课堂状态管理 (Zustand)
 */
import { create } from 'zustand';
import type { Classroom, GenerateClassroomOptions, SceneType } from '@/lib/classroom/types';

interface ClassroomState {
  /** 当前课堂 */
  classroom: Classroom | null;
  /** 当前场景索引 */
  currentSceneIndex: number;
  /** 生成进度 */
  generateProgress: number;
  /** 生成阶段描述 */
  generateStage: string;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 是否暂停 */
  isPaused: boolean;
  /** 语音是否开启 */
  voiceEnabled: boolean;
  /** 白板是否开启 */
  whiteboardEnabled: boolean;
  /** 错误消息 */
  error: string | null;

  /** 生成课堂 */
  generateClassroom: (opts: GenerateClassroomOptions) => Promise<void>;
  /** 设置课堂 */
  setClassroom: (classroom: Classroom | null) => void;
  /** 切换场景 */
  goToScene: (index: number) => void;
  /** 下一场景 */
  nextScene: () => void;
  /** 上一场景 */
  prevScene: () => void;
  /** 播放控制 */
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  /** 切换语音 */
  toggleVoice: () => void;
  /** 切换白板 */
  toggleWhiteboard: () => void;
  /** 设置进度 */
  setProgress: (stage: string, progress: number) => void;
  /** 清除错误 */
  clearError: () => void;
}

export const useClassroomStore = create<ClassroomState>((set, get) => ({
  classroom: null,
  currentSceneIndex: 0,
  generateProgress: 0,
  generateStage: '',
  isGenerating: false,
  isPlaying: false,
  isPaused: false,
  voiceEnabled: false,
  whiteboardEnabled: true,
  error: null,

  generateClassroom: async (opts) => {
    set({ isGenerating: true, generateProgress: 0, generateStage: '准备中...', error: null });

    try {
      const res = await fetch('/api/classroom/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });

      if (res.status === 402) {
        const data = await res.json();
        set({
          isGenerating: false,
          error: `积分不足：需要 ${data.cost} 积分，当前余额 ${data.balance}`,
        });
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '生成失败' }));
        set({ isGenerating: false, error: data.error });
        return;
      }

      // 读取 SSE 流
      const reader = res.body?.getReader();
      if (!reader) {
        set({ isGenerating: false, error: '无法读取响应' });
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
          if (!line.trim().startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.trim().slice(6));
            if (data.type === 'progress') {
              set({ generateStage: data.stage, generateProgress: data.progress });
            } else if (data.type === 'complete') {
              set({
                classroom: data.classroom,
                currentSceneIndex: 0,
                isGenerating: false,
                generateProgress: 100,
                generateStage: '完成！',
              });
            } else if (data.type === 'error') {
              set({ isGenerating: false, error: data.error });
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err: unknown) {
      set({
        isGenerating: false,
        error: err instanceof Error ? err.message : '生成失败',
      });
    }
  },

  setClassroom: (classroom) => set({ classroom, currentSceneIndex: 0 }),

  goToScene: (index) => {
    const { classroom } = get();
    if (classroom && index >= 0 && index < classroom.scenes.length) {
      set({ currentSceneIndex: index });
    }
  },

  nextScene: () => {
    const { classroom, currentSceneIndex } = get();
    if (classroom && currentSceneIndex < classroom.scenes.length - 1) {
      set({ currentSceneIndex: currentSceneIndex + 1 });
    }
  },

  prevScene: () => {
    const { currentSceneIndex } = get();
    if (currentSceneIndex > 0) {
      set({ currentSceneIndex: currentSceneIndex - 1 });
    }
  },

  setPlaying: (playing) => set({ isPlaying: playing }),
  setPaused: (paused) => set({ isPaused: paused }),
  toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
  toggleWhiteboard: () => set((s) => ({ whiteboardEnabled: !s.whiteboardEnabled })),
  setProgress: (stage, progress) => set({ generateStage: stage, generateProgress: progress }),
  clearError: () => set({ error: null }),
}));
