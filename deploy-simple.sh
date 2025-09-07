#!/bin/bash

echo "🚀 简化部署 V0 Sandbox（跳过镜像预拉取）..."

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

# 1. 配置 Docker 镜像加速器
echo -e "${YELLOW}🔧 配置 Docker 镜像加速器...${NC}"
sudo mkdir -p /etc/docker

# 备份现有配置
if [ -f /etc/docker/daemon.json ]; then
    sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
    echo -e "${GREEN}✅ 已备份现有 Docker 配置${NC}"
fi

# 写入镜像加速器配置
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://ccr.ccs.tencentyun.com"
  ],
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

echo -e "${GREEN}✅ Docker 镜像加速器配置完成${NC}"

# 2. 重启 Docker 服务
echo -e "${YELLOW}🔄 重启 Docker 服务...${NC}"
sudo systemctl daemon-reload
sudo systemctl restart docker

# 等待 Docker 启动
sleep 10

# 3. 清理旧容器
echo -e "${YELLOW}🧹 清理旧容器...${NC}"
docker compose down --remove-orphans 2>/dev/null || true

# 4. 创建必要目录
echo -e "${YELLOW}📁 创建必要目录...${NC}"
mkdir -p data logs

# 5. 构建并启动服务（直接使用官方镜像）
echo -e "${YELLOW}🔨 构建并启动服务...${NC}"
echo -e "${YELLOW}⚠️ 跳过镜像预拉取，直接使用官方镜像源${NC}"
docker compose up -d

# 6. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 20

# 7. 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo -e "${GREEN}🌐 应用访问地址: http://localhost:3000${NC}"
    echo -e "${GREEN}🌐 Nginx 访问地址: http://localhost${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo -e "${YELLOW}📋 查看日志:${NC}"
    docker compose logs
    exit 1
fi

# 8. 健康检查
echo -e "${YELLOW}🏥 执行健康检查...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 健康检查通过！${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 健康检查失败${NC}"
        echo -e "${YELLOW}📋 查看应用日志:${NC}"
        docker compose logs app
        exit 1
    fi
    sleep 3
done

echo -e "${GREEN}🎉 简化部署完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker compose ps

echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}   - 直接访问应用: http://localhost:3000${NC}"
echo -e "${YELLOW}   - 通过 Nginx: http://localhost${NC}"
echo -e "${YELLOW}   - 外网访问: http://你的服务器IP${NC}"

# 9. 显示防火墙配置提示
echo -e "${YELLOW}🔒 防火墙配置提示:${NC}"
echo -e "${YELLOW}   如果无法外网访问，请开放以下端口:${NC}"
echo -e "${YELLOW}   sudo ufw allow 80${NC}"
echo -e "${YELLOW}   sudo ufw allow 3000${NC}"
