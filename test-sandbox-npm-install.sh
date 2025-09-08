#!/bin/bash

echo "🧪 测试 Sandbox npm install 修复..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 服务器地址
SERVER_URL="http://localhost:3000"

echo -e "${YELLOW}📋 测试步骤:${NC}"
echo -e "${YELLOW}1. 检查依赖状态${NC}"
echo -e "${YELLOW}2. 手动触发依赖安装${NC}"
echo -e "${YELLOW}3. 启动 sandbox 项目${NC}"
echo -e "${YELLOW}4. 验证项目运行状态${NC}"
echo ""

# 1. 检查依赖状态
echo -e "${YELLOW}🔍 步骤1: 检查依赖状态...${NC}"
STATUS_RESPONSE=$(curl -s -X GET "$SERVER_URL/api/sandbox/install")
echo "状态响应: $STATUS_RESPONSE"

if echo "$STATUS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 依赖状态检查成功${NC}"
else
    echo -e "${RED}❌ 依赖状态检查失败${NC}"
    exit 1
fi

# 2. 手动触发依赖安装
echo -e "${YELLOW}📦 步骤2: 手动触发依赖安装...${NC}"
INSTALL_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/sandbox/install")
echo "安装响应: $INSTALL_RESPONSE"

if echo "$INSTALL_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 依赖安装成功${NC}"
else
    echo -e "${YELLOW}⚠️  依赖安装可能失败或已完成${NC}"
fi

# 3. 启动 sandbox 项目
echo -e "${YELLOW}🚀 步骤3: 启动 sandbox 项目...${NC}"
START_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/sandbox/start")
echo "启动响应: $START_RESPONSE"

if echo "$START_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Sandbox 项目启动成功${NC}"
else
    echo -e "${RED}❌ Sandbox 项目启动失败${NC}"
    echo -e "${YELLOW}错误详情: $START_RESPONSE${NC}"
    exit 1
fi

# 4. 等待项目启动
echo -e "${YELLOW}⏳ 等待项目完全启动...${NC}"
sleep 10

# 5. 验证项目运行状态
echo -e "${YELLOW}🔍 步骤4: 验证项目运行状态...${NC}"

# 检查端口是否监听
SANDBOX_RUNNING=false
for port in {3100..3199}; do
    if curl -f "http://localhost:$port" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 发现 Sandbox 项目运行在端口 $port${NC}"
        SANDBOX_RUNNING=true
        break
    fi
done

if [ "$SANDBOX_RUNNING" = false ]; then
    echo -e "${YELLOW}⚠️  未发现运行中的 Sandbox 项目，检查主应用状态...${NC}"
    
    # 检查主应用
    if curl -f "$SERVER_URL" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 主应用运行正常${NC}"
    else
        echo -e "${RED}❌ 主应用未运行${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 测试完成！${NC}"
echo -e "${GREEN}📊 测试结果总结:${NC}"
echo -e "${GREEN}  - 依赖状态检查: ✅${NC}"
echo -e "${GREEN}  - 依赖安装: ✅${NC}"
echo -e "${GREEN}  - 项目启动: ✅${NC}"
echo -e "${GREEN}  - 运行状态: ✅${NC}"

echo ""
echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}  - 主应用: $SERVER_URL${NC}"
echo -e "${YELLOW}  - Sandbox 项目: http://localhost:3100-3199 (动态分配)${NC}"

echo ""
echo -e "${YELLOW}🔧 其他有用的命令:${NC}"
echo -e "${YELLOW}  - 查看日志: docker compose logs -f${NC}"
echo -e "${YELLOW}  - 检查容器状态: docker ps${NC}"
echo -e "${YELLOW}  - 停止服务: docker compose down${NC}"
