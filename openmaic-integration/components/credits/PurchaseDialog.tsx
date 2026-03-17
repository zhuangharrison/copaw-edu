'use client';

import { useState } from 'react';
import { Check, Loader2, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

interface CreditPack {
  id: string;
  credits: number;
  price: number;
  label: string;
}

const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_100', credits: 100, price: 990, label: '100 积分' },
  { id: 'pack_500', credits: 500, price: 3990, label: '500 积分' },
  { id: 'pack_2000', credits: 2000, price: 12900, label: '2000 积分' },
];

interface PurchaseDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PurchaseDialog({ open, onClose }: PurchaseDialogProps) {
  const [selectedPack, setSelectedPack] = useState<string>('pack_500');
  const [purchasing, setPurchasing] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const { fetchSession } = useAuthStore();

  if (!open) return null;

  const handlePurchase = async () => {
    setPurchasing(true);
    setResult(null);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'credit_pack', packId: selectedPack }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'completed') {
          setResult('success');
          await fetchSession();
          setTimeout(() => {
            onClose();
            setResult(null);
          }, 1500);
        }
      } else {
        setResult('error');
      }
    } catch {
      setResult('error');
    } finally {
      setPurchasing(false);
    }
  };

  const pack = CREDIT_PACKS.find((p) => p.id === selectedPack);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background w-full max-w-md rounded-xl border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold">购买积分包</h3>
        <p className="text-muted-foreground mb-5 text-sm">选择积分包，立即到账</p>

        <div className="space-y-2">
          {CREDIT_PACKS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPack(p.id)}
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                selectedPack === p.id
                  ? 'border-primary bg-primary/5 ring-primary/20 ring-1'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className={`h-5 w-5 ${selectedPack === p.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-muted-foreground text-xs">
                    ¥{(p.price / p.credits).toFixed(2)}/积分
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">¥{(p.price / 100).toFixed(0)}</span>
                {selectedPack === p.id && <Check className="text-primary h-4 w-4" />}
              </div>
            </button>
          ))}
        </div>

        {result === 'success' && (
          <div className="mt-4 rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-600 dark:text-green-400">
            购买成功！{pack?.credits} 积分已到账
          </div>
        )}

        {result === 'error' && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-600 dark:text-red-400">
            购买失败，请重试
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground flex-1 rounded-xl py-2.5 text-sm"
          >
            取消
          </button>
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {purchasing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 处理中...
              </>
            ) : (
              `支付 ¥${pack ? (pack.price / 100).toFixed(0) : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
