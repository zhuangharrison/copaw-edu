'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, X } from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
}

const DEFAULT_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'],
  anthropic: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  google: ['gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-1.5-flash'],
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  qwen: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
  kimi: ['moonshot-v1-128k', 'moonshot-v1-32k', 'moonshot-v1-8k'],
  minimax: ['abab6.5s-chat', 'abab5.5-chat'],
  glm: ['glm-4-plus', 'glm-4', 'glm-4-flash'],
  doubao: ['doubao-pro-256k', 'doubao-pro-32k', 'doubao-lite-32k'],
};

export function ModelManager() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/providers?category=llm');
      if (res.ok) {
        const data = await res.json();
        const allModels: ModelInfo[] = [];

        for (const provider of data.providers ?? []) {
          const providerModels = provider.models.length > 0
            ? provider.models
            : DEFAULT_MODELS[provider.providerId] ?? [];

          for (const modelId of providerModels) {
            allModels.push({
              id: `${provider.providerId}/${modelId}`,
              name: modelId,
              provider: provider.providerId,
              enabled: provider.isEnabled,
            });
          }
        }

        setModels(allModels);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = async (model: ModelInfo) => {
    setSaving(model.id);
    try {
      // 此处在实际生产中需要实现单个模型的启用/禁用
      // 现在先更新本地状态
      setModels((prev) =>
        prev.map((m) =>
          m.id === model.id ? { ...m, enabled: !m.enabled } : m,
        ),
      );
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  const providers = [...new Set(models.map((m) => m.provider))];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">模型管理</h3>
        <p className="text-muted-foreground text-sm">管理可用的 AI 模型，未启用的模型用户不可见</p>
      </div>

      {providers.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          请先在「提供商配置」中添加提供商
        </p>
      ) : (
        providers.map((provider) => {
          const providerModels = models.filter((m) => m.provider === provider);
          return (
            <div key={provider} className="rounded-xl border">
              <div className="border-b px-4 py-2.5">
                <span className="text-sm font-semibold capitalize">{provider}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {providerModels.filter((m) => m.enabled).length}/{providerModels.length} 已启用
                </span>
              </div>
              <div className="divide-y">
                {providerModels.map((model) => (
                  <div key={model.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm">{model.name}</span>
                    <button
                      onClick={() => toggleModel(model)}
                      disabled={saving === model.id}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        model.enabled
                          ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {saving === model.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : model.enabled ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {model.enabled ? '已启用' : '已禁用'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
