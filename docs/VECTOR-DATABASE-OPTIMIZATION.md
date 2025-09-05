# Supabase 向量数据库优化方案

## 📋 优化目标

解决 LLM token 超出限制问题，通过向量数据库实现：

- 智能代码片段检索
- 项目上下文压缩
- 历史对话优化
- 组件知识库管理

## 🏗️ 架构设计

### 1. 向量维度配置

**重要说明：** 所有向量表都使用 **1536 维** 向量，这与 Azure OpenAI 的 `text-embedding-3-large` 模型兼容。

- 数据库 schema 中定义的向量维度：`vector(1536)`
- Embedding 服务中指定生成 1536 维向量：`dimensions: 1536`
- 这确保了模型输出与数据库存储的维度完全匹配

### 2. 向量数据库结构

```sql
-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 代码片段向量表
CREATE TABLE code_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'component', 'function', 'type', 'style'
  code_snippet TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  embedding vector(1536), -- OpenAI ada-002 维度
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 项目上下文向量表
CREATE TABLE project_context_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  context_type TEXT NOT NULL, -- 'structure', 'dependencies', 'config', 'api'
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(1536),
  importance_score FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 对话历史向量表
CREATE TABLE conversation_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  project_id TEXT,
  user_intent TEXT NOT NULL,
  ai_response_summary TEXT,
  embedding vector(1536),
  tokens_saved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 组件库知识向量表
CREATE TABLE component_knowledge_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_name TEXT NOT NULL,
  component_path TEXT NOT NULL,
  props_info TEXT,
  usage_examples TEXT,
  related_components TEXT[],
  embedding vector(1536),
  usage_frequency INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX code_embeddings_embedding_idx ON code_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX project_context_embedding_idx ON project_context_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX conversation_embedding_idx ON conversation_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX component_knowledge_embedding_idx ON component_knowledge_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### 2. 向量化服务架构

```typescript
// src/lib/vector/embedding-service.ts
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export class EmbeddingService {
  private supabase;
  private openai;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * 生成文本向量
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  }

  /**
   * 代码片段向量化存储
   */
  async storeCodeEmbedding(
    projectId: string,
    filePath: string,
    codeSnippet: string,
    contentType: string,
    metadata: any = {}
  ) {
    // 生成描述
    const description = await this.generateCodeDescription(codeSnippet);

    // 生成向量
    const embedding = await this.generateEmbedding(
      `${description}\n\n${codeSnippet}`
    );

    return await this.supabase.from("code_embeddings").insert({
      project_id: projectId,
      file_path: filePath,
      content_type: contentType,
      code_snippet: codeSnippet,
      description,
      embedding,
      metadata,
      tags: this.extractTags(codeSnippet, contentType),
    });
  }

  /**
   * 项目上下文向量化存储
   */
  async storeProjectContext(
    projectId: string,
    contextType: string,
    content: string,
    importance: number = 0.5
  ) {
    const summary = await this.generateContextSummary(content, contextType);
    const embedding = await this.generateEmbedding(
      `${contextType}: ${summary}`
    );

    return await this.supabase.from("project_context_embeddings").insert({
      project_id: projectId,
      context_type: contextType,
      content,
      summary,
      embedding,
      importance_score: importance,
    });
  }

  /**
   * 智能代码检索
   */
  async searchRelevantCode(
    projectId: string,
    query: string,
    limit: number = 5,
    threshold: number = 0.7
  ) {
    const queryEmbedding = await this.generateEmbedding(query);

    const { data, error } = await this.supabase.rpc("search_code_embeddings", {
      project_id: projectId,
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    return data || [];
  }

  /**
   * 项目上下文检索
   */
  async getRelevantContext(
    projectId: string,
    userIntent: string,
    maxTokens: number = 2000
  ) {
    const queryEmbedding = await this.generateEmbedding(userIntent);

    const { data } = await this.supabase.rpc("search_project_context", {
      project_id: projectId,
      query_embedding: queryEmbedding,
      max_tokens: maxTokens,
    });

    return this.optimizeContextForTokens(data, maxTokens);
  }

  private async generateCodeDescription(code: string): Promise<string> {
    // 使用轻量级 LLM 生成代码描述
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `简洁描述这段代码的功能（限制50字内）：\n${code.substring(
              0,
              500
            )}`,
          },
        ],
        max_tokens: 100,
      });
      return response.choices[0].message.content || "代码片段";
    } catch {
      return "代码片段";
    }
  }
}
```

### 3. 项目向量化管理器

```typescript
// src/lib/vector/project-vectorizer.ts
export class ProjectVectorizer {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * 向量化整个项目
   */
  async vectorizeProject(projectId: string, projectPath: string) {
    console.log(`🔍 开始向量化项目: ${projectId}`);

    // 1. 扫描并向量化代码文件
    await this.vectorizeCodeFiles(projectId, projectPath);

    // 2. 向量化项目配置
    await this.vectorizeProjectConfig(projectId, projectPath);

    // 3. 向量化组件库信息
    await this.vectorizeComponentLibrary(projectId, projectPath);

    // 4. 向量化API路由
    await this.vectorizeAPIRoutes(projectId, projectPath);

    console.log(`✅ 项目向量化完成: ${projectId}`);
  }

  /**
   * 向量化代码文件
   */
  private async vectorizeCodeFiles(projectId: string, projectPath: string) {
    const files = await this.scanCodeFiles(projectPath);

    for (const file of files) {
      const content = await fs.readFile(file.path, "utf-8");

      // 按函数/组件分割代码
      const codeBlocks = this.parseCodeBlocks(content, file.extension);

      for (const block of codeBlocks) {
        await this.embeddingService.storeCodeEmbedding(
          projectId,
          file.relativePath,
          block.code,
          block.type,
          {
            language: file.extension,
            lineStart: block.lineStart,
            lineEnd: block.lineEnd,
            exports: block.exports,
          }
        );
      }
    }
  }

  /**
   * 解析代码块
   */
  private parseCodeBlocks(content: string, extension: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];

    if (extension === "tsx" || extension === "jsx") {
      // 解析 React 组件
      blocks.push(...this.parseReactComponents(content));
      blocks.push(...this.parseReactHooks(content));
    }

    if (extension === "ts" || extension === "js") {
      // 解析函数和类
      blocks.push(...this.parseFunctions(content));
      blocks.push(...this.parseClasses(content));
    }

    return blocks;
  }

  /**
   * 增量更新向量
   */
  async updateFileVectors(
    projectId: string,
    filePath: string,
    content: string
  ) {
    // 删除旧向量
    await this.embeddingService.deleteFileVectors(projectId, filePath);

    // 生成新向量
    const blocks = this.parseCodeBlocks(content, path.extname(filePath));

    for (const block of blocks) {
      await this.embeddingService.storeCodeEmbedding(
        projectId,
        filePath,
        block.code,
        block.type
      );
    }
  }
}
```

### 4. 智能上下文检索器

```typescript
// src/lib/vector/context-retriever.ts
export class ContextRetriever {
  private embeddingService: EmbeddingService;
  private tokenCounter: TokenCounter;

  constructor() {
    this.embeddingService = new EmbeddingService();
    this.tokenCounter = new TokenCounter();
  }

  /**
   * 为 LLM 构建优化的上下文
   */
  async buildOptimizedContext(
    projectId: string,
    userRequest: string,
    maxTokens: number = 4000
  ): Promise<OptimizedContext> {
    // 1. 分析用户意图
    const intent = await this.analyzeUserIntent(userRequest);

    // 2. 检索相关代码片段
    const relevantCode = await this.embeddingService.searchRelevantCode(
      projectId,
      userRequest,
      10,
      0.7
    );

    // 3. 检索项目上下文
    const projectContext = await this.embeddingService.getRelevantContext(
      projectId,
      userRequest,
      maxTokens * 0.3 // 30% 给项目上下文
    );

    // 4. 检索相关组件
    const relevantComponents = await this.getRelevantComponents(
      intent.components,
      maxTokens * 0.2 // 20% 给组件信息
    );

    // 5. 检索历史对话
    const conversationHistory = await this.getRelevantHistory(
      intent.conversationId,
      userRequest,
      maxTokens * 0.1 // 10% 给历史对话
    );

    // 6. 构建优化的上下文
    return this.assembleContext({
      userRequest,
      relevantCode,
      projectContext,
      relevantComponents,
      conversationHistory,
      maxTokens,
    });
  }

  /**
   * 组装优化的上下文
   */
  private assembleContext(params: ContextParams): OptimizedContext {
    const context = {
      summary: this.generateProjectSummary(params.projectContext),
      relevantCode: params.relevantCode.slice(0, 5), // 最多5个代码片段
      componentGuide: this.generateComponentGuide(params.relevantComponents),
      previousContext: this.summarizeHistory(params.conversationHistory),
      suggestions: this.generateSuggestions(params.userRequest),
    };

    // 确保不超过 token 限制
    return this.optimizeForTokenLimit(context, params.maxTokens);
  }

  /**
   * Token 优化
   */
  private optimizeForTokenLimit(
    context: any,
    maxTokens: number
  ): OptimizedContext {
    let totalTokens = this.tokenCounter.count(JSON.stringify(context));

    while (totalTokens > maxTokens) {
      // 逐步减少内容
      if (context.relevantCode.length > 3) {
        context.relevantCode.pop();
      } else if (context.previousContext.length > 200) {
        context.previousContext = context.previousContext.substring(0, 200);
      } else if (context.componentGuide.length > 500) {
        context.componentGuide = context.componentGuide.substring(0, 500);
      } else {
        break;
      }

      totalTokens = this.tokenCounter.count(JSON.stringify(context));
    }

    return {
      ...context,
      tokenCount: totalTokens,
      optimizationApplied:
        totalTokens < this.tokenCounter.count(JSON.stringify(context)),
    };
  }
}
```

### 5. API 集成

```typescript
// src/app/api/vector/sync/route.ts
export async function POST(request: Request) {
  try {
    const { projectId, files, action } = await request.json();

    const vectorizer = new ProjectVectorizer();

    switch (action) {
      case "full_sync":
        await vectorizer.vectorizeProject(projectId, "sandbox");
        break;

      case "incremental_sync":
        for (const [filePath, content] of Object.entries(files)) {
          await vectorizer.updateFileVectors(projectId, filePath, content);
        }
        break;
    }

    return NextResponse.json({
      success: true,
      message: "向量同步完成",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// src/app/api/ai/generate-optimized/route.ts
export async function POST(request: Request) {
  try {
    const { prompt, projectId, conversationId } = await request.json();

    const contextRetriever = new ContextRetriever();

    // 构建优化的上下文
    const optimizedContext = await contextRetriever.buildOptimizedContext(
      projectId,
      prompt,
      4000 // 4k tokens 限制
    );

    // 使用优化的上下文调用 Dify
    const difyClient = DifyClient.getInstance();
    const result = await difyClient.generateUI(prompt, {
      projectType: "nextjs",
      context: JSON.stringify(optimizedContext),
      conversationId,
    });

    // 存储对话历史向量
    await new EmbeddingService().storeConversationHistory(
      conversationId,
      projectId,
      prompt,
      result.description
    );

    return NextResponse.json({
      success: true,
      data: result,
      contextOptimization: {
        tokensSaved: 8000 - optimizedContext.tokenCount,
        optimizationApplied: optimizedContext.optimizationApplied,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

## 🚀 实施步骤

### 1. 环境配置

```bash
# 安装依赖
npm install @supabase/supabase-js openai tiktoken

# 环境变量
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
```

### 2. Supabase 设置

1. 在 Supabase 项目中启用向量扩展
2. 运行 SQL 脚本创建表结构
3. 配置 RLS (Row Level Security) 策略
4. 创建向量搜索函数

### 3. 项目集成

1. 集成向量化服务到项目管理器
2. 修改 AI 生成 API 使用优化上下文
3. 添加实时向量同步机制
4. 实现向量搜索 UI 组件

## 📊 预期收益

- **Token 使用优化**: 减少 60-80% 的 token 消耗
- **响应速度提升**: 更精准的上下文检索
- **知识积累**: 项目知识库持续学习
- **成本降低**: 显著减少 LLM API 调用成本

## 🔍 监控和调优

1. **向量质量监控**: 检索准确率跟踪
2. **Token 使用分析**: 优化效果量化
3. **响应时间优化**: 向量检索性能调优
4. **用户体验**: A/B 测试对比效果
