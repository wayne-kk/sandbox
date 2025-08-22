# 环境变量配置说明

## 🔧 必需的环境变量

根据你的配置需求，系统需要以下**3个**环境变量：

```bash
# 统一的 Dify API 接口地址
DIFY_API_ENDPOINT=your_dify_api_endpoint_here

# 需求清单生成功能的 API 密钥
REQUIRMENT_DIFY_API_KEY=your_requirement_api_key_here

# 组件生成功能的 API 密钥
COMPONENT_DIFY_API_KEY=your_component_api_key_here
```

## 📋 配置原理

### 统一端点设计
- **一个 API 端点**: `DIFY_API_ENDPOINT` 处理所有请求
- **两个不同密钥**: 通过不同的 API 密钥区分功能

### 工作流程
1. **需求分析阶段**: 使用 `REQUIRMENT_DIFY_API_KEY` 调用 API
2. **代码生成阶段**: 使用 `COMPONENT_DIFY_API_KEY` 调用 API

## 🌟 优势
- **配置简单**: 只需要配置3个环境变量
- **管理方便**: 统一的 API 端点，便于维护
- **功能分离**: 不同密钥对应不同功能，便于权限管理

## ✅ 配置验证

访问 `/api/ai/config-check` 可以检查配置状态：

```bash
curl http://localhost:3000/api/ai/config-check
```

## 🔍 故障排除

### 常见问题

1. **API 端点未配置**
   ```
   错误: DIFY_API_ENDPOINT 未设置
   解决: 设置统一的 Dify API 端点地址
   ```

2. **需求分析密钥未配置**
   ```
   错误: REQUIRMENT_DIFY_API_KEY 未设置
   解决: 设置需求清单生成功能的专用密钥
   ```

3. **组件生成密钥未配置**
   ```
   错误: COMPONENT_DIFY_API_KEY 未设置
   解决: 设置组件生成功能的专用密钥
   ```

## 📝 .env.local 示例

```bash
# Dify API 配置
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/your-workflow-id/run
REQUIRMENT_DIFY_API_KEY=app-your-requirement-api-key
COMPONENT_DIFY_API_KEY=app-your-component-api-key

# 其他配置
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **注意**: 
> - 替换示例中的 `your-workflow-id` 为实际的工作流ID
> - 替换示例中的 API 密钥为实际的密钥值
> - 确保密钥对应正确的功能权限
