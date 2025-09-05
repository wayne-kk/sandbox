#!/bin/bash

# 分步部署脚本 - 更安全的部署方式
# 使用方法: ./deploy-step-by-step.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查系统环境
check_system() {
    log_info "🔍 检查系统环境..."
    
    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        log_info "操作系统: $NAME $VER"
    fi
    
    # 检查内存
    MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    log_info "系统内存: ${MEMORY}MB"
    
    if [ $MEMORY -lt 4096 ]; then
        log_warning "内存不足 4GB，多项目架构可能运行缓慢"
    fi
    
    # 检查磁盘空间
    DISK=$(df -h / | awk 'NR==2{print $4}' | sed 's/G//')
    log_info "可用磁盘空间: ${DISK}GB"
    
    if [ $DISK -lt 20 ]; then
        log_warning "磁盘空间不足 20GB，建议清理或扩容"
    fi
    
    log_success "系统环境检查完成"
}

# 检查依赖
check_dependencies() {
    log_info "🔍 检查依赖..."
    
    # 检查 Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js: $NODE_VERSION"
    else
        log_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_info "Docker: $DOCKER_VERSION"
    else
        log_error "Docker 未安装"
        exit 1
    fi
    
    # 检查 Docker Compose
    if docker compose version &> /dev/null; then
        log_info "Docker Compose: $(docker compose version)"
    elif command -v docker-compose &> /dev/null; then
        log_info "Docker Compose: $(docker-compose --version)"
    else
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 准备环境
prepare_environment() {
    log_info "🔧 准备环境..."
    
    # 创建必要的目录
    mkdir -p sandbox-projects
    mkdir -p data
    mkdir -p logs
    
    # 设置权限
    chmod 755 sandbox-projects
    chmod 755 data
    chmod 755 logs
    
    log_success "环境准备完成"
}

# 安装依赖
install_dependencies() {
    log_info "📦 安装项目依赖..."
    
    # 安装 Node.js 依赖
    npm install
    
    # 生成 Prisma 客户端
    npx prisma generate
    
    log_success "依赖安装完成"
}

# 构建主项目
build_main_project() {
    log_info "🏗️ 构建主项目..."
    
    # 设置环境变量
    export NODE_OPTIONS="--max-old-space-size=2048"
    export NEXT_TELEMETRY_DISABLED=1
    export CI=true
    
    # 清理构建缓存
    rm -rf .next
    rm -rf node_modules/.cache
    
    # 构建应用
    npm run build
    
    log_success "主项目构建完成"
}

# 数据库迁移
migrate_database() {
    log_info "🗄️ 运行数据库迁移..."
    
    # 数据库迁移
    npx prisma db push
    
    # 运行种子数据
    npm run db:seed
    
    log_success "数据库迁移完成"
}

# 启动服务
start_services() {
    log_info "🚀 启动服务..."
    
    # 使用多项目 Docker Compose
    if docker compose -f docker-compose.multi-project.yml version &> /dev/null; then
        docker compose -f docker-compose.multi-project.yml up -d
    elif command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.multi-project.yml up -d
    else
        log_error "Docker Compose 未安装，无法启动服务"
        exit 1
    fi
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "🏥 执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "主应用健康检查通过"
            return 0
        fi
        
        log_info "健康检查尝试 $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    log_error "健康检查失败，应用可能未正常启动"
    return 1
}

# 显示部署信息
show_deployment_info() {
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    
    log_success "🎉 部署完成！"
    echo ""
    echo "🌐 服务访问地址:"
    echo "  - 主应用: http://$server_ip"
    echo "  - 健康检查: http://$server_ip/api/health"
    echo ""
    echo "📊 管理命令:"
    echo "  - 查看服务状态: docker compose -f docker-compose.multi-project.yml ps"
    echo "  - 查看服务日志: docker compose -f docker-compose.multi-project.yml logs -f"
    echo "  - 重启服务: docker compose -f docker-compose.multi-project.yml restart"
    echo "  - 停止服务: docker compose -f docker-compose.multi-project.yml down"
    echo ""
    echo "🔧 系统管理:"
    echo "  - 查看系统资源: htop"
    echo "  - 查看磁盘使用: df -h"
    echo "  - 查看内存使用: free -h"
    echo "  - 查看 Docker 状态: docker ps"
    echo ""
    echo "📝 日志位置:"
    echo "  - 主应用日志: ./logs/"
    echo "  - Sandbox 项目: ./sandbox-projects/"
    echo "  - Docker 日志: docker logs <container-name>"
    echo ""
    echo "🎯 架构说明:"
    echo "  - 主项目: 端口 3000，提供 IDE 界面和项目管理"
    echo "  - Sandbox 项目: 端口 3001-3010，动态创建和运行"
    echo "  - Nginx: 端口 80/443，反向代理和负载均衡"
    echo ""
}

# 主函数
main() {
    log_info "开始分步部署 V0-Sandbox 多项目架构..."
    
    # 检查系统环境
    check_system
    
    # 检查依赖
    check_dependencies
    
    # 准备环境
    prepare_environment
    
    # 安装依赖
    install_dependencies
    
    # 构建主项目
    build_main_project
    
    # 数据库迁移
    migrate_database
    
    # 启动服务
    start_services
    
    # 健康检查
    if health_check; then
        show_deployment_info
    else
        log_error "部署失败，请检查日志"
        exit 1
    fi
}

# 执行主函数
main "$@"
