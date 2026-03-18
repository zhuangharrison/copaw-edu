# CoPaw-Edu × OpenMAIC 整合实施计划

## 项目总览

将 CoPaw-Edu 的 15 个个人学习技能嵌入 OpenMAIC 平台，优化模型配置为后端管理，并建立积分订阅制商业模式。

---

## 一、CoPaw-Edu 学习技能嵌入 OpenMAIC

### 1.1 技能适配层设计

CoPaw-Edu 的技能使用 SKILL.md (YAML front-matter + Markdown) 格式定义，需要转换为 OpenMAIC 的智能体注册系统（`lib/orchestration/registry/`）。

**新增目录**：`lib/skills/copaw/`

```
lib/skills/copaw/
├── index.ts                    # 技能注册入口
├── skill-adapter.ts            # SKILL.md → OpenMAIC Agent 适配器
├── skill-types.ts              # 技能类型定义
├── student/                    # 学生技能（6个）
│   ├── memory-system.ts        # 智能记忆系统
│   ├── concept-master.ts       # 知识理解专家
│   ├── mistake-master.ts       # 错题管理
│   ├── exam-prep.ts            # 考前冲刺
│   ├── multimodal-gen.ts       # 多模态内容生成
│   └── ai-study-prompts.ts     # AI学习提示库
├── parent/                     # 家长技能（4个）
│   ├── progress-report.ts      # 学习进度报告
│   ├── daily-briefing.ts       # 每日学情简报
│   ├── resource-finder.ts      # 教育资源推荐
│   └── schedule-reminder.ts    # 时间管理提醒
└── teacher/                    # 教师技能（5个）
    ├── lesson-plan.ts          # 教案生成
    ├── quiz-creator.ts         # 试卷生成
    ├── student-analyzer.ts     # 学生学情分析
    ├── grading-helper.ts       # 批改辅助
    └── parent-comm.ts          # 家校沟通
```

### 1.2 技能注册到 OpenMAIC 智能体系统

每个 CoPaw 技能转换为一个 OpenMAIC 可调用的智能体角色：

```typescript
// lib/skills/copaw/skill-adapter.ts
interface CoPawSkill {
  id: string;
  name: string;
  role: 'student' | 'parent' | 'teacher';
  version: string;
  systemPrompt: string;        // 从 SKILL.md 提取的完整提示词
  triggerKeywords: string[];    // 自动检测触发词
  tools?: ToolDefinition[];     // 技能专用工具（如错题数据库查询）
}
```

### 1.3 技能与课堂场景的整合

- **课堂生成阶段**：在 `lib/generation/scene-generator.ts` 中新增 `copaw-skill` 场景类型
- **实时交互阶段**：在 `lib/orchestration/director-graph.ts` 中注册 CoPaw 技能智能体
- **技能选择 UI**：在 `components/settings/` 中新增技能管理面板

### 1.4 数据持久化

在 Dexie 数据库中新增表：

```typescript
// lib/utils/database.ts 新增
interface MistakeRecord {    // 错题记录
  id: string;
  userId: string;
  subject: string;
  category: string;          // 6种错误类型
  content: string;
  analysis: string;
  createdAt: Date;
}

interface MemoryRecord {     // 记忆记录
  id: string;
  userId: string;
  subject: string;
  method: string;            // 记忆宫殿/口诀/联想等
  content: string;
  nextReviewAt: Date;        // 艾宾浩斯复习时间
  reviewCount: number;
}

interface LearningProgress { // 学习进度
  id: string;
  userId: string;
  skillId: string;
  data: Record<string, any>;
  updatedAt: Date;
}
```

---

## 二、模型配置后端化

### 2.1 当前痛点

- 用户需手动在前端 Settings 面板逐个配置 API Key
- `server-providers.yml` 和 `.env` 需要手动编辑服务器文件
- 无多用户隔离，配置存储在浏览器 localStorage

### 2.2 后端管理架构

**新增目录**：`lib/server/admin/`

```
lib/server/admin/
├── index.ts                    # Admin API 入口
├── provider-manager.ts         # 提供商管理服务
├── config-store.ts             # 配置持久化（文件/数据库）
├── encryption.ts               # API Key 加密存储
└── types.ts                    # Admin 类型定义
```

**新增 API 路由**：`app/api/admin/`

```
app/api/admin/
├── providers/
│   ├── route.ts               # GET: 列表, POST: 新增提供商
│   └── [id]/
│       └── route.ts           # PUT: 更新, DELETE: 删除提供商
├── models/
│   ├── route.ts               # GET: 可用模型列表
│   └── [id]/
│       └── route.ts           # PUT: 启用/禁用/配置模型
├── defaults/
│   └── route.ts               # GET/PUT: 默认模型和提供商设置
└── test-connection/
    └── route.ts               # POST: 测试提供商连接
```

### 2.3 Admin 配置面板

**新增组件**：`components/admin/`

```
components/admin/
├── AdminPanel.tsx              # 管理主面板
├── ProviderList.tsx            # 提供商列表管理
├── ProviderForm.tsx            # 提供商配置表单
├── ModelManager.tsx            # 模型启用/禁用管理
├── DefaultSettings.tsx         # 默认配置设置
└── ConnectionTester.tsx        # 连接测试
```

### 2.4 配置流程变更

**当前流程**：
```
用户 → 前端 Settings → localStorage → 每次请求带上 apiKey
```

**新流程**：
```
管理员 → Admin 面板 → 后端加密存储 → 前端仅选择模型（无需 API Key）
用户 → 选择模型 → API 请求 → 后端自动注入凭证
```

### 2.5 前端 Settings 简化

移除用户端的 API Key 输入，保留：
- 模型选择（从后端可用列表中选择）
- TTS/ASR 偏好选择
- 播放速度、字体等个人偏好
- 语言选择

---

## 三、积分订阅制系统

### 3.1 积分体系设计

#### 积分消耗规则

| 操作 | 消耗积分 |
|------|---------|
| 生成课堂（基础，5个场景以内） | 50 积分 |
| 生成课堂（标准，10个场景以内） | 100 积分 |
| 生成课堂（高级，20个场景以内） | 200 积分 |
| AI 讨论（每轮对话） | 2 积分 |
| TTS 语音合成（每分钟） | 5 积分 |
| 图片生成（每张） | 10 积分 |
| 视频生成（每段） | 30 积分 |
| PDF 解析（每份） | 10 积分 |
| CoPaw 技能使用（每次会话） | 5 积分 |
| 导出 PPTX | 5 积分 |

#### 首次注册赠送

- **新用户基础积分**：200 积分（约可体验 2-3 次完整课堂生成）

### 3.2 订阅方案

#### 月订阅

| 方案 | 月价 | 积分/月 | 权限 |
|------|------|---------|------|
| **学生版** | ¥29/月 | 1,000 积分 | 基础课堂生成 + AI讨论 + TTS + CoPaw学生技能 |
| **教师版** | ¥59/月 | 3,000 积分 | 全部课堂功能 + 图片生成 + CoPaw全部技能 + PPTX导出 |
| **专业版** | ¥99/月 | 8,000 积分 | 全部功能 + 视频生成 + 优先模型 + API 访问 |

#### 年订阅（8折优惠）

| 方案 | 年价 | 折合月价 | 积分/月 | 额外权益 |
|------|------|---------|---------|---------|
| **学生版** | ¥278/年 | ¥23.2/月 | 1,000 积分 | +200 额外积分/月 |
| **教师版** | ¥566/年 | ¥47.2/月 | 3,000 积分 | +500 额外积分/月 + 专属模板 |
| **专业版** | ¥950/年 | ¥79.2/月 | 8,000 积分 | +1,500 额外积分/月 + 私有部署支持 |

#### 积分包（按需购买）

| 积分包 | 价格 | 适用场景 |
|--------|------|---------|
| 100 积分 | ¥9.9 | 临时补充 |
| 500 积分 | ¥39.9 | 中度使用 |
| 2,000 积分 | ¥129 | 重度使用 |

### 3.3 技术实现

#### 数据库设计

**新增后端数据库**（建议使用 Prisma + PostgreSQL 或 SQLite）：

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String
  role          UserRole  @default(FREE)
  credits       Int       @default(200)    // 首次赠送200积分
  subscription  Subscription?
  creditHistory CreditHistory[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum UserRole {
  FREE
  STUDENT
  TEACHER
  PRO
  ADMIN
}

model Subscription {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  plan          PlanType
  period        PeriodType
  status        SubStatus @default(ACTIVE)
  monthlyCredits Int
  bonusCredits  Int       @default(0)
  startDate     DateTime
  endDate       DateTime
  createdAt     DateTime  @default(now())
}

enum PlanType {
  STUDENT
  TEACHER
  PRO
}

enum PeriodType {
  MONTHLY
  YEARLY
}

enum SubStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}

model CreditHistory {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  amount      Int                    // 正数=充值/赠送，负数=消耗
  balance     Int                    // 操作后余额
  type        CreditType
  description String
  metadata    Json?                  // 额外信息（如课堂ID）
  createdAt   DateTime  @default(now())
}

enum CreditType {
  INITIAL_GRANT      // 首次赠送
  SUBSCRIPTION       // 订阅月度积分
  BONUS              // 年订阅额外积分
  PURCHASE           // 积分包购买
  CONSUMPTION        // 使用消耗
  REFUND             // 退款
}
```

#### API 路由

```
app/api/
├── auth/
│   ├── register/route.ts       # 注册（赠送200积分）
│   ├── login/route.ts          # 登录
│   └── session/route.ts        # 会话管理
├── credits/
│   ├── route.ts                # GET: 查询余额
│   ├── consume/route.ts        # POST: 消耗积分（内部调用）
│   └── history/route.ts        # GET: 积分流水
├── subscription/
│   ├── route.ts                # GET: 当前订阅, POST: 创建订阅
│   ├── plans/route.ts          # GET: 可用方案
│   └── cancel/route.ts         # POST: 取消订阅
└── payment/
    ├── create/route.ts         # POST: 创建支付订单
    └── webhook/route.ts        # POST: 支付回调
```

#### 前端组件

```
components/
├── auth/
│   ├── LoginDialog.tsx         # 登录弹窗
│   ├── RegisterDialog.tsx      # 注册弹窗
│   └── UserMenu.tsx            # 用户菜单（头像、积分余额）
├── credits/
│   ├── CreditsBadge.tsx        # 积分余额显示（顶部导航栏）
│   ├── CreditsHistory.tsx      # 积分流水
│   ├── InsufficientDialog.tsx  # 积分不足提示
│   └── PurchaseDialog.tsx      # 购买积分包
├── subscription/
│   ├── PricingPage.tsx         # 定价页面（3个方案对比）
│   ├── PlanCard.tsx            # 单个方案卡片
│   ├── SubscriptionStatus.tsx  # 当前订阅状态
│   └── UpgradePrompt.tsx       # 升级提示
└── payment/
    ├── PaymentDialog.tsx       # 支付弹窗
    └── PaymentSuccess.tsx      # 支付成功
```

#### 积分扣费中间件

```typescript
// lib/middleware/credits.ts
export async function checkCredits(
  userId: string,
  operation: OperationType,
  params?: Record<string, any>
): Promise<{ allowed: boolean; cost: number; balance: number }> {
  const cost = calculateCost(operation, params);
  const user = await getUser(userId);

  if (user.credits < cost) {
    return { allowed: false, cost, balance: user.credits };
  }

  return { allowed: true, cost, balance: user.credits };
}

export async function deductCredits(
  userId: string,
  operation: OperationType,
  cost: number,
  metadata?: Record<string, any>
): Promise<void> {
  // 原子操作：扣减积分 + 记录流水
}
```

### 3.4 支付集成（建议）

- **国内**：微信支付 + 支付宝（通过聚合支付如 Stripe China 或 Ping++）
- **国际**：Stripe
- **Webhook 回调**处理订阅激活和积分充值

---

## 四、实施路线图

### Phase 1：基础设施（第1-2周）
1. [ ] 添加数据库（Prisma + SQLite/PostgreSQL）
2. [ ] 实现用户认证系统（注册/登录/会话）
3. [ ] 实现积分系统核心逻辑
4. [ ] 新用户 200 积分赠送

### Phase 2：后端模型配置（第3-4周）
5. [ ] Admin API 端点开发
6. [ ] Admin 管理面板 UI
7. [ ] 前端 Settings 简化（移除 API Key 输入）
8. [ ] 配置加密存储

### Phase 3：CoPaw 技能整合（第5-6周）
9. [ ] CoPaw 技能适配层开发
10. [ ] 15 个技能逐个迁移和测试
11. [ ] 技能选择 UI
12. [ ] 学习数据持久化（错题本、记忆库）

### Phase 4：订阅与支付（第7-8周）
13. [ ] 订阅方案 API 和管理
14. [ ] 定价页面和订阅 UI
15. [ ] 支付集成（微信/支付宝/Stripe）
16. [ ] 积分扣费中间件集成到所有 API

### Phase 5：测试与优化（第9-10周）
17. [ ] 端到端测试
18. [ ] 性能优化
19. [ ] 安全审计（支付安全、API Key 加密、XSS/CSRF 防护）
20. [ ] 文档更新

---

## 五、关键技术决策

| 决策项 | 建议方案 | 理由 |
|--------|---------|------|
| 数据库 | Prisma + PostgreSQL | Next.js 生态成熟，支持迁移 |
| 认证 | NextAuth.js | 开箱即用，支持多种登录方式 |
| 支付 | Stripe (国际) + Ping++ (国内) | 覆盖全球 |
| API Key 加密 | AES-256-GCM | 标准加密方案 |
| 缓存 | Redis (可选) | 积分余额高频查询 |
| 部署 | Vercel + Supabase/Neon | 与 Next.js 原生兼容 |
