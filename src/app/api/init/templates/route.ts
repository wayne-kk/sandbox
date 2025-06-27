import { NextResponse } from 'next/server';
import { TemplateService } from '@/lib/services/template.service';

const templateService = TemplateService.getInstance();

export async function POST() {
    try {
        console.log('🚀 开始初始化模板数据...');

        // 初始化默认模板到数据库
        await templateService.initializeDefaultTemplates();

        console.log('✅ 模板数据初始化完成');

        return NextResponse.json({
            success: true,
            message: '模板数据初始化成功'
        });
    } catch (error) {
        console.error('❌ 模板数据初始化失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '初始化失败'
            },
            { status: 500 }
        );
    }
} 