import { NextResponse } from 'next/server';
import { EnhancedDockerManager } from '@/lib/enhanced-docker';

const dockerManager = new EnhancedDockerManager();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        switch (action) {
            case 'list':
                // 列出所有相关进程
                const result = await dockerManager.executeCommand(
                    'ps aux | grep -E "(yarn|node|next)" | grep -v grep'
                );

                const processes = result.output
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        const parts = line.trim().split(/\s+/);
                        return {
                            pid: parts[1],
                            command: parts.slice(10).join(' '),
                            cpu: parts[2],
                            mem: parts[3]
                        };
                    });

                return NextResponse.json({
                    success: true,
                    processes
                });

            case 'kill-dev':
                // 杀死所有开发服务器进程
                const killResult = await dockerManager.executeCommand(
                    'pkill -f "yarn dev\\|npm run dev\\|next dev" || killall -9 yarn node || echo "No processes found"'
                );

                return NextResponse.json({
                    success: true,
                    message: '开发服务器进程已清理',
                    output: killResult.output
                });

            case 'status':
                // 检查端口占用情况
                const portResult = await dockerManager.executeCommand(
                    'netstat -tulpn | grep -E ":300[0-9]" || echo "No ports occupied"'
                );

                return NextResponse.json({
                    success: true,
                    ports: portResult.output
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: '不支持的操作'
                }, { status: 400 });
        }
    } catch (error) {
        console.error('进程管理API错误:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { action, pid } = await request.json();

        switch (action) {
            case 'kill':
                if (!pid) {
                    return NextResponse.json({
                        success: false,
                        error: 'PID不能为空'
                    }, { status: 400 });
                }

                const killResult = await dockerManager.executeCommand(`kill -9 ${pid}`);

                return NextResponse.json({
                    success: killResult.success,
                    message: killResult.success ? `进程 ${pid} 已终止` : '终止进程失败',
                    output: killResult.output || killResult.error
                });

            case 'cleanup':
                // 全面清理
                const commands = [
                    'pkill -f "yarn dev" || true',
                    'pkill -f "npm run dev" || true',
                    'pkill -f "next dev" || true',
                    'killall -9 yarn || true',
                    'killall -9 node || true',
                    'rm -f /tmp/dev-output.log || true',
                    'echo "Cleanup completed"'
                ];

                const cleanupResults = [];
                for (const cmd of commands) {
                    const result = await dockerManager.executeCommand(cmd);
                    cleanupResults.push({
                        command: cmd,
                        success: result.success,
                        output: result.output || result.error
                    });
                }

                return NextResponse.json({
                    success: true,
                    message: '全面清理完成',
                    results: cleanupResults
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: '不支持的操作'
                }, { status: 400 });
        }
    } catch (error) {
        console.error('进程管理POST错误:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 