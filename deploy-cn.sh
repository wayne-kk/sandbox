#!/bin/bash

echo "🚀 开始部署 V0 Sandbox (中国镜像源优化版)..."

# 设置错误时退出
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 1. 清理旧容器和镜像
echo -e "${YELLOW}🧹 清理旧容器和镜像...${NC}"
docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
docker system prune -f

# 2. 构建镜像（使用中国镜像源）
echo -e "${YELLOW}🔨 构建 Docker 镜像...${NC}"
docker build -f Dockerfile.prod.cn -t v0-sandbox:latest .

# 3. 启动服务
echo -e "${YELLOW}🚀 启动服务...${NC}"
docker-compose -f docker-compose.yml up -d

# 4. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 10

# 5. 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
if docker-compose -f docker-compose.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo -e "${GREEN}🌐 访问地址: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo -e "${YELLOW}📋 查看日志:${NC}"
    docker-compose -f docker-compose.yml logs
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
        exit 1
    fi
    sleep 2
done

echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker-compose -f docker-compose.yml ps
