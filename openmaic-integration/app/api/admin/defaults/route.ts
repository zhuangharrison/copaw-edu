import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/admin/auth-guard';
import { getDefaults, setDefault } from '@/lib/server/admin/provider-manager';

/**
 * GET /api/admin/defaults
 * 获取默认配置
 */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const defaults = await getDefaults();
  return NextResponse.json({ defaults });
}

/**
 * PUT /api/admin/defaults
 * 设置默认配置
 */
export async function PUT(request: Request) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const { key, value } = await request.json();

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key 和 value 必填' }, { status: 400 });
  }

  await setDefault(key, value);
  return NextResponse.json({ ok: true });
}
