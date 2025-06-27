import { NextRequest, NextResponse } from 'next/server';
import { UserProjectService } from '@/lib/services/user-project.service';
import { TemplateService } from '@/lib/services/template.service';
import { UserSessionManager } from '@/lib/user-session';

const projectService = UserProjectService.getInstance();
const templateService = TemplateService.getInstance();

// GET /api/user-projects - 获取用户项目列表
export async function GET(request: NextRequest) {
    try {
        // 获取或创建用户会话
        const session = await UserSessionManager.getOrCreateSession(request);
        const userId = session.userId;

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const query = searchParams.get('query');

        if (query) {
            // 搜索项目
            const projects = await projectService.searchProjects(userId, query, limit);
            const response = NextResponse.json({
                success: true,
                data: {
                    projects,
                    total: projects.length,
                    hasMore: false
                }
            });

            // 设置会话Cookie
            response.cookies.set('session-id', session.sessionId, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 // 24小时
            });
            response.headers.set('x-user-id', userId);

            return response;
        } else {
            // 获取项目列表
            const result = await projectService.getUserProjects(userId, page, limit);
            const response = NextResponse.json({
                success: true,
                data: result
            });

            // 设置会话Cookie
            response.cookies.set('session-id', session.sessionId, {
                httpOnly: true,
                maxAge: 24 * 60 * 60
            });
            response.headers.set('x-user-id', userId);

            return response;
        }
    } catch (error) {
        console.error('获取项目列表失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '获取项目列表失败'
            },
            { status: 500 }
        );
    }
}

// POST /api/user-projects - 创建新项目
export async function POST(request: NextRequest) {
    try {
        // 获取或创建用户会话
        const session = await UserSessionManager.getOrCreateSession(request);
        const userId = session.userId;

        const body = await request.json();
        const projectId = await projectService.createProject(userId, body);

        const response = NextResponse.json({
            success: true,
            data: { projectId }
        });

        // 设置会话Cookie
        response.cookies.set('session-id', session.sessionId, {
            httpOnly: true,
            maxAge: 24 * 60 * 60
        });
        response.headers.set('x-user-id', userId);

        return response;
    } catch (error) {
        console.error('创建项目失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '创建项目失败'
            },
            { status: 500 }
        );
    }
} 