# V0 Sandbox 部署指南

## 🚀 快速部署

### 1. 配置 Docker 镜像加速器（推荐）
```bash
./setup-docker-mirrors.sh
```

### 2. 一键部署
```bash
./deploy.sh
```

### 3. 访问地址
- **应用**: http://localhost:3000
- **Nginx**: http://localhost
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

### Docker 镜像拉取超时
如果遇到镜像拉取超时，配置 Docker 镜像加速器：

```bash
# 创建 Docker 配置
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

# 重启 Docker
sudo systemctl restart docker
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
├── deploy.sh              # 部署脚本
├── docker-compose.yml     # Docker 编排配置
├── Dockerfile.prod.cn     # 生产环境 Dockerfile
├── nginx.conf             # Nginx 配置
├── data/                  # 数据目录
├── logs/                  # 日志目录
└── sandbox/               # 模板项目
```
