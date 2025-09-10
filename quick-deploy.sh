#!/bin/bash

echo "⚡ V0 Sandbox 快速部署"
echo "===================="

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "服务器IP: $SERVER_IP"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查是否需要重新构建
NEED_REBUILD=false

# 检查镜像是否存在
if ! docker images | grep -q "v0-sandbox-app"; then
    echo "📦 镜像不存在，需要构建"
    NEED_REBUILD=true
fi

# 检查源代码是否有变化
if [ -f ".last-deploy" ]; then
    if [ "package.json" -nt ".last-deploy" ] || [ "Dockerfile" -nt ".last-deploy" ] || [ "docker-compose.yml" -nt ".last-deploy" ]; then
        echo "📝 源代码有变化，需要重新构建"
        NEED_REBUILD=true
    fi
else
    echo "📦 首次部署，需要构建"
    NEED_REBUILD=true
fi

# 检查是否有sandbox相关文件变化
if git diff HEAD~1 --name-only 2>/dev/null | grep -q "sandbox/"; then
    echo "📝 检测到sandbox文件变化，需要重新构建"
    NEED_REBUILD=true
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
SANDBOX_PREVIEW_URL=http://$SERVER_IP:3000/sandbox/
NEXT_PUBLIC_SANDBOX_PREVIEW_URL=http://$SERVER_IP:3000/sandbox/
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
    # 备份原文件
    cp sandbox/package.json sandbox/package.json.bak
    
    # 更新启动脚本，使用0.0.0.0 hostname
    sed -i 's/"dev": "next dev --turbopack --port 3100"/"dev": "next dev --port 3100 --hostname 0.0.0.0"/' sandbox/package.json
    echo "✅ 已修复sandbox启动配置"
fi

# 检查是否需要重新构建
if [ "$NEED_REBUILD" = true ]; then
    echo "🔨 重新构建应用..."
    
    # 如果检测到sandbox变化，进行完全重建
    if git diff HEAD~1 --name-only 2>/dev/null | grep -q "sandbox/"; then
        echo "🧹 检测到sandbox变化，进行完全重建..."
        docker system prune -f
        docker builder prune -f
        docker rmi v0-sandbox-app 2>/dev/null || true
    fi
    
    docker compose build --no-cache
else
    echo "⚡ 使用现有镜像，跳过构建"
fi

# 启动服务
echo "🚀 启动服务..."
docker compose up -d

# 等待启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查状态
echo "🔍 检查服务状态..."
docker compose ps

# 测试访问
echo "🧪 测试访问..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ 主服务正常"
else
    echo "❌ 主服务异常"
fi

# 测试Sandbox启动
echo "🧪 测试Sandbox启动..."
sleep 5
curl -X POST http://localhost:3000/api/sandbox/start >/dev/null 2>&1
sleep 10

# 检查sandbox状态
SANDBOX_STATUS=$(curl -s http://localhost:3000/api/sandbox/start | jq -r '.running // false' 2>/dev/null || echo "false")
if [ "$SANDBOX_STATUS" = "true" ]; then
    echo "✅ Sandbox服务正常"
else
    echo "⚠️  Sandbox服务可能需要手动启动"
fi

# 验证sandbox代码更新（如果进行了重建）
if [ "$NEED_REBUILD" = true ]; then
    echo "🔍 验证sandbox代码更新..."
    if docker compose exec app ls -la /app/sandbox/ 2>/dev/null | grep -q "package.json"; then
        echo "✅ Sandbox目录已正确挂载"
    else
        echo "⚠️  Sandbox目录挂载可能有问题"
    fi
fi

# 记录部署时间
touch .last-deploy

echo ""
echo "🎉 快速部署完成！"
echo "📱 访问地址:"
echo "  - 主应用: http://$SERVER_IP:3000"
echo "  - Sandbox预览: http://$SERVER_IP:3000/sandbox"
echo ""
echo "🔧 管理命令:"
echo "  - 查看日志: docker compose logs -f"
echo "  - 重启服务: docker compose restart"
echo "  - 停止服务: docker compose down"
echo ""
echo "💡 功能说明:"
echo "  - 自动检测代码变化并重新构建"
echo "  - 检测到sandbox变化时进行完全重建"
echo "  - 自动修复sandbox配置问题"
echo "  - 验证sandbox代码更新"