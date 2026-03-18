export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;    // 月付价格（分）
  yearlyPrice: number;     // 年付价格（分）
  monthlyCredits: number;  // 每月积分
  yearlyBonusCredits: number; // 年付额外积分/月
  features: string[];
  highlighted?: boolean;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'STUDENT',
    name: '学生版',
    description: '适合学生个人学习使用',
    monthlyPrice: 2900,      // ¥29
    yearlyPrice: 27800,      // ¥278
    monthlyCredits: 1000,
    yearlyBonusCredits: 200,
    features: [
      '基础课堂生成',
      'AI 讨论对话',
      'TTS 语音合成',
      'CoPaw 学生技能（6个）',
      '错题本 + 记忆库',
    ],
  },
  {
    id: 'TEACHER',
    name: '教师版',
    description: '教师备课与教学利器',
    monthlyPrice: 5900,      // ¥59
    yearlyPrice: 56600,      // ¥566
    monthlyCredits: 3000,
    yearlyBonusCredits: 500,
    highlighted: true,
    features: [
      '全部课堂生成功能',
      '图片生成',
      'CoPaw 全部技能（15个）',
      'PPTX 导出',
      '专属教学模板',
      '学生学情分析',
    ],
  },
  {
    id: 'PRO',
    name: '专业版',
    description: '全功能无限制',
    monthlyPrice: 9900,      // ¥99
    yearlyPrice: 95000,      // ¥950
    monthlyCredits: 8000,
    yearlyBonusCredits: 1500,
    features: [
      '全部功能',
      '视频生成',
      '优先使用高级模型',
      'API 访问',
      '私有部署支持',
      '专属技术支持',
    ],
  },
];

export const CREDIT_PACKS = [
  { id: 'pack_100', credits: 100, price: 990, label: '100 积分' },
  { id: 'pack_500', credits: 500, price: 3990, label: '500 积分' },
  { id: 'pack_2000', credits: 2000, price: 12900, label: '2000 积分' },
];

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return PLANS.find((p) => p.id === planId);
}
