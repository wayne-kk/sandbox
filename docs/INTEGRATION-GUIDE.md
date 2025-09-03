# 🚀 向量数据库集成指南 - 让 AI 读懂您的项目

本指南将帮助您将向量数据库集成到现有的 AI 生成项目中，让 AI 能够智能地理解您项目中的现有内容。

## 🎯 集成目标

通过向量数据库和智能项目分析，让 AI 能够：

- **理解项目结构**: 自动分析文件组织、组件库、依赖关系
- **检索相关代码**: 智能找到与用户需求最相关的代码片段
- **避免重复**: 识别已存在的组件和功能，避免重复生成
- **保持一致性**: 遵循项目的编码风格和架构模式
- **优化 Token 使用**: 减少 60-80% 的 LLM token 消耗

## 📋 集成步骤

### 步骤 1: 安装依赖

```bash
npm install @supabase/supabase-js openai gpt-tokenizer glob
```

### 步骤 2: 配置环境变量

在 `.env.local` 中添加：

```bash
# Supabase 配置
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI 配置
OPENAI_API_KEY=your-openai-api-key

# 应用配置
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 步骤 3: 设置 Supabase 向量数据库

1. 在 Supabase Dashboard 中启用 `vector` 扩展
2. 执行 `sql/supabase-vector-setup.sql` 脚本
3. 验证数据库表创建成功

### 步骤 4: 初始化项目向量

```bash
# 首次完整向量化
curl -X POST http://localhost:3000/api/vector/sync \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "sandbox-project",
    "action": "full_sync"
  }'
```

## 🔧 使用方法

### 1. 基础向量集成 (推荐)

使用现有的 `/api/ai/generate` 接口，自动启用向量上下文：

```typescript
// 前端调用
const response = await fetch("/api/ai/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "创建一个登录页面",
    projectId: "sandbox-project",
    projectType: "nextjs",
    useVectorContext: true, // 启用向量上下文
  }),
});

const result = await response.json();
console.log("向量上下文信息:", result.data.vectorContext);
```

**优势**:

- 无需修改现有代码
- 自动优化 token 使用
- 智能检索相关代码

### 2. 增强 AI 生成 (完整功能)

使用新的 `/api/ai/generate-enhanced` 接口，获得完整功能：

```typescript
const response = await fetch("/api/ai/generate-enhanced", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "创建一个用户仪表板",
    projectId: "sandbox-project",
    projectType: "nextjs",
    useVectorContext: true, // 启用向量上下文
    useSmartAnalysis: true, // 启用智能项目分析
    maxTokens: 4000, // 控制上下文大小
  }),
});

const result = await response.json();

// 智能分析结果
console.log("项目洞察:", result.data.smartAnalysis);
console.log("相关文件:", result.data.smartAnalysis.relevantFiles);
console.log("建议方法:", result.data.smartAnalysis.suggestions);
console.log("潜在冲突:", result.data.smartAnalysis.conflicts);
console.log("集成点:", result.data.smartAnalysis.integrationPoints);
```

**功能特性**:

- 🧠 智能项目分析
- 🔍 向量代码检索
- ⚠️ 冲突检测
- 💡 集成建议
- 📊 详细分析报告

### 3. 项目分析 API

独立使用项目分析功能：

```typescript
// 获取项目分析
const analysisResponse = await fetch(
  "/api/ai/generate-enhanced?action=analyze"
);
const analysis = await analysisResponse.json();

console.log("项目结构:", analysis.data.insight.projectStructure);
console.log("组件信息:", analysis.data.insight.components);
console.log("样式框架:", analysis.data.insight.styling);
console.log("路由信息:", analysis.data.insight.routing);
```

## 📊 实际效果对比

### 传统方式 (无向量数据库)

```typescript
// 每次请求都发送完整项目信息
const context = `
项目ID: sandbox-project
目标框架: nextjs
所有组件: Button, Input, Card, Modal, Form, Table, List, Nav, Header, Footer...
所有页面: home, about, contact, dashboard, profile, settings...
所有样式: tailwind, custom CSS, theme variables...
所有依赖: react, next, typescript, tailwindcss, prisma...
`;

// 结果: 8000+ tokens, 高成本, 低效率
```

### 向量优化方式

```typescript
// 智能检索最相关的内容
const optimizedContext = `
项目ID: sandbox-project
目标框架: nextjs

智能检索的项目上下文:
这是一个使用 Next.js + React + TypeScript + Tailwind CSS 的现代化 Web 应用

相关代码片段:
文件: components/ui/button.tsx (component)
Button 组件，支持多种变体和尺寸
export default function Button({ variant = "default", size = "default", ...props }) { ... }

文件: components/ui/form.tsx (component)
Form 组件，包含验证和提交逻辑
export default function Form({ onSubmit, validation, ...props }) { ... }

可用组件:
Button, Input, Form, Card, Modal (从 shadcn/ui)
自定义组件: UserCard, ProductList, SearchBar

项目建议:
使用现有的 Button 和 Form 组件保持一致性
遵循项目的 TypeScript 类型定义
参考现有页面的布局结构
`;

// 结果: 2000-3000 tokens, 节省 60-80%, 高相关性
```

## 🎯 使用场景示例

### 场景 1: 创建新页面

**用户提示**: "创建一个产品详情页面"

**AI 理解过程**:

1. 分析项目结构 → 发现现有页面模式
2. 检索相关组件 → 找到 ProductCard, ImageGallery 等
3. 检查样式框架 → 确认使用 Tailwind CSS
4. 识别集成点 → 可以添加到现有路由结构
5. 避免冲突 → 检查是否已有 product 相关页面

**生成结果**: 符合项目风格的产品详情页面，复用现有组件

### 场景 2: 添加新功能

**用户提示**: "添加用户评论功能"

**AI 理解过程**:

1. 分析现有功能 → 发现用户系统、数据库配置
2. 检索相关代码 → 找到用户模型、API 路由
3. 检查依赖 → 确认 Prisma 数据库配置
4. 识别模式 → 参考现有的 CRUD 操作
5. 建议集成 → 添加到现有的用户相关页面

**生成结果**: 与现有架构一致的评论系统

### 场景 3: 优化现有代码

**用户提示**: "优化登录表单的性能"

**AI 理解过程**:

1. 找到现有表单 → 定位登录组件
2. 分析当前实现 → 检查状态管理、验证逻辑
3. 检索优化模式 → 找到项目中的性能优化示例
4. 检查依赖 → 确认可用的优化库
5. 建议改进 → 基于项目最佳实践

**生成结果**: 性能优化的登录表单，保持项目一致性

## 🔍 监控和调试

### 1. 检查向量服务状态

```bash
curl "http://localhost:3000/api/vector/sync?action=health"
```

### 2. 查看项目分析

```bash
curl "http://localhost:3000/api/ai/generate-enhanced?action=analyze"
```

### 3. 监控 Token 使用

在生成结果中查看：

```typescript
{
  "context": {
    "vectorEnabled": true,
    "smartAnalysisEnabled": true,
    "totalContextSize": 2847,
    "contextType": "enhanced"
  }
}
```

### 4. 向量统计信息

```bash
curl "http://localhost:3000/api/vector/sync?projectId=sandbox-project&action=stats"
```

## 🚨 故障排除

### 常见问题

#### 1. 向量服务未启动

**症状**: `向量上下文构建失败`

**解决**:

```bash
# 检查环境变量
echo $SUPABASE_URL
echo $OPENAI_API_KEY

# 测试连接
curl "http://localhost:3000/api/vector/sync?action=health"
```

#### 2. 项目分析失败

**症状**: `智能项目分析失败`

**解决**:

```bash
# 检查文件权限
ls -la sandbox/

# 手动执行分析
curl "http://localhost:3000/api/ai/generate-enhanced?action=analyze"
```

#### 3. Token 优化不明显

**症状**: 上下文大小仍然很大

**解决**:

```bash
# 检查向量数据质量
curl "http://localhost:3000/api/vector/sync?projectId=sandbox-project&action=stats"

# 重新向量化项目
curl -X POST http://localhost:3000/api/vector/sync \
  -d '{"projectId": "sandbox-project", "action": "full_sync"}'
```

## 📈 性能优化建议

### 1. 向量更新策略

```typescript
// 只在文件实际变化时更新向量
const shouldUpdateVector = (oldContent: string, newContent: string) => {
  const significantChange =
    Math.abs(oldContent.length - newContent.length) > 100;
  const contentDiff = calculateSimilarity(oldContent, newContent) < 0.9;
  return significantChange || contentDiff;
};
```

### 2. 上下文大小控制

```typescript
// 根据用户需求动态调整上下文大小
const getOptimalContextSize = (userPrompt: string) => {
  if (userPrompt.includes("简单") || userPrompt.length < 50) return 2000;
  if (userPrompt.includes("复杂") || userPrompt.length > 200) return 4000;
  return 3000; // 默认大小
};
```

### 3. 缓存策略

```typescript
// 缓存项目分析结果
const projectAnalysisCache = new Map();
const getCachedAnalysis = async (projectId: string) => {
  if (projectAnalysisCache.has(projectId)) {
    const cached = projectAnalysisCache.get(projectId);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      // 5分钟缓存
      return cached.data;
    }
  }

  const analysis = await analyzer.analyzeProject();
  projectAnalysisCache.set(projectId, {
    data: analysis,
    timestamp: Date.now(),
  });

  return analysis;
};
```

## 🎉 总结

通过集成向量数据库和智能项目分析，您的 AI 代码生成将获得：

✅ **智能理解**: AI 能够读懂您的项目结构和内容  
✅ **高效检索**: 只获取最相关的代码片段  
✅ **成本降低**: 减少 60-80% 的 token 消耗  
✅ **质量提升**: 生成更符合项目风格的代码  
✅ **冲突避免**: 自动检测和避免重复功能  
✅ **一致性保持**: 遵循项目的编码规范和架构模式

现在您的 AI 助手就像一个了解您项目的资深开发者，能够生成更精准、更一致的代码！

---

如有问题，请参考项目文档或提交 Issue。
