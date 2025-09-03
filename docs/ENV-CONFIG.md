# 环境配置指南

本文档说明如何配置项目的环境变量。

## 🔧 必需的环境变量

### Supabase 配置

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Azure OpenAI 配置

```bash
# Azure OpenAI 配置
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4
```

## 📋 配置步骤

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
touch .env.local
```

### 2. 添加配置

将上述环境变量添加到 `.env.local` 文件中，替换为实际的值。

### 3. 重启服务

```bash
npm run dev
```

## 🔍 获取配置值

### Supabase

1. 登录 [Supabase](https://supabase.com)
2. 选择您的项目
3. 进入 Settings > API
4. 复制 Project URL 和 anon public key

### Azure OpenAI

1. 登录 [Azure Portal](https://portal.azure.com)
2. 找到您的 Azure OpenAI 资源
3. 进入 Keys and Endpoint
4. 复制 Key 1 和 Endpoint
5. 在 Azure OpenAI Studio 中部署模型

## ⚠️ 注意事项

1. **不要提交 `.env.local` 文件到版本控制**
2. **确保 API 密钥的安全性**
3. **检查 Azure OpenAI 服务的配额和限制**
4. **验证模型部署状态**

## 🧪 测试配置

启动开发服务器后，检查控制台是否有配置错误信息。如果配置正确，您应该能够：

- 生成向量嵌入
- 进行向量搜索
- 生成代码描述
- 使用 AI 功能

## 🆘 故障排除

如果遇到配置问题，请参考：

- [Azure OpenAI 配置指南](./AZURE-OPENAI-SETUP.md)
- [Supabase 设置指南](./SUPABASE-SETUP.md)
- [项目文档](../README.md)
