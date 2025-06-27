import { NextResponse } from 'next/server';
import { DockerManager } from '@/lib/docker';

const dockerManager = new DockerManager();

export async function POST(request: Request) {
    try {
        const { command, stream = false } = await request.json();

        if (!command) {
            return NextResponse.json({
                success: false,
                error: '命令不能为空'
            }, { status: 400 });
        }

        // 检查容器是否运行
        const isRunning = await dockerManager.isContainerRunning();
        if (!isRunning) {
            return NextResponse.json({
                success: false,
                error: '容器未运行，请先启动容器'
            }, { status: 400 });
        }

        if (stream) {
            // 流式输出（用于长时间运行的命令如 npm install）
            return new Response(
                new ReadableStream({
                    async start(controller) {
                        const encoder = new TextEncoder();

                        try {
                            await dockerManager.execInContainerStream(
                                command,
                                (data) => {
                                    try {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stdout', data })}\n\n`));
                                    } catch (error) {
                                        console.error('流输出错误:', error);
                                    }
                                },
                                (error) => {
                                    try {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'stderr', data: error })}\n\n`));
                                    } catch (e) {
                                        console.error('流错误输出错误:', e);
                                    }
                                },
                                (code) => {
                                    try {
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'exit', code })}\n\n`));
                                        controller.close();
                                    } catch (error) {
                                        console.error('流关闭错误:', error);
                                        controller.close();
                                    }
                                }
                            );
                        } catch (error) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: error instanceof Error ? error.message : String(error) })}\n\n`));
                            controller.close();
                        }
                    }
                }),
                {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Connection': 'keep-alive',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            );
        } else {
            // 一次性执行
            const result = await dockerManager.execInContainer(command);

            return NextResponse.json({
                success: result.exitCode === 0,
                command,
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode
            });
        }
    } catch (error) {
        console.error('命令执行失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

// 预定义的常用命令
export async function GET() {
    try {
        const isRunning = await dockerManager.isContainerRunning();

        const commonCommands = [
            {
                name: '安装依赖',
                command: 'npm install',
                description: '安装 package.json 中的所有依赖'
            },
            {
                name: '启动开发服务器',
                command: 'npm run dev',
                description: '启动 Next.js 开发服务器'
            },
            {
                name: '构建项目',
                command: 'npm run build',
                description: '构建生产版本'
            },
            {
                name: '查看文件',
                command: 'ls -la',
                description: '列出当前目录文件'
            },
            {
                name: '查看端口',
                command: 'netstat -tulpn | grep :3001',
                description: '检查端口 3001 使用情况'
            },
            {
                name: '查看进程',
                command: 'ps aux | grep node',
                description: '查看 Node.js 进程'
            }
        ];

        return NextResponse.json({
            success: true,
            isRunning,
            commands: commonCommands
        });
    } catch (error) {
        console.error('获取命令列表失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 