#!/bin/bash

# V0-Sandbox 多项目架构部署脚本
# 使用方法: ./deploy-multi-project.sh [production|staging]

set -e

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

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 用户运行此脚本"
        log_info "使用: sudo $0 $@"
        exit 1
    fi
}

# 检查系统环境
check_system() {
    log_info "检查系统环境..."
    
    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        log_info "检测到操作系统: $OS $VER"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    # 检查内存
    MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ $MEMORY -lt 4096 ]; then
        log_warning "系统内存不足 4GB，建议升级到 8GB 或更高"
        log_warning "多项目架构需要更多内存资源"
    fi
    
    # 检查磁盘空间
    DISK=$(df -h / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ $DISK -lt 20 ]; then
        log_warning "磁盘空间不足 20GB，建议清理或扩容"
    fi
    
    log_success "系统环境检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    # 检测操作系统并使用对应的包管理器
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL 系统
        yum update -y
        yum install -y curl wget git
    else
        # Ubuntu/Debian 系统
        apt-get update
        apt-get install -y curl wget git
    fi
    
    log_success "系统依赖安装完成"
}

# 安装 Node.js
install_nodejs() {
    log_info "安装 Node.js 18..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ $NODE_VERSION -ge 18 ]; then
            log_info "Node.js 已安装，版本: $(node --version)"
            return 0
        fi
    fi
    
    # 使用官方源安装 Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    
    if [ -f /etc/redhat-release ]; then
        yum install -y nodejs
    else
        apt-get install -y nodejs
    fi
    
    log_success "Node.js 安装完成: $(node --version)"
}

# 安装 Docker
install_docker() {
    log_info "安装 Docker..."
    
    if command -v docker &> /dev/null; then
        log_info "Docker 已安装: $(docker --version)"
        return 0
    fi
    
    # 安装 Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # 启动 Docker 服务
    systemctl start docker
    systemctl enable docker
    
    # 添加当前用户到 docker 组
    usermod -aG docker $SUDO_USER
    
    log_success "Docker 安装完成: $(docker --version)"
}

# 创建应用用户
create_app_user() {
    log_info "创建应用用户..."
    
    if id "v0sandbox" &>/dev/null; then
        log_info "应用用户已存在"
        return 0
    fi
    
    # 创建用户
    useradd -m -s /bin/bash v0sandbox
    usermod -aG docker v0sandbox
    
    # 创建应用目录
    mkdir -p /opt/v0-sandbox
    chown v0sandbox:v0sandbox /opt/v0-sandbox
    
    log_success "应用用户创建完成"
}

# 部署主项目
deploy_main_project() {
    local environment=${1:-production}
    
    log_info "部署主项目到 $environment 环境..."
    
    # 切换到应用目录
    cd /opt/v0-sandbox
    
    # 如果是首次部署，克隆项目
    if [ ! -d "v0-sandbox" ]; then
        log_info "克隆项目代码..."
        git clone https://github.com/wayne-kk/sandbox.git v0-sandbox
    else
        log_info "更新项目代码..."
        cd v0-sandbox
        git pull origin main
        cd ..
    fi
    
    # 切换到项目目录
    cd v0-sandbox
    
    # 安装依赖
    log_info "安装项目依赖..."
    npm install
    
    # 生成 Prisma 客户端
    log_info "生成 Prisma 客户端..."
    npx prisma generate
    
    # 构建主项目（不包含 sandbox）
    log_info "构建主项目..."
    export NODE_OPTIONS="--max-old-space-size=2048"
    export NEXT_TELEMETRY_DISABLED=1
    export CI=true
    
    # 清理构建缓存
    rm -rf .next
    rm -rf node_modules/.cache
    
    # 构建应用
    npm run build
    
    # 创建数据目录
    mkdir -p data
    mkdir -p sandbox-projects
    
    # 数据库迁移
    log_info "运行数据库迁移..."
    npx prisma db push
    
    # 运行种子数据
    npm run db:seed
    
    log_success "主项目部署完成"
}

# 启动多项目服务
start_multi_project_services() {
    local environment=${1:-production}
    
    log_info "启动多项目服务..."
    
    # 切换到项目目录
    cd /opt/v0-sandbox/v0-sandbox
    
    # 使用多项目 Docker Compose
    if docker compose -f docker-compose.multi-project.yml version &> /dev/null; then
        docker compose -f docker-compose.multi-project.yml up -d
    elif command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.multi-project.yml up -d
    else
        log_error "Docker Compose 未安装，无法启动服务"
        exit 1
    fi
    
    log_success "多项目服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
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
    local server_ip=$(curl -s ifconfig.me || echo "your-server-ip")
    
    log_success "多项目架构部署完成！"
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
    echo "  - 主应用日志: /opt/v0-sandbox/v0-sandbox/logs/"
    echo "  - Sandbox 项目: /opt/v0-sandbox/v0-sandbox/sandbox-projects/"
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
    local environment=${1:-production}
    
    log_info "开始部署 V0-Sandbox 多项目架构..."
    log_info "部署环境: $environment"
    
    # 检查权限
    check_root
    
    # 系统环境检查
    check_system
    
    # 安装依赖
    install_dependencies
    install_nodejs
    install_docker
    
    # 配置系统
    create_app_user
    
    # 部署应用
    deploy_main_project $environment
    start_multi_project_services $environment
    
    # 健康检查
    if health_check; then
        show_deployment_info
    else
        log_error "部署失败，请检查日志"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "V0-Sandbox 多项目架构部署脚本"
    echo ""
    echo "使用方法:"
    echo "  sudo $0 [环境]"
    echo ""
    echo "环境选项:"
    echo "  production  - 生产环境 (默认)"
    echo "  staging     - 测试环境"
    echo ""
    echo "示例:"
    echo "  sudo $0 production    # 部署到生产环境"
    echo "  sudo $0 staging       # 部署到测试环境"
    echo ""
    echo "注意:"
    echo "  - 需要 root 权限运行"
    echo "  - 确保服务器已安装 Git"
    echo "  - 需要配置环境变量"
    echo "  - 多项目架构需要更多系统资源"
}

# 检查参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# 执行主函数
main "$@"
