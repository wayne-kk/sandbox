import { encode } from 'gpt-tokenizer';
import { EmbeddingService, CodeEmbedding, ProjectContext, ConversationEmbedding, ComponentKnowledge } from './embedding-service';

export interface UserIntent {
  type: 'create' | 'modify' | 'debug' | 'explain' | 'optimize';
  components: string[];
  features: string[];
  technologies: string[];
  complexity: 'simple' | 'medium' | 'complex';
  conversationId?: string;
}

export interface OptimizedContext {
  summary: string;
  relevantCode: CodeEmbedding[];
  componentGuide: string;
  previousContext: string;
  suggestions: string[];
  tokenCount: number;
  optimizationApplied: boolean;
  debugInfo?: {
    originalTokenCount: number;
    codeBlocksFound: number;
    contextItemsFound: number;
    componentsFound: number;
  };
}

export interface ContextParams {
  userRequest: string;
  relevantCode: CodeEmbedding[];
  projectContext: ProjectContext[];
  relevantComponents: ComponentKnowledge[];
  conversationHistory: ConversationEmbedding[];
  maxTokens: number;
}

export class ContextRetriever {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  /**
   * 为 LLM 构建优化的上下文
   */
  async buildOptimizedContext(
    projectId: string,
    userRequest: string,
    maxTokens: number = 4000,
    conversationId?: string
  ): Promise<OptimizedContext> {
    console.log(`🧠 开始构建优化上下文 (最大 ${maxTokens} tokens)`);
    
    try {
      // 1. 分析用户意图
      const intent = await this.analyzeUserIntent(userRequest);
      console.log(`🎯 用户意图分析: ${intent.type} | 复杂度: ${intent.complexity}`);

      // 2. 并行检索相关内容
      const [relevantCode, projectContext, relevantComponents, conversationHistory] = await Promise.all([
        this.embeddingService.searchRelevantCode(projectId, userRequest, 10, 0.7),
        this.embeddingService.searchProjectContext(projectId, userRequest, 5, 0.7),
        this.embeddingService.searchRelevantComponents(userRequest, 8, 0.7),
        conversationId 
          ? this.embeddingService.searchConversationHistory(conversationId, userRequest, 3, 0.7)
          : []
      ]);

      console.log(`📊 检索结果: ${relevantCode.length} 代码块, ${projectContext.length} 上下文, ${relevantComponents.length} 组件, ${conversationHistory.length} 历史对话`);

      // 3. 构建优化的上下文
      const optimizedContext = this.assembleContext({
        userRequest,
        relevantCode,
        projectContext,
        relevantComponents,
        conversationHistory,
        maxTokens
      });

      console.log(`✅ 上下文构建完成: ${optimizedContext.tokenCount} tokens (优化: ${optimizedContext.optimizationApplied ? '是' : '否'})`);
      
      return optimizedContext;
    } catch (error) {
      console.error('构建优化上下文失败:', error);
      // 返回基础上下文作为回退
      return this.buildFallbackContext(userRequest, maxTokens);
    }
  }

  /**
   * 分析用户意图
   */
  private async analyzeUserIntent(userRequest: string): Promise<UserIntent> {
    const request = userRequest.toLowerCase();
    
    // 确定意图类型
    let type: UserIntent['type'] = 'create';
    if (request.includes('修改') || request.includes('更新') || request.includes('改')) {
      type = 'modify';
    } else if (request.includes('调试') || request.includes('错误') || request.includes('bug')) {
      type = 'debug';
    } else if (request.includes('解释') || request.includes('说明') || request.includes('怎么')) {
      type = 'explain';
    } else if (request.includes('优化') || request.includes('改进') || request.includes('性能')) {
      type = 'optimize';
    }

    // 提取组件名称
    const componentKeywords = [
      'button', 'input', 'form', 'card', 'modal', 'dialog', 'table', 'list',
      'nav', 'header', 'footer', 'sidebar', 'dropdown', 'tooltip', 'badge',
      'alert', 'progress', 'tabs', 'accordion', 'carousel', 'chart'
    ];
    const components = componentKeywords.filter(comp => request.includes(comp));

    // 提取功能特性
    const featureKeywords = [
      '登录', '注册', '搜索', '筛选', '排序', '分页', '上传', '下载',
      '支付', '购物车', '评论', '点赞', '分享', '通知', '聊天', '视频',
      '地图', '日历', '图表', '报表', '导出', '导入'
    ];
    const features = featureKeywords.filter(feat => request.includes(feat));

    // 提取技术栈
    const techKeywords = [
      'react', 'next', 'typescript', 'tailwind', 'prisma', 'supabase',
      'api', 'database', 'auth', 'payment', 'websocket', 'sse'
    ];
    const technologies = techKeywords.filter(tech => request.includes(tech));

    // 确定复杂度
    let complexity: UserIntent['complexity'] = 'simple';
    if (features.length > 3 || technologies.length > 2 || request.length > 200) {
      complexity = 'complex';
    } else if (features.length > 1 || technologies.length > 1 || request.length > 100) {
      complexity = 'medium';
    }

    return {
      type,
      components,
      features,
      technologies,
      complexity
    };
  }

  /**
   * 组装优化的上下文
   */
  private assembleContext(params: ContextParams): OptimizedContext {
    console.log(`🔧 开始组装上下文...`);
    
    // 计算初始分配
    const allocations = this.calculateTokenAllocations(params.maxTokens, params);
    
    // 构建各部分内容
    const summary = this.generateProjectSummary(params.projectContext);
    const componentGuide = this.generateComponentGuide(params.relevantComponents, allocations.components);
    const previousContext = this.summarizeHistory(params.conversationHistory, allocations.history);
    const suggestions = this.generateSuggestions(params.userRequest);
    
    // 选择最相关的代码块
    const relevantCode = this.selectRelevantCode(params.relevantCode, allocations.code);

    const originalContext = {
      summary,
      relevantCode: params.relevantCode,
      componentGuide: this.generateComponentGuide(params.relevantComponents),
      previousContext: this.summarizeHistory(params.conversationHistory),
      suggestions
    };

    const optimizedContext = {
      summary,
      relevantCode,
      componentGuide,
      previousContext,
      suggestions,
      tokenCount: 0,
      optimizationApplied: false,
      debugInfo: {
        originalTokenCount: this.countTokens(JSON.stringify(originalContext)),
        codeBlocksFound: params.relevantCode.length,
        contextItemsFound: params.projectContext.length,
        componentsFound: params.relevantComponents.length
      }
    };

    // 计算最终 token 数量并进行最终优化
    return this.finalizeContext(optimizedContext, params.maxTokens);
  }

  /**
   * 计算 Token 分配策略
   */
  private calculateTokenAllocations(maxTokens: number, params: ContextParams): {
    code: number;
    components: number;
    history: number;
    summary: number;
    buffer: number;
  } {
    const intent = params.userRequest.toLowerCase();
    
    // 根据用户意图调整分配比例
    let codeRatio = 0.5; // 默认代码占 50%
    let componentRatio = 0.2; // 组件信息占 20%
    let historyRatio = 0.1; // 历史对话占 10%
    let summaryRatio = 0.15; // 项目摘要占 15%
    let bufferRatio = 0.05; // 缓冲区占 5%

    if (intent.includes('创建') || intent.includes('新建')) {
      // 创建场景：更多组件信息，较少历史
      componentRatio = 0.3;
      historyRatio = 0.05;
      codeRatio = 0.45;
    } else if (intent.includes('修改') || intent.includes('更新')) {
      // 修改场景：更多代码上下文和历史
      codeRatio = 0.6;
      historyRatio = 0.15;
      componentRatio = 0.1;
    } else if (intent.includes('调试') || intent.includes('错误')) {
      // 调试场景：主要关注代码和历史
      codeRatio = 0.7;
      historyRatio = 0.2;
      componentRatio = 0.05;
    }

    return {
      code: Math.floor(maxTokens * codeRatio),
      components: Math.floor(maxTokens * componentRatio),
      history: Math.floor(maxTokens * historyRatio),
      summary: Math.floor(maxTokens * summaryRatio),
      buffer: Math.floor(maxTokens * bufferRatio)
    };
  }

  /**
   * 选择最相关的代码块
   */
  private selectRelevantCode(codeBlocks: CodeEmbedding[], maxTokens: number): CodeEmbedding[] {
    const selected: CodeEmbedding[] = [];
    let currentTokens = 0;

    // 按相关性和类型优先级排序
    const prioritized = [...codeBlocks].sort((a, b) => {
      const typeWeight = this.getTypeWeight(a.content_type) - this.getTypeWeight(b.content_type);
      if (typeWeight !== 0) return typeWeight;
      
      // 如果有相似度分数，按相似度排序
      return 0; // 默认保持原序
    });

    for (const block of prioritized) {
      const tokens = this.countTokens(block.code_snippet);
      
      if (currentTokens + tokens <= maxTokens) {
        selected.push(block);
        currentTokens += tokens;
      } else {
        // 尝试截断最后一个代码块
        const remainingTokens = maxTokens - currentTokens;
        if (remainingTokens > 100) { // 至少保留 100 tokens 的代码
          const truncatedBlock = {
            ...block,
            code_snippet: this.truncateText(block.code_snippet, remainingTokens)
          };
          selected.push(truncatedBlock);
        }
        break;
      }
    }

    return selected;
  }

  /**
   * 获取内容类型权重
   */
  private getTypeWeight(contentType: string): number {
    const weights = {
      'component': 1,
      'function': 2,
      'api': 3,
      'type': 4,
      'config': 5,
      'style': 6
    };
    return weights[contentType as keyof typeof weights] || 10;
  }

  /**
   * 生成项目摘要
   */
  private generateProjectSummary(contexts: ProjectContext[]): string {
    if (contexts.length === 0) {
      return "这是一个 Next.js + React 项目，使用 TypeScript 和 Tailwind CSS。";
    }

    const summaries = contexts
      .filter(ctx => ctx.summary)
      .map(ctx => ctx.summary)
      .slice(0, 3); // 最多 3 个摘要

    return summaries.join(' ');
  }

  /**
   * 生成组件指南
   */
  private generateComponentGuide(components: ComponentKnowledge[], maxTokens?: number): string {
    if (components.length === 0) {
      return "项目使用 shadcn/ui 组件库，包含 Button、Input、Card 等基础组件。";
    }

    let guide = "可用组件:\n";
    let currentTokens = this.countTokens(guide);

    for (const comp of components.slice(0, 5)) { // 最多 5 个组件
      const compText = `- ${comp.component_name}: ${comp.props_info || '基础组件'}\n`;
      const tokens = this.countTokens(compText);
      
      if (maxTokens && currentTokens + tokens > maxTokens) break;
      
      guide += compText;
      currentTokens += tokens;
    }

    return guide;
  }

  /**
   * 总结历史对话
   */
  private summarizeHistory(history: ConversationEmbedding[], maxTokens?: number): string {
    if (history.length === 0) {
      return "";
    }

    let summary = "相关历史:\n";
    let currentTokens = this.countTokens(summary);

    for (const conv of history.slice(0, 3)) { // 最多 3 条历史
      const historyText = `- 用户: ${conv.user_intent}\n- AI: ${conv.ai_response_summary}\n`;
      const tokens = this.countTokens(historyText);
      
      if (maxTokens && currentTokens + tokens > maxTokens) break;
      
      summary += historyText;
      currentTokens += tokens;
    }

    return summary;
  }

  /**
   * 生成建议
   */
  private generateSuggestions(userRequest: string): string[] {
    const suggestions: string[] = [];
    const request = userRequest.toLowerCase();

    if (request.includes('页面') || request.includes('组件')) {
      suggestions.push("使用 shadcn/ui 组件保持设计一致性");
      suggestions.push("确保响应式设计，支持移动端");
    }

    if (request.includes('表单') || request.includes('输入')) {
      suggestions.push("添加表单验证和错误处理");
      suggestions.push("使用受控组件管理表单状态");
    }

    if (request.includes('api') || request.includes('数据')) {
      suggestions.push("使用 loading 状态提升用户体验");
      suggestions.push("实现错误边界处理异常情况");
    }

    if (suggestions.length === 0) {
      suggestions.push("保持代码简洁和可维护性");
      suggestions.push("遵循项目的编码规范");
    }

    return suggestions.slice(0, 3); // 最多 3 个建议
  }

  /**
   * 最终化上下文
   */
  private finalizeContext(context: OptimizedContext, maxTokens: number): OptimizedContext {
    let totalTokens = this.countTokens(JSON.stringify(context));
    let optimizationApplied = false;

    // 如果超出限制，逐步优化
    while (totalTokens > maxTokens && !optimizationApplied) {
      optimizationApplied = true;

      // 1. 减少代码块数量
      if (context.relevantCode.length > 3) {
        context.relevantCode = context.relevantCode.slice(0, -1);
      }
      // 2. 缩短历史上下文
      else if (context.previousContext.length > 300) {
        context.previousContext = context.previousContext.substring(0, 300) + "...";
      }
      // 3. 缩短组件指南
      else if (context.componentGuide.length > 500) {
        context.componentGuide = context.componentGuide.substring(0, 500) + "...";
      }
      // 4. 减少建议数量
      else if (context.suggestions.length > 1) {
        context.suggestions = context.suggestions.slice(0, -1);
      }
      // 5. 最后缩短摘要
      else if (context.summary.length > 200) {
        context.summary = context.summary.substring(0, 200) + "...";
      } else {
        break; // 无法进一步优化
      }

      totalTokens = this.countTokens(JSON.stringify(context));
    }

    context.tokenCount = totalTokens;
    context.optimizationApplied = optimizationApplied;

    return context;
  }

  /**
   * 构建回退上下文
   */
  private buildFallbackContext(userRequest: string, maxTokens: number): OptimizedContext {
    return {
      summary: "这是一个 Next.js + React 项目，使用 TypeScript 和 Tailwind CSS。",
      relevantCode: [],
      componentGuide: "项目使用 shadcn/ui 组件库。",
      previousContext: "",
      suggestions: ["保持代码简洁", "遵循项目规范"],
      tokenCount: 100,
      optimizationApplied: true,
      debugInfo: {
        originalTokenCount: 0,
        codeBlocksFound: 0,
        contextItemsFound: 0,
        componentsFound: 0
      }
    };
  }

  /**
   * 计算文本的 token 数量
   */
  private countTokens(text: string): number {
    try {
      return encode(text).length;
    } catch (error) {
      // 回退到粗略估算: 1 token ≈ 4 字符
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * 截断文本到指定 token 数量
   */
  private truncateText(text: string, maxTokens: number): string {
    try {
      const tokens = encode(text);
      if (tokens.length <= maxTokens) return text;

      // 简单截断到指定 token 数量
      const ratio = maxTokens / tokens.length;
      const truncatedLength = Math.floor(text.length * ratio);
      return text.substring(0, truncatedLength) + "...";
    } catch (error) {
      // 回退到字符截断
      const maxChars = maxTokens * 4;
      return text.length > maxChars ? text.substring(0, maxChars) + "..." : text;
    }
  }

  /**
   * 获取上下文统计信息
   */
  async getContextStats(projectId: string): Promise<{
    totalCodeBlocks: number;
    totalContextItems: number;
    totalComponents: number;
    totalConversations: number;
    estimatedTokens: number;
  }> {
    try {
      const [codeCount, contextCount, componentCount, conversationCount] = await Promise.all([
        this.countTableRecords('code_embeddings', 'project_id', projectId),
        this.countTableRecords('project_context_embeddings', 'project_id', projectId),
        this.countTableRecords('component_knowledge_embeddings'),
        this.countTableRecords('conversation_embeddings', 'project_id', projectId)
      ]);

      // 估算总 token 数（粗略计算）
      const estimatedTokens = (codeCount * 200) + (contextCount * 100) + (componentCount * 50) + (conversationCount * 50);

      return {
        totalCodeBlocks: codeCount,
        totalContextItems: contextCount,
        totalComponents: componentCount,
        totalConversations: conversationCount,
        estimatedTokens
      };
    } catch (error) {
      console.error('获取上下文统计失败:', error);
      return {
        totalCodeBlocks: 0,
        totalContextItems: 0,
        totalComponents: 0,
        totalConversations: 0,
        estimatedTokens: 0
      };
    }
  }

  /**
   * 计算表记录数
   */
  private async countTableRecords(table: string, filterColumn?: string, filterValue?: string): Promise<number> {
    try {
      let query = this.embeddingService['supabase'].from(table).select('*', { count: 'exact', head: true });
      
      if (filterColumn && filterValue) {
        query = query.eq(filterColumn, filterValue);
      }

      const { count } = await query;
      return count || 0;
    } catch (error) {
      console.error(`计算 ${table} 记录数失败:`, error);
      return 0;
    }
  }
}
