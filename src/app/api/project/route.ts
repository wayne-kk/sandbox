import { NextRequest, NextResponse } from 'next/server';
import { ProjectManager } from '@/lib/project-manager';

const projectManager = ProjectManager.getInstance();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json(
                { success: false, error: '缺少 projectId 参数' },
                { status: 400 }
            );
        }

        const projectStatus = projectManager.getProjectStatus(projectId);

        if (!projectStatus) {
            return NextResponse.json({
                success: true,
                data: {
                    status: 'stopped',
                    port: null,
                    url: null,
                    logs: [],
                    framework: 'react'
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: projectStatus
        });
    } catch (error) {
        console.error('获取项目状态失败:', error);
        return NextResponse.json(
            { success: false, error: '获取项目状态失败' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, projectId, files, framework } = body;

        if (!action || !projectId) {
            return NextResponse.json(
                { success: false, error: '缺少必要参数' },
                { status: 400 }
            );
        }

        return await handleProjectAction(action, projectId, { files, framework });
    } catch (error) {
        console.error('项目操作失败:', error);
        return NextResponse.json(
            { success: false, error: '项目操作失败' },
            { status: 500 }
        );
    }
}

async function handleProjectAction(
    action: string,
    projectId: string,
    params: { files?: any; framework?: string }
): Promise<NextResponse> {
    switch (action) {
        case 'start':
            try {
                const status = await projectManager.startProject(projectId);
                return NextResponse.json({
                    success: true,
                    data: status,
                    message: '项目启动成功'
                });
            } catch (error) {
                return NextResponse.json(
                    { success: false, error: error instanceof Error ? error.message : '启动失败' },
                    { status: 500 }
                );
            }

        case 'stop':
            try {
                await projectManager.stopProject(projectId);
                return NextResponse.json({
                    success: true,
                    message: '项目已停止'
                });
            } catch (error) {
                return NextResponse.json(
                    { success: false, error: error instanceof Error ? error.message : '停止失败' },
                    { status: 500 }
                );
            }

        case 'update':
            try {
                if (params.files) {
                    await projectManager.saveProjectFiles(projectId, params.files);
                }
                return NextResponse.json({
                    success: true,
                    message: '文件更新成功'
                });
            } catch (error) {
                return NextResponse.json(
                    { success: false, error: error instanceof Error ? error.message : '更新失败' },
                    { status: 500 }
                );
            }

        default:
            return NextResponse.json(
                { success: false, error: '不支持的操作' },
                { status: 400 }
            );
    }
} 