#!/bin/bash

echo "🚀 部署 V0 Sandbox..."

# 设置错误时退出
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 1. 清理旧容器
echo -e "${YELLOW}🧹 清理旧容器...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true

# 2. 创建必要目录
echo -e "${YELLOW}📁 创建必要目录...${NC}"
mkdir -p data logs

# 3. 构建并启动服务
echo -e "${YELLOW}🔨 构建并启动服务...${NC}"
docker-compose up -d

# 4. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 15

# 5. 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo -e "${GREEN}🌐 应用访问地址: http://localhost:3000${NC}"
    echo -e "${GREEN}🌐 Nginx 访问地址: http://localhost${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo -e "${YELLOW}📋 查看日志:${NC}"
    docker-compose logs
    exit 1
fi

# 6. 健康检查
echo -e "${YELLOW}🏥 执行健康检查...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 健康检查通过！${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 健康检查失败${NC}"
        echo -e "${YELLOW}📋 查看应用日志:${NC}"
        docker-compose logs app
        exit 1
    fi
    sleep 2
done

echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker-compose ps

echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}   - 直接访问应用: http://localhost:3000${NC}"
echo -e "${YELLOW}   - 通过 Nginx: http://localhost${NC}"