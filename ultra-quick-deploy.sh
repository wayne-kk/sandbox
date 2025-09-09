#!/bin/bash

echo "⚡ V0 Sandbox 超快速部署"
echo "======================="

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "服务器IP: $SERVER_IP"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

# 创建环境变量文件（如果不存在）
if [ ! -f ".env.local" ]; then
    echo "📝 创建环境变量文件..."
    cat > .env.local << EOF
# 生产环境配置
NODE_ENV=production
NEXT_PUBLIC_NODE_ENV=production
SERVER_HOST=$SERVER_IP
NEXT_PUBLIC_SERVER_HOST=$SERVER_IP
SANDBOX_PREVIEW_URL=http://$SERVER_IP/sandbox/
NEXT_PUBLIC_SANDBOX_PREVIEW_URL=http://$SERVER_IP/sandbox/
DATABASE_URL=file:./data/prod.db
DIFY_API_KEY=
DIFY_API_ENDPOINT=http://152.136.41.186:32422/v1/workflows/run
COMPONENT_DIFY_API_KEY=app-p363bFgzxF8m9J1eyl5wasBT
REQUIRMENT_DIFY_API_KEY=app-YgkdhmiPidrzl8e1bbaIdNrb
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://$SERVER_IP:3000
NEXT_PUBLIC_APP_URL=http://$SERVER_IP:3000
REDIS_URL=redis://redis:6379
http_proxy=
https_proxy=
HTTP_PROXY=
HTTPS_PROXY=
no_proxy=152.136.41.186
NO_PROXY=152.136.41.186
EOF
fi

# 停止旧容器
echo "🛑 停止旧容器..."
docker compose down 2>/dev/null || true

# 拉取最新代码（如果是在服务器上运行）
if [ -d ".git" ]; then
    echo "📥 拉取最新代码..."
    git pull origin main 2>/dev/null || echo "⚠️  Git拉取失败，继续使用当前代码"
fi

# 修复sandbox配置
echo "🔧 修复sandbox配置..."
if [ -f "sandbox/package.json" ]; then
    # 更新启动脚本，使用0.0.0.0 hostname
    sed -i 's/"dev": "next dev --turbopack --port 3100"/"dev": "next dev --port 3100 --hostname 0.0.0.0"/' sandbox/package.json
    echo "✅ 已修复sandbox启动配置"
fi

# 检查是否需要重新构建
NEED_REBUILD=false

# 检查镜像是否存在
if ! docker images | grep -q "v0-sandbox-app"; then
    echo "📦 镜像不存在，需要构建"
    NEED_REBUILD=true
fi

# 检查关键文件是否有变化
if [ -f ".last-deploy" ]; then
    if [ "package.json" -nt ".last-deploy" ] || [ "Dockerfile" -nt ".last-deploy" ] || [ "docker-compose.yml" -nt ".last-deploy" ]; then
        echo "📝 关键文件有变化，需要重新构建"
        NEED_REBUILD=true
    fi
else
    echo "📦 首次部署，需要构建"
    NEED_REBUILD=true
fi

# 构建或使用现有镜像
if [ "$NEED_REBUILD" = true ]; then
    echo "🔨 重新构建应用..."
    echo "⚡ 使用优化构建配置..."
    
    # 使用BuildKit和并行构建
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # 并行构建，显示进度
    docker compose build --parallel --progress=plain
else
    echo "⚡ 使用现有镜像，跳过构建"
fi

# 启动服务
echo "🚀 启动服务..."
docker compose up -d

# 等待启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查状态
echo "🔍 检查服务状态..."
docker compose ps

# 测试访问
echo "🧪 测试访问..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health 2>/dev/null)
if [ $? -eq 0 ] && echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ 主服务正常"
else
    echo "⚠️  主服务响应异常，但可能仍在运行"
    echo "   响应: $HEALTH_RESPONSE"
fi

# 测试Sandbox启动
echo "🧪 测试Sandbox启动..."
sleep 3
curl -X POST http://localhost:3000/api/sandbox/start >/dev/null 2>&1
sleep 5

# 检查sandbox状态
SANDBOX_STATUS=$(curl -s http://localhost:3000/api/sandbox/start | jq -r '.running // false' 2>/dev/null || echo "false")
if [ "$SANDBOX_STATUS" = "true" ]; then
    echo "✅ Sandbox服务正常"
else
    echo "⚠️  Sandbox服务可能需要手动启动"
fi

# 记录部署时间
touch .last-deploy

echo ""
echo "🎉 超快速部署完成！"
echo "📱 访问地址:"
echo "  - 主应用: http://$SERVER_IP:3000"
echo "  - Sandbox预览: http://$SERVER_IP/sandbox"
echo ""
echo "🔧 管理命令:"
echo "  - 查看日志: docker compose logs -f"
echo "  - 重启服务: docker compose restart"
echo "  - 停止服务: docker compose down"
echo ""
echo "💡 优化特性:"
echo "  - 使用BuildKit并行构建"
echo "  - 智能检测文件变化"
echo "  - 优化npm安装配置"
echo "  - 减少构建上下文大小"
