#!/bin/bash

echo "🔍 诊断500错误和网络问题..."
echo "=================================="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. 检查容器状态${NC}"
echo "--------------------------------"
docker compose ps

echo ""
echo -e "${BLUE}2. 检查应用容器日志（最后20行）${NC}"
echo "--------------------------------"
docker compose logs app --tail 20

echo ""
echo -e "${BLUE}3. 检查Nginx容器日志（最后10行）${NC}"
echo "--------------------------------"
docker compose logs nginx --tail 10

echo ""
echo -e "${BLUE}4. 测试本地服务连通性${NC}"
echo "--------------------------------"
echo "测试localhost:3000:"
if curl -f -s --connect-timeout 5 http://localhost:3000 >/dev/null; then
    echo -e "${GREEN}✅ localhost:3000 可访问${NC}"
else
    echo -e "${RED}❌ localhost:3000 不可访问${NC}"
    echo "详细错误:"
    curl -v http://localhost:3000 2>&1 | head -10
fi

echo ""
echo "测试localhost:8080:"
if curl -f -s --connect-timeout 5 http://localhost:8080 >/dev/null; then
    echo -e "${GREEN}✅ localhost:8080 可访问${NC}"
else
    echo -e "${RED}❌ localhost:8080 不可访问${NC}"
    echo "详细错误:"
    curl -v http://localhost:8080 2>&1 | head -10
fi

echo ""
echo -e "${BLUE}5. 检查lightningcss问题${NC}"
echo "--------------------------------"
echo "检查lightningcss安装状态:"
docker exec v0-sandbox-app npm list lightningcss 2>/dev/null || echo "lightningcss未安装或有问题"

echo ""
echo "检查tailwindcss版本:"
docker exec v0-sandbox-app npm list tailwindcss 2>/dev/null || echo "tailwindcss未安装或有问题"

echo ""
echo -e "${BLUE}6. 检查端口监听${NC}"
echo "--------------------------------"
echo "端口监听状态:"
netstat -tlnp | grep -E "(3000|8080)" || echo "未找到相关端口监听"

echo ""
echo -e "${BLUE}7. 建议的修复步骤${NC}"
echo "--------------------------------"
echo -e "${YELLOW}如果发现lightningcss问题:${NC}"
echo "docker exec v0-sandbox-app npm uninstall lightningcss @tailwindcss/postcss"
echo "docker exec v0-sandbox-app npm install tailwindcss@^3.4.0 postcss autoprefixer --save-dev"
echo "docker compose restart app"

echo ""
echo -e "${YELLOW}如果服务完全无法启动:${NC}"
echo "docker compose down"
echo "docker compose up -d"
echo "sleep 20"
echo "docker compose logs app"

echo ""
echo -e "${YELLOW}如果网络传输有问题:${NC}"
echo "检查防火墙: sudo ufw status"
echo "检查云服务器安全组设置"
echo "重启Nginx: docker compose restart nginx"
