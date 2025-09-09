#!/bin/bash

echo "🚀 V0 Sandbox 云服务器部署脚本..."
echo "=================================="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo -e "${GREEN}✅ 检测到服务器IP: $SERVER_IP${NC}"

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  检测到root用户，建议使用普通用户部署${NC}"
    read -p "是否继续？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}📦 安装Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker安装完成${NC}"
    echo -e "${YELLOW}⚠️  请重新登录以应用Docker用户组更改${NC}"
    exit 0
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}📦 安装Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose安装完成${NC}"
fi

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker未运行，请启动Docker服务${NC}"
    sudo systemctl start docker
    sudo systemctl enable docker
fi

echo -e "${GREEN}✅ Docker环境检查完成${NC}"

# 设置环境变量
export SERVER_HOST="$SERVER_IP"
export NEXT_PUBLIC_SERVER_HOST="$SERVER_IP"
export SANDBOX_PREVIEW_URL="http://$SERVER_IP/sandbox/"
export NEXT_PUBLIC_SANDBOX_PREVIEW_URL="http://$SERVER_IP/sandbox/"

# 创建环境变量文件
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}📝 创建环境变量文件...${NC}"
    cat > .env.local << EOF
# 服务器配置
SERVER_HOST=$SERVER_IP
NEXT_PUBLIC_SERVER_HOST=$SERVER_IP
EXTERNAL_DOMAIN=$SERVER_IP
EXTERNAL_PROTOCOL=http
EXTERNAL_PORT=
SANDBOX_PREVIEW_URL=http://$SERVER_IP/sandbox/
NEXT_PUBLIC_SANDBOX_PREVIEW_URL=http://$SERVER_IP/sandbox/

# 数据库配置
DATABASE_URL=file:./data/prod.db

# AI服务配置（可选）
DIFY_API_KEY=
DIFY_API_ENDPOINT=http://152.136.41.186:32422/v1/workflows/run
COMPONENT_DIFY_API_KEY=app-p363bFgzxF8m9J1eyl5wasBT
REQUIRMENT_DIFY_API_KEY=app-YgkdhmiPidrzl8e1bbaIdNrb

# OpenAI配置（可选）
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=

# Azure OpenAI配置（可选）
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_VERSION=
AZURE_OPENAI_DEPLOYMENT_NAME=
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=

# Supabase配置（可选）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 认证配置
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://$SERVER_IP:3000
NEXT_PUBLIC_APP_URL=http://$SERVER_IP:3000

# Redis配置
REDIS_URL=redis://redis:6379

# 禁用代理
http_proxy=
https_proxy=
HTTP_PROXY=
HTTPS_PROXY=
no_proxy=152.136.41.186
NO_PROXY=152.136.41.186
EOF
    echo -e "${GREEN}✅ 环境变量文件已创建${NC}"
fi

# 1. 完全清理
echo -e "${YELLOW}🧹 清理旧容器和镜像...${NC}"
docker compose down --remove-orphans --volumes 2>/dev/null || true
docker rmi v0-sandbox-app 2>/dev/null || true

# 2. 清理本地文件
echo -e "${YELLOW}🧹 清理本地文件...${NC}"
rm -f package-lock.json
rm -rf node_modules
rm -rf .next

# 3. 清理Docker缓存
echo -e "${YELLOW}🧹 清理Docker构建缓存...${NC}"
docker builder prune -f

# 4. 重新构建
echo -e "${YELLOW}🔄 构建应用...${NC}"
docker compose build --no-cache

# 5. 启动服务
echo -e "${YELLOW}🚀 启动服务...${NC}"
docker compose up -d

# 6. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 30

# 7. 健康检查
echo -e "${YELLOW}🏥 健康检查...${NC}"
for i in {1..20}; do
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 主服务启动成功！${NC}"
        break
    fi
    
    if [ $i -eq 20 ]; then
        echo -e "${RED}❌ 主服务启动失败${NC}"
        echo -e "${YELLOW}查看详细日志:${NC}"
        docker compose logs app --tail 50
        exit 1
    fi
    sleep 3
done

# 检查Nginx
for i in {1..10}; do
    if curl -f http://localhost:8080 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx代理启动成功！${NC}"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo -e "${YELLOW}⚠️  Nginx可能仍在启动中...${NC}"
        echo -e "${YELLOW}查看Nginx日志:${NC}"
        docker compose logs nginx --tail 20
    fi
    sleep 2
done

# 8. 配置防火墙
echo -e "${YELLOW}🔥 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 22    # SSH
    sudo ufw allow 80    # HTTP
    sudo ufw allow 443   # HTTPS
    sudo ufw allow 3000  # 主应用
    sudo ufw allow 8080  # Nginx代理
    sudo ufw allow 3100:3110/tcp  # Sandbox端口范围
    echo -e "${GREEN}✅ UFW防火墙配置完成${NC}"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=22/tcp
    sudo firewall-cmd --permanent --add-port=80/tcp
    sudo firewall-cmd --permanent --add-port=443/tcp
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --permanent --add-port=8080/tcp
    sudo firewall-cmd --permanent --add-port=3100-3110/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✅ Firewalld防火墙配置完成${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到防火墙，请手动配置安全组${NC}"
fi

# 9. 测试访问
echo -e "${YELLOW}🔍 测试访问...${NC}"
echo "测试主应用:"
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 主应用访问正常${NC}"
else
    echo -e "${RED}❌ 主应用访问失败${NC}"
fi

echo "测试Nginx代理:"
if curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx代理访问正常${NC}"
else
    echo -e "${RED}❌ Nginx代理访问失败${NC}"
fi

echo -e "${GREEN}🎉 云服务器部署完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker compose ps

echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}   - 本地访问: http://localhost:3000${NC}"
echo -e "${YELLOW}   - 通过Nginx: http://localhost:8080${NC}"
echo -e "${GREEN}   - 外网访问: http://$SERVER_IP:8080${NC}"
echo -e "${GREEN}   - 外网Sandbox: http://$SERVER_IP:8080/sandbox${NC}"

echo -e "${YELLOW}🔧 管理命令:${NC}"
echo -e "${YELLOW}   - 查看日志: docker compose logs -f${NC}"
echo -e "${YELLOW}   - 停止服务: docker compose down${NC}"
echo -e "${YELLOW}   - 重启服务: docker compose restart${NC}"
echo -e "${YELLOW}   - 更新服务: docker compose pull && docker compose up -d${NC}"

# 10. 创建systemd服务
echo -e "${YELLOW}⚙️  创建系统服务...${NC}"
sudo tee /etc/systemd/system/v0-sandbox.service > /dev/null << EOF
[Unit]
Description=V0 Sandbox Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable v0-sandbox.service
echo -e "${GREEN}✅ 系统服务已创建并启用${NC}"

# 11. 验证环境
echo -e "${BLUE}🔍 验证环境:${NC}"
echo "Node.js版本:"
docker exec v0-sandbox-app node -v

echo "检查关键依赖:"
docker exec v0-sandbox-app npm list next 2>/dev/null || echo "依赖检查完成"

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${BLUE}💡 下一步:${NC}"
echo -e "${BLUE}   1. 配置域名解析${NC}"
echo -e "${BLUE}   2. 安装SSL证书${NC}"
echo -e "${BLUE}   3. 配置CDN加速${NC}"
echo -e "${BLUE}   4. 设置监控告警${NC}"

echo ""
echo -e "${YELLOW}📋 重要提醒:${NC}"
echo -e "${YELLOW}   - 请确保云服务商安全组已开放相应端口${NC}"
echo -e "${YELLOW}   - 建议配置域名和SSL证书${NC}"
echo -e "${YELLOW}   - 定期备份数据和更新系统${NC}"
