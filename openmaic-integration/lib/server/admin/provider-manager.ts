import { prisma } from '@/lib/server/db';
import { encryptApiKey, decryptApiKey, maskApiKey } from './encryption';

export type ProviderCategory = 'llm' | 'tts' | 'asr' | 'image' | 'video' | 'pdf' | 'web-search';

export interface AdminProviderInput {
  providerId: string;
  category: ProviderCategory;
  apiKey: string;
  baseUrl?: string;
  proxy?: string;
  models?: string[];    // 启用的模型ID列表
  isEnabled?: boolean;
  priority?: number;
}

export interface AdminProviderOutput {
  id: string;
  providerId: string;
  category: ProviderCategory;
  maskedApiKey: string;
  baseUrl: string | null;
  proxy: string | null;
  models: string[];
  isEnabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 用于内部解析的完整配置（含解密后的 API Key） */
export interface ResolvedProviderConfig {
  providerId: string;
  category: ProviderCategory;
  apiKey: string;
  baseUrl: string | null;
  proxy: string | null;
  models: string[];
  isEnabled: boolean;
}

/**
 * 列出所有提供商配置（前端展示用，API Key 已遮罩）
 */
export async function listProviders(category?: ProviderCategory): Promise<AdminProviderOutput[]> {
  const where = category ? { category } : {};
  const records = await prisma.adminProviderConfig.findMany({
    where,
    orderBy: [{ category: 'asc' }, { priority: 'desc' }, { providerId: 'asc' }],
  });

  return records.map((r) => ({
    id: r.id,
    providerId: r.providerId,
    category: r.category as ProviderCategory,
    maskedApiKey: maskApiKey(decryptApiKey(r.apiKey)),
    baseUrl: r.baseUrl,
    proxy: r.proxy,
    models: r.models ? JSON.parse(r.models) : [],
    isEnabled: r.isEnabled,
    priority: r.priority,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/**
 * 获取解密后的提供商配置（内部使用）
 */
export async function getResolvedProvider(
  providerId: string,
  category: ProviderCategory = 'llm',
): Promise<ResolvedProviderConfig | null> {
  const record = await prisma.adminProviderConfig.findUnique({
    where: { providerId_category: { providerId, category } },
  });

  if (!record || !record.isEnabled) return null;

  return {
    providerId: record.providerId,
    category: record.category as ProviderCategory,
    apiKey: decryptApiKey(record.apiKey),
    baseUrl: record.baseUrl,
    proxy: record.proxy,
    models: record.models ? JSON.parse(record.models) : [],
    isEnabled: record.isEnabled,
  };
}

/**
 * 获取所有启用的 LLM 提供商配置（解密后，供 API 路由使用）
 */
export async function getAllResolvedProviders(
  category: ProviderCategory = 'llm',
): Promise<ResolvedProviderConfig[]> {
  const records = await prisma.adminProviderConfig.findMany({
    where: { category, isEnabled: true },
    orderBy: { priority: 'desc' },
  });

  return records.map((r) => ({
    providerId: r.providerId,
    category: r.category as ProviderCategory,
    apiKey: decryptApiKey(r.apiKey),
    baseUrl: r.baseUrl,
    proxy: r.proxy,
    models: r.models ? JSON.parse(r.models) : [],
    isEnabled: r.isEnabled,
  }));
}

/**
 * 创建或更新提供商配置
 */
export async function upsertProvider(input: AdminProviderInput): Promise<AdminProviderOutput> {
  const encryptedKey = encryptApiKey(input.apiKey);

  const record = await prisma.adminProviderConfig.upsert({
    where: {
      providerId_category: { providerId: input.providerId, category: input.category },
    },
    create: {
      providerId: input.providerId,
      category: input.category,
      apiKey: encryptedKey,
      baseUrl: input.baseUrl ?? null,
      proxy: input.proxy ?? null,
      models: input.models ? JSON.stringify(input.models) : null,
      isEnabled: input.isEnabled ?? true,
      priority: input.priority ?? 0,
    },
    update: {
      apiKey: encryptedKey,
      baseUrl: input.baseUrl ?? null,
      proxy: input.proxy ?? null,
      models: input.models ? JSON.stringify(input.models) : null,
      isEnabled: input.isEnabled ?? true,
      priority: input.priority ?? 0,
    },
  });

  return {
    id: record.id,
    providerId: record.providerId,
    category: record.category as ProviderCategory,
    maskedApiKey: maskApiKey(input.apiKey),
    baseUrl: record.baseUrl,
    proxy: record.proxy,
    models: record.models ? JSON.parse(record.models) : [],
    isEnabled: record.isEnabled,
    priority: record.priority,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * 删除提供商配置
 */
export async function deleteProvider(id: string): Promise<void> {
  await prisma.adminProviderConfig.delete({ where: { id } });
}

/**
 * 获取默认配置
 */
export async function getDefaults(): Promise<Record<string, string>> {
  const records = await prisma.adminDefaultConfig.findMany();
  return Object.fromEntries(records.map((r) => [r.key, r.value]));
}

/**
 * 设置默认配置
 */
export async function setDefault(key: string, value: string): Promise<void> {
  await prisma.adminDefaultConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
