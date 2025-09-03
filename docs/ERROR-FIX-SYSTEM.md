# 项目错误修复系统

## 概述

项目错误修复系统是一个全自动的智能错误检测和修复解决方案，专门为 AI 生成的项目设计。当项目生成完成后，系统会自动检测运行错误，分析错误原因，并提供智能修复建议，最终自动应用修复。

## 🚀 核心特性

### 1. **全自动错误检测**

- 构建错误检测 (`npm run build`)
- TypeScript 类型错误检测 (`npx tsc --noEmit`)
- ESLint 代码规范检查 (`npm run lint`)
- 依赖完整性检查 (package.json, node_modules)

### 2. **智能错误分析**

- 基于向量相似度的代码上下文检索
- AI 驱动的错误原因分析
- 多维度修复建议生成
- 置信度和时间估算

### 3. **自动修复执行**

- 智能代码更改应用
- 文件备份和回滚机制
- 修复结果验证
- 失败自动回滚

### 4. **完整工作流管理**

- 按严重程度排序处理
- 最大重试次数控制
- 实时进度跟踪
- 详细执行日志

## 🏗️ 系统架构

```
用户请求 → API路由 → 错误修复服务 → 向量检索 → AI分析 → 自动修复 → 结果验证
    ↓           ↓           ↓           ↓         ↓         ↓         ↓
前端界面 → 错误检测 → 上下文构建 → 修复建议 → 代码更改 → 验证测试 → 状态更新
```

## 📁 文件结构

```
src/
├── lib/vector/
│   ├── error-fix-service.ts          # 核心错误修复服务
│   ├── embedding-service.ts          # 向量检索服务
│   └── context-retriever.ts          # 上下文检索器
├── app/api/ai/error-fix/
│   └── route.ts                      # 错误修复API路由
└── components/ErrorFix/
    ├── ErrorFixDashboard.tsx         # 错误修复仪表板
    └── ProjectErrorFixIntegration.tsx # 项目集成组件
```

## 🔧 使用方法

### 1. **基本使用**

```typescript
import { ErrorFixService } from "@/lib/vector/error-fix-service";

const errorFixService = new ErrorFixService();

// 检测项目错误
const errors = await errorFixService.detectProjectErrors(
  projectId,
  projectPath
);

// 启动智能修复工作流
const result = await errorFixService.intelligentErrorFixWorkflow(
  projectId,
  projectPath
);
```

### 2. **React 组件集成**

```tsx
import ProjectErrorFixIntegration from "@/components/ErrorFix/ProjectErrorFixIntegration";

function ProjectGenerationWorkflow() {
  const handleErrorFixComplete = (result) => {
    console.log("错误修复完成:", result);
  };

  return (
    <ProjectErrorFixIntegration
      projectId="project_123"
      projectPath="/path/to/project"
      onErrorFixComplete={handleErrorFixComplete}
      autoStart={true}
    />
  );
}
```

### 3. **API 调用**

```typescript
// 检测错误
const response = await fetch("/api/ai/error-fix", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    projectId: "project_123",
    projectPath: "/path/to/project",
    action: "detect",
  }),
});

// 启动工作流
const workflowResponse = await fetch("/api/ai/error-fix", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    projectId: "project_123",
    projectPath: "/path/to/project",
    action: "workflow",
  }),
});
```

## 🎯 工作流程

### 阶段 1: 错误检测

```typescript
// 并行执行多种检测
const [buildErrors, typeErrors, lintErrors, dependencyErrors] =
  await Promise.all([
    this.checkBuildErrors(projectPath),
    this.checkTypeErrors(projectPath),
    this.checkLintErrors(projectPath),
    this.checkDependencyErrors(projectPath),
  ]);
```

### 阶段 2: 错误分析

```typescript
// 检索相关代码上下文
const relevantCode = await this.embeddingService.searchRelevantCode(
  projectId,
  error.errorMessage,
  5,
  0.6
);

// AI分析错误原因
const suggestions = await this.generateFixSuggestions(analysisPrompt, error);
```

### 阶段 3: 自动修复

```typescript
// 备份原始文件
const backupFiles = await this.backupFiles(suggestion.codeChanges, projectPath);

// 应用代码更改
for (const change of suggestion.codeChanges) {
  await this.applyCodeChange(change, projectPath);
}

// 验证修复结果
const validationResult = await this.validateFix(projectPath, error);
```

### 阶段 4: 结果验证

```typescript
// 根据错误类型进行相应验证
switch (originalError.errorType) {
  case "build":
    await execAsync("npm run build", { cwd: projectPath });
    break;
  case "type":
    await execAsync("npx tsc --noEmit", { cwd: projectPath });
    break;
  // ... 其他类型
}
```

## ⚙️ 配置选项

### 环境变量

```bash
# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 服务配置

```typescript
class ErrorFixService {
  private maxFixAttempts: number = 3; // 最大修复尝试次数
  private similarityThreshold: number = 0.7; // 相似度阈值
  private maxSuggestions: number = 5; // 最大建议数量
}
```

## 📊 监控和日志

### 执行状态跟踪

```typescript
interface ErrorInfo {
  status: "open" | "analyzing" | "fixing" | "resolved" | "failed";
  fixAttempts: number;
  maxFixAttempts: number;
  createdAt: Date;
  resolvedAt?: Date;
}
```

### 详细执行日志

```typescript
const logs = [
  "[10:30:15] 🚀 启动项目错误修复工作流...",
  "[10:30:16] 🔍 检测项目错误...",
  "[10:30:17] 📊 发现 3 个错误，开始智能修复...",
  "[10:30:18] 🔧 启动智能修复工作流...",
  "[10:30:25] 🏁 错误修复工作流完成: 修复完成！成功率: 100%",
];
```

## 🚨 错误处理

### 自动回滚机制

```typescript
try {
  // 应用修复
  await this.applyCodeChange(change, projectPath);
} catch (error) {
  // 自动回滚
  await this.rollbackChanges(backupFiles, projectPath);
  throw error;
}
```

### 重试策略

```typescript
if (error.fixAttempts >= this.maxFixAttempts) {
  console.log(`跳过错误 ${error.id}: 已达到最大修复尝试次数`);
  failedErrors++;
  continue;
}
```

## 🔍 故障排除

### 常见问题

1. **OpenAI API 调用失败**

   - 检查 API 密钥配置
   - 验证网络连接
   - 检查 API 配额

2. **项目构建失败**

   - 确认项目路径正确
   - 检查 package.json 配置
   - 验证依赖安装

3. **向量检索失败**
   - 检查 Supabase 配置
   - 验证向量索引状态
   - 确认项目已向量化

### 调试模式

```typescript
// 启用详细日志
const errorFixService = new ErrorFixService();
errorFixService.setDebugMode(true);

// 查看执行详情
const result = await errorFixService.intelligentErrorFixWorkflow(
  projectId,
  projectPath,
  { debug: true, verbose: true }
);
```

## 📈 性能优化

### 并行处理

```typescript
// 并行检测多种错误类型
const [buildErrors, typeErrors, lintErrors, dependencyErrors] =
  await Promise.all([
    this.checkBuildErrors(projectPath),
    this.checkTypeErrors(projectPath),
    this.checkLintErrors(projectPath),
    this.checkDependencyErrors(projectPath),
  ]);
```

### 智能缓存

```typescript
// 缓存向量检索结果
const cacheKey = `error_analysis_${error.id}_${error.errorMessage}`;
let suggestions = this.cache.get(cacheKey);

if (!suggestions) {
  suggestions = await this.generateFixSuggestions(prompt, error);
  this.cache.set(cacheKey, suggestions, 300000); // 5分钟缓存
}
```

## 🔮 未来扩展

### 计划功能

- [ ] 支持更多编程语言
- [ ] 集成更多错误检测工具
- [ ] 机器学习模型优化
- [ ] 团队协作功能
- [ ] 性能基准测试

### 插件系统

```typescript
interface ErrorDetectorPlugin {
  name: string;
  detect(projectPath: string): Promise<ErrorInfo[]>;
  validate(fixResult: FixResult): Promise<boolean>;
}

// 注册自定义检测器
errorFixService.registerPlugin(new CustomErrorDetector());
```

## 📚 相关文档

- [向量化系统文档](./VECTOR-SETUP-GUIDE.md)
- [项目生成工作流](./PROJECT-GENERATION-WORKFLOW.md)
- [API 集成指南](./INTEGRATION-GUIDE.md)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个系统！

### 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建项目
npm run build
```

---

**注意**: 这是一个实验性功能，在生产环境中使用前请充分测试。
