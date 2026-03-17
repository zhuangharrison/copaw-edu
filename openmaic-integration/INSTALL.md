# CoPaw-Edu × OpenMAIC 整合模块 - 安装指南

## 快速开始

### 前置要求

- Node.js >= 18
- 已克隆 OpenMAIC 项目

### 1. 安装依赖

```bash
cd openmaic-integration
npm install
```

### 2. 初始化数据库

```bash
# 生成 Prisma Client 并创建数据库
npm run setup
```

数据库文件将创建在 `prisma/dev.db`（SQLite）。

### 3. 填充测试数据

```bash
npm run db:seed
```

这将创建以下测试账户：

| 角色 | 邮箱 | 密码 | 积分 |
|------|------|------|------|
| 管理员 | admin@copaw.edu | admin123 | 99999 |
| 学生 | student@test.com | test123 | 200 |
| 教师 | teacher@test.com | test123 | 3000 |

### 4. 运行集成测试

```bash
npm test
```

### 5. 集成到 OpenMAIC

将本模块的文件复制到 OpenMAIC 项目中：

```bash
# 在 OpenMAIC 项目根目录执行
cp -r openmaic-integration/app/* app/
cp -r openmaic-integration/components/* components/
cp -r openmaic-integration/lib/* lib/
cp -r openmaic-integration/prisma/* prisma/
cp openmaic-integration/prisma.config.ts prisma.config.ts

# 安装新增依赖
npm install @prisma/client bcryptjs zustand
npm install -D prisma @types/bcryptjs

# 初始化数据库
npx prisma generate
npx prisma db push
```

或者直接应用补丁文件：

```bash
git apply openmaic-integration/openmaic-changes.patch
git apply openmaic-integration/openmaic-changes-phase2.patch
```

### 6. 环境变量（可选）

```env
# .env
DATABASE_URL="file:./prisma/dev.db"
ENCRYPTION_KEY="your-32-byte-hex-key"   # 用于 API Key 加密
PAYMENT_MODE="development"               # development | production
```

## 模块结构

```
openmaic-integration/
├── app/                    # Next.js 页面和 API 路由
│   ├── account/            # 用户账户页面
│   ├── admin/              # 管理后台页面
│   ├── pricing/            # 订阅定价页面
│   └── api/
│       ├── auth/           # 认证 API
│       ├── credits/        # 积分 API
│       ├── subscription/   # 订阅 API
│       ├── payment/        # 支付 API
│       ├── skills/         # 技能 API
│       ├── learning/       # 学习数据 API
│       └── admin/          # 管理 API
├── components/             # React 组件
│   ├── auth/               # 认证组件
│   ├── credits/            # 积分组件
│   ├── subscription/       # 订阅组件
│   ├── payment/            # 支付组件
│   ├── admin/              # 管理组件
│   └── skills/             # 技能选择器
├── lib/
│   ├── middleware/          # 积分扣费中间件
│   ├── server/             # 后端服务
│   ├── skills/copaw/       # 15个 CoPaw 技能定义
│   └── store/              # Zustand 状态管理
├── prisma/                 # 数据库 Schema 和迁移
└── scripts/                # 工具脚本
```

## 功能清单

### 已实现

- [x] 用户注册/登录（邮箱+密码）
- [x] 新用户 200 积分赠送
- [x] 积分消耗（10种操作类型）
- [x] 积分流水记录
- [x] 积分包购买（100/500/2000）
- [x] 3档订阅方案（学生/教师/专业）
- [x] 月付/年付切换
- [x] 订阅取消
- [x] 订阅续费逻辑
- [x] 15个 CoPaw 学习技能（6学生+4家长+5教师）
- [x] 技能选择器 UI
- [x] 错题本管理
- [x] 记忆库（艾宾浩斯）
- [x] 学习进度追踪
- [x] 后端提供商配置（CRUD + AES-256 加密）
- [x] 模型管理
- [x] 连接测试
- [x] 管理后台（提供商/模型/默认设置）
- [x] 用户账户页面
- [x] 积分不足提示
- [x] 升级引导
- [x] 支付对话框（预留微信/支付宝/Stripe 接口）
- [x] 积分扣费中间件

### 待生产环境对接

- [ ] 支付网关集成（微信支付/支付宝/Stripe）
- [ ] 定时任务（订阅续费 cron job）
- [ ] 邮件通知（到期提醒、支付确认）
- [ ] 更多安全加固（Rate limiting、CSRF）

## 数据库管理

```bash
# 查看数据库 UI
npm run db:studio

# 重新生成数据库
npm run db:push

# 创建新迁移
npm run db:migrate
```
