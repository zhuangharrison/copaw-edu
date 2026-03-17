'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, Check, X, RefreshCw } from 'lucide-react';

interface ProviderRecord {
  id: string;
  providerId: string;
  category: string;
  maskedApiKey: string;
  baseUrl: string | null;
  proxy: string | null;
  models: string[];
  isEnabled: boolean;
  priority: number;
}

const CATEGORIES = [
  { value: 'llm', label: 'LLM 模型' },
  { value: 'tts', label: '语音合成' },
  { value: 'asr', label: '语音识别' },
  { value: 'image', label: '图片生成' },
  { value: 'video', label: '视频生成' },
  { value: 'pdf', label: 'PDF 解析' },
  { value: 'web-search', label: '网络搜索' },
];

const LLM_PROVIDERS = [
  'openai', 'anthropic', 'google', 'deepseek', 'qwen', 'kimi', 'minimax', 'glm', 'siliconflow', 'doubao',
];

export function ProviderList() {
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('llm');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    providerId: '',
    category: 'llm',
    apiKey: '',
    baseUrl: '',
    proxy: '',
    models: '',
    isEnabled: true,
    priority: 0,
  });

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/providers?category=${activeCategory}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        models: formData.models ? formData.models.split(',').map((m) => m.trim()) : undefined,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setFormData({ providerId: '', category: activeCategory, apiKey: '', baseUrl: '', proxy: '', models: '', isEnabled: true, priority: 0 });
      fetchProviders();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此提供商配置？')) return;
    await fetch(`/api/admin/providers/${id}`, { method: 'DELETE' });
    fetchProviders();
  };

  const handleToggle = async (provider: ProviderRecord) => {
    // 切换启用/禁用需要重新提交完整数据（含新 apiKey）
    // 此处简化为仅删除再重建
    // 实际生产中应有专门的 PATCH 端点
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => { setActiveCategory(cat.value); setShowForm(false); }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {CATEGORIES.find((c) => c.value === activeCategory)?.label} 提供商配置
        </h3>
        <div className="flex gap-2">
          <button
            onClick={fetchProviders}
            className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setShowForm(true); setFormData((prev) => ({ ...prev, category: activeCategory })); }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            添加提供商
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-muted/50 space-y-3 rounded-xl border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">提供商 ID</label>
              {activeCategory === 'llm' ? (
                <select
                  value={formData.providerId}
                  onChange={(e) => setFormData((p) => ({ ...p, providerId: e.target.value }))}
                  required
                  className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">选择提供商...</option>
                  {LLM_PROVIDERS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.providerId}
                  onChange={(e) => setFormData((p) => ({ ...p, providerId: e.target.value }))}
                  required
                  placeholder="如: openai-tts"
                  className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
                />
              )}
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">API Key</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData((p) => ({ ...p, apiKey: e.target.value }))}
                required
                placeholder="sk-..."
                className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Base URL（可选）</label>
              <input
                type="text"
                value={formData.baseUrl}
                onChange={(e) => setFormData((p) => ({ ...p, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">启用模型（可选，逗号分隔）</label>
              <input
                type="text"
                value={formData.models}
                onChange={(e) => setFormData((p) => ({ ...p, models: e.target.value }))}
                placeholder="gpt-4o, gpt-4o-mini"
                className="border-input bg-background w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm"
            >
              <X className="h-3.5 w-3.5" /> 取消
            </button>
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              <Check className="h-3.5 w-3.5" /> 保存
            </button>
          </div>
        </form>
      )}

      {/* Provider List */}
      {loading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">加载中...</div>
      ) : providers.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          暂无配置，点击「添加提供商」开始
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <div
              key={p.id}
              className="bg-background flex items-center justify-between rounded-xl border px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${p.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <div>
                  <div className="text-sm font-medium">{p.providerId}</div>
                  <div className="text-muted-foreground text-xs">
                    {p.maskedApiKey}
                    {p.baseUrl && ` · ${p.baseUrl}`}
                    {p.models.length > 0 && ` · ${p.models.length} 个模型`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-muted-foreground hover:text-destructive rounded-lg p-1.5 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
