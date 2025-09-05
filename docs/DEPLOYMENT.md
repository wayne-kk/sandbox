# 火山引擎服务器部署指南

本指南将帮助您将 V0 Sandbox 部署到火山引擎（ByteDance Cloud）服务器上。

## 🚀 快速部署

### 使用部署脚本

```bash
# 一键部署到火山引擎服务器
./deploy.sh production

# 或手动执行部署步骤
```

## 🖥️ 服务器准备

### 1. 创建火山引擎实例

1. **登录火山引擎控制台**

   - 访问 [火山引擎控制台](https://console.volcengine.com/)
   - 选择"云服务器 ECS"

2. **创建实例**

   ```
   实例规格: 推荐 2核4GB 或更高
   操作系统: Ubuntu 20.04 LTS 或 CentOS 7
   存储: 40GB SSD 或更高
   网络: 公网IP，开放必要端口
   ```

3. **安全组配置**
   ```
   入站规则:
   - SSH (22): 0.0.0.0/0
   - HTTP (80): 0.0.0.0/0
   - HTTPS (443): 0.0.0.0/0
   - 应用端口 (3000): 0.0.0.0/0
   - Docker 端口 (3100-3200): 0.0.0.0/0
   ```

### 2. 连接服务器

```bash
# 使用 SSH 连接
ssh root@your-server-ip

# 或使用密钥对
ssh -i your-key.pem root@your-server-ip
```

## 🔧 环境安装

### 1. 系统更新

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. 安装 Node.js 18+

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到 docker 组
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker run hello-world
```

### 4. 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 5. 安装 PM2 (可选)

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 设置 PM2 开机自启
pm2 startup
```

### 6. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 📦 项目部署

### 1. 克隆项目

```bash
# 克隆项目到服务器
git clone <your-repository-url>
cd v0-sandbox

# 或上传项目文件
scp -r ./v0-sandbox root@your-server-ip:/opt/
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp env.template .env.local

# 编辑环境变量
nano .env.local
```

**必需的环境变量配置：**

```bash
# 应用配置
NODE_ENV=production
NEXTAUTH_SECRET=your_strong_secret_here
NEXTAUTH_URL=http://your-server-ip:3000

# 数据库配置
DATABASE_URL="file:./data/prod.db"

# Dify AI 服务
DIFY_API_KEY=your_dify_api_key
DIFY_API_ENDPOINT=https://api.dify.ai/v1

# 应用 URL
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000
```

### 3. 安装依赖并构建

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npm run db:generate

# 构建应用
npm run build
```

### 4. 数据库初始化

```bash
# 创建数据目录
mkdir -p data

# 推送数据库模式
npm run db:push

# 运行种子数据
npm run db:seed
```

## 🐳 Docker 部署

### 1. 构建生产镜像

```bash
# 构建生产环境镜像
docker build -f Dockerfile.prod -t v0-sandbox:prod .

# 或使用脚本
npm run docker:build:prod
```

### 2. 启动服务

```bash
# 使用 Docker Compose 启动
docker-compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 🌐 Nginx 配置

### 1. 创建 Nginx 配置

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/v0-sandbox
```

**Nginx 配置内容：**

```nginx
server {
    listen 80;
    server_name your-domain.com your-server-ip;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

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

        # 超时设置
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
```

### 2. 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/v0-sandbox /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 🔒 SSL 证书配置

### 1. 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

### 2. 申请 SSL 证书

```bash
# 申请证书（需要域名）
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和维护

### 1. 系统监控

```bash
# 安装系统监控工具
sudo apt install htop iotop nethogs -y

# 查看系统资源
htop
df -h
free -h
```

### 2. 应用监控

```bash
# 查看应用状态
docker-compose -f docker-compose.prod.yml ps

# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f app

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. 健康检查

```bash
# 检查应用健康状态
curl http://localhost:3000/api/health

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查 Docker 状态
sudo systemctl status docker
```

## 🔄 更新部署

### 1. 代码更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
./deploy.sh production

# 或手动更新
npm run build
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. 数据库迁移

```bash
# 运行数据库迁移
npm run db:migrate:deploy

# 或使用 Prisma
npx prisma migrate deploy
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**

   ```bash
   # 查看端口占用
   sudo netstat -tlnp | grep :3000

   # 杀死占用进程
   sudo kill -9 <PID>
   ```

2. **Docker 权限问题**

   ```bash
   # 添加用户到 docker 组
   sudo usermod -aG docker $USER

   # 重新登录
   logout
   ```

3. **内存不足**

   ```bash
   # 查看内存使用
   free -h

   # 清理 Docker 资源
   docker system prune -a
   ```

4. **Nginx 配置错误**

   ```bash
   # 测试配置
   sudo nginx -t

   # 查看错误日志
   sudo tail -f /var/log/nginx/error.log
   ```

## 💰 成本优化

### 1. 实例规格选择

```
开发环境: 1核2GB
测试环境: 2核4GB
生产环境: 4核8GB 或更高
```

### 2. 存储优化

```bash
# 定期清理日志
sudo find /var/log -name "*.log" -type f -mtime +7 -delete

# 清理 Docker 资源
docker system prune -a --volumes
```

### 3. 网络优化

- 使用 CDN 加速静态资源
- 启用 Gzip 压缩
- 配置缓存策略

## 📞 技术支持

如果遇到问题：

1. 查看 [火山引擎文档](https://www.volcengine.com/docs)
2. 联系火山引擎技术支持
3. 查看项目 Issues
4. 联系维护者

---

**部署完成后，您的 V0 Sandbox 将在火山引擎服务器上运行！** 🎉
