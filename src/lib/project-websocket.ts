import { NextRequest } from 'next/server';

export interface ProjectStatusUpdate {
    type: 'status-change' | 'logs-update' | 'url-change' | 'error' | 'ping';
    projectId: string;
    data: {
        status?: 'stopped' | 'starting' | 'running' | 'error';
        logs?: string[];
        url?: string;
        error?: string;
        message?: string;
    };
    timestamp: number;
}

interface ProjectConnection {
    ws: WebSocket;
    projectId: string;
    lastPing: number;
    clientId: string;
}

export class ProjectWebSocketManager {
    private static instance: ProjectWebSocketManager | null = null;
    private connections: Map<string, ProjectConnection[]> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.startHeartbeat();
        console.log('🔌 ProjectWebSocketManager 初始化 (使用SSE实现)');
    }

    static getInstance(): ProjectWebSocketManager {
        if (!ProjectWebSocketManager.instance) {
            ProjectWebSocketManager.instance = new ProjectWebSocketManager();
        }
        return ProjectWebSocketManager.instance;
    }

    /**
     * 处理SSE连接 (模拟WebSocket功能)
     */
    async handleConnection(request: NextRequest, projectId: string): Promise<Response> {
        try {
            // 使用Server-Sent Events (SSE)实现实时通信
            // Next.js在Edge Runtime中不直接支持WebSocket，所以使用SSE作为替代方案

            const clientId = this.generateClientId();

            const stream = new ReadableStream({
                start: (controller) => {
                    // 创建SSE连接
                    const connection = {
                        controller,
                        projectId,
                        lastPing: Date.now(),
                        clientId,
                        send: (data: ProjectStatusUpdate) => {
                            try {
                                const message = `data: ${JSON.stringify(data)}\n\n`;
                                controller.enqueue(new TextEncoder().encode(message));
                            } catch (error) {
                                console.error('发送SSE消息失败:', error);
                            }
                        }
                    };

                    // 添加到连接池
                    if (!this.connections.has(projectId)) {
                        this.connections.set(projectId, []);
                    }
                    this.connections.get(projectId)!.push(connection as any);

                    console.log(`📡 新的SSE连接: ${projectId} (${clientId})`);

                    // 发送连接确认
                    connection.send({
                        type: 'ping',
                        projectId,
                        data: { message: 'Connected to project status stream' },
                        timestamp: Date.now()
                    });

                    // 发送初始状态
                    this.sendInitialStatus(projectId, connection.send);
                },
                cancel: () => {
                    this.removeConnection(projectId, clientId);
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Cache-Control',
                },
            });
        } catch (error) {
            console.error('处理SSE连接失败:', error);
            throw error;
        }
    }

    /**
     * 发送初始状态
     */
    private async sendInitialStatus(projectId: string, send: (data: ProjectStatusUpdate) => void) {
        try {
            // 这里可以从ProjectManager获取当前状态
            const ProjectManager = (await import('./project-manager')).ProjectManager;
            const projectManager = ProjectManager.getInstance();
            const status = projectManager?.getProjectStatus(projectId);

            if (status) {
                send({
                    type: 'status-change',
                    projectId,
                    data: {
                        status: status.status as any,
                        url: status.url,
                        logs: status.logs || []
                    },
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('发送初始状态失败:', error);
        }
    }

    /**
     * 广播状态更新到所有订阅的客户端
     */
    broadcast(projectId: string, update: Omit<ProjectStatusUpdate, 'timestamp'>) {
        const connections = this.connections.get(projectId);
        if (!connections || connections.length === 0) {
            return;
        }

        const message: ProjectStatusUpdate = {
            ...update,
            timestamp: Date.now()
        };

        console.log(`📤 广播消息到 ${connections.length} 个客户端:`, message.type);

        connections.forEach((connection, index) => {
            try {
                (connection as any).send(message);
            } catch (error) {
                console.error(`发送消息到客户端 ${index} 失败:`, error);
                // 移除无效连接
                this.removeConnection(projectId, connection.clientId);
            }
        });
    }

    /**
     * 项目状态变化时调用
     */
    onProjectStatusChange(projectId: string, status: string, url?: string) {
        this.broadcast(projectId, {
            type: 'status-change',
            projectId,
            data: { status: status as any, url }
        });
    }

    /**
     * 构建日志更新时调用
     */
    onProjectLogsUpdate(projectId: string, logs: string[]) {
        this.broadcast(projectId, {
            type: 'logs-update',
            projectId,
            data: { logs }
        });
    }

    /**
     * 预览URL变化时调用
     */
    onProjectUrlChange(projectId: string, url: string) {
        this.broadcast(projectId, {
            type: 'url-change',
            projectId,
            data: { url }
        });
    }

    /**
     * 项目错误时调用
     */
    onProjectError(projectId: string, error: string) {
        this.broadcast(projectId, {
            type: 'error',
            projectId,
            data: { error }
        });
    }

    /**
     * 移除连接
     */
    private removeConnection(projectId: string, clientId: string) {
        const connections = this.connections.get(projectId);
        if (connections) {
            const index = connections.findIndex(conn => conn.clientId === clientId);
            if (index !== -1) {
                connections.splice(index, 1);
                console.log(`🔌 移除连接: ${projectId} (${clientId})`);

                if (connections.length === 0) {
                    this.connections.delete(projectId);
                }
            }
        }
    }

    /**
     * 生成客户端ID
     */
    private generateClientId(): string {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 启动心跳检测
     */
    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();

            for (const [projectId, connections] of this.connections.entries()) {
                connections.forEach(connection => {
                    // 发送心跳
                    try {
                        (connection as any).send({
                            type: 'ping',
                            projectId,
                            data: { message: 'heartbeat' },
                            timestamp: now
                        });
                    } catch (error) {
                        this.removeConnection(projectId, connection.clientId);
                    }
                });
            }
        }, 30000); // 30秒心跳

        console.log('💓 WebSocket心跳已启动');
    }

    /**
     * 获取连接统计
     */
    getConnectionStats(): { totalConnections: number; projectCount: number; projects: { [projectId: string]: number } } {
        let totalConnections = 0;
        const projects: { [projectId: string]: number } = {};

        for (const [projectId, connections] of this.connections.entries()) {
            const count = connections.length;
            totalConnections += count;
            projects[projectId] = count;
        }

        return {
            totalConnections,
            projectCount: this.connections.size,
            projects
        };
    }

    /**
     * 清理所有连接
     */
    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        this.connections.clear();
        console.log('🧹 WebSocket连接已清理');
    }
} 