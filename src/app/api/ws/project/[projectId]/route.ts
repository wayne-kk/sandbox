import { NextRequest } from 'next/server';
import { ProjectWebSocketManager } from '@/lib/project-websocket';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const { projectId } = await params;

    if (!projectId) {
        return new Response('Missing projectId', { status: 400 });
    }

    // 移除WebSocket升级检查，因为我们使用SSE实现
    // SSE不需要协议升级，直接通过HTTP GET请求建立连接

    try {
        const wsManager = ProjectWebSocketManager.getInstance();
        const response = await wsManager.handleConnection(request, projectId);
        return response;
    } catch (error) {
        console.error('SSE connection error:', error);
        return new Response('SSE connection failed', { status: 500 });
    }
} 