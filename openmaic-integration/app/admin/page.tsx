'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { ProviderList } from '@/components/admin/ProviderList';
import { ModelManager } from '@/components/admin/ModelManager';
import { ArrowLeft, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user, loading, fetchSession } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<'providers' | 'models' | 'defaults'>('providers');

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Shield className="text-muted-foreground h-12 w-12" />
        <h1 className="text-xl font-semibold">无权访问</h1>
        <p className="text-muted-foreground text-sm">
          {user ? '需要管理员权限' : '请先登录'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-primary text-sm underline"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/60 backdrop-blur-md dark:bg-gray-800/60">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">管理后台</h1>
            <p className="text-muted-foreground text-xs">提供商配置与系统管理</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b">
          <button
            onClick={() => setTab('providers')}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === 'providers'
                ? 'border-primary text-primary'
                : 'text-muted-foreground border-transparent hover:border-gray-300'
            }`}
          >
            提供商配置
          </button>
          <button
            onClick={() => setTab('models')}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === 'models'
                ? 'border-primary text-primary'
                : 'text-muted-foreground border-transparent hover:border-gray-300'
            }`}
          >
            模型管理
          </button>
          <button
            onClick={() => setTab('defaults')}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === 'defaults'
                ? 'border-primary text-primary'
                : 'text-muted-foreground border-transparent hover:border-gray-300'
            }`}
          >
            默认设置
          </button>
        </div>

        {tab === 'providers' && <ProviderList />}
        {tab === 'models' && <ModelManager />}
        {tab === 'defaults' && <DefaultsPanel />}
      </main>
    </div>
  );
}

function DefaultsPanel() {
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/defaults')
      .then((r) => r.json())
      .then((data) => { setDefaults(data.defaults ?? {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const DEFAULT_KEYS = [
    { key: 'default_llm_provider', label: '默认 LLM 提供商', placeholder: 'openai' },
    { key: 'default_llm_model', label: '默认 LLM 模型', placeholder: 'gpt-4o' },
    { key: 'default_tts_provider', label: '默认 TTS 提供商', placeholder: 'openai-tts' },
    { key: 'default_image_provider', label: '默认图片生成', placeholder: 'seedream' },
  ];

  const handleSave = async (key: string, value: string) => {
    await fetch('/api/admin/defaults', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    setDefaults((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <p className="text-muted-foreground text-sm">加载中...</p>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">默认配置</h3>
      <p className="text-muted-foreground text-sm">设置用户未选择模型时的默认值</p>
      <div className="space-y-3">
        {DEFAULT_KEYS.map(({ key, label, placeholder }) => (
          <div key={key} className="bg-background flex items-center gap-4 rounded-xl border px-4 py-3">
            <label className="w-40 text-sm font-medium">{label}</label>
            <input
              type="text"
              value={defaults[key] ?? ''}
              onChange={(e) => setDefaults((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="border-input bg-background flex-1 rounded-lg border px-3 py-1.5 text-sm"
            />
            <button
              onClick={() => handleSave(key, defaults[key] ?? '')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              保存
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
