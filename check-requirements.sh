#!/bin/bash

# 系统要求检查脚本
# 使用方法: ./check-requirements.sh

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

# 检查系统要求
check_requirements() {
    log_info "🔍 检查系统要求..."
    
    local all_good=true
    
    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        log_info "操作系统: $NAME $VER"
    else
        log_warning "无法检测操作系统"
    fi
    
    # 检查内存
    MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    log_info "系统内存: ${MEMORY}MB"
    
    if [ $MEMORY -lt 4096 ]; then
        log_warning "内存不足 4GB，建议升级到 8GB 或更高"
        all_good=false
    fi
    
    # 检查磁盘空间
    DISK=$(df -h / | awk 'NR==2{print $4}' | sed 's/G//')
    log_info "可用磁盘空间: ${DISK}GB"
    
    if [ $DISK -lt 20 ]; then
        log_warning "磁盘空间不足 20GB，建议清理或扩容"
        all_good=false
    fi
    
    # 检查 Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        log_info "Node.js: $NODE_VERSION"
        
        if [ $NODE_MAJOR -lt 18 ]; then
            log_error "Node.js 版本过低，需要 18 或更高版本"
            all_good=false
        fi
    else
        log_error "Node.js 未安装"
        all_good=false
    fi
    
    # 检查 Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        log_info "Docker: $DOCKER_VERSION"
        
        # 检查 Docker 是否运行
        if ! docker info &> /dev/null; then
            log_error "Docker 未运行，请启动 Docker 服务"
            all_good=false
        fi
    else
        log_error "Docker 未安装"
        all_good=false
    fi
    
    # 检查 Docker Compose
    if docker compose version &> /dev/null; then
        log_info "Docker Compose: $(docker compose version)"
    elif command -v docker-compose &> /dev/null; then
        log_info "Docker Compose: $(docker-compose --version)"
    else
        log_error "Docker Compose 未安装"
        all_good=false
    fi
    
    # 检查 Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        log_info "Git: $GIT_VERSION"
    else
        log_error "Git 未安装"
        all_good=false
    fi
    
    # 检查网络连接
    if curl -s https://api.github.com &> /dev/null; then
        log_info "网络连接: 正常"
    else
        log_warning "网络连接可能有问题"
    fi
    
    echo ""
    if [ "$all_good" = true ]; then
        log_success "✅ 系统要求检查通过，可以开始部署！"
        echo ""
        echo "🚀 部署命令:"
        echo "  sudo ./deploy-multi-project.sh production"
        echo ""
    else
        log_error "❌ 系统要求检查失败，请解决上述问题后重试"
        echo ""
        echo "🔧 常见解决方案:"
        echo "  - 安装 Node.js 18+: https://nodejs.org/"
        echo "  - 安装 Docker: https://docs.docker.com/get-docker/"
        echo "  - 安装 Docker Compose: https://docs.docker.com/compose/install/"
        echo "  - 安装 Git: https://git-scm.com/downloads"
        echo ""
        exit 1
    fi
}

# 执行检查
check_requirements
