#!/bin/bash

echo "🔧 修复Next.js SWC二进制文件问题..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}方案1: 安装SWC二进制文件${NC}"
echo "--------------------------------"

# 进入容器并安装SWC包
docker exec v0-sandbox-app sh -c "
    echo '安装SWC二进制文件...'
    npm install @next/swc-linux-x64-musl --save-dev
    
    echo '检查安装结果...'
    npm list @next/swc-linux-x64-musl
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SWC二进制文件安装成功${NC}"
    echo -e "${YELLOW}重启容器...${NC}"
    docker compose restart app
    sleep 10
    echo -e "${GREEN}检查服务状态...${NC}"
    docker compose logs app --tail 10
    exit 0
fi

echo -e "${RED}❌ 方案1失败，尝试方案2${NC}"
echo ""
echo -e "${BLUE}方案2: 重新安装Next.js${NC}"
echo "--------------------------------"

# 重新安装Next.js
docker exec v0-sandbox-app sh -c "
    echo '重新安装Next.js...'
    npm uninstall next
    npm install next@latest
    
    echo '检查安装结果...'
    npm list next
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Next.js重新安装成功${NC}"
    echo -e "${YELLOW}重启容器...${NC}"
    docker compose restart app
    sleep 10
    echo -e "${GREEN}检查服务状态...${NC}"
    docker compose logs app --tail 10
    exit 0
fi

echo -e "${RED}❌ 方案2失败，尝试方案3${NC}"
echo ""
echo -e "${BLUE}方案3: 禁用SWC使用Babel${NC}"
echo "--------------------------------"

# 禁用SWC
docker exec v0-sandbox-app sh -c "
    echo '创建next.config.js禁用SWC...'
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
  experimental: {
    swcMinify: false,
  }
}

module.exports = nextConfig
EOF
    
    echo '配置文件已创建'
    cat next.config.js
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SWC已禁用${NC}"
    echo -e "${YELLOW}重启容器...${NC}"
    docker compose restart app
    sleep 10
    echo -e "${GREEN}检查服务状态...${NC}"
    docker compose logs app --tail 10
    exit 0
fi

echo -e "${RED}❌ 所有方案都失败了${NC}"
echo -e "${YELLOW}建议修改Dockerfile使用Ubuntu基础镜像${NC}"
