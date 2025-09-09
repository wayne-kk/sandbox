#!/bin/bash

echo "🔍 测试 Nginx 配置"
echo "=================="

# 检查 nginx 配置语法
echo "1. 检查 nginx 配置语法..."
docker compose exec v0-sandbox-nginx nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置语法正确"
else
    echo "❌ Nginx 配置有语法错误"
    exit 1
fi

# 检查重复的 proxy_http_version
echo ""
echo "2. 检查重复的 proxy_http_version 配置..."
REPEAT_COUNT=$(docker compose exec v0-sandbox-nginx cat /etc/nginx/nginx.conf | grep -c "proxy_http_version")
echo "找到 $REPEAT_COUNT 个 proxy_http_version 配置"

# 检查每个 location 块的配置
echo ""
echo "3. 检查各 location 块的配置..."
docker compose exec v0-sandbox-nginx cat /etc/nginx/nginx.conf | grep -A 5 -B 1 "proxy_http_version"

# 重启 nginx 服务
echo ""
echo "4. 重启 nginx 服务..."
docker compose restart nginx

# 等待服务启动
sleep 5

# 检查 nginx 状态
echo ""
echo "5. 检查 nginx 服务状态..."
docker compose ps nginx

# 测试 nginx 响应
echo ""
echo "6. 测试 nginx 响应..."
curl -I http://localhost:8080/health 2>/dev/null | head -1

echo ""
echo "🎉 Nginx 配置测试完成！"
