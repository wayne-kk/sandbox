import { NextRequest, NextResponse } from 'next/server';
import { TemplateService } from '@/lib/services/template.service';

const templateService = TemplateService.getInstance();

// GET /api/templates - 获取所有可用模板
export async function GET(request: NextRequest) {
    try {
        const templates = await templateService.getAvailableTemplates();

        return NextResponse.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('获取模板列表失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '获取模板列表失败'
            },
            { status: 500 }
        );
    }
}

// POST /api/templates - 创建新模板（管理员功能）
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, displayName, description, framework, files } = body;

        if (!name || !displayName || !framework || !files) {
            return NextResponse.json(
                { success: false, error: '缺少必要字段' },
                { status: 400 }
            );
        }

        const templateId = await templateService.createTemplate({
            name,
            displayName,
            description,
            framework,
            files
        });

        return NextResponse.json({
            success: true,
            data: { templateId },
            message: '模板创建成功'
        });
    } catch (error) {
        console.error('创建模板失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '创建模板失败'
            },
            { status: 500 }
        );
    }
} 