# 项目生成工作流文档

这个文档介绍了如何配置和使用完整的项目生成工作流，该工作流将需求清单生成和组件生成整合在一起。

## 🚀 工作流概述

项目生成工作流包含以下步骤：

1. **需求清单生成** - 使用专门的 Dify API 分析用户输入，生成详细的项目需求清单
2. **组件代码生成** - 基于需求清单，使用另一个 Dify API 生成完整的项目代码
3. **文件写入** - 将生成的代码写入 sandbox 目录
4. **项目启动** - 自动启动开发服务器（可选）

## 🔧 环境配置

### 必需的环境变量

```bash
# 🌐 统一的 Dify API 端点
DIFY_API_ENDPOINT=your_dify_api_endpoint_here

# 🎯 需求清单生成的 API 密钥 (第一步：需求分析)
REQUIRMENT_DIFY_API_KEY=your_requirement_dify_api_key_here

# 🎨 组件生成的 API 密钥 (第二步：代码生成)
COMPONENT_DIFY_API_KEY=your_component_dify_api_key_here

# 其他配置
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **配置说明**: 使用统一的 Dify API 端点和不同的密钥：
>
> - **DIFY_API_ENDPOINT**: 统一的 Dify API 接口地址
> - **REQUIRMENT_DIFY_API_KEY**: 需求清单生成功能的专用密钥
> - **COMPONENT_DIFY_API_KEY**: 组件代码生成功能的专用密钥

### Dify API 配置说明

**统一端点，不同密钥的设计**：

1. **DIFY_API_ENDPOINT**：

   - 统一的 Dify API 接口地址
   - 同一个端点处理不同的请求类型
   - 通过不同的 API 密钥区分功能

2. **需求清单生成功能**：

   - 使用 `REQUIRMENT_DIFY_API_KEY` 作为 API 密钥
   - 负责分析用户需求并生成结构化的需求清单
   - 输入：用户的项目描述
   - 输出：包含功能需求、页面结构、组件需求等的 JSON 结构

3. **组件生成功能**：
   - 使用 `COMPONENT_DIFY_API_KEY` 作为 API 密钥
   - 基于需求清单生成具体的代码文件
   - 输入：结构化的需求清单和项目上下文
   - 输出：包含文件路径和内容的代码文件数组

## 📁 文件结构

```
src/
├── lib/
│   └── ai/                              # AI 相关模块统一目录
│       ├── index.ts                     # 统一导出文件
│       ├── requirement-generator.ts     # 需求清单生成器
│       ├── project-generation-workflow.ts # 工作流管理器
│       ├── dify-client.ts              # Dify客户端（已更新）
│       ├── component-analyzer.ts       # 组件分析器
│       ├── smart-context-builder.ts    # 智能上下文构建器

│       ├── project-context-analyzer.ts # 项目上下文分析器
│       └── ai-agent.ts                 # AI 代理
├── app/
│   └── api/
│       └── ai/
│           └── generate-project/
│               └── route.ts             # 完整项目生成API端点
├── components/
│   └── AI/
│       └── ProjectGenerationWorkflow.tsx # 前端工作流组件
└── app/
    └── ai-generator/
        ├── page.tsx                     # AI生成器主页面（已更新）
        └── project-workflow/
            └── page.tsx                 # 独立的工作流页面
```

## 🎯 API 使用方法

### 1. 检查配置状态

```typescript
GET / api / ai / generate - project;
```

返回当前工作流的配置状态，包括各个 API 是否正确配置。

### 2. 执行完整项目生成

```typescript
POST /api/ai/generate-project
Content-Type: application/json

{
  "prompt": "创建一个电商网站，包含商品展示、购物车、用户登录注册、订单管理等功能",
  "projectType": "nextjs",
  "projectId": "my-project",
  "autoStart": true,
  "context": "完整项目生成"
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "🎉 完整项目生成成功！",
  "data": {
    "projectId": "my-project",
    "steps": [
      {
        "step": 1,
        "name": "生成需求清单",
        "status": "completed",
        "startedAt": "2024-01-01T12:00:00Z",
        "completedAt": "2024-01-01T12:01:00Z"
      },
      {
        "step": 2,
        "name": "生成组件代码",
        "status": "completed",
        "startedAt": "2024-01-01T12:01:00Z",
        "completedAt": "2024-01-01T12:03:00Z"
      },
      {
        "step": 3,
        "name": "写入项目文件",
        "status": "completed",
        "startedAt": "2024-01-01T12:03:00Z",
        "completedAt": "2024-01-01T12:03:30Z"
      },
      {
        "step": 4,
        "name": "启动项目",
        "status": "completed",
        "startedAt": "2024-01-01T12:03:30Z",
        "completedAt": "2024-01-01T12:04:00Z"
      }
    ],
    "requirements": {
      "description": "电商网站项目",
      "featuresCount": 8,
      "pagesCount": 5,
      "componentsCount": 12,
      "technologies": ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      "dependencies": ["@next/font", "lucide-react"]
    },
    "generation": {
      "filesGenerated": 15,
      "files": [
        {
          "path": "app/page.tsx",
          "size": 2048,
          "type": "tsx"
        }
      ],
      "description": "电商网站完整代码",
      "features": ["商品展示", "购物车", "用户认证"],
      "dependencies": ["react", "next"]
    },
    "projectStatus": {
      "status": "running",
      "url": "http://localhost:3100",
      "port": 3100
    },
    "metadata": {
      "startedAt": "2024-01-01T12:00:00Z",
      "completedAt": "2024-01-01T12:04:00Z",
      "userPrompt": "创建一个电商网站..."
    }
  }
}
```

## 🖥️ 前端使用

### 1. 在现有页面中使用

访问 `/ai-generator` 页面，切换到"完整项目生成"标签页。

### 2. 独立页面使用

访问 `/ai-generator/project-workflow` 页面，使用专门的项目工作流界面。

### 3. 在自定义组件中使用

```tsx
import ProjectGenerationWorkflow from "@/components/AI/ProjectGenerationWorkflow";

export default function MyPage() {
  const handleProjectGenerated = (result: any) => {
    console.log("项目生成完成:", result);
  };

  const handlePreview = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <ProjectGenerationWorkflow
      projectId="my-custom-project"
      onProjectGenerated={handleProjectGenerated}
      onPreview={handlePreview}
    />
  );
}
```

## 🔍 工作流监控

工作流组件提供实时监控功能：

1. **配置状态检查** - 显示各个 API 的配置状态
2. **步骤追踪** - 实时显示每个步骤的执行状态
3. **进度显示** - 可视化进度条显示整体进度
4. **日志显示** - 详细的执行日志
5. **结果摘要** - 生成结果的详细统计

## 🛠️ 故障排除

### 常见问题

1. **配置错误**

   - 确保所有环境变量都已正确设置
   - 检查 Dify API 端点和密钥的有效性

2. **需求清单生成失败**

   - 检查 `REQUIREMENT_DIFY_API_ENDPOINT` 和 `REQUIRMENT_DIFY_API_KEY`
   - 确保需求清单 Dify API 返回正确的 JSON 格式

3. **组件生成失败**

   - 检查 `DIFY_API_ENDPOINT` 和 `DIFY_API_KEY`
   - 确保组件生成 Dify API 能够正确处理需求清单

4. **项目启动失败**
   - 检查端口占用情况
   - 查看项目依赖是否正确安装

### 调试模式

在开发环境中，可以通过浏览器控制台查看详细的调试信息：

```javascript
// 在浏览器控制台中启用详细日志
localStorage.setItem("debug", "true");
```

## 🚀 扩展和自定义

### 添加新的生成步骤

在 `ProjectGenerationWorkflow` 类中添加新的步骤：

```typescript
// 在 generateProject 方法中添加新步骤
console.log("📦 步骤 5: 部署项目...");
result.steps.push({
  step: 5,
  name: "部署项目",
  status: "running",
  startedAt: new Date().toISOString(),
});

// 执行部署逻辑
await this.deployProject(projectId);

result.steps[4].status = "completed";
result.steps[4].completedAt = new Date().toISOString();
```

### 自定义需求清单格式

修改 `RequirementGenerator` 中的 `validateRequirementResult` 方法来支持自定义的需求清单格式。

### 集成其他 AI 服务

工作流设计为模块化，可以轻松替换或添加其他 AI 服务：

```typescript
// 添加新的 AI 服务
import { OpenAIClient } from "./openai-client";

// 在工作流中使用
const openaiClient = new OpenAIClient();
const result = await openaiClient.generateCode(prompt);
```

## 📈 性能优化

1. **并行处理** - 某些步骤可以并行执行以提高效率
2. **缓存机制** - 缓存常用的需求清单模板
3. **增量生成** - 支持基于现有项目的增量生成
4. **批量操作** - 优化文件写入操作

## 🔒 安全考虑

1. **API 密钥管理** - 确保 API 密钥的安全存储
2. **输入验证** - 对用户输入进行严格验证
3. **文件路径检查** - 防止路径遍历攻击
4. **资源限制** - 限制生成文件的数量和大小

## 📝 更新日志

### v1.0.0

- 初始版本
- 支持需求清单生成和组件生成的完整工作流
- 提供前端界面和 API 端点
- 集成项目管理和自动启动功能
