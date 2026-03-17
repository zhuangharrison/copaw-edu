'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { AuthDialog } from '@/components/auth/AuthDialog';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCredits: number;
  yearlyBonusCredits: number;
  features: string[];
  highlighted?: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [period, setPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const router = useRouter();
  const { user, fetchSession } = useAuthStore();

  useEffect(() => {
    fetch('/api/subscription/plans')
      .then((r) => r.json())
      .then((data) => { setPlans(data.plans ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    setSubscribing(planId);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, period }),
      });

      if (res.ok) {
        await fetchSession();
        router.push('/');
      }
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (cents: number) => `¥${(cents / 100).toFixed(0)}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-12">
      {/* Back */}
      <button
        onClick={() => router.push('/')}
        className="text-muted-foreground hover:text-foreground fixed left-4 top-4 rounded-lg p-2 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Header */}
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">选择适合你的方案</h1>
        <p className="text-muted-foreground mt-3 text-lg">
          新用户注册即赠 200 积分，免费体验完整课堂生成
        </p>

        {/* Period Toggle */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white p-1 shadow-sm dark:bg-gray-800">
          <button
            onClick={() => setPeriod('MONTHLY')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              period === 'MONTHLY'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            月付
          </button>
          <button
            onClick={() => setPeriod('YEARLY')}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              period === 'YEARLY'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            年付
            <span className="ml-1.5 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">
              省20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const price = period === 'MONTHLY' ? plan.monthlyPrice : plan.yearlyPrice;
          const monthlyEquivalent = period === 'YEARLY' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
          const totalCredits = plan.monthlyCredits + (period === 'YEARLY' ? plan.yearlyBonusCredits : 0);
          const isCurrentPlan = user?.role === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800/80 ${
                plan.highlighted
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-border'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold">
                  推荐
                </div>
              )}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>

              <div className="mt-4">
                <span className="text-3xl font-bold">{formatPrice(monthlyEquivalent)}</span>
                <span className="text-muted-foreground text-sm">/月</span>
                {period === 'YEARLY' && (
                  <span className="text-muted-foreground ml-2 text-xs line-through">
                    {formatPrice(plan.monthlyPrice)}/月
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-sm">
                <Zap className="text-primary h-4 w-4" />
                <span className="font-medium">{totalCredits.toLocaleString()} 积分/月</span>
                {period === 'YEARLY' && plan.yearlyBonusCredits > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    +{plan.yearlyBonusCredits} 额外
                  </span>
                )}
              </div>

              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan || subscribing === plan.id}
                className={`mt-6 w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  isCurrentPlan
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : plan.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                } disabled:opacity-50`}
              >
                {isCurrentPlan ? '当前方案' : subscribing === plan.id ? '处理中...' : '立即订阅'}
              </button>

              {period === 'YEARLY' && (
                <p className="text-muted-foreground mt-2 text-center text-xs">
                  年付 {formatPrice(price)}，到期自动续订
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Free Tier */}
      <div className="mx-auto mt-8 max-w-5xl text-center">
        <p className="text-muted-foreground text-sm">
          免费版：注册赠送 200 积分 · 支持基础课堂生成 · 无需绑定信用卡
        </p>
      </div>

      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
