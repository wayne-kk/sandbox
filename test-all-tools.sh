#!/bin/bash

# 测试所有网络诊断工具
# 用于验证所有工具是否正常工作

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 测试所有网络诊断工具...${NC}"

# 检查脚本文件是否存在
scripts=(
    "deploy.sh"
    "diagnose-network.sh"
    "fix-network-issues.sh"
    "test-container-network.sh"
    "generate-nginx-config.sh"
    "update-external-nginx.sh"
)

echo -e "${YELLOW}📋 检查脚本文件...${NC}"
for script in "${scripts[@]}"; do
    if [[ -f "$script" ]]; then
        if [[ -x "$script" ]]; then
            echo -e "${GREEN}   ✅ $script (可执行)${NC}"
        else
            echo -e "${YELLOW}   ⚠️  $script (不可执行)${NC}"
            chmod +x "$script"
            echo -e "${GREEN}   ✅ $script (已添加执行权限)${NC}"
        fi
    else
        echo -e "${RED}   ❌ $script (不存在)${NC}"
    fi
done

# 检查 API 文件
echo -e "${YELLOW}📋 检查 API 文件...${NC}"
api_files=(
    "src/app/api/network-test/route.ts"
    "src/lib/ai/dify-client.ts"
)

for api_file in "${api_files[@]}"; do
    if [[ -f "$api_file" ]]; then
        echo -e "${GREEN}   ✅ $api_file${NC}"
    else
        echo -e "${RED}   ❌ $api_file (不存在)${NC}"
    fi
done

# 检查配置文件
echo -e "${YELLOW}📋 检查配置文件...${NC}"
config_files=(
    "docker-compose.yml"
    "Dockerfile"
    "nginx.conf"
    "nginx-external-config.conf"
)

for config_file in "${config_files[@]}"; do
    if [[ -f "$config_file" ]]; then
        echo -e "${GREEN}   ✅ $config_file${NC}"
    else
        echo -e "${RED}   ❌ $config_file (不存在)${NC}"
    fi
done

# 检查文档文件
echo -e "${YELLOW}📋 检查文档文件...${NC}"
doc_files=(
    "NETWORK-TROUBLESHOOTING.md"
)

for doc_file in "${doc_files[@]}"; do
    if [[ -f "$doc_file" ]]; then
        echo -e "${GREEN}   ✅ $doc_file${NC}"
    else
        echo -e "${RED}   ❌ $doc_file (不存在)${NC}"
    fi
done

# 测试基本功能
echo -e "${YELLOW}📋 测试基本功能...${NC}"

# 测试网络诊断脚本
echo -e "${BLUE}   测试网络诊断脚本...${NC}"
if ./diagnose-network.sh > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ diagnose-network.sh 运行正常${NC}"
else
    echo -e "${RED}   ❌ diagnose-network.sh 运行失败${NC}"
fi

# 测试网络修复脚本
echo -e "${BLUE}   测试网络修复脚本...${NC}"
if ./fix-network-issues.sh > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ fix-network-issues.sh 运行正常${NC}"
else
    echo -e "${RED}   ❌ fix-network-issues.sh 运行失败${NC}"
fi

# 测试部署脚本帮助
echo -e "${BLUE}   测试部署脚本帮助...${NC}"
if ./deploy.sh --help > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ deploy.sh 帮助功能正常${NC}"
else
    echo -e "${RED}   ❌ deploy.sh 帮助功能失败${NC}"
fi

# 检查 Docker 环境
echo -e "${YELLOW}📋 检查 Docker 环境...${NC}"
if command -v docker > /dev/null; then
    echo -e "${GREEN}   ✅ Docker 已安装${NC}"
    if docker --version > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Docker 运行正常${NC}"
    else
        echo -e "${RED}   ❌ Docker 运行异常${NC}"
    fi
else
    echo -e "${RED}   ❌ Docker 未安装${NC}"
fi

if command -v docker-compose > /dev/null || command -v docker > /dev/null && docker compose version > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Docker Compose 可用${NC}"
else
    echo -e "${RED}   ❌ Docker Compose 不可用${NC}"
fi

# 检查网络工具
echo -e "${YELLOW}📋 检查网络工具...${NC}"
network_tools=("curl" "ping" "nslookup" "ip" "ufw")
for tool in "${network_tools[@]}"; do
    if command -v "$tool" > /dev/null; then
        echo -e "${GREEN}   ✅ $tool 可用${NC}"
    else
        echo -e "${YELLOW}   ⚠️  $tool 不可用${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ 所有工具测试完成${NC}"
echo -e "${YELLOW}💡 如果发现问题，请检查文件权限和依赖项${NC}"
echo -e "${YELLOW}💡 运行 ./deploy.sh --dev 开始开发模式部署${NC}"
