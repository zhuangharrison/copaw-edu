@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo   CoPaw-Edu × OpenMAIC 一键安装 (Windows)
echo ==========================================
echo.

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%a in ('node -v') do set NODE_RAW=%%a
echo [OK] Node.js 已安装

:: 获取当前脚本目录
set "INTEGRATION_DIR=%~dp0"
set "INTEGRATION_DIR=%INTEGRATION_DIR:~0,-1%"
set "APP_DIR=%INTEGRATION_DIR%\..\copaw-app"

:: 创建 Next.js 项目目录
if exist "%APP_DIR%" (
    echo [提示] copaw-app 目录已存在，将更新文件...
) else (
    echo.
    echo [1/6] 创建 Next.js 项目...
    mkdir "%APP_DIR%"
)

cd /d "%APP_DIR%"

:: 写 package.json
echo [1/6] 写入 package.json...
(
echo {
echo   "name": "copaw-app",
echo   "version": "1.0.0",
echo   "private": true,
echo   "scripts": {
echo     "dev": "next dev",
echo     "build": "next build",
echo     "start": "next start",
echo     "db:seed": "npx tsx scripts/seed.ts",
echo     "db:studio": "npx prisma studio",
echo     "db:push": "npx prisma generate && npx prisma db push"
echo   },
echo   "dependencies": {
echo     "next": "^14.2.0",
echo     "react": "^18.3.0",
echo     "react-dom": "^18.3.0",
echo     "@prisma/client": "^6.5.0",
echo     "bcryptjs": "^2.4.3",
echo     "zustand": "^5.0.0",
echo     "pptxgenjs": "^3.12.0",
echo     "lucide-react": "^0.460.0"
echo   },
echo   "devDependencies": {
echo     "@types/node": "^22.0.0",
echo     "@types/react": "^18.3.0",
echo     "@types/react-dom": "^18.3.0",
echo     "@types/bcryptjs": "^2.4.6",
echo     "prisma": "^6.5.0",
echo     "tsx": "^4.19.0",
echo     "typescript": "^5.7.0"
echo   }
echo }
) > package.json

:: 写 tsconfig.json
(
echo {
echo   "compilerOptions": {
echo     "target": "ES2017",
echo     "lib": ["dom", "dom.iterable", "esnext"],
echo     "allowJs": true,
echo     "skipLibCheck": true,
echo     "strict": true,
echo     "noEmit": true,
echo     "esModuleInterop": true,
echo     "module": "esnext",
echo     "moduleResolution": "bundler",
echo     "resolveJsonModule": true,
echo     "isolatedModules": true,
echo     "jsx": "preserve",
echo     "incremental": true,
echo     "plugins": [{ "name": "next" }],
echo     "paths": { "@/*": ["./*"] }
echo   },
echo   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
echo   "exclude": ["node_modules"]
echo }
) > tsconfig.json

:: 写 next.config.js
(
echo /** @type {import('next'^).NextConfig} */
echo const nextConfig = {};
echo module.exports = nextConfig;
) > next.config.js

:: 创建 app/layout.tsx
if not exist "app" mkdir app
(
echo export const metadata = {
echo   title: 'CoPaw-Edu x OpenMAIC',
echo   description: '智能教育平台',
echo };
echo.
echo export default function RootLayout({ children }: { children: React.ReactNode }^) {
echo   return (
echo     ^<html lang="zh-CN"^>
echo       ^<body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}^>
echo         {children}
echo       ^</body^>
echo     ^</html^>
echo   ^);
echo }
) > app\layout.tsx

echo [OK] 项目框架创建完成

:: 复制模块文件
echo.
echo [2/6] 复制模块文件...
xcopy "%INTEGRATION_DIR%\app" "%APP_DIR%\app" /E /I /Y /Q >nul 2>nul
xcopy "%INTEGRATION_DIR%\components" "%APP_DIR%\components" /E /I /Y /Q >nul 2>nul
xcopy "%INTEGRATION_DIR%\lib" "%APP_DIR%\lib" /E /I /Y /Q >nul 2>nul
xcopy "%INTEGRATION_DIR%\prisma" "%APP_DIR%\prisma" /E /I /Y /Q >nul 2>nul
xcopy "%INTEGRATION_DIR%\scripts" "%APP_DIR%\scripts" /E /I /Y /Q >nul 2>nul
if exist "%INTEGRATION_DIR%\prisma.config.ts" copy "%INTEGRATION_DIR%\prisma.config.ts" "%APP_DIR%\" /Y >nul
echo [OK] 文件复制完成

:: 安装依赖
echo.
echo [3/6] 安装依赖（npm install）...
call npm install
if %errorlevel% neq 0 (
    echo [错误] npm install 失败
    pause
    exit /b 1
)
echo [OK] 依赖安装完成

:: 初始化数据库
echo.
echo [4/6] 初始化数据库...
call npx prisma generate
call npx prisma db push
echo [OK] 数据库初始化完成

:: 填充测试数据
echo.
echo [5/6] 填充测试数据...
call npx tsx scripts/seed.ts 2>nul
if %errorlevel% neq 0 (
    echo [提示] seed 跳过，可稍后运行: npm run db:seed
) else (
    echo [OK] 测试数据填充完成
)

:: 创建 .env
echo.
echo [6/6] 创建环境变量...
if not exist ".env" (
    (
echo DATABASE_URL="file:./prisma/dev.db"
echo ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"
echo PAYMENT_MODE="development"
echo.
echo # LLM 配置 - 请替换为你的 API Key
echo # 支持 OpenAI / DeepSeek / 通义千问等兼容接口
echo LLM_API_BASE="https://api.openai.com/v1"
echo LLM_API_KEY="sk-your-api-key-here"
echo LLM_MODEL="gpt-4o"
echo.
echo # TTS 语音合成（可选）
echo TTS_API_BASE="https://api.openai.com/v1"
echo TTS_API_KEY=""
echo TTS_MODEL="tts-1"
    ) > .env
    echo [OK] .env 已创建
) else (
    echo [OK] .env 已存在，跳过
)

echo.
echo ==========================================
echo   安装完成！
echo ==========================================
echo.
echo   重要：请先编辑 .env 文件填入 LLM API Key
echo.
echo   操作步骤：
echo     1. 用记事本打开 copaw-app\.env
echo     2. 把 LLM_API_KEY="sk-your-api-key-here" 改成你的 key
echo     3. 保存
echo.
echo   启动命令：
echo     cd copaw-app
echo     npm run dev
echo.
echo   浏览器访问：
echo     首页：       http://localhost:3000
echo     智能课堂：   http://localhost:3000/classroom
echo     CoPaw教学：  http://localhost:3000/copaw
echo     管理后台：   http://localhost:3000/admin
echo     用户账户：   http://localhost:3000/account
echo.
echo   测试账户：
echo     管理员：admin@copaw.edu / admin123
echo     学生：  student@test.com / test123
echo     教师：  teacher@test.com / test123
echo.
pause
