#!/bin/bash

# 简化的依赖安装脚本 - 专门解决网络问题
# 使用方法: sudo ./install-deps-only.sh

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
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 用户运行此脚本"
    log_info "使用: sudo $0"
    exit 1
fi

log_info "开始安装依赖..."

# 检测操作系统
if [ -f /etc/redhat-release ]; then
    OS_TYPE="centos"
    log_info "检测到 CentOS/RHEL 系统"
else
    OS_TYPE="ubuntu"
    log_info "检测到 Ubuntu/Debian 系统"
fi

# 安装 Node.js
log_info "安装 Node.js 18..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ $NODE_VERSION -ge 18 ]; then
        log_info "Node.js 已安装，版本: $(node --version)"
    else
        log_info "Node.js 版本过低，重新安装..."
    fi
else
    log_info "Node.js 未安装，开始安装..."
fi

# 尝试多个源安装 Node.js
NODE_INSTALLED=false

# 尝试清华源
if [ "$NODE_INSTALLED" = false ]; then
    log_info "尝试使用清华源安装 Node.js..."
    if curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/nodesource/setup_18.x | bash -; then
        if [ "$OS_TYPE" = "centos" ]; then
            yum install -y nodejs && NODE_INSTALLED=true
        else
            apt-get install -y nodejs && NODE_INSTALLED=true
        fi
    fi
fi

# 尝试官方源
if [ "$NODE_INSTALLED" = false ]; then
    log_warning "清华源失败，尝试官方源..."
    if curl -fsSL https://deb.nodesource.com/setup_18.x | bash -; then
        if [ "$OS_TYPE" = "centos" ]; then
            yum install -y nodejs && NODE_INSTALLED=true
        else
            apt-get install -y nodejs && NODE_INSTALLED=true
        fi
    fi
fi

# 尝试 EPEL 源（仅 CentOS）
if [ "$NODE_INSTALLED" = false ] && [ "$OS_TYPE" = "centos" ]; then
    log_warning "官方源失败，尝试 EPEL 源..."
    yum install -y epel-release
    yum install -y nodejs npm && NODE_INSTALLED=true
fi

if [ "$NODE_INSTALLED" = true ]; then
    log_success "Node.js 安装完成: $(node --version)"
else
    log_error "Node.js 安装失败"
    exit 1
fi

# 安装 Docker
log_info "安装 Docker..."

if command -v docker &> /dev/null; then
    log_info "Docker 已安装: $(docker --version)"
else
    log_info "Docker 未安装，开始安装..."
    
    if [ "$OS_TYPE" = "centos" ]; then
        # CentOS 安装 Docker
        log_info "使用 CentOS 方式安装 Docker..."
        
        # 卸载旧版本
        yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine 2>/dev/null || true
        
        # 安装必要的包
        yum install -y yum-utils device-mapper-persistent-data lvm2
        
        # 尝试多个 Docker 源
        DOCKER_INSTALLED=false
        
        # 尝试清华源
        if [ "$DOCKER_INSTALLED" = false ]; then
            log_info "尝试使用清华源安装 Docker..."
            if yum-config-manager --add-repo https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/docker-ce.repo; then
                yum makecache
                if yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin; then
                    DOCKER_INSTALLED=true
                fi
            fi
        fi
        
        # 尝试阿里云源
        if [ "$DOCKER_INSTALLED" = false ]; then
            log_warning "清华源失败，尝试阿里云源..."
            if yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo; then
                yum makecache
                if yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin; then
                    DOCKER_INSTALLED=true
                fi
            fi
        fi
        
        # 尝试官方源
        if [ "$DOCKER_INSTALLED" = false ]; then
            log_warning "阿里云源失败，尝试官方源..."
            if yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo; then
                yum makecache
                if yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin; then
                    DOCKER_INSTALLED=true
                fi
            fi
        fi
        
    else
        # Ubuntu 安装 Docker
        log_info "使用 Ubuntu 方式安装 Docker..."
        
        # 卸载旧版本
        apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # 安装必要的包
        apt-get update
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        
        # 尝试多个 Docker 源
        DOCKER_INSTALLED=false
        
        # 尝试清华源
        if [ "$DOCKER_INSTALLED" = false ]; then
            log_info "尝试使用清华源安装 Docker..."
            if curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg; then
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
                apt-get update
                if apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin; then
                    DOCKER_INSTALLED=true
                fi
            fi
        fi
        
        # 尝试官方源
        if [ "$DOCKER_INSTALLED" = false ]; then
            log_warning "清华源失败，尝试官方源..."
            if curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg; then
                echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
                apt-get update
                if apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin; then
                    DOCKER_INSTALLED=true
                fi
            fi
        fi
    fi
    
    if [ "$DOCKER_INSTALLED" = true ]; then
        # 启动 Docker 服务
        systemctl start docker
        systemctl enable docker
        
        # 添加当前用户到 docker 组
        usermod -aG docker $SUDO_USER
        
        # 配置 Docker 镜像加速
        log_info "配置 Docker 镜像加速..."
        mkdir -p /etc/docker
        cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn",
    "https://reg-mirror.qiniu.com",
    "https://hub-mirror.c.163.com"
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
EOF
        
        # 重启 Docker 服务使配置生效
        systemctl daemon-reload
        systemctl restart docker
        
        log_success "Docker 安装完成: $(docker --version)"
    else
        log_error "Docker 安装失败"
        exit 1
    fi
fi

# 安装 Nginx
log_info "安装 Nginx..."

if command -v nginx &> /dev/null; then
    log_info "Nginx 已安装: $(nginx -v 2>&1)"
else
    if [ "$OS_TYPE" = "centos" ]; then
        yum install -y nginx
    else
        apt-get update
        apt-get install -y nginx
    fi
    
    systemctl start nginx
    systemctl enable nginx
    log_success "Nginx 安装完成"
fi

# 安装 PM2
log_info "安装 PM2..."

if command -v pm2 &> /dev/null; then
    log_info "PM2 已安装: $(pm2 --version)"
else
    npm install -g pm2
    log_success "PM2 安装完成: $(pm2 --version)"
fi

log_success "所有依赖安装完成！"
echo ""
echo "安装的软件版本:"
echo "  - Node.js: $(node --version)"
echo "  - NPM: $(npm --version)"
echo "  - Docker: $(docker --version)"
echo "  - Docker Compose: $(docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || echo '未安装')"
echo "  - Nginx: $(nginx -v 2>&1)"
echo "  - PM2: $(pm2 --version)"
echo ""
echo "现在可以运行部署脚本: sudo ./deploy.sh production"
