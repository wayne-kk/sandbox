import { NextRequest, NextResponse } from 'next/server';
import { UserProjectService } from '@/lib/services/user-project.service';

const projectService = UserProjectService.getInstance();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, filePath, content } = body;

        console.log(`🔍 测试保存文件: ${projectId}/${filePath}`);

        // 测试保存单个文件
        await projectService.saveFile('test-user', projectId, filePath, content);

        return NextResponse.json({
            success: true,
            message: '文件保存成功',
            data: { projectId, filePath }
        });
    } catch (error) {
        console.error('测试保存文件失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '保存失败'
            },
            { status: 500 }
        );
    }
} 