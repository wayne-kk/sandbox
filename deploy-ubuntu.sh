#!/bin/bash

echo "🐧 V0 Sandbox Ubuntu部署脚本..."
echo "=================================="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 使用Ubuntu基础镜像 + Node.js 20，解决SWC和lightningcss兼容性问题${NC}"

# 设置服务器地址
SERVER_IP="115.190.100.24"
echo -e "${GREEN}✅ 使用服务器公网IP: $SERVER_IP${NC}"

# 设置环境变量
export SERVER_HOST="$SERVER_IP"
export NEXT_PUBLIC_SERVER_HOST="$SERVER_IP"
export SANDBOX_PREVIEW_URL="http://$SERVER_IP/sandbox/"
export NEXT_PUBLIC_SANDBOX_PREVIEW_URL="http://$SERVER_IP/sandbox/"

# 1. 完全清理
echo -e "${YELLOW}🧹 完全清理旧容器和镜像...${NC}"
docker compose down --remove-orphans --volumes 2>/dev/null || true
docker rmi v0-sandbox-app 2>/dev/null || true

# 2. 清理Docker缓存
echo -e "${YELLOW}🧹 清理Docker构建缓存...${NC}"
docker builder prune -f

# 3. 重新构建（使用Ubuntu基础镜像）
echo -e "${YELLOW}🔄 使用Ubuntu基础镜像重新构建...${NC}"
docker compose build --no-cache

# 4. 启动服务
echo -e "${YELLOW}🚀 启动服务...${NC}"
docker compose up -d

# 5. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 20

# 6. 健康检查
echo -e "${YELLOW}🏥 健康检查...${NC}"
for i in {1..10}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 主服务启动成功！${NC}"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ 主服务启动失败${NC}"
        echo -e "${YELLOW}查看详细日志:${NC}"
        docker compose logs app --tail 20
        exit 1
    fi
    sleep 3
done

# 检查Nginx
for i in {1..5}; do
    if curl -f http://localhost:8080 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx代理启动成功！${NC}"
        break
    fi
    
    if [ $i -eq 5 ]; then
        echo -e "${YELLOW}⚠️  Nginx可能仍在启动中...${NC}"
    fi
    sleep 2
done

echo -e "${GREEN}🎉 Ubuntu部署完成！${NC}"
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
echo -e "${YELLOW}   - 重启服务: docker compose restart${NC}"

# 7. 验证Node.js和依赖版本
echo -e "${BLUE}🔍 验证环境:${NC}"
echo "Node.js版本:"
docker exec v0-sandbox-app node -v

echo "npm版本:"
docker exec v0-sandbox-app npm -v

echo "检查关键依赖:"
docker exec v0-sandbox-app npm list next tailwindcss 2>/dev/null || echo "依赖检查完成"
