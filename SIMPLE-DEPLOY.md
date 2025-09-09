# 简单云服务器部署指南

## 快速部署步骤

### 1. 准备云服务器

**最低配置：**

- 2 核 CPU
- 4GB 内存
- 20GB 硬盘
- Ubuntu 20.04+

### 2. 上传项目文件

```bash
# 方法1：使用git克隆
git clone <your-repo-url>
cd v0-sandbox

# 方法2：使用scp上传
scp -r ./v0-sandbox user@your-server:/home/user/
```

### 3. 一键部署

```bash
# 进入项目目录
cd v0-sandbox

# 运行部署脚本
chmod +x simple-deploy.sh
./simple-deploy.sh
```

### 4. 配置安全组

在云服务商控制台开放以下端口：

- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (主应用)
- 8080 (Nginx 代理)
- 3100-3110 (Sandbox 端口)

### 5. 访问应用

部署完成后，通过以下地址访问：

- 主应用：`http://你的服务器IP:8080`
- Sandbox：`http://你的服务器IP:8080/sandbox`

## 管理命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新服务
docker compose pull
docker compose up -d
```

## 常见问题

### 1. 无法访问

- 检查安全组是否开放端口
- 检查防火墙设置
- 查看服务日志：`docker compose logs`

### 2. 服务启动失败

- 检查内存是否足够（至少 4GB）
- 查看详细日志：`docker compose logs app`

### 3. 数据库错误

- 检查数据目录权限
- 重新生成 Prisma 客户端：`docker compose exec app npx prisma generate`

## 后续优化

部署成功后，可以考虑：

1. 配置域名和 SSL 证书
2. 设置自动备份
3. 配置监控告警
4. 优化性能参数

---

**注意：** 这是最简单的部署方案，适合快速测试和演示。生产环境建议进行更多安全配置。
