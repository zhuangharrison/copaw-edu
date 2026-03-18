'use client';

import { useState, useEffect } from 'react';
import { Loader2, Crown, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscriptionData {
  id: string;
  plan: string;
  period: string;
  status: string;
  monthlyCredits: number;
  bonusCredits: number;
  startDate: string;
  endDate: string;
}

const PLAN_LABELS: Record<string, string> = {
  STUDENT: '学生版',
  TEACHER: '教师版',
  PRO: '专业版',
};

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/subscription')
      .then((r) => r.json())
      .then((data) => {
        setSubscription(data.subscription ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCancel = async () => {
    if (!confirm('确定要取消订阅吗？取消后当前周期积分仍可使用，到期后不再续费。')) return;

    setCancelling(true);
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' });
      if (res.ok) {
        setSubscription((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      }
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="rounded-xl border bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-6 text-center">
        <Crown className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
        <h3 className="mb-1 text-lg font-semibold">尚未订阅</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          升级订阅享更多积分和功能
        </p>
        <button
          onClick={() => router.push('/pricing')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-2.5 text-sm font-medium"
        >
          查看订阅方案
        </button>
      </div>
    );
  }

  const isExpired = new Date(subscription.endDate) < new Date();
  const isCancelled = subscription.status === 'CANCELLED';
  const daysLeft = Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / 86400000));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">当前订阅</h3>

      <div className="rounded-xl border p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="text-primary h-5 w-5" />
              <span className="text-lg font-semibold">
                {PLAN_LABELS[subscription.plan] ?? subscription.plan}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isExpired || isCancelled
                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                    : 'bg-green-500/10 text-green-600 dark:text-green-400'
                }`}
              >
                {isExpired ? '已过期' : isCancelled ? '已取消' : '生效中'}
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {subscription.period === 'YEARLY' ? '年付' : '月付'} ·
              每月 {subscription.monthlyCredits.toLocaleString()} 积分
              {subscription.bonusCredits > 0 && ` + ${subscription.bonusCredits} 额外积分`}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-xs">开始日期</p>
            <p className="font-medium">{new Date(subscription.startDate).toLocaleDateString('zh-CN')}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-xs">到期日期</p>
            <p className="font-medium">{new Date(subscription.endDate).toLocaleDateString('zh-CN')}</p>
          </div>
        </div>

        {!isExpired && !isCancelled && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            {daysLeft <= 7 && (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            <span className={daysLeft <= 7 ? 'text-amber-500' : 'text-muted-foreground'}>
              距到期还有 {daysLeft} 天
            </span>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {!isExpired && !isCancelled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-muted-foreground hover:text-destructive rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50"
            >
              {cancelling ? '处理中...' : '取消订阅'}
            </button>
          )}
          {(isExpired || isCancelled) && (
            <button
              onClick={() => router.push('/pricing')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-1.5 text-sm font-medium"
            >
              重新订阅
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
