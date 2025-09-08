#!/bin/bash

echo "🚀 V0 Sandbox 一键部署脚本..."

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
    
# 1. 配置 Docker 基础设置
echo -e "${YELLOW}🔧 配置 Docker 基础设置...${NC}"
sudo mkdir -p /etc/docker

# 备份现有配置
if [ -f /etc/docker/daemon.json ]; then
    sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup
    echo -e "${GREEN}✅ 已备份现有 Docker 配置${NC}"
fi

# 跳过代理配置，使用基础Docker配置

# 写入Docker基础配置
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "max-concurrent-downloads": 3,
  "max-concurrent-uploads": 5,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

echo -e "${GREEN}✅ Docker 基础配置完成${NC}"

# 验证Docker配置文件语法
echo -e "${YELLOW}🔍 验证Docker配置文件语法...${NC}"
if command -v python3 >/dev/null 2>&1; then
    if python3 -m json.tool /etc/docker/daemon.json >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker配置文件语法正确${NC}"
    else
        echo -e "${RED}❌ Docker配置文件语法错误${NC}"
        echo -e "${YELLOW}📋 配置文件内容:${NC}"
        cat /etc/docker/daemon.json
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  无法验证JSON语法，请手动检查配置文件${NC}"
fi

# 2. 重启 Docker 服务
echo -e "${YELLOW}🔄 重启 Docker 服务...${NC}"

# 检测操作系统类型并执行相应的重启命令
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux系统使用systemctl
    echo -e "${YELLOW}🔄 重新加载systemd配置...${NC}"
    sudo systemctl daemon-reload
    
    echo -e "${YELLOW}🔄 重启Docker服务...${NC}"
    if sudo systemctl restart docker; then
        echo -e "${GREEN}✅ Linux系统Docker服务重启完成${NC}"
    else
        echo -e "${RED}❌ Docker服务重启失败，尝试恢复...${NC}"
        
        # 检查Docker服务状态
        echo -e "${YELLOW}📋 Docker服务状态:${NC}"
        sudo systemctl status docker --no-pager -l
        
        # 尝试恢复原始配置
        if [ -f /etc/docker/daemon.json.backup ]; then
            echo -e "${YELLOW}🔄 恢复原始Docker配置...${NC}"
            sudo cp /etc/docker/daemon.json.backup /etc/docker/daemon.json
            sudo systemctl daemon-reload
            sudo systemctl restart docker
            echo -e "${GREEN}✅ 已恢复原始配置并重启Docker${NC}"
        else
            echo -e "${YELLOW}🔄 删除可能损坏的配置文件...${NC}"
            sudo rm -f /etc/docker/daemon.json
            sudo systemctl daemon-reload
            sudo systemctl restart docker
            echo -e "${GREEN}✅ 已删除配置文件并重启Docker${NC}"
        fi
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS系统，Docker Desktop需要手动重启
    echo -e "${YELLOW}⚠️  macOS系统检测到，请手动重启Docker Desktop${NC}"
    echo -e "${YELLOW}   或者运行: killall Docker && open /Applications/Docker.app${NC}"
    # 尝试优雅地重启Docker Desktop
    if command -v docker >/dev/null 2>&1; then
        echo -e "${YELLOW}🔄 尝试重启Docker Desktop...${NC}"
        killall Docker 2>/dev/null || true
        sleep 5
        open /Applications/Docker.app 2>/dev/null || true
    fi
else
    echo -e "${YELLOW}⚠️  未知操作系统类型，跳过Docker服务重启${NC}"
fi

# 等待 Docker 启动
echo -e "${YELLOW}⏳ 等待Docker启动...${NC}"
sleep 15

# 测试 Docker 连接
echo -e "${YELLOW}🧪 测试 Docker 连接...${NC}"
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker 服务正常${NC}"
else
    echo -e "${RED}❌ Docker 服务异常${NC}"
    exit 1
fi

# 3. 预拉取镜像
echo -e "${YELLOW}🔄 预拉取 Docker 镜像...${NC}"

# 镜像列表
IMAGES=(
    "redis:7-alpine"
    "nginx:alpine"
    "node:18-alpine"
)

echo -e "${YELLOW}📋 需要拉取的镜像:${NC}"
for image in "${IMAGES[@]}"; do
    echo -e "${YELLOW}  - $image${NC}"
done

# 从官方源拉取镜像
for image in "${IMAGES[@]}"; do
    echo -e "${YELLOW}🔄 拉取镜像: $image${NC}"
    
    if docker pull "$image"; then
        echo -e "${GREEN}✅ 成功拉取: $image${NC}"
    else
        echo -e "${RED}❌ 拉取失败: $image${NC}"
        echo -e "${YELLOW}⚠️  镜像拉取失败，将在后续步骤中重试${NC}"
    fi
done

echo -e "${GREEN}🎉 镜像预拉取完成！${NC}"

# 4. 清理旧容器
echo -e "${YELLOW}🧹 清理旧容器...${NC}"
docker compose down --remove-orphans 2>/dev/null || true

# 5. 创建必要目录
echo -e "${YELLOW}📁 创建必要目录...${NC}"
mkdir -p data logs

# 6. 构建并启动服务
echo -e "${YELLOW}🔨 构建并启动服务...${NC}"
docker compose up -d

# 7. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 20

# 8. 检查服务状态
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

# 9. 健康检查
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

echo -e "${GREEN}🎉 云服务器部署完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker compose ps

echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}   - 直接访问应用: http://localhost:3000${NC}"
echo -e "${YELLOW}   - 通过 Nginx: http://localhost${NC}"
echo -e "${YELLOW}   - 外网访问: http://你的服务器IP${NC}"

# 10. 显示防火墙配置提示
echo -e "${YELLOW}🔒 防火墙配置提示:${NC}"
echo -e "${YELLOW}   如果无法外网访问，请开放以下端口:${NC}"
echo -e "${YELLOW}   sudo ufw allow 80${NC}"
echo -e "${YELLOW}   sudo ufw allow 3000${NC}"
