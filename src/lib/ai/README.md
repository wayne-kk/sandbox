# AI 模块目录

这个目录包含所有与大模型交互和 AI 相关的模块。

## 📁 文件结构

```
ai/
├── index.ts                     # 统一导出文件，便于导入
├── dify-client.ts              # Dify API 客户端
├── requirement-generator.ts    # 需求清单生成器
├── project-generation-workflow.ts # 完整项目生成工作流
├── component-analyzer.ts       # 组件分析器
├── smart-context-builder.ts    # 智能上下文构建器

├── project-context-analyzer.ts # 项目上下文分析器
└── ai-agent.ts                 # AI 代理
```

## 🎯 模块说明

### 核心 AI 客户端

- **dify-client.ts**: Dify API 的核心客户端，负责与 Dify 服务通信
- **requirement-generator.ts**: 专门用于生成项目需求清单的模块

### 工作流管理

- **project-generation-workflow.ts**: 协调整个项目生成流程的工作流管理器

### 代码分析和上下文

- **component-analyzer.ts**: 分析现有组件库，提供组件文档和使用指南
- **smart-context-builder.ts**: 智能构建上下文信息
- **project-context-analyzer.ts**: 分析项目结构和上下文

### 其他

- **ai-agent.ts**: AI 代理相关功能
- **index.ts**: 统一导出文件，便于其他模块导入

## 🚀 使用方式

### 1. 使用统一导出（推荐）

```typescript
// 从统一入口导入
import {
  DifyClient,
  RequirementGenerator,
  ProjectGenerationWorkflow,
} from "@/lib/ai";

// 或者导入类型
import type {
  GenerateResult,
  RequirementResult,
  ProjectGenerationOptions,
} from "@/lib/ai";
```

### 2. 直接导入特定模块

```typescript
// 直接从具体模块导入
import { DifyClient } from "@/lib/ai/dify-client";
import { RequirementGenerator } from "@/lib/ai/requirement-generator";
```

## 🔧 配置

大部分模块需要以下环境变量：

```bash
# Dify API 配置
DIFY_API_ENDPOINT=your_dify_api_endpoint
DIFY_API_KEY=your_dify_api_key

# 需求清单生成配置
REQUIREMENT_DIFY_API_ENDPOINT=your_requirement_api_endpoint
REQUIRMENT_DIFY_API_KEY=your_requirement_api_key
```

## 📋 模块依赖关系

```
project-generation-workflow
├── requirement-generator
├── dify-client
└── project-manager (外部)

dify-client
├── component-analyzer
└── smart-context-builder

smart-context-builder
├── component-analyzer
└── project-context-analyzer

project-context-analyzer
└── dify-client
```

## 🛠️ 开发指南

### 添加新的 AI 模块

1. 在此目录下创建新的 TypeScript 文件
2. 实现相应的功能和类型定义
3. 在 `index.ts` 中添加导出
4. 更新此 README 文档

### 模块设计原则

1. **单一职责**: 每个模块专注于特定的 AI 功能
2. **松耦合**: 模块间通过接口交互，减少直接依赖
3. **可测试**: 提供清晰的接口和错误处理
4. **可扩展**: 支持配置和自定义

## 🔍 调试和监控

所有 AI 模块都包含详细的日志输出，可以通过以下方式启用调试模式：

```typescript
// 在代码中启用调试
process.env.DEBUG = "ai:*";

// 或在浏览器控制台中
localStorage.setItem("debug", "ai:*");
```

## 📚 相关文档

- [项目生成工作流文档](../../docs/PROJECT-GENERATION-WORKFLOW.md)
- [Dify 集成文档](../../docs/DIFY-INTEGRATION.md)
- [智能代码演进文档](../../docs/INTELLIGENT-CODE-EVOLUTION.md)
