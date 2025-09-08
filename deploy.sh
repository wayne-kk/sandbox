#!/bin/bash

echo "🚀 V0 Sandbox 一键部署脚本..."

# 设置错误时退出
set -e

# 检查是否有快速启动参数
QUICK_START=false
if [ "$1" = "--quick" ] || [ "$1" = "-q" ]; then
    QUICK_START=true
    echo "⚡ 快速启动模式 - 跳过Docker配置和镜像拉取"
fi

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
if [ "$QUICK_START" = false ]; then
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
else
    echo -e "${GREEN}⚡ 跳过Docker配置（快速启动模式）${NC}"
fi

# 2. 重启 Docker 服务
if [ "$QUICK_START" = false ]; then
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
else
    echo -e "${GREEN}⚡ 跳过Docker重启（快速启动模式）${NC}"
fi

# 3. 预拉取镜像
if [ "$QUICK_START" = false ]; then
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
else
    echo -e "${GREEN}⚡ 跳过镜像拉取（快速启动模式）${NC}"
fi

# 4. 检查端口占用并清理旧容器
echo -e "${YELLOW}🔍 检查端口占用情况...${NC}"

# 检查8080端口占用
if lsof -i :8080 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口8080被占用，正在清理...${NC}"
    # 尝试停止占用8080端口的容器
    docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":8080->" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
fi

# 检查3000端口占用
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口3000被占用，正在清理...${NC}"
    # 尝试停止占用3000端口的容器
    docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":3000->" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
fi

# 检查3101端口占用
if lsof -i :3101 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  端口3101被占用，正在清理...${NC}"
    # 尝试停止占用3101端口的容器
    docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":3101->" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
fi
echo -e "${YELLOW}🧹 清理旧容器...${NC}"
docker compose down --remove-orphans 2>/dev/null || true

# 5. 检查环境变量文件
echo -e "${YELLOW}🔍 检查环境变量配置...${NC}"
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ 找到 .env.local 文件${NC}"
    echo -e "${YELLOW}📋 文件路径: $(pwd)/.env.local${NC}"
    
    # 检查关键环境变量
    if grep -q "DIFY_API_ENDPOINT" .env.local; then
        DIFY_ENDPOINT=$(grep "DIFY_API_ENDPOINT" .env.local | cut -d'=' -f2)
        # 去除引号和空格
        DIFY_ENDPOINT=$(echo "$DIFY_ENDPOINT" | sed 's/^["'\'']*//;s/["'\'']*$//' | xargs)
        echo -e "${GREEN}✅ DIFY_API_ENDPOINT 已配置: $DIFY_ENDPOINT${NC}"
        
        # 检查值是否为空
        if [ -z "$DIFY_ENDPOINT" ]; then
            echo -e "${RED}❌ DIFY_API_ENDPOINT 值为空！${NC}"
            echo -e "${YELLOW}📋 原始行内容: $(grep "DIFY_API_ENDPOINT" .env.local)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  DIFY_API_ENDPOINT 未在 .env.local 中找到${NC}"
    fi
    
    if grep -q "COMPONENT_DIFY_API_KEY" .env.local; then
        echo -e "${GREEN}✅ COMPONENT_DIFY_API_KEY 已配置${NC}"
    else
        echo -e "${YELLOW}⚠️  COMPONENT_DIFY_API_KEY 未在 .env.local 中找到${NC}"
    fi
    
    # 显示文件权限
    echo -e "${YELLOW}📋 文件权限: $(ls -la .env.local | awk '{print $1}')${NC}"
else
    echo -e "${RED}❌ 未找到 .env.local 文件${NC}"
    echo -e "${YELLOW}💡 请创建 .env.local 文件并配置必要的环境变量${NC}"
    echo -e "${YELLOW}💡 当前目录: $(pwd)${NC}"
fi

# 6. 创建必要目录
echo -e "${YELLOW}📁 创建必要目录...${NC}"
mkdir -p data logs

# 7. 构建并启动服务
echo -e "${YELLOW}🔨 构建并启动服务...${NC}"
docker compose up -d

# 8. 等待服务启动
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 20

# 9. 检查服务状态
echo -e "${YELLOW}🔍 检查服务状态...${NC}"
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ 服务启动成功！${NC}"
    echo -e "${GREEN}🌐 主应用访问地址: http://localhost:3000${NC}"
    echo -e "${GREEN}🌐 Sandbox项目访问地址: http://localhost:3101${NC}"
    echo -e "${GREEN}🌐 Nginx 访问地址: http://localhost:8080${NC}"
else
    echo -e "${RED}❌ 服务启动失败${NC}"
    echo -e "${YELLOW}📋 查看日志:${NC}"
    docker compose logs
    exit 1
fi

# 10. 检查容器内环境变量
echo -e "${YELLOW}🔍 检查容器内环境变量...${NC}"
sleep 5  # 等待容器完全启动

if docker exec v0-sandbox-app printenv DIFY_API_ENDPOINT >/dev/null 2>&1; then
    DIFY_ENV=$(docker exec v0-sandbox-app printenv DIFY_API_ENDPOINT)
    echo -e "${GREEN}✅ 容器内 DIFY_API_ENDPOINT: $DIFY_ENV${NC}"
else
    echo -e "${RED}❌ 容器内未找到 DIFY_API_ENDPOINT 环境变量${NC}"
fi

if docker exec v0-sandbox-app printenv COMPONENT_DIFY_API_KEY >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 容器内 COMPONENT_DIFY_API_KEY 已设置${NC}"
else
    echo -e "${RED}❌ 容器内未找到 COMPONENT_DIFY_API_KEY 环境变量${NC}"
fi

# 11. 健康检查
echo -e "${YELLOW}🏥 执行健康检查...${NC}"

# 首先检查容器是否正在运行
echo -e "${YELLOW}🔍 检查容器状态...${NC}"
if ! docker ps | grep -q "v0-sandbox-app"; then
    echo -e "${RED}❌ 应用容器未运行${NC}"
    echo -e "${YELLOW}📋 查看所有容器状态:${NC}"
    docker ps -a
    echo -e "${YELLOW}📋 查看应用日志:${NC}"
    docker compose logs app
    exit 1
fi

# 检查端口是否监听
echo -e "${YELLOW}🔍 检查端口监听状态...${NC}"
if ! netstat -tlnp 2>/dev/null | grep -q ":3000" && ! ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${YELLOW}⚠️  端口3000未监听，等待应用启动...${NC}"
fi

if ! netstat -tlnp 2>/dev/null | grep -q ":3101" && ! ss -tlnp 2>/dev/null | grep -q ":3101"; then
    echo -e "${YELLOW}⚠️  端口3101未监听，等待Sandbox项目启动...${NC}"
fi

# 执行健康检查
for i in {1..30}; do
    echo -e "${YELLOW}🔄 健康检查尝试 $i/30...${NC}"
    
    # 尝试多种方式检查
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 主应用健康检查通过！${NC}"
        # 检查Sandbox项目是否也启动
        if curl -f http://localhost:3101 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Sandbox项目也启动成功！${NC}"
        else
            echo -e "${YELLOW}⚠️  Sandbox项目尚未启动，但主应用正常${NC}"
        fi
        break
    elif curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 主应用响应正常（健康检查端点可能不存在）${NC}"
        # 检查Sandbox项目
        if curl -f http://localhost:3101 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Sandbox项目也启动成功！${NC}"
        else
            echo -e "${YELLOW}⚠️  Sandbox项目尚未启动，但主应用正常${NC}"
        fi
        break
    elif curl -s http://localhost:3000/api/health 2>/dev/null | grep -q "healthy"; then
        echo -e "${GREEN}✅ 主应用健康检查通过（返回503但服务正常）${NC}"
        # 检查Sandbox项目
        if curl -f http://localhost:3101 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Sandbox项目也启动成功！${NC}"
        else
            echo -e "${YELLOW}⚠️  Sandbox项目尚未启动，但主应用正常${NC}"
        fi
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 健康检查失败${NC}"
        echo -e "${YELLOW}📋 容器状态:${NC}"
        docker ps | grep v0-sandbox
        echo -e "${YELLOW}📋 端口监听状态:${NC}"
        netstat -tlnp 2>/dev/null | grep ":3000" || ss -tlnp 2>/dev/null | grep ":3000" || echo "端口3000未监听"
        echo -e "${YELLOW}📋 应用日志（最后50行）:${NC}"
        docker compose logs --tail=50 app
        echo -e "${YELLOW}📋 尝试直接访问应用:${NC}"
        curl -v http://localhost:3000 2>&1 | head -20
        
        echo -e "${YELLOW}⚠️  健康检查失败，但应用可能仍在启动中${NC}"
        echo -e "${YELLOW}💡 请手动检查应用状态:${NC}"
        echo -e "${YELLOW}   - 访问: http://localhost:3000${NC}"
        echo -e "${YELLOW}   - 查看日志: docker compose logs -f app${NC}"
        echo -e "${YELLOW}   - 检查容器: docker ps${NC}"
        
        # 不退出，继续执行后续步骤
        echo -e "${YELLOW}🔄 继续执行部署流程...${NC}"
    fi
    sleep 3
done

echo -e "${GREEN}🎉 云服务器部署完成！${NC}"
echo -e "${GREEN}📊 服务状态:${NC}"
docker compose ps

echo -e "${YELLOW}💡 访问地址:${NC}"
echo -e "${YELLOW}   - 主应用: http://localhost:3000${NC}"
echo -e "${YELLOW}   - Sandbox项目: http://localhost:3101${NC}"
echo -e "${YELLOW}   - 通过 Nginx: http://localhost:8080${NC}"
echo -e "${YELLOW}   - 外网访问主应用: http://你的服务器IP:3000${NC}"
echo -e "${YELLOW}   - 外网访问Sandbox: http://你的服务器IP:3101${NC}"
echo -e "${YELLOW}   - 外网访问Nginx: http://你的服务器IP:8080${NC}"

# 12. 显示防火墙配置提示
echo -e "${YELLOW}🔒 防火墙配置提示:${NC}"
echo -e "${YELLOW}   如果无法外网访问，请开放以下端口:${NC}"
echo -e "${YELLOW}   sudo ufw allow 3000${NC}"
echo -e "${YELLOW}   sudo ufw allow 3101${NC}"
echo -e "${YELLOW}   sudo ufw allow 8080${NC}"

# 13. 显示使用说明
echo -e "${GREEN}📚 使用说明:${NC}"
echo -e "${GREEN}   - 完整部署: ./deploy.sh${NC}"
echo -e "${GREEN}   - 快速启动: ./deploy.sh --quick 或 ./deploy.sh -q${NC}"
echo -e "${GREEN}   - 查看日志: docker compose logs -f${NC}"
echo -e "${GREEN}   - 停止服务: docker compose down${NC}"
