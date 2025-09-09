#!/bin/bash

echo "🔍 V0 Sandbox Chunked Encoding 问题诊断脚本..."
echo "============================================="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. 检查 Docker 容器状态${NC}"
echo "================================"
docker compose ps

echo ""
echo -e "${BLUE}2. 检查容器健康状态${NC}"
echo "================================"
docker compose exec app curl -f http://localhost:3000/api/health 2>/dev/null && echo -e "${GREEN}✅ 应用健康检查通过${NC}" || echo -e "${RED}❌ 应用健康检查失败${NC}"

echo ""
echo -e "${BLUE}3. 检查端口监听${NC}"
echo "================================"
echo "检查端口 3000:"
netstat -tlnp 2>/dev/null | grep :3000 || ss -tlnp 2>/dev/null | grep :3000 || echo -e "${RED}❌ 端口 3000 未监听${NC}"

echo "检查端口 8080:"
netstat -tlnp 2>/dev/null | grep :8080 || ss -tlnp 2>/dev/null | grep :8080 || echo -e "${RED}❌ 端口 8080 未监听${NC}"

echo ""
echo -e "${BLUE}4. 测试本地访问${NC}"
echo "================================"
echo "测试应用直接访问:"
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 应用直接访问正常${NC}"
else
    echo -e "${RED}❌ 应用直接访问失败${NC}"
fi

echo "测试Nginx代理访问:"
if curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx代理访问正常${NC}"
else
    echo -e "${RED}❌ Nginx代理访问失败${NC}"
fi

echo ""
echo -e "${BLUE}5. 检查应用日志${NC}"
echo "================================"
echo "最近的应用日志:"
docker compose logs app --tail 20

echo ""
echo -e "${BLUE}6. 检查Nginx日志${NC}"
echo "================================"
echo "最近的Nginx日志:"
docker compose logs nginx --tail 20

echo ""
echo -e "${BLUE}7. 检查网络连接${NC}"
echo "================================"
echo "测试容器间网络连接:"
docker compose exec nginx curl -f http://app:3000 >/dev/null 2>&1 && echo -e "${GREEN}✅ Nginx到应用连接正常${NC}" || echo -e "${RED}❌ Nginx到应用连接失败${NC}"

echo ""
echo -e "${BLUE}8. 检查环境变量${NC}"
echo "================================"
echo "关键环境变量:"
docker compose exec app env | grep -E "(NODE_ENV|PORT|HOSTNAME)" || echo "环境变量检查完成"

echo ""
echo -e "${BLUE}9. 检查文件权限${NC}"
echo "================================"
echo "检查关键文件:"
ls -la nginx.conf docker-compose.yml Dockerfile 2>/dev/null || echo "文件检查完成"

echo ""
echo -e "${BLUE}10. 建议的修复步骤${NC}"
echo "================================"
echo -e "${YELLOW}如果发现问题，请按以下步骤修复:${NC}"
echo -e "${YELLOW}1. 运行: ./deploy-fixed-chunked.sh${NC}"
echo -e "${YELLOW}2. 检查防火墙设置${NC}"
echo -e "${YELLOW}3. 检查云服务商安全组设置${NC}"
echo -e "${YELLOW}4. 检查域名解析${NC}"

echo ""
echo -e "${GREEN}🎉 诊断完成！${NC}"
