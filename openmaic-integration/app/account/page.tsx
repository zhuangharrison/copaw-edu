'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { CreditsHistory } from '@/components/credits/CreditsHistory';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { PurchaseDialog } from '@/components/credits/PurchaseDialog';
import { CreditsBadge } from '@/components/credits/CreditsBadge';
import { ArrowLeft, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const { user, loading, fetchSession } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<'subscription' | 'credits' | 'profile'>('subscription');
  const [showPurchase, setShowPurchase] = useState(false);

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

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <User className="text-muted-foreground h-12 w-12" />
        <h1 className="text-xl font-semibold">请先登录</h1>
        <button
          onClick={() => router.push('/')}
          className="text-primary text-sm underline"
        >
          返回首页
        </button>
      </div>
    );
  }

  const TABS = [
    { id: 'subscription' as const, label: '订阅管理' },
    { id: 'credits' as const, label: '积分流水' },
    { id: 'profile' as const, label: '个人信息' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/60 backdrop-blur-md dark:bg-gray-800/60">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">我的账户</h1>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>
          <CreditsBadge credits={user.credits} />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Upgrade prompt */}
        <UpgradePrompt currentPlan={user.role} creditsLeft={user.credits} />

        {/* Tabs */}
        <div className="mb-6 mt-4 flex gap-4 border-b">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground border-transparent hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'subscription' && <SubscriptionStatus />}

        {tab === 'credits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{user.credits.toLocaleString()}</p>
                <p className="text-muted-foreground text-sm">当前积分余额</p>
              </div>
              <button
                onClick={() => setShowPurchase(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2 text-sm font-medium"
              >
                购买积分
              </button>
            </div>
            <CreditsHistory />
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">个人信息</h3>
            <div className="bg-background space-y-3 rounded-xl border p-5">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground text-sm">昵称</span>
                <span className="text-sm font-medium">{user.name ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground text-sm">邮箱</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-muted-foreground text-sm">用户角色</span>
                <span className="text-sm font-medium">{user.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">积分余额</span>
                <span className="text-sm font-medium">{user.credits}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <PurchaseDialog open={showPurchase} onClose={() => setShowPurchase(false)} />
    </div>
  );
}
