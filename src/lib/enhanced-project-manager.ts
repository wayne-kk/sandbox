import { ProjectManager, ProjectStatus } from './project-manager';
import { ProjectVectorizer } from './vector/project-vectorizer';
import { EmbeddingService } from './vector/embedding-service';

/**
 * 增强的项目管理器 - 集成向量数据库功能
 * 使用组合模式包装原有的项目管理器
 */
export class EnhancedProjectManager {
  private static enhancedInstance: EnhancedProjectManager;
  private projectManager: ProjectManager;
  private vectorizer: ProjectVectorizer;
  private embeddingService: EmbeddingService;
  private vectorSyncEnabled: boolean = true;

  private constructor() {
    this.projectManager = ProjectManager.getInstance();
    this.vectorizer = new ProjectVectorizer();
    this.embeddingService = new EmbeddingService();
  }

  static getInstance(): EnhancedProjectManager {
    if (!EnhancedProjectManager.enhancedInstance) {
      EnhancedProjectManager.enhancedInstance = new EnhancedProjectManager();
    }
    return EnhancedProjectManager.enhancedInstance;
  }

  /**
 * 启动项目并进行向量化
 */
  async startProject(projectId: string): Promise<ProjectStatus> {
    console.log(`🚀 启动增强项目管理: ${projectId}`);

    try {
      // 调用原项目管理器的启动方法
      const status = await this.projectManager.startProject(projectId);

      // 如果启动成功，异步进行项目向量化
      if (status.status === 'running' && this.vectorSyncEnabled) {
        this.asyncVectorizeProject(projectId).catch(error => {
          console.warn('项目向量化失败:', error);
        });
      }

      return status;
    } catch (error) {
      console.error('增强项目启动失败:', error);
      throw error;
    }
  }

  /**
 * 保存项目文件并更新向量
 */
  async saveProjectFiles(projectId: string, files: { [filePath: string]: string }): Promise<void> {
    console.log(`💾 保存项目文件并更新向量: ${projectId}`);

    try {
      // 调用原项目管理器的保存方法
      await this.projectManager.saveProjectFiles(projectId, files);

      // 异步更新文件向量
      if (this.vectorSyncEnabled) {
        this.asyncUpdateFileVectors(projectId, files).catch(error => {
          console.warn('文件向量更新失败:', error);
        });
      }
    } catch (error) {
      console.error('增强文件保存失败:', error);
      throw error;
    }
  }

  /**
   * 手动触发项目完整向量化
   */
  async vectorizeProject(projectId: string, projectPath?: string): Promise<{
    success: boolean;
    message: string;
    stats?: any;
  }> {
    console.log(`🔍 手动触发项目向量化: ${projectId}`);

    try {
      const workingDir = projectPath || this.getProjectWorkingDir(projectId);

      await this.vectorizer.vectorizeProject(projectId, workingDir);

      // 获取向量化统计信息
      const stats = await this.getVectorStats(projectId);

      return {
        success: true,
        message: '项目向量化完成',
        stats
      };
    } catch (error) {
      console.error('项目向量化失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '向量化失败'
      };
    }
  }

  /**
   * 获取项目向量统计信息
   */
  async getVectorStats(projectId: string): Promise<{
    codeBlocks: number;
    contextItems: number;
    components: number;
    estimatedTokens: number;
    lastUpdated: Date;
  }> {
    try {
      // 这里可以调用 ContextRetriever 的统计方法
      const { ContextRetriever } = await import('./vector/context-retriever');
      const retriever = new ContextRetriever();
      const stats = await retriever.getContextStats(projectId);

      return {
        codeBlocks: stats.totalCodeBlocks,
        contextItems: stats.totalContextItems,
        components: stats.totalComponents,
        estimatedTokens: stats.estimatedTokens,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('获取向量统计失败:', error);
      return {
        codeBlocks: 0,
        contextItems: 0,
        components: 0,
        estimatedTokens: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * 搜索项目代码
   */
  async searchProjectCode(
    projectId: string,
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      contentTypes?: string[];
    } = {}
  ): Promise<any[]> {
    try {
      const {
        limit = 5,
        threshold = 0.7,
        contentTypes = []
      } = options;

      let results = await this.embeddingService.searchRelevantCode(
        projectId,
        query,
        limit,
        threshold
      );

      // 如果指定了内容类型过滤
      if (contentTypes.length > 0) {
        results = results.filter(result =>
          contentTypes.includes(result.content_type)
        );
      }

      return results;
    } catch (error) {
      console.error('搜索项目代码失败:', error);
      return [];
    }
  }

  /**
   * 智能代码建议
   */
  async getCodeSuggestions(
    projectId: string,
    userIntent: string,
    contextType: 'create' | 'modify' | 'debug' = 'create'
  ): Promise<{
    suggestions: string[];
    relevantCode: any[];
    components: any[];
  }> {
    try {
      // 根据用户意图搜索相关代码
      const relevantCode = await this.searchProjectCode(projectId, userIntent, {
        limit: 3,
        threshold: 0.6
      });

      // 搜索相关组件
      const components = await this.embeddingService.searchRelevantComponents(userIntent, 3, 0.6);

      // 生成智能建议
      const suggestions = this.generateSmartSuggestions(userIntent, contextType, relevantCode, components);

      return {
        suggestions,
        relevantCode,
        components
      };
    } catch (error) {
      console.error('获取代码建议失败:', error);
      return {
        suggestions: ['使用现有组件保持一致性', '添加适当的错误处理'],
        relevantCode: [],
        components: []
      };
    }
  }

  /**
   * 清理项目向量数据
   */
  async cleanupProjectVectors(projectId: string): Promise<void> {
    console.log(`🧹 清理项目向量数据: ${projectId}`);

    try {
      await this.embeddingService.deleteProjectVectors(projectId);
      console.log(`✅ 项目向量数据清理完成: ${projectId}`);
    } catch (error) {
      console.error('清理项目向量数据失败:', error);
      throw error;
    }
  }

  /**
   * 设置向量同步状态
   */
  setVectorSyncEnabled(enabled: boolean): void {
    this.vectorSyncEnabled = enabled;
    console.log(`🔧 向量同步${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 检查向量服务健康状态
   */
  async checkVectorServiceHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: {
      embedding: boolean;
      database: boolean;
    };
    message: string;
  }> {
    try {
      // 测试嵌入服务
      await this.embeddingService.generateEmbedding('测试文本');

      // 测试数据库连接
      await this.embeddingService.searchRelevantCode('test', '测试', 1, 0.9);

      return {
        status: 'healthy',
        services: {
          embedding: true,
          database: true
        },
        message: '向量服务运行正常'
      };
    } catch (error) {
      console.error('向量服务健康检查失败:', error);
      return {
        status: 'unhealthy',
        services: {
          embedding: false,
          database: false
        },
        message: error instanceof Error ? error.message : '向量服务异常'
      };
    }
  }

  /**
   * 异步项目向量化
   */
  private async asyncVectorizeProject(projectId: string): Promise<void> {
    console.log(`🔄 开始异步项目向量化: ${projectId}`);

    try {
      const workingDir = this.getProjectWorkingDir(projectId);
      await this.vectorizer.vectorizeProject(projectId, workingDir);
      console.log(`✅ 异步项目向量化完成: ${projectId}`);
    } catch (error) {
      console.error(`❌ 异步项目向量化失败: ${projectId}`, error);
    }
  }

  /**
   * 异步文件向量更新
   */
  private async asyncUpdateFileVectors(projectId: string, files: { [filePath: string]: string }): Promise<void> {
    console.log(`🔄 开始异步文件向量更新: ${projectId}`);

    try {
      const updatePromises = Object.entries(files).map(([filePath, content]) =>
        this.vectorizer.updateFileVectors(projectId, filePath, content)
      );

      await Promise.all(updatePromises);
      console.log(`✅ 异步文件向量更新完成: ${projectId} (${Object.keys(files).length} 个文件)`);
    } catch (error) {
      console.error(`❌ 异步文件向量更新失败: ${projectId}`, error);
    }
  }

  /**
 * 获取项目工作目录
 */
  private getProjectWorkingDir(projectId: string): string {
    // 默认使用 sandbox 目录
    return 'sandbox';
  }

  /**
   * 生成智能建议
   */
  private generateSmartSuggestions(
    userIntent: string,
    contextType: string,
    relevantCode: any[],
    components: any[]
  ): string[] {
    const suggestions: string[] = [];
    const intent = userIntent.toLowerCase();

    // 基于上下文类型的建议
    if (contextType === 'create') {
      suggestions.push('使用项目现有的设计模式和组件结构');
      if (components.length > 0) {
        suggestions.push(`考虑使用这些相关组件: ${components.map(c => c.component_name).join(', ')}`);
      }
    } else if (contextType === 'modify') {
      suggestions.push('保持与现有代码的一致性');
      if (relevantCode.length > 0) {
        suggestions.push('参考已有的类似实现进行修改');
      }
    } else if (contextType === 'debug') {
      suggestions.push('检查错误处理和边界条件');
      suggestions.push('确保类型安全和空值检查');
    }

    // 基于用户意图的建议
    if (intent.includes('form') || intent.includes('表单')) {
      suggestions.push('添加表单验证和用户反馈');
      suggestions.push('使用受控组件管理表单状态');
    }

    if (intent.includes('api') || intent.includes('数据')) {
      suggestions.push('实现加载状态和错误处理');
      suggestions.push('考虑添加数据缓存机制');
    }

    if (intent.includes('页面') || intent.includes('page')) {
      suggestions.push('确保页面响应式设计');
      suggestions.push('添加适当的 SEO 优化');
    }

    // 如果没有特定建议，添加通用建议
    if (suggestions.length === 0) {
      suggestions.push('遵循项目的编码规范和最佳实践');
      suggestions.push('考虑代码的可维护性和可读性');
    }

    return suggestions.slice(0, 5); // 最多返回5个建议
  }

  /**
 * 清理方法，包含向量清理
 */
  async cleanup(): Promise<void> {
    console.log('🧹 开始增强清理...');

    try {
      // 清理向量数据（这里简化处理，实际项目中可能需要更复杂的逻辑）
      if (this.vectorSyncEnabled) {
        console.log('🧹 清理向量数据...');
      }

      // 调用原项目管理器清理
      await this.projectManager.cleanup();

      console.log('✅ 增强清理完成');
    } catch (error) {
      console.error('增强清理失败:', error);
      throw error;
    }
  }
}

// 导出增强的项目管理器实例
export const enhancedProjectManager = EnhancedProjectManager.getInstance();
