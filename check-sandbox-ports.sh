#!/bin/bash

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 检查当前运行的Sandbox端口...${NC}"
echo ""

# 检查端口范围 3100-3199
running_ports=()
for port in {3100..3199}; do
    if netstat -tlnp 2>/dev/null | grep -q ":$port" || ss -tlnp 2>/dev/null | grep -q ":$port"; then
        running_ports+=($port)
    fi
done

if [ ${#running_ports[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  没有发现运行中的Sandbox项目${NC}"
    echo -e "${YELLOW}💡 端口范围: 3100-3199${NC}"
else
    echo -e "${GREEN}✅ 发现 ${#running_ports[@]} 个运行中的Sandbox项目:${NC}"
    for port in "${running_ports[@]}"; do
        echo -e "${GREEN}   🌐 直接访问: http://localhost:$port${NC}"
        echo -e "${GREEN}   🌐 直接访问: http://115.190.100.24:$port${NC}"
        echo -e "${BLUE}   🌐 Nginx代理: http://localhost:8080/sandbox${NC}"
        echo -e "${BLUE}   🌐 Nginx代理: http://115.190.100.24:8080/sandbox${NC}"
        echo ""
    done
fi

echo -e "${BLUE}📋 端口使用情况:${NC}"
echo -e "${YELLOW}   主应用: http://localhost:3000 或 http://115.190.100.24:3000${NC}"
echo -e "${YELLOW}   Nginx: http://localhost:8080 或 http://115.190.100.24:8080${NC}"
echo -e "${BLUE}   Sandbox (推荐): http://localhost:8080/sandbox 或 http://115.190.100.24:8080/sandbox${NC}"
echo -e "${YELLOW}   Sandbox直接访问: 3100-3199 (不推荐)${NC}"

# 检查Docker容器状态
echo ""
echo -e "${BLUE}🐳 Docker容器状态:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(v0-sandbox|NAMES)"
