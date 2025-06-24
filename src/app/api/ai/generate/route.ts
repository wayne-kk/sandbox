import { NextResponse } from 'next/server';
import { DockerManager } from '@/lib/docker';

const dockerManager = new DockerManager();

// 模拟AI代码生成（实际项目中替换为真实的AI API调用）
async function generateCodeWithAI(prompt: string, projectType: 'nextjs' | 'react'): Promise<{
    files: Array<{ path: string; content: string; }>
}> {
    // 这里集成你的AI模型 (GPT-4, Claude, 本地模型等)
    // 示例返回结构

    if (projectType === 'nextjs') {
        return {
            files: [
                {
                    path: 'pages/index.tsx',
                    content: `import React from 'react';
import Head from 'next/head';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Head>
                <title>AI生成页面</title>
            </Head>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
                    ${prompt}
                </h1>
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
                    <p className="text-gray-600 text-center">
                        这是由AI根据你的需求 "${prompt}" 生成的页面
                    </p>
                </div>
            </div>
        </div>
    );
}`
                },
                {
                    path: 'tailwind.config.js',
                    content: `module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}`
                }
            ]
        };
    }

    // React 版本的生成逻辑...
    return { files: [] };
}

export async function POST(request: Request) {
    try {
        const { prompt, projectType = 'nextjs' } = await request.json();

        if (!prompt) {
            return NextResponse.json({
                success: false,
                error: '请提供代码生成提示'
            }, { status: 400 });
        }

        // 1. 使用AI生成代码
        console.log(`🤖 AI正在生成代码: ${prompt}`);
        const generatedCode = await generateCodeWithAI(prompt, projectType);

        // 2. 检查Docker容器是否运行
        const isRunning = await dockerManager.isContainerRunning();
        if (!isRunning) {
            return NextResponse.json({
                success: false,
                error: '请先创建并启动Docker容器'
            }, { status: 400 });
        }

        // 3. 将生成的代码写入容器
        const writePromises = generatedCode.files.map(async (file) => {
            console.log(`📝 写入文件: ${file.path}`);
            await dockerManager.writeFileToContainer(file.path, file.content);
        });

        await Promise.all(writePromises);

        // 4. 安装依赖（如果有package.json变化）
        if (generatedCode.files.some(f => f.path === 'package.json')) {
            console.log('📦 安装新依赖...');
            await dockerManager.installDependencies();
        }

        // 5. 触发热重载（Next.js会自动检测文件变化）
        console.log('🔄 代码已更新，Next.js将自动重载');

        return NextResponse.json({
            success: true,
            message: '🎉 AI代码生成完成！',
            filesGenerated: generatedCode.files.length,
            files: generatedCode.files.map(f => ({ path: f.path, size: f.content.length }))
        });

    } catch (error) {
        console.error('AI代码生成失败:', error);
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