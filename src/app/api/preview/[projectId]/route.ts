import { NextRequest, NextResponse } from 'next/server';
import { RealtimePreviewManager } from '@/lib/preview/realtime-preview';
import { PrismaFileStorageService } from '@/lib/services/file-storage.service';

const previewManager = RealtimePreviewManager.getInstance();
const fileStorage = PrismaFileStorageService.getInstance();

// GET /api/preview/[projectId] - 获取预览状态
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        const status = previewManager.getPreviewStatus(projectId);

        return NextResponse.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('获取预览状态失败:', error);
        return NextResponse.json(
            { error: '获取预览状态失败' },
            { status: 500 }
        );
    }
}

// POST /api/preview/[projectId] - 启动预览
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        // 获取项目信息和文件
        const project = await fileStorage.getProject(userId, projectId);
        if (!project) {
            return NextResponse.json({ error: '项目不存在' }, { status: 404 });
        }

        // 构建文件映射
        const files: { [path: string]: string } = {};
        project.files.forEach(file => {
            files[file.filePath] = file.content;
        });

        // 启动预览
        const result = await previewManager.startPreview(
            projectId,
            files,
            project.framework as 'react' | 'vue' | 'vanilla'
        );

        return NextResponse.json({
            success: true,
            data: {
                url: result.url,
                containerId: result.containerId,
                status: 'running'
            }
        });

    } catch (error) {
        console.error('启动预览失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '启动预览失败' },
            { status: 500 }
        );
    }
}

// PUT /api/preview/[projectId] - 更新预览
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }

        const body = await request.json();
        const { files } = body;

        if (!files || typeof files !== 'object') {
            return NextResponse.json(
                { error: '无效的文件数据' },
                { status: 400 }
            );
        }

        // 更新预览
        await previewManager.updatePreview(projectId, files);

        return NextResponse.json({
            success: true,
            message: '预览已更新'
        });

    } catch (error) {
        console.error('更新预览失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '更新预览失败' },
            { status: 500 }
        );
    }
}

// DELETE /api/preview/[projectId] - 停止预览
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        await previewManager.stopPreview(projectId);

        return NextResponse.json({
            success: true,
            message: '预览已停止'
        });

    } catch (error) {
        console.error('停止预览失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '停止预览失败' },
            { status: 500 }
        );
    }
} 