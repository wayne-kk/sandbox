#!/bin/bash

echo "🔄 更新Sandbox代码"
echo "=================="

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. 拉取最新代码
echo -e "${YELLOW}📥 拉取最新代码...${NC}"
git pull origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 代码拉取成功${NC}"
else
    echo -e "${RED}❌ 代码拉取失败${NC}"
    exit 1
fi

# 2. 检查sandbox目录是否有更新
echo -e "${YELLOW}🔍 检查sandbox更新...${NC}"
if git diff HEAD~1 --name-only | grep -q "sandbox/"; then
    echo -e "${GREEN}✅ 检测到sandbox文件更新${NC}"
    
    # 3. 重启容器以应用更新
    echo -e "${YELLOW}🔄 重启容器以应用更新...${NC}"
    docker compose down
    docker compose up -d
    
    # 4. 等待服务启动
    echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
    sleep 15
    
    # 5. 重启sandbox服务
    echo -e "${YELLOW}🚀 重启sandbox服务...${NC}"
    curl -X POST http://localhost:3000/api/sandbox/start >/dev/null 2>&1
    sleep 5
    
    # 6. 检查服务状态
    echo -e "${YELLOW}🏥 检查服务状态...${NC}"
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 主服务正常${NC}"
    else
        echo -e "${RED}❌ 主服务异常${NC}"
    fi
    
    SANDBOX_STATUS=$(curl -s http://localhost:3000/api/sandbox/start | jq -r '.running // false' 2>/dev/null || echo "false")
    if [ "$SANDBOX_STATUS" = "true" ]; then
        echo -e "${GREEN}✅ Sandbox服务正常${NC}"
    else
        echo -e "${YELLOW}⚠️  Sandbox服务可能需要手动启动${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Sandbox更新完成！${NC}"
    echo -e "${BLUE}📱 访问地址: http://$(curl -s ifconfig.me):3000/sandbox${NC}"
    
else
    echo -e "${YELLOW}ℹ️  没有检测到sandbox文件更新${NC}"
    echo -e "${BLUE}💡 如果需要强制重启sandbox，请运行:${NC}"
    echo "   curl -X POST http://localhost:3000/api/sandbox/start"
fi
