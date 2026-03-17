/**
 * 从数据库预加载 Admin 提供商配置到内存
 * 供 provider-config.ts 的同步 resolve 函数使用
 *
 * 设计：
 * - 启动时 / 首次请求时异步加载一次
 * - 缓存 60 秒后自动过期（Admin 面板修改后最多 60 秒生效）
 * - 返回与 ServerProviderEntry 兼容的格式
 */

import { prisma } from '@/lib/server/db';
import { decryptApiKey } from './encryption';
import { createLogger } from '@/lib/logger';

const log = createLogger('DBProviderLoader');

interface ProviderEntry {
  apiKey: string;
  baseUrl?: string;
  models?: string[];
  proxy?: string;
}

interface DBProviderCache {
  providers: Record<string, ProviderEntry>;
  tts: Record<string, ProviderEntry>;
  asr: Record<string, ProviderEntry>;
  pdf: Record<string, ProviderEntry>;
  image: Record<string, ProviderEntry>;
  video: Record<string, ProviderEntry>;
  webSearch: Record<string, ProviderEntry>;
  loadedAt: number;
}

const CACHE_TTL_MS = 60_000; // 60秒
let _cache: DBProviderCache | null = null;
let _loading: Promise<DBProviderCache> | null = null;

const CATEGORY_MAP: Record<string, keyof Omit<DBProviderCache, 'loadedAt'>> = {
  llm: 'providers',
  tts: 'tts',
  asr: 'asr',
  pdf: 'pdf',
  image: 'image',
  video: 'video',
  'web-search': 'webSearch',
};

async function loadFromDB(): Promise<DBProviderCache> {
  const cache: DBProviderCache = {
    providers: {},
    tts: {},
    asr: {},
    pdf: {},
    image: {},
    video: {},
    webSearch: {},
    loadedAt: Date.now(),
  };

  try {
    const records = await prisma.adminProviderConfig.findMany({
      where: { isEnabled: true },
    });

    for (const record of records) {
      const section = CATEGORY_MAP[record.category];
      if (!section) continue;

      const target = cache[section] as Record<string, ProviderEntry>;
      target[record.providerId] = {
        apiKey: decryptApiKey(record.apiKey),
        baseUrl: record.baseUrl ?? undefined,
        models: record.models ? JSON.parse(record.models) : undefined,
        proxy: record.proxy ?? undefined,
      };
    }

    log.info(
      `[DBProviderLoader] Loaded from DB: ${records.length} configs ` +
      `(${Object.keys(cache.providers).length} LLM, ${Object.keys(cache.tts).length} TTS, ` +
      `${Object.keys(cache.image).length} Image)`,
    );
  } catch (e) {
    log.warn('[DBProviderLoader] Failed to load from DB, using empty:', e);
  }

  return cache;
}

/**
 * 获取数据库中的提供商配置（带缓存）
 * 同步返回缓存，异步刷新
 */
export function getDBProviderConfig(): DBProviderCache | null {
  if (_cache && Date.now() - _cache.loadedAt < CACHE_TTL_MS) {
    return _cache;
  }

  // 触发异步加载
  if (!_loading) {
    _loading = loadFromDB().then((c) => {
      _cache = c;
      _loading = null;
      return c;
    }).catch(() => {
      _loading = null;
      return _cache ?? {
        providers: {}, tts: {}, asr: {}, pdf: {},
        image: {}, video: {}, webSearch: {}, loadedAt: Date.now(),
      };
    });
  }

  return _cache; // 返回旧缓存（可能为null，首次加载时）
}

/**
 * 强制重新加载数据库配置（Admin 面板保存后调用）
 */
export async function reloadDBProviderConfig(): Promise<void> {
  _cache = await loadFromDB();
}

/**
 * 从 DB 配置中解析 API Key（数据库优先，无则返回 undefined）
 */
export function resolveDBApiKey(
  category: keyof Omit<DBProviderCache, 'loadedAt'>,
  providerId: string,
): string | undefined {
  const cache = getDBProviderConfig();
  if (!cache) return undefined;
  return (cache[category] as Record<string, ProviderEntry>)?.[providerId]?.apiKey;
}

/**
 * 从 DB 配置中解析 Base URL
 */
export function resolveDBBaseUrl(
  category: keyof Omit<DBProviderCache, 'loadedAt'>,
  providerId: string,
): string | undefined {
  const cache = getDBProviderConfig();
  if (!cache) return undefined;
  return (cache[category] as Record<string, ProviderEntry>)?.[providerId]?.baseUrl;
}
