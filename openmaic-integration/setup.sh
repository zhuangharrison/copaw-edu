#!/bin/bash
# ============================================
# CoPaw-Edu × OpenMAIC 一键安装启动脚本
# ============================================
set -e

echo "=========================================="
echo "  CoPaw-Edu × OpenMAIC 一键安装"
echo "=========================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js >= 18"
    echo "   下载地址：https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低（当前 $(node -v)），需要 >= 18"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# 获取脚本所在目录（即 openmaic-integration 目录）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INTEGRATION_DIR="$SCRIPT_DIR"

# 创建 Next.js 宿主项目
APP_DIR="$SCRIPT_DIR/../copaw-app"

if [ -d "$APP_DIR" ]; then
    echo "⚠️  目录 copaw-app 已存在，将更新文件..."
else
    echo ""
    echo "📦 步骤 1/6：创建 Next.js 项目..."
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"

    # 手动创建而非 create-next-app（避免交互式提问）
    cat > package.json << 'PACKAGE_EOF'
{
  "name": "copaw-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:seed": "npx tsx scripts/seed.ts",
    "db:studio": "npx prisma studio",
    "db:push": "npx prisma generate && npx prisma db push"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^6.5.0",
    "bcryptjs": "^2.4.3",
    "zustand": "^5.0.0",
    "pptxgenjs": "^3.12.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^6.5.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
PACKAGE_EOF

    cat > tsconfig.json << 'TS_EOF'
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
TS_EOF

    cat > next.config.js << 'NEXT_EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
};
module.exports = nextConfig;
NEXT_EOF

    # 创建首页
    mkdir -p app
    cat > app/layout.tsx << 'LAYOUT_EOF'
export const metadata = {
  title: 'CoPaw-Edu × OpenMAIC',
  description: '智能教育平台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
LAYOUT_EOF

    cat > app/page.tsx << 'HOME_EOF'
import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ maxWidth: 800, margin: '60px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>CoPaw-Edu × OpenMAIC</h1>
      <p style={{ color: '#6b7280', marginBottom: 40 }}>智能教育平台 - 一键生成多智能体互动课堂</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <NavCard href="/classroom" icon="🎓" title="智能课堂" desc="一键生成课堂，4种场景类型，多智能体互动" />
        <NavCard href="/copaw" icon="🐾" title="CoPaw 教学" desc="AI 教学助手，15种学习技能" />
        <NavCard href="/copaw/setup" icon="📝" title="个人档案" desc="设置学习档案，获得个性化教学" />
        <NavCard href="/account" icon="👤" title="我的账户" desc="积分余额、订阅管理" />
        <NavCard href="/admin" icon="⚙️" title="管理后台" desc="模型配置、提供商管理（需管理员）" />
        <NavCard href="/pricing" icon="💰" title="订阅方案" desc="查看订阅计划和定价" />
      </div>

      <div style={{ marginTop: 40, padding: 20, backgroundColor: '#f9fafb', borderRadius: 12 }}>
        <h3 style={{ margin: '0 0 12px' }}>测试账户</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>角色</th>
              <th style={{ textAlign: 'left', padding: 8 }}>邮箱</th>
              <th style={{ textAlign: 'left', padding: 8 }}>密码</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: 8 }}>管理员</td><td style={{ padding: 8 }}>admin@copaw.edu</td><td style={{ padding: 8 }}>admin123</td></tr>
            <tr><td style={{ padding: 8 }}>学生</td><td style={{ padding: 8 }}>student@test.com</td><td style={{ padding: 8 }}>test123</td></tr>
            <tr><td style={{ padding: 8 }}>教师</td><td style={{ padding: 8 }}>teacher@test.com</td><td style={{ padding: 8 }}>test123</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NavCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} style={{
      display: 'block', padding: 20, borderRadius: 12,
      border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{desc}</div>
    </Link>
  );
}
HOME_EOF
fi

cd "$APP_DIR"

echo ""
echo "📁 步骤 2/6：复制模块文件..."

# 复制所有模块文件
cp -r "$INTEGRATION_DIR/app/"* app/ 2>/dev/null || true
mkdir -p components && cp -r "$INTEGRATION_DIR/components/"* components/ 2>/dev/null || true
mkdir -p lib && cp -r "$INTEGRATION_DIR/lib/"* lib/ 2>/dev/null || true
mkdir -p prisma && cp -r "$INTEGRATION_DIR/prisma/"* prisma/ 2>/dev/null || true
mkdir -p scripts && cp -r "$INTEGRATION_DIR/scripts/"* scripts/ 2>/dev/null || true

# 复制 prisma.config.ts（如果存在）
if [ -f "$INTEGRATION_DIR/prisma.config.ts" ]; then
    cp "$INTEGRATION_DIR/prisma.config.ts" .
fi

echo "✅ 文件复制完成"

echo ""
echo "📦 步骤 3/6：安装依赖..."
npm install

echo ""
echo "🗄️  步骤 4/6：初始化数据库..."
npx prisma generate
npx prisma db push

echo ""
echo "🌱 步骤 5/6：填充测试数据..."
npx tsx scripts/seed.ts 2>/dev/null || echo "⚠️  seed 脚本跳过（可稍后手动运行 npm run db:seed）"

echo ""
echo "📝 步骤 6/6：创建环境变量..."
if [ ! -f .env ]; then
    cat > .env << 'ENV_EOF'
DATABASE_URL="file:./prisma/dev.db"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"
PAYMENT_MODE="development"

# LLM 配置 - 请替换为你的 API Key
# 支持 OpenAI / DeepSeek / 通义千问等兼容接口
LLM_API_BASE="https://api.openai.com/v1"
LLM_API_KEY="sk-your-api-key-here"
LLM_MODEL="gpt-4o"

# TTS 语音合成（可选）
TTS_API_BASE="https://api.openai.com/v1"
TTS_API_KEY=""
TTS_MODEL="tts-1"
ENV_EOF
    echo "✅ .env 已创建，请编辑填入你的 API Key"
else
    echo "✅ .env 已存在，跳过"
fi

echo ""
echo "=========================================="
echo "  ✅ 安装完成！"
echo "=========================================="
echo ""
echo "  📌 重要：请先编辑 .env 文件填入 LLM API Key"
echo "     cd $(basename "$APP_DIR")"
echo "     编辑 .env 文件中的 LLM_API_KEY"
echo ""
echo "  🚀 启动命令："
echo "     cd $(basename "$APP_DIR")"
echo "     npm run dev"
echo ""
echo "  🌐 访问地址（启动后）："
echo "     首页：      http://localhost:3000"
echo "     智能课堂：  http://localhost:3000/classroom"
echo "     CoPaw教学： http://localhost:3000/copaw"
echo "     管理后台：  http://localhost:3000/admin"
echo "     用户账户：  http://localhost:3000/account"
echo ""
echo "  👤 测试账户："
echo "     管理员：admin@copaw.edu / admin123"
echo "     学生：  student@test.com / test123"
echo "     教师：  teacher@test.com / test123"
echo ""
