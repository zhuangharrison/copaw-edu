'use client';

import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
  currentPlan?: string;
  creditsLeft: number;
}

export function UpgradePrompt({ currentPlan, creditsLeft }: UpgradePromptProps) {
  const router = useRouter();

  if (creditsLeft >= 100) return null;

  const message =
    creditsLeft <= 0
      ? '积分已用完'
      : creditsLeft < 50
        ? '积分即将用完'
        : '积分余额较低';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <Zap className="h-5 w-5 shrink-0 text-amber-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{message}</p>
        <p className="text-muted-foreground text-xs">
          剩余 {creditsLeft} 积分
          {currentPlan && currentPlan !== 'FREE' ? '，可购买积分包补充' : '，升级订阅获取更多积分'}
        </p>
      </div>
      <button
        onClick={() => router.push('/pricing')}
        className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
      >
        {currentPlan && currentPlan !== 'FREE' ? '充值' : '升级'}
      </button>
    </div>
  );
}
