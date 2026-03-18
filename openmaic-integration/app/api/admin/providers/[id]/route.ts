import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/admin/auth-guard';
import { deleteProvider, upsertProvider } from '@/lib/server/admin/provider-manager';

/**
 * PUT /api/admin/providers/[id]
 * 更新提供商配置
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const { id } = await params;
  const body = await request.json();
  const { providerId, category, apiKey, baseUrl, proxy, models, isEnabled, priority } = body;

  if (!providerId || !apiKey) {
    return NextResponse.json({ error: 'providerId 和 apiKey 必填' }, { status: 400 });
  }

  const provider = await upsertProvider({
    providerId,
    category: category ?? 'llm',
    apiKey,
    baseUrl,
    proxy,
    models,
    isEnabled,
    priority,
  });

  return NextResponse.json({ provider });
}

/**
 * DELETE /api/admin/providers/[id]
 * 删除提供商配置
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const { id } = await params;
  await deleteProvider(id);

  return NextResponse.json({ ok: true });
}
