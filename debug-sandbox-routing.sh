#!/bin/bash

echo "=== Sandbox 路由调试脚本 ==="
echo

echo "1. 检查容器状态："
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "2. 测试主应用调试端点："
echo "访问 https://wayne.beer:8443/debug"
curl -k -s --max-time 5 https://wayne.beer:8443/debug || echo "主应用调试端点访问失败"

echo
echo "3. 测试sandbox调试端点："
echo "访问 https://sandbox.wayne.beer:8443/debug"
curl -k -s --max-time 5 https://sandbox.wayne.beer:8443/debug || echo "Sandbox调试端点访问失败"

echo
echo "4. 测试本地端口连接："
echo "测试主应用端口3000："
curl -s --max-time 5 http://localhost:3000/ | head -5 || echo "主应用端口3000连接失败"

echo
echo "测试sandbox端口3100："
curl -s --max-time 5 http://localhost:3100/ | head -5 || echo "Sandbox端口3100连接失败"

echo
echo "5. 检查nginx容器到sandbox容器的连接："
echo "从nginx容器测试sandbox:3100："
docker exec v0-sandbox-nginx wget -qO- --timeout=5 http://sandbox:3100/ | head -5 || echo "nginx到sandbox连接失败"

echo
echo "6. 检查nginx配置语法："
docker exec v0-sandbox-nginx nginx -t

echo
echo "7. 检查sandbox容器日志（最近10行）："
docker logs --tail 10 v0-sandbox-preview

echo
echo "8. 检查nginx容器日志（最近10行）："
docker logs --tail 10 v0-sandbox-nginx

echo
echo "9. 检查nginx访问日志："
docker exec v0-sandbox-nginx tail -5 /var/log/nginx/access.log 2>/dev/null || echo "无法访问nginx访问日志"

echo
echo "10. 检查nginx错误日志："
docker exec v0-sandbox-nginx tail -5 /var/log/nginx/error.log 2>/dev/null || echo "无法访问nginx错误日志"

echo
echo "=== 调试完成 ==="
