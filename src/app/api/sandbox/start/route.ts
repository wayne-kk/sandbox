import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
    try {
        console.log('🚀 启动 Sandbox 开发服务器...');

        // 检查 sandbox 目录是否存在
        const fs = await import('fs/promises');
        const path = await import('path');
        const sandboxPath = path.join(process.cwd(), 'sandbox');

        try {
            await fs.access(sandboxPath);
        } catch (error) {
            return NextResponse.json({
                success: false,
                error: 'Sandbox 目录不存在'
            }, { status: 404 });
        }

        // 检查是否已经运行 - 检查多个可能的端口
        const possiblePorts = [3103, 3001, 3000];
        let runningPort = null;

        for (const port of possiblePorts) {
            try {
                const { stdout } = await execAsync(`lsof -ti:${port}`);
                if (stdout.trim()) {
                    runningPort = port;
                    console.log(`✅ Sandbox 服务器已在运行 (端口 ${port})`);
                    break;
                }
            } catch (error) {
                // 端口未被占用，继续检查下一个
            }
        }

        if (runningPort) {
            return NextResponse.json({
                success: true,
                message: `Sandbox 服务器已在运行`,
                port: runningPort,
                url: `http://localhost:${runningPort}`
            });
        }

        // 启动开发服务器
        const startCommand = 'cd sandbox && npm run dev';

        // 在后台启动服务器
        const childProcess = exec(startCommand, (error, stdout, stderr) => {
            if (error) {
                console.error('启动 Sandbox 服务器失败:', error);
                return;
            }
            console.log('Sandbox 服务器输出:', stdout);
            if (stderr) {
                console.error('Sandbox 服务器错误:', stderr);
            }
        });

        // 等待服务器启动
        console.log('⏳ 等待 Sandbox 服务器启动...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        return NextResponse.json({
            success: true,
            message: 'Sandbox 服务器启动中...',
            port: 3103, // sandbox项目配置的端口
            url: 'http://localhost:3103'
        });

    } catch (error) {
        console.error('启动 Sandbox 服务器失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '启动失败'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        // 检查服务器状态 - 检查多个可能的端口
        const possiblePorts = [3103, 3001, 3000];

        for (const port of possiblePorts) {
            try {
                const { stdout } = await execAsync(`lsof -ti:${port}`);
                if (stdout.trim()) {
                    return NextResponse.json({
                        success: true,
                        running: true,
                        port: port,
                        url: `http://localhost:${port}`,
                        message: `Sandbox 服务器正在运行 (端口 ${port})`
                    });
                }
            } catch (error) {
                // 端口未被占用，继续检查下一个
            }
        }

        // 没有找到运行中的服务器
        return NextResponse.json({
            success: true,
            running: false,
            port: 3103, // 默认端口
            message: 'Sandbox 服务器未运行'
        });
    } catch (error) {
        // 如果lsof命令失败，假设服务器未运行
        return NextResponse.json({
            success: true,
            running: false,
            port: 3103,
            message: '无法检查服务器状态，假设未运行'
        });
    }
}
