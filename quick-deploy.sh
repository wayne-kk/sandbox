#!/bin/bash

echo "⚡ V0 Sandbox 极速部署脚本..."

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

# 设置服务器地址
SERVER_IP="115.190.100.24"
echo -e "${GREEN}✅ 使用服务器公网IP: $SERVER_IP${NC}"

# 设置环境变量
export SERVER_HOST="$SERVER_IP"
export NEXT_PUBLIC_SERVER_HOST="$SERVER_IP"
export SANDBOX_PREVIEW_URL="http://$SERVER_IP/sandbox/"
export NEXT_PUBLIC_SANDBOX_PREVIEW_URL="http://$SERVER_IP/sandbox/"

# 1. 快速清理
echo -e "${YELLOW}🧹 快速清理旧容器...${NC}"
docker compose down --remove-orphans 2>/dev/null || true

# 2. 检查镜像是否存在
if docker images | grep -q "v0-sandbox.*app"; then
    echo -e "${GREEN}✅ 发现现有镜像，直接启动...${NC}"
    docker compose up -d
else
    echo -e "${YELLOW}🔄 构建开发镜像（快速模式）...${NC}"
    # 使用开发模式构建，跳过生产构建步骤
    BUILD_TARGET=development docker compose build
    docker compose up -d
fi

# 3. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 10

# 4. 快速健康检查
echo -e "${YELLOW}🏥 快速健康检查...${NC}"
for i in {1..5}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务启动成功！${NC}"
        break
    fi
    
    if [ $i -eq 5 ]; then
        echo -e "${YELLOW}⚠️  服务可能仍在启动中，请稍等...${NC}"
    fi
    sleep 2
done

echo -e "${GREEN}🎉 极速部署完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker compose ps

echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}   - 本地访问: http://localhost:3000${NC}"
echo -e "${YELLOW}   - 通过Nginx: http://localhost:8080${NC}"
echo -e "${GREEN}   - 外网访问: http://$SERVER_IP:8080${NC}"
echo -e "${GREEN}   - 外网Sandbox: http://$SERVER_IP:8080/sandbox${NC}"

echo -e "${YELLOW}🔧 其他命令:${NC}"
echo -e "${YELLOW}   - 查看日志: docker compose logs -f${NC}"
echo -e "${YELLOW}   - 停止服务: docker compose down${NC}"
echo -e "${YELLOW}   - 完整部署: ./deploy.sh${NC}"
