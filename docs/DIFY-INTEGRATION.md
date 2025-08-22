# Dify UI 生成器集成指南

## 📋 概述

通过 Dify 的 SSE 接口生成 UI 界面，并自动写入到 sandbox 项目中。系统能够理解您的 shadcn/ui 组件库，生成符合规范的代码。

## 🔧 核心组件

### 1. 组件分析器 (`ComponentAnalyzer`)

- 自动分析 `sandbox/components/ui/` 下的所有组件
- 解析组件的 props、variants、导出等信息
- 为 Dify 提供组件库上下文信息

### 2. Dify 客户端 (`DifyClient`)

- 与您的 Dify SSE 服务通信
- 构建包含组件上下文的完整提示词
- 处理 SSE 流式响应

### 3. UI 生成器组件 (`DifyUIGenerator`)

- 用户界面组件
- 提示词输入和示例选择
- 实时生成进度显示

## ⚙️ 配置说明

### 环境变量设置

创建 `.env.local` 文件：

```bash
# 必需：您的 Dify SSE 接口地址
DIFY_SSE_ENDPOINT=http://localhost:8080/api/dify/sse
```

### SSE 接口格式要求

请求格式：

```json
{
  "prompt": "用户的完整提示词（包含组件上下文）",
  "context": "额外上下文信息",
  "user": "用户标识"
}
```

SSE 响应格式：

```json
{
  "content": "生成的文本片段",
  "conversation_id": "会话ID"
}
```

## 🎯 使用流程

1. **组件库分析**: 系统自动分析 sandbox 组件库
2. **增强提示词**: 构建包含组件文档的完整提示词
3. **代码生成**: 调用 Dify SSE 接口生成代码
4. **自动写入**: 将生成的文件写入 sandbox 目录

## 📝 组件上下文示例

大模型会收到类似以下的组件文档：

````markdown
# sandbox-project 组件库文档

## 项目信息

- 框架: nextjs
- UI 库: shadcn/ui
- 图标库: lucide
- 样式系统: tailwind

## 别名配置

- components: @/components
- utils: @/lib/utils
- ui: @/components/ui

## 可用组件

### button

**文件**: components/ui/button.tsx
**分类**: action
**导出**: Button, buttonVariants

**Props**:

- variant?: default | destructive | outline | secondary | ghost | link
- size?: default | sm | lg | icon

**使用示例**:

```tsx
<Button />
<Button variant="outline" size="sm" />
```
````

## 🔌 API 接口

### 生成 UI 代码

```http
POST /api/ai/generate
{
  "prompt": "创建一个登录页面",
  "projectType": "nextjs",
  "projectId": "my-project"
}
```

### 获取组件文档

```http
GET /api/ai/components
```

## 🎨 最佳实践

### 提示词编写

- **具体描述**: 详细说明 UI 需求和交互
- **明确组件**: 指定使用的组件类型
- **样式要求**: 描述颜色、布局、响应式需求

**好的示例**:

```
创建一个用户注册页面，使用Card组件作为容器，包含：
1. 页面标题和副标题
2. 包含姓名、邮箱、密码、确认密码的表单，使用Input组件
3. 服务条款复选框，使用Checkbox组件
4. 提交按钮，使用Button的primary variant
5. 已有账户的登录链接
6. 整体采用居中布局，支持移动端响应式
```

## 🔍 故障排除

### 常见问题

1. **组件导入错误**: 检查 `sandbox/components.json` 配置
2. **生成结果不符合预期**: 优化提示词描述
3. **SSE 连接失败**: 检查 `DIFY_SSE_ENDPOINT` 配置

### 调试命令

```bash
# 检查组件分析结果
curl http://localhost:3000/api/ai/components

# 测试生成接口
curl -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"创建一个测试页面"}'
```

---

**注意**: 需要您提供 Dify SSE 接口。请确保您的 Dify 服务支持流式输出。
