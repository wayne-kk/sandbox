import { NextResponse } from 'next/server';
import { ProjectManager } from '@/lib/project-manager';
import { DifyClient } from '@/lib/ai/dify-client';

const projectManager = ProjectManager.getInstance();

// 初始化 Dify 客户端
function getDifyClient(): DifyClient {
    const apiEndpoint = process.env.DIFY_API_ENDPOINT;

    if (!apiEndpoint) {
        throw new Error('请设置 DIFY_API_ENDPOINT 环境变量');
    }

    return DifyClient.getInstance(apiEndpoint);
}

export async function POST(request: Request) {
    try {
        const { prompt, projectType = 'nextjs', projectId = 'default-project', useVectorContext = true } = await request.json();

        if (!prompt) {
            return NextResponse.json({
                success: false,
                error: '请提供代码生成提示'
            }, { status: 400 });
        }

        console.log(`🤖 开始使用 Dify 生成 UI 代码: ${prompt}`);
        console.log(`🧠 向量上下文: ${useVectorContext ? '启用' : '禁用'}`);

        // 1. 构建增强的上下文
        let enhancedContext = `项目ID: ${projectId}, 目标框架: ${projectType}`;

        if (useVectorContext) {
            try {
                console.log('🔍 开始构建向量增强上下文...');
                const { ContextRetriever } = await import('@/lib/vector/context-retriever');
                const contextRetriever = new ContextRetriever();

                // 构建优化的上下文（限制在 3000 tokens 内）
                const optimizedContext = await contextRetriever.buildOptimizedContext(
                    projectId,
                    prompt,
                    3000
                );

                // 将向量检索结果添加到上下文中
                enhancedContext = `项目ID: ${projectId}, 目标框架: ${projectType}

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
                console.log(`📊 检索到 ${optimizedContext.relevantCode.length} 个相关代码片段`);
            } catch (vectorError) {
                console.warn('向量上下文构建失败，使用基础上下文:', vectorError);
                // 回退到基础上下文
            }
        }

        // 2. 初始化 Dify 客户端
        const difyClient = getDifyClient();

        // 3. 使用 Dify 生成代码（包含增强上下文）
        const generateResult = await difyClient.generateUI(prompt, {
            projectType,
            context: enhancedContext
        });

        console.log(`✅ Dify 生成完成，共生成 ${generateResult.files.length} 个文件`);

        // 3. 将生成的代码写入 sandbox
        const fileOperations = generateResult.files.map(async (file) => {
            console.log(`📝 写入文件: ${file.path}`);
            return projectManager.saveProjectFiles(projectId, {
                [file.path]: file.content
            });
        });

        await Promise.all(fileOperations);

        // 4. 检查是否需要重启项目（如果有配置文件变化）
        const hasConfigChanges = generateResult.files.some(file =>
            file.path.includes('package.json') ||
            file.path.includes('next.config') ||
            file.path.includes('tailwind.config')
        );

        if (hasConfigChanges) {
            console.log('📦 检测到配置文件变化，可能需要重启项目');
        }

        console.log('🔄 代码已写入 sandbox，项目将自动热重载');

        // 5. 异步更新向量数据库（如果启用了向量上下文）
        if (useVectorContext) {
            updateProjectVectorsAsync(projectId, generateResult.files).catch(error => {
                console.warn('异步向量更新失败:', error);
            });
        }

        // 6. 智能演进分析（可选）
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
                    autoExecute: false // 不自动执行，只分析
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

        return NextResponse.json({
            success: true,
            message: '🎉 AI 代码生成并写入完成！',
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
                // 新增：智能演进建议
                evolution: evolutionSuggestions ? {
                    suggestions: evolutionSuggestions.suggestions,
                    recommendedPrompts: evolutionSuggestions.recommendedPrompts,
                    stats: evolutionSuggestions.stats
                } : null,
                // 新增：向量上下文信息
                vectorContext: useVectorContext ? {
                    enabled: true,
                    contextSize: enhancedContext.length,
                    contextType: 'enhanced'
                } : {
                    enabled: false,
                    contextSize: enhancedContext.length,
                    contextType: 'basic'
                }
            }
        });

    } catch (error) {
        console.error('AI 代码生成失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

// 获取生成历史
export async function GET() {
    try {
        // 这里可以返回生成历史、模板等
        return NextResponse.json({
            success: true,
            templates: [
                { id: 'landing-page', name: '落地页', description: '创建一个现代化的落地页' },
                { id: 'dashboard', name: '仪表板', description: '数据展示仪表板' },
                { id: 'blog', name: '博客', description: '简洁的博客页面' },
                { id: 'ecommerce', name: '电商', description: '产品展示页面' }
            ]
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: '获取模板失败'
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