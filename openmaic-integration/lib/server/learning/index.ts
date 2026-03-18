import { prisma } from '@/lib/server/db';

// ==================== 错题管理 ====================

export async function addMistake(
  userId: string,
  data: {
    subject: string;
    category: string;
    question: string;
    wrongAnswer?: string;
    analysis: string;
    correction: string;
    variants?: string[];
  },
) {
  return prisma.mistakeRecord.create({
    data: {
      userId,
      subject: data.subject,
      category: data.category,
      question: data.question,
      wrongAnswer: data.wrongAnswer ?? null,
      analysis: data.analysis,
      correction: data.correction,
      variants: data.variants ? JSON.stringify(data.variants) : null,
    },
  });
}

export async function getMistakes(
  userId: string,
  options?: { subject?: string; limit?: number; offset?: number },
) {
  const { subject, limit = 20, offset = 0 } = options ?? {};
  const where = { userId, ...(subject ? { subject } : {}) };

  const [records, total] = await Promise.all([
    prisma.mistakeRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.mistakeRecord.count({ where }),
  ]);

  return { records, total };
}

// ==================== 记忆管理 ====================

const EBBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30]; // 天

export async function addMemory(
  userId: string,
  data: {
    subject: string;
    content: string;
    method: string;
    mnemonicData?: Record<string, unknown>;
  },
) {
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + EBBINGHAUS_INTERVALS[0]);

  return prisma.memoryRecord.create({
    data: {
      userId,
      subject: data.subject,
      content: data.content,
      method: data.method,
      mnemonicData: data.mnemonicData ? JSON.stringify(data.mnemonicData) : null,
      nextReviewAt: nextReview,
    },
  });
}

export async function getDueMemories(userId: string) {
  return prisma.memoryRecord.findMany({
    where: {
      userId,
      nextReviewAt: { lte: new Date() },
    },
    orderBy: { nextReviewAt: 'asc' },
  });
}

export async function reviewMemory(id: string) {
  const record = await prisma.memoryRecord.findUniqueOrThrow({ where: { id } });

  const intervalIndex = Math.min(record.reviewCount, EBBINGHAUS_INTERVALS.length - 1);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + EBBINGHAUS_INTERVALS[intervalIndex]);

  return prisma.memoryRecord.update({
    where: { id },
    data: {
      reviewCount: record.reviewCount + 1,
      strength: Math.min(5, record.strength + 1),
      nextReviewAt: nextReview,
      lastReviewAt: new Date(),
    },
  });
}

// ==================== 学习进度 ====================

export async function getProgress(userId: string, skillId: string) {
  return prisma.learningProgress.findUnique({
    where: { userId_skillId: { userId, skillId } },
  });
}

export async function updateProgress(
  userId: string,
  skillId: string,
  data: Record<string, unknown>,
) {
  return prisma.learningProgress.upsert({
    where: { userId_skillId: { userId, skillId } },
    create: {
      userId,
      skillId,
      data: JSON.stringify(data),
    },
    update: {
      data: JSON.stringify(data),
    },
  });
}
