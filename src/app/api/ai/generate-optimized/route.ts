import { NextRequest, NextResponse } from 'next/server';
import { DifyClient } from '@/lib/ai/dify-client';
import { ContextRetriever } from '@/lib/vector/context-retriever';
import { EmbeddingService } from '@/lib/vector/embedding-service';
import { ProjectManager } from '@/lib/project-manager';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      projectId = 'sandbox-project', 
      conversationId,
      maxTokens = 4000,
      useOptimizedContext = true
    } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '请提供代码生成提示' },
        { status: 400 }
      );
    }

    console.log(`🤖 开始优化的 AI 代码生成: ${prompt.substring(0, 50)}...`);
    console.log(`📊 使用优化上下文: ${useOptimizedContext}, 最大tokens: ${maxTokens}`);

    // 1. 初始化服务
    const contextRetriever = new ContextRetriever();
    const embeddingService = new EmbeddingService();
    const projectManager = ProjectManager.getInstance();

    let optimizedContext;
    let contextOptimization = {
      tokensSaved: 0,
      optimizationApplied: false,
      originalTokenCount: 0,
      finalTokenCount: 0
    };

    if (useOptimizedContext) {
      // 2. 构建优化的上下文
      console.log('🧠 构建优化上下文...');
      optimizedContext = await contextRetriever.buildOptimizedContext(
        projectId,
        prompt,
        maxTokens,
        conversationId
      );

      contextOptimization = {
        tokensSaved: (optimizedContext.debugInfo?.originalTokenCount || 0) - optimizedContext.tokenCount,
        optimizationApplied: optimizedContext.optimizationApplied,
        originalTokenCount: optimizedContext.debugInfo?.originalTokenCount || 0,
        finalTokenCount: optimizedContext.tokenCount
      };

      console.log(`📈 上下文优化结果: 原始 ${contextOptimization.originalTokenCount} tokens → 最终 ${contextOptimization.finalTokenCount} tokens (节省 ${contextOptimization.tokensSaved} tokens)`);
    } else {
      console.log('⚠️ 使用传统上下文生成模式');
    }

    // 3. 调用 Dify 生成代码
    console.log('🚀 调用 Dify API...');
    const difyClient = getDifyClient();
    
    const generateOptions = {
      projectType: 'nextjs' as const,
      context: useOptimizedContext ? JSON.stringify(optimizedContext) : `项目ID: ${projectId}, 目标框架: nextjs`,
      conversationId: conversationId || `opt-${Date.now()}`
    };

    const result = await difyClient.generateUI(prompt, generateOptions);

    console.log(`✅ Dify 生成完成，共生成 ${result.files.length} 个文件`);

    // 4. 将生成的代码写入 sandbox
    console.log('💾 写入文件到 sandbox...');
    const fileOperations = result.files.map(async (file) => {
      console.log(`📝 写入文件: ${file.path}`);
      return projectManager.saveProjectFiles(projectId, {
        [file.path]: file.content
      });
    });

    await Promise.all(fileOperations);

    // 5. 检查是否需要重启项目
    const hasConfigChanges = result.files.some(file =>
      file.path.includes('package.json') ||
      file.path.includes('next.config') ||
      file.path.includes('tailwind.config')
    );

    if (hasConfigChanges) {
      console.log('📦 检测到配置文件变化，可能需要重启项目');
    }

    // 6. 存储对话历史向量（异步，不阻塞响应）
    if (conversationId && useOptimizedContext) {
      embeddingService.storeConversationHistory({
        conversation_id: conversationId,
        project_id: projectId,
        user_intent: prompt,
        ai_response_summary: result.description || '生成了UI组件',
        tokens_saved: contextOptimization.tokensSaved
      }).catch(error => {
        console.warn('存储对话历史失败:', error);
      });
    }

    // 7. 异步更新项目向量（不阻塞响应）
    if (useOptimizedContext) {
      updateProjectVectors(projectId, result.files).catch(error => {
        console.warn('更新项目向量失败:', error);
      });
    }

    console.log('🎉 优化的代码生成完成！');

    return NextResponse.json({
      success: true,
      message: '🎉 AI 代码生成并写入完成！',
      data: {
        filesGenerated: result.files.length,
        files: result.files.map(f => ({
          path: f.path,
          size: f.content.length,
          type: f.type
        })),
        description: result.description,
        features: result.features,
        dependencies: result.dependencies,
        hasConfigChanges,
        conversationId: generateOptions.conversationId,
        // 优化相关信息
        optimization: {
          enabled: useOptimizedContext,
          ...contextOptimization,
          debugInfo: optimizedContext?.debugInfo
        }
      }
    });

  } catch (error) {
    console.error('优化的 AI 代码生成失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * 获取配置状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        // 检查各项服务配置状态
        const configStatus = {
          dify: {
            configured: !!process.env.DIFY_API_ENDPOINT && !!process.env.COMPONENT_DIFY_API_KEY,
            endpoint: process.env.DIFY_API_ENDPOINT ? '已配置' : '未配置'
          },
          openai: {
            configured: !!process.env.OPENAI_API_KEY,
            model: 'text-embedding-ada-002'
          },
          supabase: {
            configured: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY,
            url: process.env.SUPABASE_URL ? '已配置' : '未配置'
          },
          vectorization: {
            enabled: true,
            supportedTypes: ['component', 'function', 'type', 'style', 'config', 'api']
          }
        };

        const allConfigured = configStatus.dify.configured && 
                            configStatus.openai.configured && 
                            configStatus.supabase.configured;

        return NextResponse.json({
          success: true,
          data: {
            status: allConfigured ? 'ready' : 'needs_configuration',
            services: configStatus,
            recommendations: allConfigured ? [] : [
              !configStatus.dify.configured && '请配置 DIFY_API_ENDPOINT 和 COMPONENT_DIFY_API_KEY',
              !configStatus.openai.configured && '请配置 OPENAI_API_KEY',
              !configStatus.supabase.configured && '请配置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY'
            ].filter(Boolean)
          }
        });

      case 'test':
        // 测试各项服务连接
        const testResults = await testServices();
        return NextResponse.json({
          success: true,
          data: testResults
        });

      default:
        return NextResponse.json(
          { success: false, error: `不支持的操作: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('获取优化状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取状态失败'
    }, { status: 500 });
  }
}

/**
 * 初始化 Dify 客户端
 */
function getDifyClient(): DifyClient {
  const apiEndpoint = process.env.DIFY_API_ENDPOINT;

  if (!apiEndpoint) {
    throw new Error('请设置 DIFY_API_ENDPOINT 环境变量');
  }

  return DifyClient.getInstance(apiEndpoint);
}

/**
 * 异步更新项目向量
 */
async function updateProjectVectors(projectId: string, files: any[]): Promise<void> {
  try {
    // 构建文件更新对象
    const fileUpdates: { [path: string]: string } = {};
    files.forEach(file => {
      fileUpdates[file.path] = file.content;
    });

    // 调用向量同步API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/vector/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        files: fileUpdates,
        action: 'incremental_sync'
      })
    });

    if (!response.ok) {
      throw new Error(`向量更新失败: ${response.statusText}`);
    }

    console.log('✅ 项目向量更新完成');
  } catch (error) {
    console.error('异步向量更新失败:', error);
    throw error;
  }
}

/**
 * 测试各项服务
 */
async function testServices(): Promise<any> {
  const results = {
    dify: { status: 'unknown', message: '', latency: 0 },
    openai: { status: 'unknown', message: '', latency: 0 },
    supabase: { status: 'unknown', message: '', latency: 0 }
  };

  // 测试 OpenAI
  try {
    const start = Date.now();
    const embeddingService = new EmbeddingService();
    await embeddingService.generateEmbedding('测试文本');
    results.openai = {
      status: 'ok',
      message: '连接正常',
      latency: Date.now() - start
    };
  } catch (error) {
    results.openai = {
      status: 'error',
      message: error instanceof Error ? error.message : '连接失败',
      latency: 0
    };
  }

  // 测试 Dify
  try {
    const start = Date.now();
    const difyClient = getDifyClient();
    // 这里可以添加 Dify 连接测试
    results.dify = {
      status: 'ok',
      message: '配置正常',
      latency: Date.now() - start
    };
  } catch (error) {
    results.dify = {
      status: 'error',
      message: error instanceof Error ? error.message : '配置错误',
      latency: 0
    };
  }

  // 测试 Supabase
  try {
    const start = Date.now();
    const embeddingService = new EmbeddingService();
    // 测试数据库连接
    await embeddingService['supabase'].from('code_embeddings').select('id').limit(1);
    results.supabase = {
      status: 'ok',
      message: '数据库连接正常',
      latency: Date.now() - start
    };
  } catch (error) {
    results.supabase = {
      status: 'error',
      message: error instanceof Error ? error.message : '数据库连接失败',
      latency: 0
    };
  }

  return results;
}
