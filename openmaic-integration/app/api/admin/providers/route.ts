import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/admin/auth-guard';
import {
  listProviders,
  upsertProvider,
  type ProviderCategory,
} from '@/lib/server/admin/provider-manager';

/**
 * GET /api/admin/providers?category=llm
 * 列出所有提供商配置
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as ProviderCategory | null;

  const providers = await listProviders(category ?? undefined);
  return NextResponse.json({ providers });
}

/**
 * POST /api/admin/providers
 * 创建或更新提供商配置
 */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

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

  return NextResponse.json({ provider }, { status: 201 });
}
