'use client';

import Link from 'next/link';

interface CreditsBadgeProps {
  credits: number;
}

export function CreditsBadge({ credits }: CreditsBadgeProps) {
  const isLow = credits < 50;

  return (
    <Link
      href="/pricing"
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${
        isLow
          ? 'bg-destructive/10 text-destructive'
          : 'bg-primary/10 text-primary'
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 18V6" />
      </svg>
      <span>{credits}</span>
      {isLow && <span className="text-[10px] opacity-70">充值</span>}
    </Link>
  );
}
