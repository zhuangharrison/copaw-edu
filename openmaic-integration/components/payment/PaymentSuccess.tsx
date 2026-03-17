'use client';

import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentSuccessProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function PaymentSuccess({ open, onClose, message }: PaymentSuccessProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background w-full max-w-sm rounded-xl border p-6 text-center shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>

        <h3 className="mb-2 text-lg font-semibold">支付成功</h3>
        <p className="text-muted-foreground text-sm">{message ?? '积分已到账，可以开始使用啦'}</p>

        <div className="mt-6 space-y-2">
          <button
            onClick={() => {
              onClose();
              router.push('/');
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl py-2.5 text-sm font-medium"
          >
            开始使用
          </button>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground w-full rounded-xl py-2 text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
