'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      onClose();
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background w-full max-w-md rounded-xl border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-center text-xl font-semibold">
          {mode === 'login' ? '登录 OpenMAIC' : '注册 OpenMAIC'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-muted-foreground mb-1 block text-sm">昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="选填"
              />
            </div>
          )}

          <div>
            <label className="text-muted-foreground mb-1 block text-sm">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="text-muted-foreground mb-1 block text-sm">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="至少6位"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {mode === 'register' && (
            <p className="text-muted-foreground text-xs">
              注册即赠送 200 积分，可体验 2-3 次完整课堂生成
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <p className="text-muted-foreground mt-4 text-center text-sm">
          {mode === 'login' ? (
            <>
              还没有账号？{' '}
              <button className="text-primary underline" onClick={() => { setMode('register'); setError(''); }}>
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？{' '}
              <button className="text-primary underline" onClick={() => { setMode('login'); setError(''); }}>
                去登录
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
