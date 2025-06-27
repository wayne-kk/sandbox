#!/bin/bash

echo "🔧 开始设置 Prisma + Supabase 环境..."

# 检查环境文件
if [ ! -f .env ]; then
    echo "⚠️  请先复制 .env.example 到 .env 并配置数据库连接"
    echo "cp .env.example .env"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 生成 Prisma 客户端
echo "🔄 生成 Prisma 客户端..."
npx prisma generate

# 推送数据库结构
echo "🗄️  推送数据库结构到 Supabase..."
npx prisma db push

# 填充初始数据
echo "🌱 填充初始数据..."
npm run db:seed

echo "✅ Prisma 设置完成！"
echo ""
echo "📊 可用命令："
echo "  npm run db:studio     - 打开 Prisma Studio"
echo "  npm run db:seed       - 重新填充数据"
echo "  npm run db:push       - 推送结构变更"
echo "  npm run dev           - 启动开发服务器"
echo ""
echo "🚀 现在可以运行 'npm run dev' 启动项目了！" 