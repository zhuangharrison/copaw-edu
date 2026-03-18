'use client';

import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InsufficientDialogProps {
  open: boolean;
  onClose: () => void;
  cost: number;
  balance: number;
  onPurchase?: () => void;
}

export function InsufficientDialog({ open, onClose, cost, balance, onPurchase }: InsufficientDialogProps) {
  const router = useRouter();

  if (!open) return null;

  const deficit = cost - balance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background w-full max-w-sm rounded-xl border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-amber-500/10 p-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <h3 className="mb-2 text-center text-lg font-semibold">积分不足</h3>

        <div className="mb-4 space-y-1 text-center text-sm">
          <p className="text-muted-foreground">
            此操作需要 <span className="text-foreground font-semibold">{cost}</span> 积分
          </p>
          <p className="text-muted-foreground">
            当前余额 <span className="text-foreground font-semibold">{balance}</span> 积分，
            还差 <span className="font-semibold text-red-500">{deficit}</span> 积分
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              if (onPurchase) {
                onPurchase();
              }
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl py-2.5 text-sm font-medium"
          >
            购买积分包
          </button>
          <button
            onClick={() => {
              onClose();
              router.push('/pricing');
            }}
            className="bg-primary/10 text-primary hover:bg-primary/20 w-full rounded-xl py-2.5 text-sm font-medium"
          >
            升级订阅方案
          </button>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground w-full rounded-xl py-2 text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
