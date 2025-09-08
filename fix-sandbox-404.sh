#!/bin/bash

echo "🔧 修复Sandbox 404错误脚本..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 停止当前服务
echo -e "${YELLOW}🛑 停止当前服务...${NC}"
docker compose down

# 2. 清理旧容器和镜像
echo -e "${YELLOW}🧹 清理旧容器和镜像...${NC}"
docker system prune -f
docker image prune -f

# 3. 重新构建并启动服务
echo -e "${YELLOW}🔨 重新构建并启动服务...${NC}"
docker compose build --no-cache
docker compose up -d

# 4. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 30

# 5. 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
docker compose ps

# 6. 测试Sandbox静态资源
echo -e "${YELLOW}🧪 测试Sandbox静态资源...${NC}"
if curl -f http://localhost:8080/sandbox/_next/static/chunks/webpack.js >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Sandbox静态资源访问正常${NC}"
else
    echo -e "${RED}❌ Sandbox静态资源访问失败${NC}"
    echo -e "${YELLOW}📋 查看容器日志:${NC}"
    docker compose logs app
fi

# 7. 显示访问地址
echo -e "${GREEN}🎉 修复完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker compose ps

echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}   - 主应用: http://localhost:3000${NC}"
echo -e "${YELLOW}   - 通过Nginx: http://localhost:8080${NC}"
echo -e "${YELLOW}   - Sandbox项目: http://localhost:8080/sandbox${NC}"
echo -e "${GREEN}   - 外网访问: http://115.190.100.24:8080${NC}"
echo -e "${GREEN}   - 外网Sandbox: http://115.190.100.24:8080/sandbox${NC}"

echo -e "${YELLOW}🔧 如果问题仍然存在，请检查:${NC}"
echo -e "${YELLOW}   1. 外部Nginx配置是否正确更新${NC}"
echo -e "${YELLOW}   2. 防火墙是否开放8080端口${NC}"
echo -e "${YELLOW}   3. 查看详细日志: docker compose logs -f app${NC}"
