#!/bin/bash

echo "🚀 V0 Sandbox 云服务器部署"
echo "========================"

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "服务器IP: $SERVER_IP"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "安装Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker安装完成，请重新登录"
    exit 0
fi

# 检查Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "安装Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 创建简单的环境变量文件
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
http_proxy=
https_proxy=
HTTP_PROXY=
HTTPS_PROXY=
no_proxy=152.136.41.186
NO_PROXY=152.136.41.186
EOF

echo "环境变量已创建"

# 停止旧容器
docker compose down 2>/dev/null || true

# 清理Docker缓存
echo "清理Docker缓存..."
docker system prune -f 2>/dev/null || true

# 修复sandbox配置
echo "修复sandbox配置..."
# 确保sandbox使用正确的端口和配置
if [ -f "sandbox/package.json" ]; then
    # 备份原文件
    cp sandbox/package.json sandbox/package.json.bak
    
    # 更新启动脚本，禁用turbopack，使用0.0.0.0 hostname
    sed -i 's/"dev": "next dev --turbopack --port 3100"/"dev": "next dev --port 3100 --hostname 0.0.0.0"/' sandbox/package.json
    echo "✅ 已修复sandbox启动配置"
fi

# 构建并启动
echo "构建应用..."
echo "⚡ 使用优化构建配置..."
DOCKER_BUILDKIT=1 docker compose --progress=plain build --parallel

echo "启动服务..."
docker compose up -d

# 等待启动
echo "等待服务启动..."
sleep 30

# 检查状态
echo "检查服务状态..."
docker compose ps

# 测试访问
echo "测试访问..."
if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "✅ 主服务正常"
else
    echo "❌ 主服务异常"
fi

if curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ Nginx代理正常"
else
    echo "❌ Nginx代理异常"
fi

# 测试Sandbox启动
echo "测试Sandbox启动..."
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

echo ""
echo "🎉 部署完成！"
echo ""
echo "📱 访问地址:"
echo "  - 主应用: http://$SERVER_IP:3000"
echo "  - Sandbox 实时预览: http://$SERVER_IP:3000/sandbox"
echo "  - API 健康检查: http://$SERVER_IP:3000/api/health"
echo ""
echo "🔧 管理命令:"
echo "  - 查看日志: docker compose logs -f"
echo "  - 停止服务: docker compose down"
echo "  - 重启服务: docker compose restart"
echo ""
echo "🎯 Sandbox 实时预览功能:"
echo "  - 支持在线代码编辑和实时预览"
echo "  - 自动热重载，代码修改立即生效"
echo "  - 支持多个并发项目 (端口 3100-3110)"
echo ""
echo "⚠️  重要提醒:"
echo "  - 确保云服务商安全组已开放端口 8080, 3100-3110"
echo "  - Sandbox 需要在线运行以支持实时预览"
echo "  - 首次启动可能需要安装依赖，请耐心等待"
