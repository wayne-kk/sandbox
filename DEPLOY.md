# V0 Sandbox 云服务器部署

## 快速部署

### 1. 上传项目到云服务器
```bash
git clone <your-repo>
cd v0-sandbox
```

### 2. 一键部署
```bash
chmod +x deploy.sh
./deploy.sh
```

### 3. 配置安全组
开放端口：22, 80, 443, 3000, 3100-3110

### 4. 访问应用
- 主应用：`http://你的服务器IP:3000`
- Sandbox 实时预览：`http://你的服务器IP:3000/sandbox`

## 管理命令

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down
```

## 功能说明

- ✅ 支持 AI 生成 React/Vue 组件
- ✅ 在线代码编辑和实时预览
- ✅ 自动热重载
- ✅ 多项目并发支持
- ✅ 生产环境优化

## 故障排除

如果部署失败，请检查：
1. 服务器内存是否足够（至少4GB）
2. 安全组是否开放必要端口
3. Docker 是否正常运行
4. 查看日志：`docker compose logs`