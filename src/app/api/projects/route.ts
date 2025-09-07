import { NextRequest, NextResponse } from 'next/server';
import { PrismaFileStorageService } from '@/lib/services/file-storage.service';

const fileStorage = PrismaFileStorageService.getInstance();

// GET /api/projects - 获取可用模板列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const framework = searchParams.get('framework');

        const templates = await fileStorage.getTemplates(framework || undefined);

        return NextResponse.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('获取模板列表失败:', error);
        return NextResponse.json(
            { error: '获取模板列表失败' },
            { status: 500 }
        );
    }
}

// POST /api/projects - 从模板创建项目文件
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, templateId } = body;

        if (!projectId || !templateId) {
            return NextResponse.json(
                { error: '项目ID和模板ID为必填项' },
                { status: 400 }
            );
        }

        await fileStorage.createProjectFromTemplate(projectId, templateId);

        return NextResponse.json({
            success: true,
            message: '项目文件创建成功'
        });
    } catch (error) {
        console.error('创建项目文件失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '创建项目文件失败' },
            { status: 500 }
        );
    }
} 