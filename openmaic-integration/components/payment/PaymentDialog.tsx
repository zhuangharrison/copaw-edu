'use client';

import { useState } from 'react';
import { Loader2, CreditCard, Smartphone, QrCode } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  amount: number; // 分
  description: string;
  onSuccess: () => void;
  orderId?: string;
}

type PaymentMethod = 'wechat' | 'alipay' | 'stripe';

export function PaymentDialog({ open, onClose, amount, description, onSuccess, orderId }: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>('wechat');
  const [paying, setPaying] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  if (!open) return null;

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direct',
          amount,
          method,
          description,
          orderId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.qrUrl) {
          setQrUrl(data.qrUrl);
        }
        if (data.status === 'completed') {
          onSuccess();
          onClose();
        }
      }
    } finally {
      setPaying(false);
    }
  };

  const METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { id: 'wechat', label: '微信支付', icon: <Smartphone className="h-5 w-5 text-green-500" /> },
    { id: 'alipay', label: '支付宝', icon: <QrCode className="h-5 w-5 text-blue-500" /> },
    { id: 'stripe', label: '银行卡 / Stripe', icon: <CreditCard className="h-5 w-5 text-purple-500" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background w-full max-w-md rounded-xl border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold">确认支付</h3>
        <p className="text-muted-foreground text-sm">{description}</p>

        <div className="my-5 text-center">
          <span className="text-3xl font-bold">¥{(amount / 100).toFixed(2)}</span>
        </div>

        {/* Payment method selection */}
        {!qrUrl && (
          <div className="space-y-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  method === m.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {m.icon}
                <span className="text-sm font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* QR code area (placeholder) */}
        {qrUrl && (
          <div className="flex flex-col items-center gap-3 rounded-xl border p-6">
            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-muted-foreground text-center text-sm">
                请使用{method === 'wechat' ? '微信' : '支付宝'}
                <br />
                扫描二维码完成支付
              </p>
            </div>
            <p className="text-muted-foreground text-xs">支付完成后页面会自动更新</p>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground flex-1 rounded-xl py-2.5 text-sm"
          >
            取消
          </button>
          {!qrUrl && (
            <button
              onClick={handlePay}
              disabled={paying}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 处理中...
                </>
              ) : (
                '确认支付'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
