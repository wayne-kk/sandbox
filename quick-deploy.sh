#!/bin/bash

# 配置
PROJECT_NAME="V0 Sandbox"
ENVIRONMENT=${1:-"production"}
FEISHU_WEBHOOK_URL=${FEISHU_WEBHOOK_URL:-""}
APP_URL=${APP_URL:-"http://localhost:3000"}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 发送飞书通知
send_feishu_notification() {
    local status=$1
    local error_message=${2:-""}
    local duration=${3:-0}
    
    if [ -z "$FEISHU_WEBHOOK_URL" ]; then
        log_warning "飞书 Webhook URL 未配置，跳过通知"
        return 0
    fi
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local url=""
    
    if [ "$status" = "success" ]; then
        url="$DISPLAY_URL"
    fi
    
    local payload=$(cat <<EOF
{
    "status": "$status",
    "project": "$PROJECT_NAME",
    "environment": "$ENVIRONMENT",
    "duration": $duration,
    "error": "$error_message",
    "url": "$url",
    "timestamp": "$timestamp"
}
EOF
)
    
    log_info "发送飞书通知: $status"
    
    local response=$(curl -s -X POST "$APP_URL/api/feishu/notify" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null || echo '{"success": false, "error": "请求失败"}')
    
    local success=$(echo "$response" | jq -r '.success // false' 2>/dev/null || echo "false")
    
    if [ "$success" = "true" ]; then
        log_success "飞书通知发送成功"
    else
        log_error "飞书通知发送失败: $response"
    fi
}

echo "⚡ V0 Sandbox 快速部署"
echo "===================="

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "服务器IP: $SERVER_IP"

# 设置 APP_URL 和显示地址
if [ "$APP_URL" = "http://localhost:3000" ]; then
    APP_URL="http://$SERVER_IP:3000"
fi

# 获取显示地址（优先使用域名）
DISPLAY_URL=""
if [ -n "$EXTERNAL_DOMAIN" ]; then
    # 使用配置的域名
    if [ "$EXTERNAL_PROTOCOL" = "https" ]; then
        DISPLAY_URL="https://$EXTERNAL_DOMAIN"
    else
        DISPLAY_URL="http://$EXTERNAL_DOMAIN"
    fi
    if [ -n "$EXTERNAL_PORT" ] && [ "$EXTERNAL_PORT" != "80" ] && [ "$EXTERNAL_PORT" != "443" ]; then
        DISPLAY_URL="$DISPLAY_URL:$EXTERNAL_PORT"
    fi
elif [ -n "$SERVER_HOST" ] && [ "$SERVER_HOST" != "localhost" ]; then
    # 使用 SERVER_HOST 配置
    DISPLAY_URL="http://$SERVER_HOST:3000"
else
    # 使用服务器 IP
    DISPLAY_URL="http://$SERVER_IP:3000"
fi

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

# 记录部署开始时间
DEPLOY_START_TIME=$(date +%s)

# 发送部署开始通知
send_feishu_notification "started"

# 创建环境变量文件（如果不存在）
if [ ! -f ".env.local" ]; then
    echo "📝 创建环境变量文件..."
    cat > .env.local << EOF
# 生产环境配置
NODE_ENV=production
NEXT_PUBLIC_NODE_ENV=production
SERVER_HOST=$SERVER_IP
NEXT_PUBLIC_SERVER_HOST=$SERVER_IP
EXTERNAL_DOMAIN=wayne.beer
EXTERNAL_PROTOCOL=https
EXTERNAL_PORT=
SANDBOX_PREVIEW_URL=https://sandbox.wayne.beer/
NEXT_PUBLIC_SANDBOX_PREVIEW_URL=https://sandbox.wayne.beer/
DATABASE_URL=file:./data/prod.db
DIFY_API_KEY=
DIFY_API_ENDPOINT=http://152.136.41.186:32422/v1/workflows/run
COMPONENT_DIFY_API_KEY=app-p363bFgzxF8m9J1eyl5wasBT
REQUIRMENT_DIFY_API_KEY=app-YgkdhmiPidrzl8e1bbaIdNrb
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://$SERVER_IP:3000
NEXT_PUBLIC_APP_URL=http://$SERVER_IP:3000
FEISHU_WEBHOOK_URL=$FEISHU_WEBHOOK_URL
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

# 修复sandbox配置和权限
echo "🔧 修复sandbox配置和权限..."

# 修复文件权限
echo "🔐 修复sandbox目录权限..."
sudo chown -R 1001:1001 sandbox/ 2>/dev/null || true
chmod -R 755 sandbox/ 2>/dev/null || true

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
    
    # 启用 BuildKit 优化
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # 构建优化环境变量
    export BUILDKIT_PROGRESS=plain
    export DOCKER_BUILDKIT_MULTI_PLATFORM=0
    
    # 检查具体变化类型
    CHANGED_FILES=$(git diff HEAD~1 --name-only 2>/dev/null || echo "")
    
    if echo "$CHANGED_FILES" | grep -q "sandbox/package.json\|sandbox/pnpm-lock.yaml"; then
        echo "📦 检测到依赖变化，进行完全重建..."
        docker system prune -f
        docker builder prune -f
        docker rmi v0-sandbox-app v0-sandbox-sandbox 2>/dev/null || true
        docker compose build --no-cache
    elif echo "$CHANGED_FILES" | grep -q "sandbox/" && ! echo "$CHANGED_FILES" | grep -q "sandbox/package.json\|sandbox/pnpm-lock.yaml"; then
        echo "📝 检测到sandbox代码变化，使用缓存构建..."
        docker compose build
    elif echo "$CHANGED_FILES" | grep -q "package.json\|Dockerfile\|docker-compose.yml"; then
        echo "🔧 检测到主项目变化，使用缓存构建..."
        docker compose build
    else
        echo "⚡ 使用缓存构建..."
        docker compose build
    fi
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

# 计算部署耗时
DEPLOY_END_TIME=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))000  # 转换为毫秒

# 发送部署成功通知
send_feishu_notification "success" "" $DEPLOY_DURATION

echo ""
echo "🎉 快速部署完成！"
echo "📱 访问地址:"
echo "  - 主应用: $DISPLAY_URL"
echo "  - Sandbox预览: $DISPLAY_URL/sandbox"
echo ""
echo "⏱️ 部署耗时: $((DEPLOY_DURATION / 1000)) 秒"
echo ""
echo "🔧 管理命令:"
echo "  - 查看日志: docker compose logs -f"
echo "  - 重启服务: docker compose restart"
echo "  - 停止服务: docker compose down"
echo ""
echo "💡 功能说明:"
echo "  - 智能检测变化类型并选择构建策略"
echo "  - 依赖变化时完全重建，代码变化时使用缓存"
echo "  - 自动修复sandbox配置问题"
echo "  - 验证sandbox代码更新"
echo "  - 飞书通知部署状态"
echo "  - 构建缓存优化，减少重复构建时间"

# 错误处理函数
handle_deployment_error() {
    local error_code=$?
    local error_message="部署过程中发生错误，退出码: $error_code"
    
    # 计算部署耗时
    local end_time=$(date +%s)
    local duration=$((end_time - DEPLOY_START_TIME))000
    
    log_error "$error_message"
    
    # 发送部署失败通知
    send_feishu_notification "failed" "$error_message" $duration
    
    exit $error_code
}

# 设置错误处理
trap 'handle_deployment_error' ERR