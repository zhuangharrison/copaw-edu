'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Wifi } from 'lucide-react';

interface ConnectionTesterProps {
  providerId: string;
  category: string;
}

export function ConnectionTester({ providerId, category }: ConnectionTesterProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; latency?: number } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, category }),
      });
      const latency = Date.now() - start;
      const data = await res.json();

      if (res.ok && data.ok) {
        setResult({ ok: true, message: data.message ?? '连接成功', latency });
      } else {
        setResult({ ok: false, message: data.error ?? '连接失败' });
      }
    } catch {
      setResult({ ok: false, message: '网络错误' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTest}
        disabled={testing}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
      >
        {testing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Wifi className="h-3.5 w-3.5" />
        )}
        测试连接
      </button>
      {result && (
        <span className={`flex items-center gap-1 text-xs ${result.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {result.ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {result.message}
          {result.latency && ` (${result.latency}ms)`}
        </span>
      )}
    </div>
  );
}
