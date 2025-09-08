# 网络问题排查指南

## 问题描述

当遇到以下错误时：

```
Dify 生成失败: TypeError: fetch failed
ConnectTimeoutError: Connect Timeout Error
code: 'UND_ERR_CONNECT_TIMEOUT'
```

这表示应用无法连接到 Dify API 服务 (`http://152.136.41.186:32422/v1/workflows/run`)。

## 快速诊断

### 1. 运行网络诊断脚本

```bash
./diagnose-network.sh
```

### 2. 运行网络修复脚本

```bash
./fix-network-issues.sh
```

### 3. 测试容器内网络

```bash
# 测试 API 端点
curl http://localhost:3000/api/network-test

# 在容器内运行网络测试
docker exec -it v0-sandbox-app ./test-container-network.sh
```

## 常见问题及解决方案

### 1. 防火墙阻止连接

**问题**: 出站连接被防火墙阻止

**解决方案**:

```bash
# 检查防火墙状态
sudo ufw status

# 允许出站连接到 Dify API
sudo ufw allow out 32422/tcp

# 或者允许特定 IP 的出站连接
sudo ufw allow out to 152.136.41.186 port 32422
```

### 2. Docker 网络配置问题

**问题**: Docker 容器无法访问外部网络

**解决方案**:

```bash
# 检查 Docker 网络
docker network ls
docker network inspect bridge

# 重启 Docker 服务
sudo systemctl restart docker

# 重新创建网络
docker network prune
docker compose down
docker compose up -d
```

### 3. DNS 解析问题

**问题**: 无法解析域名

**解决方案**:

```bash
# 刷新 DNS 缓存
sudo systemd-resolve --flush-caches
# 或
sudo resolvectl flush-caches

# 检查 DNS 设置
cat /etc/resolv.conf
```

### 4. 代理设置问题

**问题**: 代理配置阻止连接

**解决方案**:

```bash
# 检查代理设置
echo $http_proxy
echo $https_proxy
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 临时禁用代理
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

# 或在 docker-compose.yml 中添加
environment:
  - NO_PROXY=152.136.41.186
```

### 5. 网络服务问题

**问题**: 网络服务异常

**解决方案**:

```bash
# 重启网络服务
sudo systemctl restart networking
sudo systemctl restart NetworkManager

# 检查网络接口
ip addr show
ip route show
```

## 高级排查

### 1. 使用 tcpdump 抓包

```bash
# 在主机上抓包
sudo tcpdump -i any host 152.136.41.186

# 在容器内抓包
docker exec -it v0-sandbox-app tcpdump -i any host 152.136.41.186
```

### 2. 使用 telnet 测试连接

```bash
# 测试端口连通性
telnet 152.136.41.186 32422
```

### 3. 检查路由表

```bash
# 查看路由表
ip route show

# 添加路由（如果需要）
sudo ip route add 152.136.41.186/32 via <gateway>
```

## 环境变量配置

确保以下环境变量正确设置：

```bash
# .env.local
DIFY_API_ENDPOINT=http://152.136.41.186:32422/v1/workflows/run
DIFY_API_KEY=your_api_key_here
COMPONENT_DIFY_API_KEY=your_component_api_key_here
```

## 容器内测试

### 1. 基本连接测试

```bash
# 进入容器
docker exec -it v0-sandbox-app bash

# 测试 ping
ping 152.136.41.186

# 测试端口
nc -zv 152.136.41.186 32422

# 测试 HTTP
curl -I http://152.136.41.186:32422/v1/workflows/run
```

### 2. 使用网络测试 API

```bash
# GET 请求测试
curl http://localhost:3000/api/network-test

# POST 请求测试
curl -X POST http://localhost:3000/api/network-test
```

## 监控和日志

### 1. 查看应用日志

```bash
# 查看容器日志
docker compose logs app

# 实时查看日志
docker compose logs -f app

# 查看特定时间段的日志
docker compose logs --since="2024-01-01T00:00:00" app
```

### 2. 查看系统日志

```bash
# 查看网络相关日志
sudo journalctl -u networking
sudo journalctl -u NetworkManager

# 查看防火墙日志
sudo journalctl -u ufw
```

## 预防措施

### 1. 定期检查网络连接

```bash
# 添加到 crontab
*/5 * * * * /path/to/your/project/diagnose-network.sh
```

### 2. 监控脚本

```bash
#!/bin/bash
# 创建监控脚本
if ! curl -s --connect-timeout 10 http://152.136.41.186:32422/v1/workflows/run > /dev/null; then
    echo "Dify API 连接失败" | mail -s "网络告警" admin@example.com
fi
```

## 联系支持

如果以上方法都无法解决问题，请提供以下信息：

1. 运行 `./diagnose-network.sh` 的完整输出
2. 运行 `docker compose logs app` 的完整输出
3. 系统信息：`uname -a`
4. Docker 版本：`docker --version`
5. 网络配置：`ip addr show` 和 `ip route show`

## 更新日志

- 2024-01-XX: 初始版本
- 添加了网络诊断脚本
- 添加了自动修复脚本
- 添加了容器内网络测试
