# Azure OpenAI 配置指南

本文档说明如何配置 Azure OpenAI 服务来替换现有的 OpenAI 服务。

## 🔧 环境变量配置

在您的 `.env.local` 文件中添加以下配置：

```bash
# Azure OpenAI 配置
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4

# 保留现有的 Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📋 配置参数说明

### 必需参数

- **AZURE_OPENAI_API_KEY**: Azure OpenAI 服务的 API 密钥
- **AZURE_OPENAI_ENDPOINT**: Azure OpenAI 服务的端点 URL

### 可选参数

- **AZURE_OPENAI_API_VERSION**: API 版本，默认为 "2024-02-01"
- **AZURE_OPENAI_DEPLOYMENT_NAME**: 向量嵌入模型的部署名称，默认为 "text-embedding-3-large"
- **AZURE_OPENAI_CHAT_DEPLOYMENT_NAME**: 聊天模型的部署名称，默认为 "gpt-4"

## 🚀 部署模型

### 1. 向量嵌入模型

在 Azure OpenAI Studio 中部署 `text-embedding-3-large` 模型：

```bash
# 模型名称
text-embedding-3-large

# 部署名称 (建议使用)
text-embedding-3-large

# 模型版本
text-embedding-3-large
```

### 2. 聊天模型

在 Azure OpenAI Studio 中部署 `gpt-4` 模型：

```bash
# 模型名称
gpt-4

# 部署名称 (建议使用)
gpt-4

# 模型版本
gpt-4
```

## 🔍 验证配置

### 1. 检查环境变量

```bash
# 在项目根目录运行
echo "AZURE_OPENAI_API_KEY: $AZURE_OPENAI_API_KEY"
echo "AZURE_OPENAI_ENDPOINT: $AZURE_OPENAI_ENDPOINT"
echo "AZURE_OPENAI_DEPLOYMENT_NAME: $AZURE_OPENAI_DEPLOYMENT_NAME"
```

### 2. 测试连接

启动开发服务器后，检查控制台是否有配置错误信息。

## 📊 模型对比

| 特性         | 原模型 (text-embedding-ada-002) | 新模型 (text-embedding-3-large) |
| ------------ | ------------------------------- | ------------------------------- |
| 向量维度     | 1536                            | 3072                            |
| 最大输入长度 | 8191 tokens                     | 8192 tokens                     |
| 性能         | 基础                            | 更高                            |
| 准确性       | 良好                            | 更好                            |
| 成本         | 较低                            | 中等                            |

## 🔄 迁移步骤

### 1. 备份现有数据

```bash
# 导出现有的向量数据 (如果需要)
# 这取决于您的具体需求
```

### 2. 更新环境变量

按照上面的配置更新 `.env.local` 文件。

### 3. 重启服务

```bash
npm run dev
```

### 4. 验证功能

测试以下功能是否正常：

- 代码向量生成
- 项目上下文向量生成
- 向量搜索功能
- 代码描述生成

## ⚠️ 注意事项

1. **向量维度变化**: `text-embedding-3-large` 生成 3072 维向量，而原模型是 1536 维
2. **数据库兼容性**: 确保您的 Supabase 向量表支持 3072 维向量
3. **成本考虑**: 新模型可能比原模型成本更高
4. **性能影响**: 新模型生成向量可能需要更多时间

## 🛠️ 故障排除

### 常见错误

1. **配置错误**

   ```
   Error: Azure OpenAI 配置缺失: AZURE_OPENAI_API_KEY 和 AZURE_OPENAI_ENDPOINT 必须设置
   ```

   解决：检查环境变量是否正确设置

2. **认证失败**

   ```
   Error: Azure OpenAI 向量生成失败: 401 Unauthorized
   ```

   解决：检查 API 密钥是否正确

3. **模型不存在**
   ```
   Error: Azure OpenAI 向量生成失败: 404 Not Found
   ```
   解决：检查部署名称是否正确

### 调试技巧

1. 启用详细日志
2. 检查网络连接
3. 验证 Azure OpenAI 服务状态
4. 确认模型部署状态

## 📚 相关文档

- [Azure OpenAI 官方文档](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [OpenAI API 参考](https://platform.openai.com/docs/api-reference)
- [Supabase 向量扩展](https://supabase.com/docs/guides/ai/vector-embeddings)

## 🤝 支持

如果遇到问题，请：

1. 检查本文档的故障排除部分
2. 查看 Azure OpenAI 服务状态
3. 联系 Azure 支持团队
4. 在项目 Issues 中报告问题
