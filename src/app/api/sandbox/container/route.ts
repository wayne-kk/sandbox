import { NextResponse } from 'next/server';
import { DockerManager } from '@/lib/docker';
import path from 'path';

const dockerManager = new DockerManager();

export async function GET() {
    try {
        const isDockerAvailable = await dockerManager.isDockerAvailable();
        const isDaemonRunning = await dockerManager.isDockerDaemonRunning();

        if (!isDockerAvailable) {
            return NextResponse.json({
                success: false,
                error: 'Docker 不可用',
                dockerAvailable: false,
                daemonRunning: false
            }, { status: 500 });
        }

        if (!isDaemonRunning) {
            return NextResponse.json({
                success: false,
                error: 'Docker 守护进程未运行，请启动 Docker Desktop',
                dockerAvailable: true,
                daemonRunning: false
            }, { status: 500 });
        }

        const info = await dockerManager.getContainerInfo();
        const isRunning = await dockerManager.isContainerRunning();

        return NextResponse.json({
            success: true,
            container: info,
            isRunning,
            dockerAvailable: isDockerAvailable,
            daemonRunning: isDaemonRunning
        });
    } catch (error) {
        console.error('获取容器状态失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { action, projectPath } = await request.json();

        const isDockerAvailable = await dockerManager.isDockerAvailable();
        const isDaemonRunning = await dockerManager.isDockerDaemonRunning();

        if (!isDockerAvailable) {
            return NextResponse.json({
                success: false,
                error: 'Docker 未安装，请安装 Docker Desktop'
            }, { status: 500 });
        }

        if (!isDaemonRunning) {
            return NextResponse.json({
                success: false,
                error: 'Docker 守护进程未运行，请启动 Docker Desktop 应用程序'
            }, { status: 500 });
        }

        switch (action) {
            case 'create':
                // 创建容器（镜像构建现在在 createContainer 内部处理）
                const sandboxPath = projectPath || path.join(process.cwd(), 'sandbox');
                const containerId = await dockerManager.createContainer(sandboxPath);

                return NextResponse.json({
                    success: true,
                    message: '容器创建成功',
                    containerId,
                    sandboxPath
                });

            case 'start':
                await dockerManager.startDevServer();
                return NextResponse.json({
                    success: true,
                    message: '开发服务器启动中...'
                });

            case 'stop':
                await dockerManager.stopContainer();
                return NextResponse.json({
                    success: true,
                    message: '容器已停止'
                });

            case 'remove':
                await dockerManager.removeContainer();
                return NextResponse.json({
                    success: true,
                    message: '容器已删除'
                });

            case 'cleanup':
                await dockerManager.cleanup();
                return NextResponse.json({
                    success: true,
                    message: '清理完成'
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: '不支持的操作'
                }, { status: 400 });
        }
    } catch (error) {
        console.error('容器操作失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 