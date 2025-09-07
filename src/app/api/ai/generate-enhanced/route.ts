import { NextRequest, NextResponse } from 'next/server';
import { ProjectManager } from '@/lib/project-manager';
import { DifyClient } from '@/lib/ai/dify-client';
import { SmartProjectAnalyzer } from '@/lib/ai/smart-project-analyzer';

const projectManager = ProjectManager.getInstance();

// 初始化 Dify 客户端
function getDifyClient(): DifyClient {
    const apiEndpoint = process.env.DIFY_API_ENDPOINT;

    if (!apiEndpoint) {
        throw new Error('请设置 DIFY_API_ENDPOINT 环境变量');
    }

    return DifyClient.getInstance(apiEndpoint);
}

export async function POST(request: NextRequest) {
    try {
        const {
            prompt,
            projectType = 'nextjs',
            projectId = 'default-project',
            useVectorContext = true,
            useSmartAnalysis = true,
            maxTokens = 4000
        } = await request.json();

        if (!prompt) {
            return NextResponse.json({
                success: false,
                error: '请提供代码生成提示'
            }, { status: 400 });
        }

        console.log(`🚀 开始增强 AI 代码生成: ${prompt}`);
        console.log(`🧠 向量上下文: ${useVectorContext ? '启用' : '禁用'}`);
        console.log(`🔍 智能分析: ${useSmartAnalysis ? '启用' : '禁用'}`);

        // 1. 智能项目分析
        let projectInsight = null;
        let generationContext = null;

        if (useSmartAnalysis) {
            try {
                console.log('🔍 开始智能项目分析...');
                const analyzer = new SmartProjectAnalyzer('sandbox');
                projectInsight = await analyzer.analyzeProject();

                generationContext = await analyzer.buildGenerationContext(prompt, projectInsight);
                console.log('✅ 智能项目分析完成');
                console.log(`📊 项目洞察: ${projectInsight.components.total} 个组件, ${projectInsight.routing.pages.length} 个页面`);
            } catch (analysisError) {
                console.warn('智能项目分析失败，跳过:', analysisError);
            }
        }

        // 2. 构建增强上下文
        let enhancedContext = `项目ID: ${projectId}, 目标框架: ${projectType}`;

        if (useVectorContext) {
            try {
                console.log('🔍 开始构建向量增强上下文...');
                const { ContextRetriever } = await import('@/lib/vector/context-retriever');
                const contextRetriever = new ContextRetriever();

                // 构建优化的上下文
                const optimizedContext = await contextRetriever.buildOptimizedContext(
                    projectId,
                    prompt,
                    Math.floor(maxTokens * 0.6) // 60% 给向量上下文
                );

                // 将向量检索结果添加到上下文中
                enhancedContext += `

智能检索的项目上下文:
${optimizedContext.summary}

相关代码片段:
${optimizedContext.relevantCode.map(code =>
                    `文件: ${code.file_path} (${code.content_type})
     ${code.description}
     ${code.code_snippet.substring(0, 200)}...`
                ).join('\n\n')}

可用组件:
${optimizedContext.componentGuide}

项目建议:
${optimizedContext.suggestions.join('\n')}`;

                console.log(`✅ 向量上下文构建完成: ${optimizedContext.tokenCount} tokens`);
            } catch (vectorError) {
                console.warn('向量上下文构建失败，使用基础上下文:', vectorError);
            }
        }

        // 3. 添加智能分析结果到上下文
        if (generationContext && projectInsight) {
            enhancedContext += `

智能项目分析结果:
项目结构: ${projectInsight.projectStructure.totalFiles} 个文件, ${projectInsight.components.total} 个组件
样式框架: ${projectInsight.styling.framework}
TypeScript 使用率: ${projectInsight.codeQuality.typescriptUsage}%

相关文件:
${generationContext.relevantFiles.slice(0, 3).join('\n')}

建议方法:
${generationContext.suggestedApproach.join('\n')}

潜在冲突:
${generationContext.potentialConflicts.length > 0 ? generationContext.potentialConflicts.join('\n') : '无'}

集成点:
${generationContext.integrationPoints.join('\n')}`;
        }

        // 4. 使用 Dify 生成代码
        console.log('🚀 调用 Dify API...');
        const difyClient = getDifyClient();

        const generateResult = await difyClient.generateUI(prompt, {
            projectType,
            customParams: {
                context: enhancedContext
            }
        });

        console.log(`✅ Dify 生成完成，共生成 ${generateResult.files.length} 个文件`);

        // 5. 将生成的代码写入 sandbox
        console.log('💾 写入文件到 sandbox...');
        const fileOperations = generateResult.files.map(async (file) => {
            console.log(`📝 写入文件: ${file.path}`);
            return projectManager.saveProjectFiles(projectId, {
                [file.path]: file.content
            });
        });

        await Promise.all(fileOperations);

        // 6. 检查配置文件变化
        const hasConfigChanges = generateResult.files.some(file =>
            file.path.includes('package.json') ||
            file.path.includes('next.config') ||
            file.path.includes('tailwind.config')
        );

        if (hasConfigChanges) {
            console.log('📦 检测到配置文件变化，可能需要重启项目');
        }

        // 7. 异步更新向量数据库
        if (useVectorContext) {
            updateProjectVectorsAsync(projectId, generateResult.files).catch(error => {
                console.warn('异步向量更新失败:', error);
            });
        }

        // 8. 智能演进分析
        let evolutionSuggestions = null;
        try {
            console.log('🧠 分析代码演进需求...');
            const evolutionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/evolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    generationResult: generateResult,
                    userIntent: prompt,
                    projectInsight,
                    autoExecute: false
                })
            });

            if (evolutionResponse.ok) {
                const evolutionData = await evolutionResponse.json();
                evolutionSuggestions = evolutionData.data;
                console.log('✅ 演进分析完成');
            }
        } catch (error) {
            console.warn('演进分析失败，跳过:', error);
        }

        console.log('🎉 增强的代码生成完成！');

        return NextResponse.json({
            success: true,
            message: '🎉 增强 AI 代码生成并写入完成！',
            data: {
                filesGenerated: generateResult.files.length,
                files: generateResult.files.map(f => ({
                    path: f.path,
                    size: f.content.length,
                    type: f.type
                })),
                description: generateResult.description,
                features: generateResult.features,
                dependencies: generateResult.dependencies,
                hasConfigChanges,
                conversationId: difyClient.getCurrentConversationId(),

                // 智能分析结果
                smartAnalysis: generationContext && projectInsight ? {
                    userIntent: generationContext.userIntent,
                    projectInsight: {
                        totalFiles: projectInsight.projectStructure.totalFiles,
                        components: projectInsight.components.total,
                        styling: projectInsight.styling.framework,
                        typescriptUsage: projectInsight.codeQuality.typescriptUsage
                    },
                    relevantFiles: generationContext.relevantFiles,
                    suggestions: generationContext.suggestedApproach,
                    conflicts: generationContext.potentialConflicts,
                    integrationPoints: generationContext.integrationPoints
                } : null,

                // 演进建议
                evolution: evolutionSuggestions ? {
                    suggestions: evolutionSuggestions.suggestions,
                    recommendedPrompts: evolutionSuggestions.recommendedPrompts,
                    stats: evolutionSuggestions.stats
                } : null,

                // 上下文信息
                context: {
                    vectorEnabled: useVectorContext,
                    smartAnalysisEnabled: useSmartAnalysis,
                    totalContextSize: enhancedContext.length,
                    contextType: 'enhanced'
                }
            }
        });

    } catch (error) {
        console.error('增强 AI 代码生成失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误',
            details: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}

// 获取增强生成状态
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
                    },
                    smartAnalysis: {
                        enabled: true,
                        features: ['项目结构分析', '依赖分析', '组件分析', '样式分析', '路由分析']
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

            case 'analyze':
                // 执行项目分析
                try {
                    const analyzer = new SmartProjectAnalyzer('sandbox');
                    const insight = await analyzer.analyzeProject();

                    return NextResponse.json({
                        success: true,
                        data: {
                            insight,
                            timestamp: new Date().toISOString()
                        }
                    });
                } catch (error) {
                    return NextResponse.json({
                        success: false,
                        error: error instanceof Error ? error.message : '项目分析失败'
                    }, { status: 500 });
                }

            default:
                return NextResponse.json(
                    { success: false, error: `不支持的操作: ${action}` },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('获取增强状态失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '获取状态失败'
        }, { status: 500 });
    }
}

// 异步更新项目向量
async function updateProjectVectorsAsync(projectId: string, files: any[]) {
    try {
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

        console.log('✅ 项目向量异步更新完成');
    } catch (error) {
        console.error('异步向量更新失败:', error);
        throw error;
    }
}
