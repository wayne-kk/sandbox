#!/bin/bash

# V0 Sandbox 部署脚本
# 使用方法: ./deploy.sh [production|staging]

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
    if [ $MEMORY -lt 2048 ]; then
        log_warning "系统内存不足 2GB，建议升级到 4GB 或更高"
    fi
    
    # 检查磁盘空间
    DISK=$(df -h / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ $DISK -lt 10 ]; then
        log_warning "磁盘空间不足 10GB，建议清理或扩容"
    fi
    
    log_success "系统环境检查完成"
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
    
    # 检测操作系统并使用对应的源
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL 系统使用清华源
        log_info "检测到 CentOS/RHEL 系统，使用清华源安装 Node.js..."
        curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/nodesource/setup_18.x | bash -
        yum install -y nodejs
    else
        # Ubuntu/Debian 系统使用清华源
        log_info "检测到 Ubuntu/Debian 系统，使用清华源安装 Node.js..."
        curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/nodesource/setup_18.x | bash -
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
    
    # 检测操作系统并使用对应的源
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL 系统使用清华源
        log_info "检测到 CentOS/RHEL 系统，使用清华源安装 Docker..."
        
        # 卸载旧版本
        yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
        
        # 安装必要的包
        yum install -y yum-utils device-mapper-persistent-data lvm2
        
        # 添加清华源 Docker 仓库
        yum-config-manager --add-repo https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/centos/docker-ce.repo
        
        # 更新缓存
        yum makecache fast
        
        # 安装 Docker
        yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
    else
        # Ubuntu/Debian 系统使用清华源
        log_info "检测到 Ubuntu/Debian 系统，使用清华源安装 Docker..."
        
        # 卸载旧版本
        apt-get remove -y docker docker-engine docker.io containerd runc
        
        # 安装必要的包
        apt-get update
        apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
        
        # 添加清华源 GPG 密钥
        curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # 添加清华源仓库
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # 更新包索引
        apt-get update
        
        # 安装 Docker
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi
    
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
}

# 安装 Docker Compose
install_docker_compose() {
    log_info "安装 Docker Compose..."
    
    # 检查 Docker Compose V2 (docker compose)
    if docker compose version &> /dev/null; then
        log_info "Docker Compose V2 已安装: $(docker compose version)"
        return 0
    fi
    
    # 检查 Docker Compose V1 (docker-compose)
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose V1 已安装: $(docker-compose --version)"
        return 0
    fi
    
    # 如果 Docker 安装时已经包含了 docker-compose-plugin，则不需要单独安装
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL 系统，Docker 安装时已经包含了 docker-compose-plugin
        log_info "CentOS/RHEL 系统，Docker Compose 已通过 docker-compose-plugin 安装"
    else
        # Ubuntu/Debian 系统，Docker 安装时已经包含了 docker-compose-plugin
        log_info "Ubuntu/Debian 系统，Docker Compose 已通过 docker-compose-plugin 安装"
    fi
    
    # 验证安装
    if docker compose version &> /dev/null; then
        log_success "Docker Compose V2 安装完成: $(docker compose version)"
    elif command -v docker-compose &> /dev/null; then
        log_success "Docker Compose V1 安装完成: $(docker-compose --version)"
    else
        log_warning "Docker Compose 安装可能失败，请手动检查"
    fi
}

# 安装 Nginx
install_nginx() {
    log_info "安装 Nginx..."
    
    if command -v nginx &> /dev/null; then
        log_info "Nginx 已安装: $(nginx -v 2>&1)"
        return 0
    fi
    
    # 检测操作系统并使用对应的包管理器
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL 系统
        log_info "检测到 CentOS/RHEL 系统，使用 yum 安装 Nginx..."
        yum install -y nginx
    else
        # Ubuntu/Debian 系统
        log_info "检测到 Ubuntu/Debian 系统，使用 apt 安装 Nginx..."
        apt-get update
        apt-get install -y nginx
    fi
    
    # 启动 Nginx 服务
    systemctl start nginx
    systemctl enable nginx
    
    log_success "Nginx 安装完成"
}

# 安装 PM2
install_pm2() {
    log_info "安装 PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_info "PM2 已安装: $(pm2 --version)"
        return 0
    fi
    
    # 全局安装 PM2
    npm install -g pm2
    
    log_success "PM2 安装完成: $(pm2 --version)"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    # 检测操作系统并使用对应的防火墙
    if [ -f /etc/redhat-release ]; then
        # CentOS/RHEL 系统使用 firewalld
        log_info "检测到 CentOS/RHEL 系统，配置 firewalld..."
        
        # 启动 firewalld
        systemctl start firewalld
        systemctl enable firewalld
        
        # 配置防火墙规则
        firewall-cmd --permanent --add-port=22/tcp     # SSH
        firewall-cmd --permanent --add-port=80/tcp     # HTTP
        firewall-cmd --permanent --add-port=443/tcp    # HTTPS
        firewall-cmd --permanent --add-port=3000/tcp   # 应用端口
        firewall-cmd --permanent --add-port=3001/tcp   # Grafana
        firewall-cmd --permanent --add-port=9090/tcp   # Prometheus
        firewall-cmd --permanent --add-port=3100-3200/tcp  # Docker 端口范围
        
        # 重新加载防火墙规则
        firewall-cmd --reload
        
    else
        # Ubuntu/Debian 系统使用 ufw
        log_info "检测到 Ubuntu/Debian 系统，配置 ufw..."
        
        # 安装 ufw
        apt-get install -y ufw
        
        # 配置防火墙规则
        ufw allow 22/tcp     # SSH
        ufw allow 80/tcp     # HTTP
        ufw allow 443/tcp    # HTTPS
        ufw allow 3000/tcp   # 应用端口
        ufw allow 3001/tcp   # Grafana
        ufw allow 9090/tcp   # Prometheus
        ufw allow 3100:3200/tcp  # Docker 端口范围
        
        # 启用防火墙
        ufw --force enable
    fi
    
    log_success "防火墙配置完成"
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

# 部署应用
deploy_application() {
    local environment=${1:-production}
    
    log_info "部署应用到 $environment 环境..."
    
    # 切换到应用目录
    cd /opt/v0-sandbox
    
    # 如果是首次部署，克隆项目
    if [ ! -d "v0-sandbox" ]; then
        log_info "克隆项目代码..."
        git clone <your-repository-url> v0-sandbox
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
    
    # 构建应用
    log_info "构建应用..."
    npm run build
    
    # 创建数据目录
    mkdir -p data
    
    # 数据库迁移
    log_info "运行数据库迁移..."
    npx prisma db push
    
    # 运行种子数据
    npm run db:seed
    
    log_success "应用部署完成"
}

# 配置 Nginx
configure_nginx() {
    log_info "配置 Nginx..."
    
    # 创建 Nginx 配置
    cat > /etc/nginx/sites-available/v0-sandbox << 'EOF'
server {
    listen 80;
    server_name _;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 路由
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 支持
    location /ws/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

    # 启用配置
    ln -sf /etc/nginx/sites-available/v0-sandbox /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    
    # 重启 Nginx
    systemctl restart nginx
    
    log_success "Nginx 配置完成"
}

# 启动应用
start_application() {
    local environment=${1:-production}
    
    log_info "启动应用服务..."
    
    # 切换到项目目录
    cd /opt/v0-sandbox/v0-sandbox
    
    if [ "$environment" = "production" ]; then
        # 生产环境使用 Docker Compose
        log_info "使用 Docker Compose 启动生产环境..."
        
        # 优先使用 Docker Compose V2，如果不可用则使用 V1
        if docker compose version &> /dev/null; then
            docker compose up -d
        elif command -v docker-compose &> /dev/null; then
            docker-compose up -d
        else
            log_error "Docker Compose 未安装，无法启动服务"
            exit 1
        fi
    else
        # 开发环境使用 PM2
        log_info "使用 PM2 启动开发环境..."
        pm2 start npm --name "v0-sandbox" -- start
        pm2 save
        pm2 startup
    fi
    
    log_success "应用服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "应用健康检查通过"
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
    
    log_success "部署完成！"
    echo ""
    echo "🌐 应用访问地址:"
    echo "  - 主应用: http://$server_ip"
    echo "  - 健康检查: http://$server_ip/api/health"
    echo ""
    echo "📊 管理命令:"
    echo "  - 查看应用状态: docker compose ps (或 docker-compose ps)"
    echo "  - 查看应用日志: docker compose logs -f (或 docker-compose logs -f)"
    echo "  - 重启应用: docker compose restart (或 docker-compose restart)"
    echo "  - 停止应用: docker compose down (或 docker-compose down)"
    echo ""
    echo "🔧 系统管理:"
    echo "  - 查看系统资源: htop"
    echo "  - 查看磁盘使用: df -h"
    echo "  - 查看内存使用: free -h"
    echo "  - 查看 Nginx 状态: systemctl status nginx"
    echo ""
    echo "📝 日志位置:"
    echo "  - 应用日志: /opt/v0-sandbox/v0-sandbox/logs/"
    echo "  - Nginx 日志: /var/log/nginx/"
    echo "  - 系统日志: journalctl -u docker"
    echo ""
}

# 主函数
main() {
    local environment=${1:-production}
    
    log_info "开始部署 V0 Sandbox..."
    log_info "部署环境: $environment"
    
    # 检查权限
    check_root
    
    # 系统环境检查
    check_system
    
    # 安装依赖
    install_nodejs
    install_docker
    install_docker_compose
    install_nginx
    install_pm2
    
    # 配置系统
    configure_firewall
    create_app_user
    
    # 部署应用
    deploy_application $environment
    configure_nginx
    start_application $environment
    
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
    echo "V0 Sandbox 部署脚本"
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
}

# 检查参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# 执行主函数
main "$@"
