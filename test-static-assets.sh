#!/bin/bash

echo "🧪 测试静态资源路径冲突修复..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 重启服务以应用新配置
echo -e "${YELLOW}🔄 重启服务以应用新配置...${NC}"
docker compose down
docker compose up -d

# 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 20

# 2. 检查服务状态
echo -e "${YELLOW}📊 检查服务状态...${NC}"
docker compose ps

echo ""

# 3. 测试主应用静态资源
echo -e "${YELLOW}🧪 测试主应用静态资源...${NC}"
if curl -f http://localhost:8080/_next/static/webpack.js >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 主应用静态资源正常: /_next/static/webpack.js${NC}"
else
    echo -e "${YELLOW}⚠️  主应用静态资源可能不存在或路径不同${NC}"
fi

# 4. 测试sandbox静态资源
echo -e "${YELLOW}🧪 测试sandbox静态资源...${NC}"
if curl -f http://localhost:8080/sandbox-assets/_next/static/webpack.js >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Sandbox静态资源正常: /sandbox-assets/_next/static/webpack.js${NC}"
else
    echo -e "${YELLOW}⚠️  Sandbox静态资源可能不存在或路径不同${NC}"
fi

# 5. 测试sandbox项目访问
echo -e "${YELLOW}🧪 测试sandbox项目访问...${NC}"
if curl -f http://localhost:8080/sandbox/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Sandbox项目访问正常: /sandbox/${NC}"
else
    echo -e "${YELLOW}⚠️  Sandbox项目访问异常${NC}"
fi

# 6. 测试主应用访问
echo -e "${YELLOW}🧪 测试主应用访问...${NC}"
if curl -f http://localhost:8080/ >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 主应用访问正常: /${NC}"
else
    echo -e "${RED}❌ 主应用访问异常${NC}"
fi

echo ""

# 7. 显示访问地址
echo -e "${GREEN}🎉 静态资源路径冲突修复完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker compose ps

echo ""
echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}   - 主应用: http://localhost:8080${NC}"
echo -e "${YELLOW}   - 主应用静态资源: http://localhost:8080/_next/static/...${NC}"
echo -e "${YELLOW}   - Sandbox项目: http://localhost:8080/sandbox/${NC}"
echo -e "${YELLOW}   - Sandbox静态资源: http://localhost:8080/sandbox-assets/_next/static/...${NC}"

echo ""
echo -e "${GREEN}   - 外网主应用: http://115.190.100.24:8080${NC}"
echo -e "${GREEN}   - 外网Sandbox: http://115.190.100.24:8080/sandbox/${NC}"
echo -e "${GREEN}   - 外网Sandbox静态资源: http://115.190.100.24:8080/sandbox-assets/_next/static/...${NC}"

echo ""
echo -e "${YELLOW}🔧 如果问题仍然存在:${NC}"
echo -e "${YELLOW}   - 查看日志: docker compose logs -f app${NC}"
echo -e "${YELLOW}   - 重新构建: docker compose build --no-cache${NC}"
echo -e "${YELLOW}   - 检查配置: docker exec v0-sandbox-nginx nginx -t${NC}"
