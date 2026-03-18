import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  credits: number;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setCredits: (credits: number) => void;

  /** 从服务端获取当前会话 */
  fetchSession: () => Promise<void>;

  /** 注册 */
  register: (email: string, password: string, name?: string) => Promise<void>;

  /** 登录 */
  login: (email: string, password: string) => Promise<void>;

  /** 登出 */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setCredits: (credits) =>
    set((state) => (state.user ? { user: { ...state.user, credits } } : {})),

  fetchSession: async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const { user } = await res.json();
        set({ user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  register: async (email, password, name) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? '注册失败');
    }

    const { user } = await res.json();
    set({ user });
  },

  login: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? '登录失败');
    }

    const { user } = await res.json();
    set({ user });
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null });
  },
}));
