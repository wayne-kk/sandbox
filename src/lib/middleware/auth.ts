import { NextRequest, NextResponse } from 'next/server';
import { UserSessionManager } from '@/lib/user-session';

export interface AuthenticatedRequest extends NextRequest {
    userId: string;
    sessionId: string;
}

/**
 * 用户身份认证中间件
 * 从请求中提取用户身份信息，如果没有则创建新用户
 */
export async function withAuth(
    request: NextRequest,
    handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        // 获取或创建用户会话
        const session = await UserSessionManager.getOrCreateSession(request);

        // 将用户信息添加到请求中
        const authenticatedRequest = request as AuthenticatedRequest;
        authenticatedRequest.userId = session.userId;
        authenticatedRequest.sessionId = session.sessionId;

        // 在响应头中设置会话信息
        const response = await handler(authenticatedRequest);

        // 设置会话Cookie (HttpOnly, Secure)
        response.cookies.set('session-id', session.sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 // 24小时
        });

        // 设置用户ID头部供前端使用
        response.headers.set('x-user-id', session.userId);

        console.log(`🔐 用户认证成功: ${session.userId}`);

        return response;
    } catch (error) {
        console.error('用户认证失败:', error);
        return NextResponse.json(
            { success: false, error: '用户认证失败' },
            { status: 401 }
        );
    }
}

/**
 * 从请求头或Cookie中提取用户ID
 */
export function getUserIdFromRequest(request: NextRequest): string {
    // 优先从头部获取
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId) {
        return headerUserId;
    }

    // 从Cookie获取会话ID，然后查找用户ID
    const sessionId = request.cookies.get('session-id')?.value;
    if (sessionId) {
        // 这里可以从UserSessionManager获取用户ID
        // 为简化，暂时使用匿名用户
        return 'anonymous';
    }

    return 'anonymous';
}

/**
 * 创建认证装饰器
 */
export function createAuthDecorator() {
    return function <T extends (...args: any[]) => Promise<NextResponse>>(
        target: any,
        propertyName: string,
        descriptor: TypedPropertyDescriptor<T>
    ) {
        const method = descriptor.value!;
        descriptor.value = (async (...args: any[]) => {
            const request = args[0] as NextRequest;
            return withAuth(request, method as any);
        }) as T;
    };
} 