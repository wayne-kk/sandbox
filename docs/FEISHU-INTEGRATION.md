# 飞书集成部署指南

## 📋 概述

本系统已将飞书机器人通知功能集成到 `quick-deploy.sh` 部署脚本中，可以在部署过程中自动发送通知消息，包括：

- 🚀 部署开始通知
- ✅ 部署成功通知（包含访问链接和耗时）
- ❌ 部署失败通知（包含错误信息）

## 🔧 配置步骤

### 1. 创建飞书机器人

1. 在飞书群中点击右上角 `...` 菜单
2. 选择 `设置` → `群机器人`
3. 点击 `添加机器人` → `自定义机器人`
4. 填写机器人信息：
   - 机器人名称：`V0 Sandbox 部署通知`
   - 机器人描述：`V0 Sandbox 项目部署状态通知`
5. 点击 `添加` 完成创建

### 2. 获取 Webhook URL

1. 在机器人设置页面，复制 `Webhook 地址`
2. 格式类似：`https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 3. 配置环境变量

在 `.env.local` 文件中添加：

```bash
# 飞书机器人 Webhook URL
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-url
```

## 🚀 使用方法

### 方法一：使用环境变量（推荐）

```bash
# 设置环境变量
export FEISHU_WEBHOOK_URL="https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-url"

# 执行部署
./quick-deploy.sh production
```

### 方法二：在 .env.local 中配置

```bash
# 在 .env.local 文件中添加
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/your-webhook-url

# 配置域名（可选，用于显示正确的访问地址）
EXTERNAL_DOMAIN=your-domain.com
EXTERNAL_PROTOCOL=https
EXTERNAL_PORT=

# 然后执行部署
./quick-deploy.sh
```

### 访问地址优先级

部署脚本会按以下优先级显示访问地址：

1. **EXTERNAL_DOMAIN**：如果配置了外部域名，优先使用
2. **SERVER_HOST**：如果配置了服务器主机名，使用该配置
3. **服务器 IP**：最后使用自动获取的服务器 IP

**示例配置**：

```bash
# 使用域名
EXTERNAL_DOMAIN=wayne.beer
EXTERNAL_PROTOCOL=https
EXTERNAL_PORT=

# 结果：https://wayne.beer
```

### 方法三：手动发送通知

```bash
# 发送部署开始通知
curl -X POST "http://localhost:3000/api/feishu/notify" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "started",
    "project": "V0 Sandbox",
    "environment": "production",
    "timestamp": "2024-01-01 12:00:00"
  }'

# 发送部署成功通知
curl -X POST "http://localhost:3000/api/feishu/notify" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "project": "V0 Sandbox",
    "environment": "production",
    "duration": 300000,
    "url": "https://your-domain.com",
    "timestamp": "2024-01-01 12:05:00"
  }'

# 发送部署失败通知
curl -X POST "http://localhost:3000/api/feishu/notify" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "failed",
    "project": "V0 Sandbox",
    "environment": "production",
    "duration": 120000,
    "error": "Docker 构建失败",
    "timestamp": "2024-01-01 12:02:00"
  }'
```

## 📱 通知消息格式

### 部署开始通知

```
🚀 V0 Sandbox 开始部署

🌍 环境: production
⏰ 时间: 2024-01-01 12:00:00
📦 项目: V0 Sandbox
```

### 部署成功通知

```
✅ V0 Sandbox 部署成功

🎉 部署完成！@all

📦 项目: V0 Sandbox
🌍 环境: production
⏱️ 耗时: 300 秒
🔗 访问地址: 点击访问
⏰ 完成时间: 2024-01-01 12:05:00
```

### 部署失败通知

```
❌ V0 Sandbox 部署失败

❌ 部署失败！@all

📦 项目: V0 Sandbox
🌍 环境: production
⏱️ 耗时: 120 秒
❌ 错误信息: Docker 构建失败
⏰ 失败时间: 2024-01-01 12:02:00
```

## 🔍 故障排除

### 1. 通知发送失败

**问题**：飞书通知发送失败
**解决方案**：

- 检查 `FEISHU_WEBHOOK_URL` 是否正确配置
- 确认 Webhook URL 格式正确
- 检查网络连接是否正常

### 2. 机器人无响应

**问题**：飞书机器人没有发送消息
**解决方案**：

- 确认机器人已添加到群中
- 检查机器人权限设置
- 验证 Webhook URL 是否有效

### 3. 消息格式异常

**问题**：飞书消息显示格式不正确
**解决方案**：

- 检查 API 请求的 JSON 格式
- 确认所有必需字段都已提供
- 查看服务器日志获取详细错误信息

## 📊 监控和日志

### 查看通知发送日志

```bash
# 查看应用日志
docker compose logs -f app

# 查看特定 API 调用
docker compose logs app | grep "feishu"
```

### 测试通知功能

```bash
# 测试飞书通知 API
curl -X POST "http://localhost:3000/api/feishu/notify" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "project": "测试项目",
    "environment": "test",
    "duration": 1000,
    "url": "http://localhost:3000",
    "timestamp": "'$(date '+%Y-%m-%d %H:%M:%S')'"
  }'
```

## 🔐 安全注意事项

1. **保护 Webhook URL**：不要将 Webhook URL 提交到代码仓库
2. **环境变量**：使用 `.env.local` 文件存储敏感信息
3. **权限控制**：确保只有授权人员可以访问部署脚本
4. **日志安全**：避免在日志中输出敏感信息

## 📈 扩展功能

### 自定义消息模板

可以修改 `src/app/api/feishu/notify/route.ts` 中的 `createFeishuMessage` 函数来自定义消息格式。

### 添加更多通知类型

可以在 API 中添加更多通知类型，如：

- 服务健康检查通知
- 性能监控通知
- 错误告警通知

### 集成其他通知渠道

可以扩展支持其他通知渠道：

- 钉钉机器人
- 企业微信
- Slack
- Discord
