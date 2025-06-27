import { NextRequest, NextResponse } from 'next/server';
import { UserProjectService } from '@/lib/services/user-project.service';

const projectService = UserProjectService.getInstance();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, files } = body;

        console.log(`🔍 测试批量保存文件: ${projectId}, ${Object.keys(files).length} 个文件`);

        // 测试批量保存文件
        await projectService.saveFiles('test-user', projectId, files);

        return NextResponse.json({
            success: true,
            message: '批量文件保存成功',
            data: {
                projectId,
                fileCount: Object.keys(files).length,
                files: Object.keys(files)
            }
        });
    } catch (error) {
        console.error('测试批量保存文件失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '批量保存失败'
            },
            { status: 500 }
        );
    }
} 