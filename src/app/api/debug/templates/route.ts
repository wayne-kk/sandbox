import { NextResponse } from 'next/server';
import { TemplateService } from '@/lib/services/template.service';

export async function GET() {
    try {
        const templateService = TemplateService.getInstance();
        const templates = await templateService.getAvailableTemplates();

        return NextResponse.json({
            success: true,
            templates: templates.map(t => ({
                id: t.id,
                name: t.name,
                displayName: t.displayName,
                description: t.description,
                framework: t.framework,
                fileCount: Object.keys(t.files).length
            }))
        });
    } catch (error) {
        console.error('❌ 获取模板失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '获取模板失败'
            },
            { status: 500 }
        );
    }
} 