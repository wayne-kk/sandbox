import { NextRequest, NextResponse } from 'next/server';
import { UserProjectService } from '@/lib/services/user-project.service';
import { UserSessionManager } from '@/lib/user-session';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const projectService = UserProjectService.getInstance();

export async function GET(request: NextRequest) {
    try {
        // 获取用户会话
        const session = await UserSessionManager.getOrCreateSession(request);
        const userId = session.userId;

        // 获取数据库统计信息
        const stats = {
            userId,
            sessionId: session.sessionId,
            tables: {
                users: await prisma.user.count(),
                userProjects: await prisma.userProject.count(),
                projectFiles: await prisma.projectFile.count(),
                templates: await prisma.template.count(),
                templateFiles: await prisma.templateFile.count()
            },
            userProjects: await prisma.userProject.findMany({
                where: { userId },
                include: {
                    _count: {
                        select: { files: true }
                    }
                }
            }),
            recentProjects: await prisma.userProject.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { files: true }
                    }
                }
            })
        };

        const response = NextResponse.json({
            success: true,
            data: stats
        });

        // 设置会话Cookie
        response.cookies.set('session-id', session.sessionId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60
        });

        return response;
    } catch (error) {
        console.error('数据库调试失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '数据库调试失败'
            },
            { status: 500 }
        );
    }
} 