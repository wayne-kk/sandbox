import { NextRequest, NextResponse } from 'next/server';
import { ProjectManager } from '@/lib/project-manager';

const projectManager = ProjectManager.getInstance();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { githubUrl } = body;

        if (!githubUrl) {
            return NextResponse.json(
                { success: false, error: '缺少GitHub URL' },
                { status: 400 }
            );
        }

        console.log(`🚀 开始设置GitHub项目: ${githubUrl}`);

        // 从GitHub下载并设置项目
        const result = await projectManager.downloadFromGitHub(githubUrl);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || result.message,
                    details: result
                },
                { status: 400 }
            );
        }

        console.log(`✅ GitHub项目设置完成`);

        return NextResponse.json({
            success: true,
            message: result.message,
            data: {
                projectInfo: result.projectInfo,
                sandboxPath: 'sandbox'
            }
        });

    } catch (error) {
        console.error('设置GitHub项目失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '设置GitHub项目失败',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
