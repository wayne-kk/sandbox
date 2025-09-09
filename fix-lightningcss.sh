#!/bin/bash

echo "🔧 修复lightningcss问题..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}方案1: 重新安装lightningcss${NC}"
echo "--------------------------------"

# 进入容器并重新安装lightningcss
docker exec v0-sandbox-app sh -c "
    echo '卸载现有lightningcss...'
    npm uninstall lightningcss 2>/dev/null || true
    
    echo '重新安装lightningcss...'
    npm install lightningcss --save-dev --force
    
    echo '检查安装结果...'
    npm list lightningcss
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ lightningcss重新安装成功${NC}"
    echo -e "${YELLOW}重启容器...${NC}"
    docker compose restart app
    exit 0
fi

echo -e "${RED}❌ 方案1失败，尝试方案2${NC}"
echo ""
echo -e "${YELLOW}方案2: 降级到Tailwind CSS 3.x${NC}"
echo "--------------------------------"

# 降级到Tailwind CSS 3.x
docker exec v0-sandbox-app sh -c "
    echo '卸载Tailwind CSS 4.0...'
    npm uninstall tailwindcss @tailwindcss/postcss 2>/dev/null || true
    
    echo '安装Tailwind CSS 3.x...'
    npm install tailwindcss@^3.4.0 postcss autoprefixer --save-dev
    
    echo '检查安装结果...'
    npm list tailwindcss
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tailwind CSS降级成功${NC}"
    echo -e "${YELLOW}重启容器...${NC}"
    docker compose restart app
    exit 0
fi

echo -e "${RED}❌ 所有方案都失败了${NC}"
echo -e "${YELLOW}请手动检查容器日志: docker compose logs app${NC}"
