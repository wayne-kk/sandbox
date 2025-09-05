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
        const { prompt, projectType = 'nextjs', projectId = 'default-project', useVectorContext = true, component_type = 'page' } = await request.json();    

        if (!prompt) {
            return NextResponse.json({
                success: false,
                error: '请提供代码生成提示'
            }, { status: 400 });
        }

        console.log(`🤖 开始使用 Dify 生成 UI 代码: ${prompt}`);
        console.log(`🧠 向量上下文: ${useVectorContext ? '启用' : '禁用'}`);

        // 1. 构建简化的上下文
        let enhancedContext = `项目ID: ${projectId}, 目标框架: ${projectType}`;

        // 移除向量上下文构建，使用简化上下文
        console.log('📝 使用简化上下文，不包含项目详细信息');

        // 2. 初始化 Dify 客户端
        const difyClient = getDifyClient();

        // 3. 使用 Dify 生成代码
        const generateResult = await difyClient.generateUI(prompt, {
            projectType,
            component_type
        });

        console.log(`✅ Dify 生成完成，共生成 ${generateResult.files.length} 个文件`);

        // 3. 将生成的代码写入 sandbox（保持原始文件结构）
        const fileOperations = generateResult.files.map(async (file) => {
            console.log(`📝 写入文件: ${file.path}`);
            return projectManager.saveProjectFiles(projectId, {
                [file.path]: file.content
            });
        });

        await Promise.all(fileOperations);

        // 4. 特殊处理：根据component_type决定文件结构
        let mainComponent = generateResult.files.find(file =>
            file.path.includes('page.tsx') ||
            file.path.includes('App.tsx') ||
            file.path.includes('index.tsx') ||
            file.type === 'page'
        );

        // 如果没有找到页面文件，但component_type是单个组件，则使用第一个组件文件
        if (!mainComponent && (component_type === 'component' || component_type === 'form' || component_type === 'card')) {
            mainComponent = generateResult.files.find(file =>
                file.path.endsWith('.tsx') &&
                !file.path.includes('layout') &&
                !file.path.includes('globals')
            );
            console.log('🔍 未找到页面文件，使用组件文件作为主组件:', mainComponent?.path);
        }

        // 4. 处理组件信息（在创建文件时确定组件名称）
        let componentInfo = null;

        if (mainComponent) {
            console.log('🔍 原始组件代码:', mainComponent.content.substring(0, 200) + '...');
            console.log('🔍 component_type:', component_type);

            // 根据component_type决定文件结构
            console.log('🔍 判断component_type:', component_type, '是否匹配单个组件类型');

            if (component_type === 'component' || component_type === 'form' || component_type === 'card') {
                // 单个组件：从文件路径获取组件名称
                const componentName = mainComponent.path
                    .replace(/^components\//, '')  // 移除 components/ 前缀
                    .replace(/\.tsx?$/, '');       // 移除文件扩展名

                console.log('🔍 组件名称:', componentName);

                // 构建import路径
                const importPath = mainComponent.path.replace(/\.tsx?$/, '');
                const componentPath = `app/${componentName}/page.tsx`;

                // 创建页面文件，import生成的组件
                const pageContent = `'use client';

import React from 'react';
import ${componentName} from '@/${importPath}';

export default function Page() {
  return <${componentName} />;
}`;

                console.log('🔍 准备写入文件路径:', componentPath);
                console.log('🔍 import路径:', importPath);

                try {
                    await projectManager.saveProjectFiles(projectId, {
                        [componentPath]: pageContent
                    });
                    console.log(`✅ 组件页面已写入 sandbox/${componentPath}`);

                    // 直接使用组件名称创建组件信息
                    componentInfo = {
                        name: componentName,
                        path: componentPath,
                        previewUrl: `/${componentName}`
                    };
                    console.log('🔍 保存的组件信息:', componentInfo);
                } catch (error) {
                    console.error('❌ 写入组件页面失败:', error);
                }
            } else {
                // 项目生成：保持原有逻辑，只写入根页面
                console.log(`🎯 项目生成，写入 sandbox/app/page.tsx: ${mainComponent.path}`);

                try {
                    await projectManager.saveProjectFiles(projectId, {
                        'app/page.tsx': mainComponent.content
                    });
                    console.log(`✅ 项目主页面已写入 sandbox/app/page.tsx`);
                } catch (error) {
                    console.error('❌ 写入项目主页面失败:', error);
                }
            }
        }

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

        // 5. 跳过向量数据库更新（已禁用向量上下文）
        console.log('⏭️ 跳过向量数据库更新');

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

        // 组件信息已在上面处理完成

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
                // 组件信息（仅单个组件生成时包含）
                componentInfo,
                // 新增：智能演进建议
                evolution: evolutionSuggestions ? {
                    suggestions: evolutionSuggestions.suggestions,
                    recommendedPrompts: evolutionSuggestions.recommendedPrompts,
                    stats: evolutionSuggestions.stats
                } : null,
                // 新增：向量上下文信息
                vectorContext: {
                    enabled: false,
                    contextSize: enhancedContext.length,
                    contextType: 'simplified'
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