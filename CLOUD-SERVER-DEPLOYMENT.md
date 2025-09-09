# 云服务器部署指南

## 部署前准备

### 1. 服务器要求

**最低配置：**

- CPU: 2 核心
- 内存: 4GB RAM
- 存储: 20GB SSD
- 网络: 5Mbps 带宽

**推荐配置：**

- CPU: 4 核心
- 内存: 8GB RAM
- 存储: 50GB SSD
- 网络: 10Mbps 带宽

### 2. 系统要求

- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Docker 20.10+
- Docker Compose 2.0+
- Git

## 部署步骤

### 步骤 1：服务器环境准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重启以应用用户组更改
sudo reboot
```

### 步骤 2：克隆项目

```bash
# 克隆项目
git clone https://github.com/your-username/v0-sandbox.git
cd v0-sandbox

# 或者上传项目文件
# scp -r ./v0-sandbox user@your-server:/home/user/
```

### 步骤 3：配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

### 步骤 4：配置防火墙

```bash
# Ubuntu/Debian
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # 主应用
sudo ufw allow 8080  # Nginx代理
sudo ufw allow 3100:3110/tcp  # Sandbox端口范围
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --permanent --add-port=3100-3110/tcp
sudo firewall-cmd --reload
```

### 步骤 5：部署应用

```bash
# 使用部署脚本
chmod +x deploy-cloud.sh
./deploy-cloud.sh

# 或者手动部署
docker compose build --no-cache
docker compose up -d
```

### 步骤 6：验证部署

```bash
# 检查服务状态
docker compose ps

# 检查日志
docker compose logs -f

# 测试访问
curl http://localhost:3000/api/health
curl http://localhost:8080
```

## 云服务商特定配置

### 阿里云 ECS

1. **安全组配置：**

   - 入方向规则：
     - 端口 22 (SSH)
     - 端口 80 (HTTP)
     - 端口 443 (HTTPS)
     - 端口 3000 (主应用)
     - 端口 8080 (Nginx)
     - 端口 3100-3110 (Sandbox)

2. **负载均衡器：**
   - 使用 SLB (Server Load Balancer)
   - 健康检查路径：`/api/health`
   - 超时时间：120 秒

### 腾讯云 CVM

1. **安全组配置：**

   - 入站规则：同上
   - 出站规则：允许所有

2. **负载均衡器：**
   - 使用 CLB (Cloud Load Balancer)
   - 健康检查：`/api/health`
   - 会话保持：开启

### 华为云 ECS

1. **安全组配置：**

   - 入方向规则：同上
   - 出方向规则：允许所有

2. **弹性负载均衡：**
   - 使用 ELB
   - 健康检查：`/api/health`
   - 超时设置：120 秒

### AWS EC2

1. **安全组配置：**

   - Inbound Rules：
     - SSH (22)
     - HTTP (80)
     - HTTPS (443)
     - Custom TCP (3000, 8080, 3100-3110)

2. **Application Load Balancer：**
   - 健康检查：`/api/health`
   - Target Group：EC2 instances
   - 超时：120 秒

## 域名和 SSL 配置

### 1. 域名解析

```bash
# 添加A记录
your-domain.com -> 服务器IP
www.your-domain.com -> 服务器IP
```

### 2. SSL 证书配置

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx SSL 配置

```bash
# 更新Nginx配置
sudo nano /etc/nginx/sites-available/your-domain.com

# 配置SSL重定向和代理
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 监控和维护

### 1. 日志管理

```bash
# 查看应用日志
docker compose logs -f app

# 查看Nginx日志
docker compose logs -f nginx

# 系统日志
sudo journalctl -u docker -f
```

### 2. 性能监控

```bash
# 安装监控工具
sudo apt install htop iotop nethogs -y

# 监控资源使用
htop
docker stats
```

### 3. 备份策略

```bash
# 创建备份脚本
nano backup.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/v0-sandbox"

# 备份数据库
docker compose exec app npx prisma db push

# 备份项目文件
tar -czf $BACKUP_DIR/project_$DATE.tar.gz ./data ./logs

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "project_*.tar.gz" -mtime +7 -delete
```

### 4. 自动重启

```bash
# 创建systemd服务
sudo nano /etc/systemd/system/v0-sandbox.service

[Unit]
Description=V0 Sandbox Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/user/v0-sandbox
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target

# 启用服务
sudo systemctl enable v0-sandbox.service
sudo systemctl start v0-sandbox.service
```

## 故障排除

### 常见问题

1. **容器启动失败**

   ```bash
   # 检查日志
   docker compose logs app

   # 检查端口占用
   sudo netstat -tlnp | grep :3000
   ```

2. **数据库连接失败**

   ```bash
   # 检查数据库文件权限
   ls -la ./data/

   # 重新生成Prisma客户端
   docker compose exec app npx prisma generate
   ```

3. **Nginx 代理失败**

   ```bash
   # 检查Nginx配置
   docker compose exec nginx nginx -t

   # 重启Nginx
   docker compose restart nginx
   ```

### 性能优化

1. **增加内存限制**

   ```yaml
   # docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 4G
   ```

2. **启用缓存**

   ```bash
   # 安装Redis
   docker compose up -d redis
   ```

3. **CDN 配置**
   - 使用阿里云 CDN/腾讯云 CDN
   - 配置静态资源缓存
   - 启用 Gzip 压缩

## 安全建议

1. **定期更新**

   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y

   # 更新Docker镜像
   docker compose pull
   docker compose up -d
   ```

2. **访问控制**

   ```bash
   # 配置SSH密钥认证
   ssh-keygen -t rsa -b 4096

   # 禁用密码登录
   sudo nano /etc/ssh/sshd_config
   # PasswordAuthentication no
   ```

3. **防火墙配置**
   ```bash
   # 只允许必要端口
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   ```

## 联系支持

如果遇到问题，请提供：

1. 服务器配置信息
2. 错误日志
3. 部署步骤
4. 网络配置

---

**注意**：本指南适用于大多数云服务商，具体配置可能需要根据服务商要求调整。
