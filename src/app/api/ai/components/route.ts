import { NextResponse } from 'next/server';
import { ComponentAnalyzer } from '@/lib/ai/component-analyzer';

export async function GET() {
    try {
        console.log('📚 获取组件库文档...');

        const analyzer = ComponentAnalyzer.getInstance();
        const documentation = await analyzer.analyzeAllComponents();

        return NextResponse.json({
            success: true,
            data: documentation
        });

    } catch (error) {
        console.error('获取组件库文档失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function POST() {
    try {
        console.log('🔄 重新分析组件库...');

        const analyzer = ComponentAnalyzer.getInstance();
        const documentation = await analyzer.analyzeAllComponents();

        return NextResponse.json({
            success: true,
            message: '组件库分析完成',
            data: documentation
        });

    } catch (error) {
        console.error('重新分析组件库失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}
