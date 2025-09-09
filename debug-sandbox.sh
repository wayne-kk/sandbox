#!/bin/bash

echo "🔍 Sandbox 诊断脚本"
echo "=================="

# 检查容器状态
echo "1. 检查容器状态:"
docker compose ps

echo ""
echo "2. 检查 sandbox 目录:"
docker compose exec app ls -la /app/sandbox/

echo ""
echo "3. 检查 package.json:"
docker compose exec app cat /app/sandbox/package.json

echo ""
echo "4. 检查端口使用情况:"
docker compose exec app netstat -tlnp | grep :3100 || echo "端口 3100 未使用"

echo ""
echo "5. 测试手动启动 sandbox:"
echo "尝试在容器内启动 sandbox..."
docker compose exec app bash -c "cd /app/sandbox && npm run dev &" &
sleep 5

echo ""
echo "6. 检查 sandbox 进程:"
docker compose exec app ps aux | grep "next dev" || echo "没有找到 next dev 进程"

echo ""
echo "7. 检查 API 调用:"
curl -X POST http://localhost:3000/api/sandbox/start 2>/dev/null || echo "API 调用失败"

echo ""
echo "诊断完成！"
