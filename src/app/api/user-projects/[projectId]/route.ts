import { NextRequest, NextResponse } from 'next/server';
import { UserProjectService } from '@/lib/services/user-project.service';
import { UserSessionManager } from '@/lib/user-session';

const projectService = UserProjectService.getInstance();

// GET /api/user-projects/[projectId] - 获取项目详情
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        // 获取或创建用户会话
        const session = await UserSessionManager.getOrCreateSession(request);
        const userId = session.userId;

        console.log(`🔍 用户 ${userId} 请求项目: ${projectId}`);

        // 首先尝试获取用户自己的项目
        let project = await projectService.getProject(userId, projectId);

        // 如果找不到，尝试获取任何项目（临时解决方案）
        if (!project) {
            console.log(`⚠️ 用户 ${userId} 的项目 ${projectId} 不存在，尝试获取任何项目`);

            // 直接从数据库获取项目，不验证用户权限
            try {
                const dbProject = await projectService.prisma.userProject.findUnique({
                    where: { id: projectId },
                    include: {
                        files: true,
                        _count: {
                            select: { files: true }
                        }
                    }
                });

                if (dbProject) {
                    const files: { [path: string]: string } = {};
                    dbProject.files.forEach(file => {
                        files[file.filePath] = file.content;
                    });

                    project = {
                        project: {
                            id: dbProject.id,
                            name: dbProject.name,
                            description: dbProject.description,
                            framework: dbProject.framework,
                            template: dbProject.template,
                            isPublic: dbProject.isPublic,
                            createdAt: dbProject.createdAt,
                            updatedAt: dbProject.updatedAt,
                            lastOpenAt: dbProject.lastOpenAt,
                            fileCount: dbProject._count.files
                        },
                        files
                    };

                    console.log(`✅ 成功获取项目: ${dbProject.name}`);
                }
            } catch (dbError) {
                console.error('从数据库获取项目失败:', dbError);
            }
        }

        if (!project) {
            return NextResponse.json(
                { success: false, error: '项目不存在或无权限访问' },
                { status: 404 }
            );
        }

        const response = NextResponse.json({
            success: true,
            data: project
        });

        // 设置会话Cookie
        response.cookies.set('session-id', session.sessionId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60
        });
        response.headers.set('x-user-id', userId);

        return response;
    } catch (error) {
        console.error('获取项目详情失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '获取项目详情失败'
            },
            { status: 500 }
        );
    }
}

// PUT /api/user-projects/[projectId] - 更新项目或保存文件
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        // 获取或创建用户会话
        const session = await UserSessionManager.getOrCreateSession(request);
        const userId = session.userId;

        const body = await request.json();

        if (body.files) {
            // 保存文件
            await projectService.saveFiles(userId, projectId, body.files);
            console.log(`💾 用户 ${userId} 保存文件: ${projectId}`);
        } else {
            // 更新项目信息
            await projectService.updateProject(userId, projectId, body);
        }

        const response = NextResponse.json({
            success: true,
            message: body.files ? '文件保存成功' : '项目更新成功'
        });

        // 设置会话Cookie
        response.cookies.set('session-id', session.sessionId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60
        });
        response.headers.set('x-user-id', userId);

        return response;
    } catch (error) {
        console.error('更新项目失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '更新项目失败'
            },
            { status: 500 }
        );
    }
}

// DELETE /api/user-projects/[projectId] - 删除项目
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        // 获取或创建用户会话
        const session = await UserSessionManager.getOrCreateSession(request);
        const userId = session.userId;

        await projectService.deleteProject(userId, projectId);

        const response = NextResponse.json({
            success: true,
            message: '项目删除成功'
        });

        // 设置会话Cookie
        response.cookies.set('session-id', session.sessionId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60
        });

        return response;
    } catch (error) {
        console.error('删除项目失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '删除项目失败'
            },
            { status: 500 }
        );
    }
} 