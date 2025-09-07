import { NextRequest, NextResponse } from 'next/server';
import { PrismaFileStorageService } from '@/lib/services/file-storage.service';

const fileStorage = PrismaFileStorageService.getInstance();

// GET /api/projects/[projectId]/files - 获取项目所有文件
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        const files = await fileStorage.getProjectFiles(projectId);

        return NextResponse.json({
            success: true,
            data: files
        });
    } catch (error) {
        console.error('获取文件失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '获取文件失败' },
            { status: 500 }
        );
    }
}

// POST /api/projects/[projectId]/files - 保存文件
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        const body = await request.json();
        const { filePath, content, batch } = body;

        if (batch) {
            // 批量保存
            if (!batch || typeof batch !== 'object') {
                return NextResponse.json(
                    { error: '批量保存数据格式错误' },
                    { status: 400 }
                );
            }

            await fileStorage.saveFiles(projectId, batch);
        } else {
            // 单个文件保存
            if (!filePath || content === undefined) {
                return NextResponse.json(
                    { error: '文件路径和内容为必填项' },
                    { status: 400 }
                );
            }

            await fileStorage.saveFile(projectId, filePath, content);
        }

        return NextResponse.json({
            success: true,
            message: batch ? '批量保存成功' : '文件保存成功'
        });
    } catch (error) {
        console.error('保存文件失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '保存文件失败' },
            { status: 500 }
        );
    }
} 