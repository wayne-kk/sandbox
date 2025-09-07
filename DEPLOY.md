# V0 Sandbox 部署指南

## 🚀 一键部署

### 自动部署（推荐）
```bash
./deploy.sh
```

**特性**：
- ✅ 自动检测代理设置
- ✅ 自动配置 Docker 镜像加速器
- ✅ 智能镜像源切换
- ✅ 预拉取镜像
- ✅ 健康检查
- ✅ 防火墙配置提示

### 访问地址
- **应用**: http://localhost:3000
- **Nginx**: http://localhost
- **外网访问**: http://你的服务器IP
- **健康检查**: http://localhost:3000/api/health

## 🔧 环境配置（可选）

如果需要配置 AI 服务或其他功能，创建 `.env` 文件：

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置
nano .env
```

### 环境变量说明
- `DIFY_API_KEY`: Dify AI 服务密钥
- `DIFY_API_ENDPOINT`: Dify API 端点
- `NEXTAUTH_SECRET`: 认证密钥（生产环境必须修改）
- `NEXTAUTH_URL`: 应用访问地址

## 📊 服务管理

### 查看服务状态
```bash
docker compose ps
```

### 查看日志
```bash
docker compose logs -f app
```

### 停止服务
```bash
docker compose down
```

### 重启服务
```bash
docker compose restart
```

## 🛠️ 故障排除

### 镜像拉取失败
如果遇到镜像拉取失败，请按以下顺序尝试：

1. **检查代理设置**：
   ```bash
   echo $https_proxy
   echo $http_proxy
   ```

2. **手动拉取镜像**：
   ```bash
   docker pull redis:7-alpine
   docker pull nginx:alpine
   docker pull node:18-alpine
   ```

3. **检查网络连接**：
   ```bash
   ping 8.8.8.8
   curl -I https://registry-1.docker.io/v2/
   ```

4. **重新运行部署**：
   ```bash
   ./deploy.sh
   ```

### 防火墙配置
如果无法外网访问，请开放端口：

```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 查看服务状态
```bash
# 查看容器状态
docker compose ps

# 查看应用日志
docker compose logs -f app

# 查看所有服务日志
docker compose logs
```

### 端口冲突
如果端口被占用，修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "3001:3000"  # 改为其他端口
```

## 📁 项目结构
```
v0-sandbox/
├── deploy.sh              # 一键部署脚本
├── docker-compose.yml     # Docker 编排配置
├── Dockerfile             # 生产环境 Dockerfile
├── nginx.conf             # Nginx 配置
├── data/                  # 数据目录
├── logs/                  # 日志目录
└── sandbox/               # 模板项目
```
