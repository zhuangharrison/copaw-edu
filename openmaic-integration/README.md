# CoPaw-Edu × OpenMAIC 整合模块

完整的教育平台整合方案，包含 15 个 CoPaw 学习技能、积分订阅系统、后端模型管理。

## 快速开始

```bash
cd openmaic-integration
npm install
npm run setup      # 初始化数据库
npm run db:seed    # 填充测试数据
npm test           # 运行集成测试
```

详细安装说明请参阅 [INSTALL.md](./INSTALL.md)。

## 模块概览

### Phase 1: 用户认证 + 积分系统
- 邮箱密码注册/登录
- 新用户 200 积分赠送
- 10 种操作积分消耗
- 积分流水记录

### Phase 2: 后端模型配置
- 提供商 CRUD 管理（支持 10+ 提供商）
- API Key AES-256 加密存储
- 模型启用/禁用管理
- 连接测试
- 默认配置管理

### Phase 3: CoPaw 学习技能
- **学生技能 (6)**：记忆系统、知识理解、错题管理、考前冲刺、多模态生成、AI提示库
- **家长技能 (4)**：进度报告、学情简报、资源推荐、时间管理
- **教师技能 (5)**：教案生成、试卷生成、学情分析、批改辅助、家校沟通
- 学习数据持久化（错题本、记忆库、进度追踪）

### Phase 4: 订阅与支付
- 3 档订阅（学生¥29/教师¥59/专业¥99 每月）
- 月付/年付（年付8折 + 额外积分）
- 积分包购买（100/500/2000）
- 支付接口预留（微信/支付宝/Stripe）
- 订阅管理（激活/取消/续费）

## 积分消耗规则

| 操作 | 积分 |
|------|------|
| 基础课堂（≤5场景） | 50 |
| 标准课堂（≤10场景） | 100 |
| 高级课堂（≤20场景） | 200 |
| AI讨论（每轮） | 2 |
| TTS语音（每分钟） | 5 |
| 图片生成（每张） | 10 |
| 视频生成（每段） | 30 |
| PDF解析（每份） | 10 |
| CoPaw技能（每次） | 5 |
| 导出PPTX | 5 |

## 测试账户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@copaw.edu | admin123 |
| 学生 | student@test.com | test123 |
| 教师 | teacher@test.com | test123 |

## API 端点

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册 |
| `/api/auth/login` | POST | 登录 |
| `/api/auth/logout` | POST | 登出 |
| `/api/auth/session` | GET | 当前会话 |
| `/api/credits` | GET | 积分余额 |
| `/api/credits/history` | GET | 积分流水 |
| `/api/subscription` | GET/POST | 订阅管理 |
| `/api/subscription/plans` | GET | 订阅方案 |
| `/api/subscription/cancel` | POST | 取消订阅 |
| `/api/payment/create` | POST | 创建支付 |
| `/api/payment/webhook` | POST | 支付回调 |
| `/api/skills` | GET | 技能列表 |
| `/api/learning/mistakes` | GET/POST | 错题管理 |
| `/api/learning/memories` | GET/POST | 记忆管理 |
| `/api/learning/progress` | GET/POST | 学习进度 |
| `/api/admin/providers` | GET/POST | 提供商管理 |
| `/api/admin/defaults` | GET/PUT | 默认配置 |
| `/api/admin/test-connection` | POST | 连接测试 |

## 页面路由

| 路径 | 说明 |
|------|------|
| `/pricing` | 订阅方案定价页 |
| `/account` | 用户账户管理 |
| `/admin` | 管理后台 |
