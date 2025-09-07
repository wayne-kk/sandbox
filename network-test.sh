#!/bin/bash

echo "🔍 网络连接诊断..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试网络连接
echo -e "${YELLOW}📡 测试网络连接...${NC}"

# 测试基本网络
if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 基本网络连接正常${NC}"
else
    echo -e "${RED}❌ 基本网络连接失败${NC}"
fi

# 测试 DNS 解析
if nslookup docker.io > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS 解析正常${NC}"
else
    echo -e "${RED}❌ DNS 解析失败${NC}"
fi

# 测试 Docker Hub 连接
echo -e "${YELLOW}🐳 测试 Docker Hub 连接...${NC}"
if curl -s --connect-timeout 10 https://registry-1.docker.io/v2/ > /dev/null; then
    echo -e "${GREEN}✅ Docker Hub 连接正常${NC}"
else
    echo -e "${RED}❌ Docker Hub 连接失败${NC}"
fi

# 测试国内镜像源
echo -e "${YELLOW}🇨🇳 测试国内镜像源...${NC}"
MIRRORS=(
    "https://docker.mirrors.ustc.edu.cn"
    "https://hub-mirror.c.163.com"
    "https://mirror.baidubce.com"
    "https://ccr.ccs.tencentyun.com"
)

for mirror in "${MIRRORS[@]}"; do
    if curl -s --connect-timeout 5 "$mirror" > /dev/null; then
        echo -e "${GREEN}✅ $mirror 连接正常${NC}"
    else
        echo -e "${RED}❌ $mirror 连接失败${NC}"
    fi
done

# 检查 Docker 配置
echo -e "${YELLOW}🔧 检查 Docker 配置...${NC}"
if [ -f /etc/docker/daemon.json ]; then
    echo -e "${GREEN}✅ Docker 配置文件存在${NC}"
    echo -e "${YELLOW}📋 当前配置:${NC}"
    cat /etc/docker/daemon.json
else
    echo -e "${RED}❌ Docker 配置文件不存在${NC}"
fi

# 检查 Docker 服务状态
echo -e "${YELLOW}🐳 检查 Docker 服务状态...${NC}"
if systemctl is-active docker > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker 服务运行正常${NC}"
else
    echo -e "${RED}❌ Docker 服务未运行${NC}"
fi

echo -e "${YELLOW}💡 建议:${NC}"
echo -e "${YELLOW}   1. 如果网络连接失败，请检查防火墙设置${NC}"
echo -e "${YELLOW}   2. 如果 DNS 解析失败，请更换 DNS 服务器${NC}"
echo -e "${YELLOW}   3. 如果所有镜像源都失败，请尝试使用 VPN 或代理${NC}"
echo -e "${YELLOW}   4. 可以尝试手动拉取镜像: docker pull redis:7-alpine${NC}"
