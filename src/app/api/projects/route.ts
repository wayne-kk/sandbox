import { NextRequest, NextResponse } from 'next/server';
import { PrismaFileStorageService } from '@/lib/services/file-storage.service';

const fileStorage = PrismaFileStorageService.getInstance();

// GET /api/projects - 获取用户项目列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const includeArchived = searchParams.get('includeArchived') === 'true';

        const result = await fileStorage.getUserProjects(userId, {
            page,
            limit,
            includeArchived
        });

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('获取项目列表失败:', error);
        return NextResponse.json(
            { error: '获取项目列表失败' },
            { status: 500 }
        );
    }
}

// POST /api/projects - 创建新项目
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const body = await request.json();
        const { templateId, name, description } = body;

        if (!templateId || !name) {
            return NextResponse.json(
                { error: '模板ID和项目名称为必填项' },
                { status: 400 }
            );
        }

        const projectId = await fileStorage.createProjectFromTemplate(
            userId,
            templateId,
            name,
            description
        );

        return NextResponse.json({
            success: true,
            data: { projectId }
        });
    } catch (error) {
        console.error('创建项目失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '创建项目失败' },
            { status: 500 }
        );
    }
} 