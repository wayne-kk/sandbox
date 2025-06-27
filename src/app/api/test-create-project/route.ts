import { NextRequest, NextResponse } from 'next/server';
import { UserSessionManager } from '@/lib/user-session';
import { UserProjectService } from '@/lib/services/user-project.service';

export async function POST(request: NextRequest) {
    try {
        const projectService = UserProjectService.getInstance();

        // 获取或创建用户会话
        const session = await UserSessionManager.getOrCreateSession(request);
        console.log('🔑 用户会话:', session);

        // 创建项目 - 使用正确的请求格式
        const projectId = await projectService.createProject(session.userId, {
            name: '测试项目',
            description: '通过API创建的测试项目',
            templateName: 'default'
        });

        console.log('✅ 创建的项目ID:', projectId);

        // 设置会话cookie
        const response = NextResponse.json({
            success: true,
            projectId,
            session: {
                userId: session.userId,
                sessionId: session.sessionId
            },
            message: '项目创建成功',
            editorUrl: `/editor/${projectId}`
        });

        // 设置会话cookie
        response.cookies.set('session-id', session.sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24小时
        });

        return response;
    } catch (error) {
        console.error('❌ 创建项目失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '创建项目失败'
            },
            { status: 500 }
        );
    }
} 