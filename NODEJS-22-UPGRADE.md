# Node.js 22 升级指南

## 📋 升级概述

已将项目中的Node.js版本从18升级到22，包括Docker镜像和相关配置。

## 🔄 已修改的文件

### 1. Docker相关文件
- `Dockerfile`: 基础镜像和生产镜像都升级到 `node:22-alpine`
- `docker-compose.yml`: 构建目标配置保持不变（通过环境变量控制）

### 2. 部署脚本
- `deploy.sh`: 镜像拉取列表更新为 `node:22-alpine`

### 3. Docker管理器
- `src/lib/docker.ts`: 所有Node.js镜像引用更新为22版本
- `src/lib/enhanced-docker.ts`: 基础镜像更新
- `src/lib/production-docker.ts`: 基础镜像更新
- `src/lib/multi-user-docker.ts`: 基础镜像更新
- `src/lib/iframe-optimized-docker.ts`: 基础镜像更新

## 🚀 在云服务器上升级步骤

### 1. 停止现有服务
```bash
docker compose down
```

### 2. 清理旧镜像（可选）
```bash
# 删除旧的Node.js 18镜像
docker rmi node:18-alpine

# 删除项目相关的旧镜像
docker images | grep v0-sandbox | awk '{print $3}' | xargs docker rmi
```

### 3. 重新构建和启动
```bash
# 使用快速部署（推荐）
./deploy.sh --quick

# 或者完整部署
./deploy.sh
```

### 4. 验证升级
```bash
# 检查容器内的Node.js版本
docker exec v0-sandbox-app node --version

# 应该显示 v22.x.x
```

## ⚠️ 注意事项

### 1. 兼容性检查
Node.js 22 相比 Node.js 18 有一些变化：
- 新的JavaScript特性支持
- 性能改进
- 安全更新
- 某些依赖包可能需要更新

### 2. 依赖包兼容性
如果遇到依赖包兼容性问题，可能需要：
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 3. 构建问题
如果构建失败，检查：
- 依赖包是否支持Node.js 22
- TypeScript配置是否需要更新
- Next.js版本是否兼容

## 🔍 验证升级成功

### 1. 检查Node.js版本
```bash
# 在容器内检查
docker exec v0-sandbox-app node --version
docker exec v0-sandbox-app npm --version
```

### 2. 检查应用运行
```bash
# 检查应用是否正常启动
curl http://localhost:3000/api/health

# 检查sandbox功能
curl -X POST http://localhost:3000/api/sandbox/start
```

### 3. 检查日志
```bash
# 查看应用日志
docker compose logs -f app
```

## 🛠️ 故障排除

### 1. 构建失败
如果Docker构建失败：
```bash
# 清理Docker缓存
docker system prune -a

# 重新构建
docker compose build --no-cache
```

### 2. 依赖问题
如果遇到依赖问题：
```bash
# 进入容器检查
docker exec -it v0-sandbox-app sh

# 在容器内重新安装依赖
cd /app
rm -rf node_modules package-lock.json
npm install
```

### 3. 回滚方案
如果需要回滚到Node.js 18：
```bash
# 修改Dockerfile中的镜像版本
# FROM node:22-alpine AS base
# 改为
# FROM node:18-alpine AS base

# 重新构建
docker compose build --no-cache
docker compose up -d
```

## 📊 升级后的优势

1. **性能提升**: Node.js 22 相比 18 有显著的性能改进
2. **新特性**: 支持最新的JavaScript特性
3. **安全更新**: 包含最新的安全补丁
4. **长期支持**: Node.js 22 是LTS版本，有长期支持

## 🎯 下一步

升级完成后，建议：
1. 监控应用性能
2. 检查所有功能是否正常
3. 更新相关文档
4. 通知团队成员版本变更
