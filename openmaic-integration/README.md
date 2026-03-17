# OpenMAIC Integration - Phase 1: 基础设施

本目录包含对 OpenMAIC 项目的改造代码，实现用户认证 + 积分系统。

## 包含的文件

### 新增文件（直接复制到 OpenMAIC 对应目录）
- `prisma/schema.prisma` - 数据库 Schema（User, Session, Subscription, CreditHistory）
- `prisma.config.ts` - Prisma 配置
- `prisma/migrations/` - 数据库迁移文件
- `lib/server/db.ts` - Prisma 客户端实例（使用 LibSQL 适配器）
- `lib/server/auth/index.ts` - 认证服务（注册/登录/会话管理）
- `lib/server/credits/index.ts` - 积分系统核心（10种操作类型、扣减/充值/流水）
- `lib/store/auth.ts` - 前端 Zustand 用户状态管理
- `app/api/auth/register/route.ts` - 注册 API
- `app/api/auth/login/route.ts` - 登录 API
- `app/api/auth/session/route.ts` - 会话查询 API
- `app/api/auth/logout/route.ts` - 登出 API
- `app/api/credits/route.ts` - 积分余额查询 + 积分检查 API
- `app/api/credits/history/route.ts` - 积分流水 API
- `components/auth/AuthDialog.tsx` - 登录/注册弹窗
- `components/auth/AuthProvider.tsx` - 认证初始化 Provider
- `components/auth/UserMenu.tsx` - 用户菜单（头像+积分+登出）
- `components/credits/CreditsBadge.tsx` - 积分余额显示组件

### 修改的文件（见 openmaic-changes.patch）
- `app/layout.tsx` - 添加 AuthProvider
- `app/page.tsx` - 添加 UserMenu 到首页导航栏
- `components/header.tsx` - 添加 UserMenu 到课堂页导航栏

### 新增依赖
```bash
pnpm add prisma @prisma/client @prisma/adapter-libsql @libsql/client next-auth@beta bcryptjs
```

## 应用步骤

1. 复制所有新增文件到 OpenMAIC 对应目录
2. 应用 patch: `cd OpenMAIC && git apply ../copaw-edu/openmaic-integration/openmaic-changes.patch`
3. 安装依赖: `pnpm install`
4. 生成 Prisma 客户端: `npx prisma generate`
5. 运行迁移: `DATABASE_URL="file:./dev.db" npx prisma migrate dev`

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

新用户注册自动赠送 **200 积分**。
