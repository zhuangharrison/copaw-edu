import { prisma } from '@/lib/server/db';

/** 操作类型 → 积分消耗映射 */
export type OperationType =
  | 'classroom_basic'     // 基础课堂（≤5场景）
  | 'classroom_standard'  // 标准课堂（≤10场景）
  | 'classroom_advanced'  // 高级课堂（≤20场景）
  | 'chat_round'          // AI讨论（每轮）
  | 'tts_minute'          // TTS语音（每分钟）
  | 'image_gen'           // 图片生成（每张）
  | 'video_gen'           // 视频生成（每段）
  | 'pdf_parse'           // PDF解析（每份）
  | 'copaw_skill'         // CoPaw技能使用（每次会话）
  | 'export_pptx';        // 导出PPTX

const COST_MAP: Record<OperationType, number> = {
  classroom_basic: 50,
  classroom_standard: 100,
  classroom_advanced: 200,
  chat_round: 2,
  tts_minute: 5,
  image_gen: 10,
  video_gen: 30,
  pdf_parse: 10,
  copaw_skill: 5,
  export_pptx: 5,
};

const OPERATION_LABELS: Record<OperationType, string> = {
  classroom_basic: '生成基础课堂',
  classroom_standard: '生成标准课堂',
  classroom_advanced: '生成高级课堂',
  chat_round: 'AI讨论',
  tts_minute: '语音合成',
  image_gen: '图片生成',
  video_gen: '视频生成',
  pdf_parse: 'PDF解析',
  copaw_skill: 'CoPaw技能使用',
  export_pptx: '导出PPTX',
};

export function getCost(operation: OperationType, quantity: number = 1): number {
  return COST_MAP[operation] * quantity;
}

export interface CreditCheckResult {
  allowed: boolean;
  cost: number;
  balance: number;
}

/**
 * 检查用户是否有足够积分
 */
export async function checkCredits(
  userId: string,
  operation: OperationType,
  quantity: number = 1,
): Promise<CreditCheckResult> {
  const cost = getCost(operation, quantity);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return {
    allowed: user.credits >= cost,
    cost,
    balance: user.credits,
  };
}

/**
 * 扣减积分（原子操作）
 * 返回扣减后的余额，积分不足时抛出错误
 */
export async function deductCredits(
  userId: string,
  operation: OperationType,
  quantity: number = 1,
  metadata?: Record<string, unknown>,
): Promise<{ balance: number; cost: number }> {
  const cost = getCost(operation, quantity);
  const label = OPERATION_LABELS[operation];

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.credits < cost) {
      throw new Error('INSUFFICIENT_CREDITS');
    }

    const newBalance = user.credits - cost;

    await tx.user.update({
      where: { id: userId },
      data: { credits: newBalance },
    });

    await tx.creditHistory.create({
      data: {
        userId,
        amount: -cost,
        balance: newBalance,
        type: 'CONSUMPTION',
        description: `${label}${quantity > 1 ? ` x${quantity}` : ''}`,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return { balance: newBalance, cost };
  });
}

/**
 * 充值积分
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'SUBSCRIPTION' | 'BONUS' | 'PURCHASE' | 'REFUND',
  description: string,
): Promise<{ balance: number }> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const newBalance = user.credits + amount;

    await tx.user.update({
      where: { id: userId },
      data: { credits: newBalance },
    });

    await tx.creditHistory.create({
      data: {
        userId,
        amount,
        balance: newBalance,
        type,
        description,
      },
    });

    return { balance: newBalance };
  });
}

/**
 * 查询积分流水
 */
export async function getCreditHistory(
  userId: string,
  options?: { limit?: number; offset?: number },
) {
  const { limit = 20, offset = 0 } = options ?? {};

  const [records, total] = await Promise.all([
    prisma.creditHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.creditHistory.count({ where: { userId } }),
  ]);

  return { records, total };
}
