# 向量数据库设置指南

本指南将帮助您完整设置 Supabase 向量数据库，以解决 LLM token 超出限制的问题。

## 🎯 设置目标

- 解决 LLM token 超出限制问题
- 实现智能代码片段检索
- 优化项目上下文管理
- 建立组件知识库

## 📋 前置要求

1. **Supabase 账户**: [注册 Supabase](https://supabase.com)
2. **OpenAI API Key**: [获取 OpenAI API Key](https://platform.openai.com)
3. **Dify 平台配置**: 您的 Dify 工作流服务

## 🚀 详细设置步骤

### 步骤 1: 创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息:
   - Name: `v0-sandbox-vectors`
   - Database Password: 生成强密码
   - Region: 选择离您最近的区域

### 步骤 2: 启用向量扩展

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 点击 "New query"
3. 执行以下 SQL:

```sql
-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;
```

### 步骤 3: 执行数据库迁移

1. 复制 `/sql/supabase-vector-setup.sql` 文件的内容
2. 在 Supabase SQL Editor 中执行完整的脚本
3. 确认所有表和函数创建成功

### 步骤 4: 配置环境变量

在您的 `.env.local` 文件中添加以下配置:

```bash
# Supabase 配置
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI 配置
OPENAI_API_KEY=your-openai-api-key

# Dify 配置 (已有)
DIFY_API_ENDPOINT=your-dify-endpoint
COMPONENT_DIFY_API_KEY=your-component-api-key

# 应用配置
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### 获取 Supabase Keys:

1. 在 Supabase Dashboard 中，进入 **Settings > API**
2. 复制以下值:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_KEY`

### 步骤 5: 安装依赖

```bash
npm install @supabase/supabase-js openai gpt-tokenizer glob
```

### 步骤 6: 测试连接

1. 启动开发服务器:
```bash
npm run dev
```

2. 访问配置检查 API:
```bash
curl http://localhost:3000/api/ai/generate-optimized?action=status
```

3. 执行健康检查:
```bash
curl http://localhost:3000/api/ai/generate-optimized?action=test
```

### 步骤 7: 初始化项目向量

执行第一次项目向量化:

```bash
curl -X POST http://localhost:3000/api/vector/sync \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "sandbox-project",
    "action": "full_sync"
  }'
```

## 🔧 功能验证

### 1. 验证向量存储

```sql
-- 在 Supabase SQL Editor 中执行
SELECT COUNT(*) FROM code_embeddings;
SELECT COUNT(*) FROM project_context_embeddings;
SELECT COUNT(*) FROM component_knowledge_embeddings;
```

### 2. 测试向量搜索

```bash
curl -X POST http://localhost:3000/api/ai/generate-optimized \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "创建一个登录页面",
    "projectId": "sandbox-project",
    "useOptimizedContext": true,
    "maxTokens": 2000
  }'
```

### 3. 检查优化效果

查看返回的 `optimization` 字段:
```json
{
  "optimization": {
    "enabled": true,
    "tokensSaved": 3500,
    "originalTokenCount": 6000,
    "finalTokenCount": 2500
  }
}
```

## 📊 监控和管理

### 1. 向量统计信息

```bash
curl "http://localhost:3000/api/vector/sync?projectId=sandbox-project&action=stats"
```

### 2. 服务健康状态

```bash
curl "http://localhost:3000/api/vector/sync?action=health"
```

### 3. 前端管理界面

可以在您的应用中集成 `VectorDashboard` 组件:

```tsx
import VectorDashboard from '@/components/Vector/VectorDashboard';

function AdminPage() {
  return (
    <div>
      <VectorDashboard projectId="sandbox-project" />
    </div>
  );
}
```

## ⚡ 性能优化建议

### 1. 数据库优化

```sql
-- 定期重建向量索引以提高性能
REINDEX INDEX code_embeddings_embedding_idx;
REINDEX INDEX project_context_embedding_idx;
```

### 2. Token 使用优化

- **代码块大小**: 每个代码块控制在 200-500 tokens
- **上下文优先级**: 按重要性排序，优先返回高价值内容
- **缓存策略**: 相似查询复用已检索的内容

### 3. 向量更新策略

```javascript
// 只在文件实际变化时更新向量
const shouldUpdateVector = (oldContent, newContent) => {
  const significantChange = Math.abs(oldContent.length - newContent.length) > 100;
  const contentDiff = calculateSimilarity(oldContent, newContent) < 0.9;
  return significantChange || contentDiff;
};
```

## 🛠️ 故障排除

### 常见问题

#### 1. 向量扩展未启用

**错误**: `extension "vector" is not available`

**解决**: 
1. 确保在 Supabase Dashboard 中启用了 vector 扩展
2. 检查您的 Supabase 计划是否支持扩展

#### 2. OpenAI API 配额超限

**错误**: `Rate limit exceeded`

**解决**:
1. 检查 OpenAI API 使用量
2. 考虑升级 OpenAI 计划
3. 实现请求缓存和去重

#### 3. 向量搜索性能问题

**症状**: 搜索响应时间过长

**解决**:
1. 检查向量索引状态
2. 减少搜索结果数量
3. 优化查询阈值

#### 4. 数据库连接问题

**错误**: `Could not connect to Supabase`

**解决**:
1. 验证 Supabase URL 和 Keys
2. 检查网络连接
3. 确认 RLS 策略配置

### 调试命令

```bash
# 检查环境变量
node -e "console.log(process.env.SUPABASE_URL)"

# 测试 OpenAI 连接
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 测试 Supabase 连接
curl "$SUPABASE_URL/rest/v1/code_embeddings?select=count" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

## 📈 使用效果

成功设置后，您将获得：

### Token 使用优化
- **原始**: 每次请求 6000-8000 tokens
- **优化后**: 每次请求 2000-3000 tokens
- **节省**: 60-75% token 使用量

### 响应质量提升
- 更精准的代码建议
- 更相关的组件推荐
- 更好的上下文理解

### 开发效率提升
- 更快的 AI 响应速度
- 更低的 API 调用成本
- 更智能的代码生成

## 🔄 维护和更新

### 定期任务

1. **每周**: 执行向量统计检查
2. **每月**: 清理过期的对话向量
3. **按需**: 重新索引和优化数据库

### 监控指标

- 向量数据量增长
- 搜索性能指标
- Token 节省效果
- API 调用成功率

---

完成这些步骤后，您的 v0-sandbox 项目将拥有强大的向量数据库支持，大大减少 LLM token 使用量，提升 AI 代码生成的效率和质量！

如有问题，请参考项目文档或提交 Issue。
