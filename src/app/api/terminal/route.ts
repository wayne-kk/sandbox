import { NextResponse } from 'next/server';
import { EnhancedDockerManager } from '@/lib/enhanced-docker';
import path from 'path';

// 全局Docker管理器实例
const dockerManager = new EnhancedDockerManager();

// WebSocket连接管理
const activeConnections = new Map<string, {
    controller: ReadableStreamDefaultController;
    encoder: TextEncoder;
    sessionId: string;
}>();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        switch (action) {
            case 'status':
                const status = await dockerManager.getContainerStatus();
                const health = await dockerManager.healthCheck();
                const runningCommands = dockerManager.getRunningCommands();

                return NextResponse.json({
                    success: true,
                    status,
                    health,
                    runningCommands: runningCommands.map(cmd => ({
                        id: cmd.id,
                        command: cmd.command,
                        startTime: cmd.startTime,
                        status: cmd.status
                    }))
                });

            case 'commands':
                const commonCommands = dockerManager.getCommonCommands();
                const commandHistory = dockerManager.getCommandHistory();

                return NextResponse.json({
                    success: true,
                    commonCommands,
                    commandHistory
                });

            case 'stream':
                // 创建SSE流
                const sessionId = Math.random().toString(36).substr(2, 9);

                return new Response(
                    new ReadableStream({
                        start(controller) {
                            const encoder = new TextEncoder();

                            activeConnections.set(sessionId, {
                                controller,
                                encoder,
                                sessionId
                            });

                            // 发送连接成功消息
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'connected',
                                sessionId,
                                timestamp: new Date().toISOString()
                            })}\n\n`));

                            // 设置事件监听器
                            const events = [
                                'command-started',
                                'command-output',
                                'command-finished',
                                'command-error',
                                'command-cancelled',
                                'container-created',
                                'pulling-image',
                                'image-pulled'
                            ];

                            events.forEach(event => {
                                dockerManager.on(event, (data) => {
                                    if (activeConnections.has(sessionId)) {
                                        try {
                                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                                type: event,
                                                data,
                                                timestamp: new Date().toISOString()
                                            })}\n\n`));
                                        } catch (error) {
                                            console.error('SSE发送失败:', error);
                                        }
                                    }
                                });
                            });
                        },
                        cancel() {
                            activeConnections.delete(sessionId);
                        }
                    }),
                    {
                        headers: {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Connection': 'keep-alive',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Headers': 'Cache-Control'
                        }
                    }
                );

            default:
                return NextResponse.json({
                    success: false,
                    error: '不支持的操作'
                }, { status: 400 });
        }
    } catch (error) {
        console.error('终端API错误:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, command, executionId, projectPath } = body;

        switch (action) {
            case 'execute':
                if (!command?.trim()) {
                    return NextResponse.json({
                        success: false,
                        error: '命令不能为空'
                    }, { status: 400 });
                }

                // 检查容器状态
                const status = await dockerManager.getContainerStatus();
                if (!status.isRunning) {
                    return NextResponse.json({
                        success: false,
                        error: '容器未运行，请先创建容器',
                        needsContainer: true
                    }, { status: 400 });
                }

                // 执行命令
                const result = await dockerManager.executeCommand(command, {
                    timeout: command.includes('pnpm install') ? 180000 : 60000, // pnpm install给3分钟超时
                    onOutput: (type, data) => {
                        // 通过SSE广播输出
                        activeConnections.forEach(({ controller, encoder }) => {
                            try {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                    type: 'command-output',
                                    data: { type, data },
                                    timestamp: new Date().toISOString()
                                })}\n\n`));
                            } catch (error) {
                                console.error('SSE广播失败:', error);
                            }
                        });
                    },
                    onProgress: (progress) => {
                        // 通过SSE广播进度
                        activeConnections.forEach(({ controller, encoder }) => {
                            try {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                    type: 'command-progress',
                                    data: progress,
                                    timestamp: new Date().toISOString()
                                })}\n\n`));
                            } catch (error) {
                                console.error('SSE进度广播失败:', error);
                            }
                        });
                    }
                });

                return NextResponse.json({
                    success: result.success,
                    output: result.output,
                    error: result.error,
                    executionId: result.executionId
                });

            case 'cancel':
                if (!executionId) {
                    return NextResponse.json({
                        success: false,
                        error: '执行ID不能为空'
                    }, { status: 400 });
                }

                const cancelled = await dockerManager.cancelCommand(executionId);
                return NextResponse.json({
                    success: cancelled,
                    message: cancelled ? '命令已取消' : '无法取消命令（可能已完成）'
                });

            case 'create-container':
                const sandboxPath = projectPath || path.join(process.cwd(), 'sandbox');

                try {
                    const containerId = await dockerManager.createContainer(sandboxPath);
                    return NextResponse.json({
                        success: true,
                        message: '容器创建成功',
                        containerId,
                        projectPath: sandboxPath
                    });
                } catch (error) {
                    return NextResponse.json({
                        success: false,
                        error: error instanceof Error ? error.message : '容器创建失败'
                    }, { status: 500 });
                }

            case 'cleanup':
                await dockerManager.cleanup();
                return NextResponse.json({
                    success: true,
                    message: '清理完成'
                });

            case 'health-check':
                const healthStatus = await dockerManager.healthCheck();
                return NextResponse.json({
                    success: true,
                    health: healthStatus
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: '不支持的操作'
                }, { status: 400 });
        }
    } catch (error) {
        console.error('终端POST请求错误:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session');

    if (sessionId && activeConnections.has(sessionId)) {
        activeConnections.delete(sessionId);
        return NextResponse.json({
            success: true,
            message: '会话已断开'
        });
    }

    return NextResponse.json({
        success: false,
        error: '会话不存在'
    }, { status: 404 });
} 