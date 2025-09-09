#!/bin/bash

echo "🧹 Docker 缓存清理脚本..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 显示当前Docker使用情况
echo -e "${YELLOW}📊 当前Docker使用情况:${NC}"
docker system df

echo ""
echo -e "${YELLOW}🧹 开始清理Docker缓存...${NC}"

# 停止所有容器
echo -e "${YELLOW}🛑 停止所有容器...${NC}"
docker compose down 2>/dev/null || true

# 清理构建缓存
echo -e "${YELLOW}🗑️  清理构建缓存...${NC}"
docker builder prune -f

# 清理未使用的镜像
echo -e "${YELLOW}🗑️  清理未使用的镜像...${NC}"
docker image prune -f

# 清理未使用的容器
echo -e "${YELLOW}🗑️  清理未使用的容器...${NC}"
docker container prune -f

# 清理未使用的网络
echo -e "${YELLOW}🗑️  清理未使用的网络...${NC}"
docker network prune -f

# 清理未使用的卷
echo -e "${YELLOW}🗑️  清理未使用的卷...${NC}"
docker volume prune -f

# 显示清理后的使用情况
echo ""
echo -e "${GREEN}✅ 清理完成！${NC}"
echo -e "${YELLOW}📊 清理后Docker使用情况:${NC}"
docker system df

echo ""
echo -e "${GREEN}💡 建议:${NC}"
echo -e "${GREEN}   - 定期运行此脚本清理缓存${NC}"
echo -e "${GREEN}   - 使用 ./quick-deploy.sh 进行快速部署${NC}"
echo -e "${GREEN}   - 使用 ./deploy.sh --fast 进行快速更新${NC}"
