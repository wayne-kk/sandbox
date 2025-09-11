#!/bin/bash

echo "🔄 重启 Sandbox 服务器..."

# 查找并终止现有的sandbox进程
echo "🛑 停止现有的 Sandbox 进程..."
pkill -f "next dev.*3100" || echo "没有发现运行中的 Sandbox 进程"
pkill -f "pnpm.*dev" || echo "没有发现运行中的 pnpm dev 进程"

# 等待进程完全停止
sleep 2

# 进入sandbox目录
cd sandbox

# 检查端口是否被释放
if lsof -Pi :3100 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口3100仍被占用，尝试强制终止..."
    lsof -ti:3100 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 启动新的sandbox服务
echo "🚀 启动新的 Sandbox 服务器..."
pnpm run dev &

# 等待服务启动
echo "⏳ 等待服务启动（10秒）..."
sleep 10

# 检查服务是否成功启动
if lsof -Pi :3100 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Sandbox 服务器已成功启动在端口3100"
    echo "🌐 访问地址: http://localhost:3100"
    echo "🌐 访问地址: http://192.168.31.161:3100"
else
    echo "❌ Sandbox 服务器启动失败"
    echo "请手动检查："
    echo "1. cd sandbox"
    echo "2. pnpm install"
    echo "3. pnpm run dev"
fi
