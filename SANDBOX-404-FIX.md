# Sandbox 404错误修复说明

## 问题描述
云服务器上的Sandbox项目出现404错误：
```
http://115.190.100.24/sandbox/_next/static/chunks/node_modules_%40swc_helpers_cjs_00636ac3._.js
Request Method: GET
Status Code: 404 Not Found
```

## 问题原因
1. **Next.js配置问题**：sandbox项目的`next.config.ts`配置了`basePath: '/sandbox'`和`assetPrefix: '/sandbox'`，导致静态资源路径不正确
2. **Nginx路由配置问题**：Nginx代理配置没有正确处理`/sandbox/_next/`路径的静态资源
3. **构建配置问题**：使用开发环境Dockerfile，没有正确构建生产环境的静态资源

## 修复方案

### 1. 修复Next.js配置
- 移除`basePath`和`assetPrefix`配置
- 添加`output: 'standalone'`配置
- 让Nginx处理路径重写

### 2. 修复Nginx路由配置
- 在`/sandbox/_next/`路由中添加`rewrite`规则
- 移除`/sandbox`前缀，直接代理到`/_next/`路径
- 添加静态资源缓存头

### 3. 创建生产环境Dockerfile
- 创建`Dockerfile.prod`用于生产环境构建
- 同时构建主应用和sandbox项目
- 生成正确的静态资源

### 4. 更新部署配置
- 更新`docker-compose.yml`使用生产环境Dockerfile
- 更新部署脚本支持生产环境构建

## 修复文件列表
- `sandbox/next.config.ts` - 修复Next.js配置
- `nginx.conf` - 修复内部Nginx配置
- `nginx-external-config.conf` - 修复外部Nginx配置
- `Dockerfile.prod` - 新增生产环境Dockerfile
- `docker-compose.yml` - 更新使用生产环境Dockerfile
- `deploy.sh` - 更新部署脚本
- `fix-sandbox-404.sh` - 新增快速修复脚本

## 部署步骤

### 方法1：使用快速修复脚本
```bash
./fix-sandbox-404.sh
```

### 方法2：手动部署
```bash
# 1. 停止服务
docker compose down

# 2. 重新构建
docker compose build --no-cache

# 3. 启动服务
docker compose up -d

# 4. 检查状态
docker compose ps
```

## 验证修复
1. 访问主应用：`http://115.190.100.24:8080`
2. 访问Sandbox项目：`http://115.190.100.24:8080/sandbox`
3. 检查静态资源：`http://115.190.100.24:8080/sandbox/_next/static/chunks/webpack.js`

## 注意事项
1. 确保外部Nginx配置已更新
2. 确保防火墙开放8080端口
3. 如果使用HTTPS，需要更新SSL配置
4. 建议在部署前备份当前配置

## 故障排除
如果问题仍然存在：
1. 检查容器日志：`docker compose logs -f app`
2. 检查Nginx配置：`nginx -t`
3. 检查端口监听：`netstat -tlnp | grep 8080`
4. 检查防火墙：`sudo ufw status`
