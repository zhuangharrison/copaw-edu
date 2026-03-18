/**
 * OpenMAIC 语音系统
 *
 * 支持：
 * - TTS 语音合成（多角色、不同音色）
 * - ASR 语音识别（用户语音输入）
 * - 语速控制
 * - 队列播放
 */

export interface VoiceConfig {
  /** TTS 提供商 API 地址 */
  ttsApiBase: string;
  /** TTS API Key */
  ttsApiKey: string;
  /** TTS 模型 */
  ttsModel: string;
  /** 默认语速 */
  defaultRate: number;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  rate?: number;
}

/**
 * 语音管理器
 */
export class VoiceManager {
  private config: VoiceConfig | null = null;
  private audioQueue: HTMLAudioElement[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private rate = 1.0;

  /** 是否为浏览器环境 */
  private get isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * 初始化语音配置
   */
  async init(): Promise<void> {
    try {
      const res = await fetch('/api/admin/defaults');
      if (res.ok) {
        const data = await res.json();
        const defaults = data.defaults ?? {};

        this.config = {
          ttsApiBase: defaults['default_tts_base'] ?? '',
          ttsApiKey: defaults['default_tts_key'] ?? '',
          ttsModel: defaults['default_tts_model'] ?? 'tts-1',
          defaultRate: 1.0,
        };
      }
    } catch {
      // 语音功能不可用
    }
  }

  /**
   * TTS 语音合成
   */
  async speak(text: string, voiceId?: string): Promise<void> {
    if (!this.isBrowser) return;

    // 优先使用浏览器内置 TTS
    if (!this.config?.ttsApiKey) {
      return this.speakBrowser(text);
    }

    try {
      const response = await fetch('/api/copaw/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 4096),
          voice: voiceId ?? 'alloy',
          speed: this.rate,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        await this.playAudio(url);
        URL.revokeObjectURL(url);
      } else {
        // 回退到浏览器 TTS
        await this.speakBrowser(text);
      }
    } catch {
      await this.speakBrowser(text);
    }
  }

  /**
   * 浏览器内置 TTS（回退方案）
   */
  private speakBrowser(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isBrowser || !window.speechSynthesis) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = this.rate;

      // 尝试使用中文语音
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.startsWith('zh'));
      if (zhVoice) {
        utterance.voice = zhVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * 播放音频
   */
  private playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.playbackRate = this.rate;

      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        this.currentAudio = null;
        reject(new Error('Audio playback failed'));
      };

      this.currentAudio = audio;
      audio.play().catch(reject);
    });
  }

  /**
   * 将发言加入队列并依次播放
   */
  async queueSpeak(text: string, voiceId?: string): Promise<void> {
    // 简化：直接依次播放
    await this.speak(text, voiceId);
  }

  /**
   * 停止播放
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.isBrowser && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * 设置语速
   */
  setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * 获取语速
   */
  getRate(): number {
    return this.rate;
  }

  /**
   * ASR 语音识别（使用浏览器 Web Speech API）
   */
  startASR(onResult: (text: string) => void, onError?: (err: string) => void): () => void {
    if (!this.isBrowser) return () => {};

    const SpeechRecognition =
      (window as unknown as Record<string, unknown>).SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.('浏览器不支持语音识别');
      return () => {};
    }

    const recognition = new (SpeechRecognition as new () => SpeechRecognition)();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript;
      if (text) onResult(text);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError?.(event.error);
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }
}

// 声明缺失的 Web Speech API 类型
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
