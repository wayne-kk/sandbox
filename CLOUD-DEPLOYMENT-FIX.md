# 云服务部署 Chunked Encoding 问题修复指南

## 问题描述

在云服务部署后出现 `net::ERR_INCOMPLETE_CHUNKED_ENCODING` 错误，Docker 容器显示正常启动但无法正常访问。

## 问题原因

1. **开发模式不稳定**：使用 `npm run dev` 在生产环境中不稳定
2. **Nginx 配置不当**：缺少适当的缓冲和超时设置
3. **Chunked Encoding 问题**：流式响应被中断
4. **网络超时**：代理超时时间过短

## 修复方案

### 1. 使用生产模式

**修改 Dockerfile：**

```dockerfile
# 构建生产版本
RUN npm run build

# 启动生产服务器
CMD ["npm", "start"]

# 设置环境变量
ENV NODE_ENV=production
```

### 2. 优化 Nginx 配置

**关键配置项：**

```nginx
# 缓冲设置 - 解决 chunked encoding 问题
proxy_buffering on;
proxy_buffer_size 8k;
proxy_buffers 16 8k;
proxy_busy_buffers_size 16k;
proxy_temp_file_write_size 16k;
proxy_max_temp_file_size 2048m;

# 超时设置
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;
send_timeout 120s;

# 禁用有问题的 chunked encoding
proxy_set_header Connection "";
proxy_http_version 1.1;
```

### 3. 部署步骤

#### 方法一：使用修复脚本（推荐）

```bash
# 1. 运行修复部署脚本
./deploy-fixed-chunked.sh

# 2. 如果仍有问题，运行诊断脚本
./diagnose-chunked-issue.sh
```

#### 方法二：手动部署

```bash
# 1. 停止现有服务
docker compose down --remove-orphans --volumes

# 2. 清理缓存
docker builder prune -f
rm -rf node_modules .next package-lock.json

# 3. 使用优化的 Nginx 配置
cp nginx-cloud-optimized.conf nginx.conf

# 4. 重新构建和启动
docker compose build --no-cache
docker compose up -d

# 5. 等待服务启动
sleep 30

# 6. 健康检查
curl -f http://localhost:3000/api/health
curl -f http://localhost:8080
```

### 4. 云服务商特定配置

#### 阿里云/腾讯云/华为云

1. **安全组设置**：

   - 开放端口：80, 443, 3000, 8080
   - 开放端口范围：3100-3110（Sandbox 项目）

2. **负载均衡器配置**：

   - 使用 `nginx-cloud-optimized.conf` 配置
   - 设置健康检查路径：`/health`
   - 超时时间：120 秒

3. **CDN 配置**：
   - 静态资源缓存：1 年
   - 动态内容：不缓存

#### AWS/GCP/Azure

1. **负载均衡器**：

   - 使用 Application Load Balancer
   - 健康检查：`/api/health`
   - 超时设置：120 秒

2. **容器服务**：
   - 使用 ECS/GKE/AKS
   - 资源配置：至少 2GB RAM
   - 健康检查间隔：30 秒

### 5. 监控和诊断

#### 实时监控

```bash
# 查看容器状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 查看特定服务日志
docker compose logs app --tail 50
docker compose logs nginx --tail 50
```

#### 性能测试

```bash
# 测试响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://your-domain.com

# 压力测试
ab -n 1000 -c 10 http://your-domain.com/
```

### 6. 常见问题排查

#### 问题 1：容器启动但无法访问

**检查步骤：**

1. 运行诊断脚本：`./diagnose-chunked-issue.sh`
2. 检查端口监听：`netstat -tlnp | grep :3000`
3. 检查防火墙设置
4. 检查云服务商安全组

#### 问题 2：间歇性连接失败

**解决方案：**

1. 增加 Nginx 超时时间
2. 优化上游服务器配置
3. 启用连接池
4. 检查网络稳定性

#### 问题 3：静态资源加载失败

**解决方案：**

1. 检查 Nginx 静态文件配置
2. 验证文件权限
3. 检查 CDN 配置
4. 优化缓存策略

### 7. 性能优化建议

1. **启用 Gzip 压缩**
2. **配置静态资源缓存**
3. **使用 CDN 加速**
4. **优化数据库连接**
5. **启用 Redis 缓存**

### 8. 安全配置

1. **HTTPS 配置**：

   - 使用 Let's Encrypt 免费证书
   - 配置 HTTP 到 HTTPS 重定向
   - 启用 HSTS

2. **防火墙设置**：

   - 只开放必要端口
   - 使用 fail2ban 防护
   - 配置 DDoS 防护

3. **访问控制**：
   - 配置 IP 白名单
   - 启用访问日志
   - 设置速率限制

## 验证部署

部署完成后，请验证以下功能：

1. ✅ 主应用访问正常
2. ✅ API 接口响应正常
3. ✅ Sandbox 项目功能正常
4. ✅ 静态资源加载正常
5. ✅ WebSocket 连接正常
6. ✅ 健康检查通过

## 联系支持

如果问题仍然存在，请提供以下信息：

1. 云服务商和配置
2. 诊断脚本输出
3. 容器日志
4. 网络配置信息
5. 错误截图

---

**注意**：本修复方案已针对云服务环境优化，应该能解决大部分 chunked encoding 相关问题。
