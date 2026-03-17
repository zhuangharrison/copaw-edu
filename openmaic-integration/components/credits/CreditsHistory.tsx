'use client';

import { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';

interface HistoryRecord {
  id: string;
  amount: number;
  balance: number;
  type: string;
  description: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  INITIAL_GRANT: '注册赠送',
  SUBSCRIPTION: '订阅积分',
  BONUS: '额外奖励',
  PURCHASE: '积分购买',
  CONSUMPTION: '使用消耗',
  REFUND: '退款',
};

export function CreditsHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/credits/history?limit=${pageSize}&offset=${page * pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setRecords(data.records ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">积分流水</h3>

      {records.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">暂无记录</p>
      ) : (
        <div className="space-y-1">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-background flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-1.5 ${
                    record.amount > 0
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}
                >
                  {record.amount > 0 ? (
                    <ArrowDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{record.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {TYPE_LABELS[record.type] ?? record.type} ·{' '}
                    {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    record.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {record.amount > 0 ? '+' : ''}
                  {record.amount}
                </p>
                <p className="text-muted-foreground text-xs">余额 {record.balance}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-1.5 text-sm disabled:opacity-30"
          >
            上一页
          </button>
          <span className="text-muted-foreground text-sm">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-1.5 text-sm disabled:opacity-30"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
