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
        const { prompt, projectType = 'nextjs', projectId = 'default-project' } = await request.json();

        if (!prompt) {
            return NextResponse.json({
                success: false,
                error: '请提供代码生成提示'
            }, { status: 400 });
        }

        console.log(`🤖 开始使用 Dify 生成 UI 代码: ${prompt}`);

        // 1. 初始化 Dify 客户端
        const difyClient = getDifyClient();

        // 2. 使用 Dify 生成代码（包含组件上下文）
        const generateResult = await difyClient.generateUI(prompt, {
            projectType,
            context: `项目ID: ${projectId}, 目标框架: ${projectType}`
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

        // 5. 智能演进分析（可选）
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
                } : null
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