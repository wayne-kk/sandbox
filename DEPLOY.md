# V0 Sandbox 云服务器部署指南

## 🚀 一键部署

### 方案1：完整部署（推荐）
```bash
./deploy.sh
```

### 方案2：简化部署（如果镜像拉取失败）
```bash
./deploy-simple.sh
```

### 方案3：网络诊断
```bash
./network-test.sh
```

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

1. **运行网络诊断**：
   ```bash
   ./network-test.sh
   ```

2. **使用简化部署**：
   ```bash
   ./deploy-simple.sh
   ```

3. **手动拉取镜像**：
   ```bash
   docker pull redis:7-alpine
   docker pull nginx:alpine
   docker pull node:18-alpine
   ```

4. **检查网络连接**：
   ```bash
   ping 8.8.8.8
   curl -I https://registry-1.docker.io/v2/
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
├── deploy.sh              # 云服务器部署脚本
├── docker-compose.yml     # Docker 编排配置（使用国内镜像源）
├── Dockerfile.prod.cn     # 生产环境 Dockerfile（国内镜像源优化）
├── nginx.conf             # Nginx 配置
├── data/                  # 数据目录
├── logs/                  # 日志目录
└── sandbox/               # 模板项目
```

## ✨ 特性

- ✅ **自动配置 Docker 镜像加速器**
- ✅ **智能镜像源切换**（官方源 → 国内镜像源）
- ✅ **预拉取镜像**（避免部署时超时）
- ✅ **健康检查**（确保服务正常运行）
- ✅ **防火墙配置提示**（外网访问支持）
- ✅ **完整的错误处理**（详细的日志输出）
