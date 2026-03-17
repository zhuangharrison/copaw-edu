'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { AuthDialog } from './AuthDialog';
import { CreditsBadge } from '../credits/CreditsBadge';

export function UserMenu() {
  const { user, logout } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuth(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-1.5 text-sm font-medium"
        >
          登录
        </button>
        <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <CreditsBadge credits={user.credits} />

      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
        >
          {(user.name ?? user.email)[0].toUpperCase()}
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="bg-popover border-border absolute right-0 top-10 z-50 w-48 rounded-lg border p-2 shadow-lg">
              <div className="border-b px-3 py-2">
                <p className="text-sm font-medium">{user.name ?? user.email}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
              </div>
              <div className="mt-1 px-3 py-1.5">
                <p className="text-muted-foreground text-xs">
                  积分余额: <span className="text-foreground font-medium">{user.credits}</span>
                </p>
                <p className="text-muted-foreground text-xs">
                  账户类型: <span className="text-foreground font-medium">{
                    { FREE: '免费', STUDENT: '学生版', TEACHER: '教师版', PRO: '专业版', ADMIN: '管理员' }[user.role] ?? user.role
                  }</span>
                </p>
              </div>
              <button
                onClick={() => { logout(); setShowMenu(false); }}
                className="text-destructive hover:bg-muted mt-1 w-full rounded-md px-3 py-1.5 text-left text-sm"
              >
                退出登录
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
