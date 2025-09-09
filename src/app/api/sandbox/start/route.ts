import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PORTS, findRunningSandboxPort, findAvailableSandboxPort, getSandboxUrl } from '@/lib/constants/ports';

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

        // 检查是否已经运行 - 检查 3100-3199 范围
        const runningPort = await findRunningSandboxPort();

        if (runningPort) {
            console.log(`✅ Sandbox 服务器已在运行 (端口 ${runningPort})`);
            return NextResponse.json({
                success: true,
                message: `Sandbox 服务器已在运行`,
                port: runningPort,
                url: getSandboxUrl(runningPort)
            });
        }

        // 先检查是否需要安装依赖
        const packageJsonPath = path.join(sandboxPath, 'package.json');
        const nodeModulesPath = path.join(sandboxPath, 'node_modules');

        let needsInstall = false;
        try {
            await fs.access(packageJsonPath);
            try {
                await fs.access(nodeModulesPath);
            } catch {
                needsInstall = true;
            }
        } catch {
            return NextResponse.json({
                success: false,
                error: 'package.json 文件不存在，请先初始化项目'
            }, { status: 400 });
        }

        // 如果需要安装依赖，先执行 npm install
        if (needsInstall) {
            console.log('📦 检测到缺少 node_modules，正在安装依赖...');
            try {
                const { stdout: installOutput, stderr: installError } = await execAsync('cd sandbox && npm install --silent', {
                    timeout: 120000 // 2分钟超时
                });

                if (installError && !installOutput) {
                    console.error('依赖安装失败:', installError);
                    return NextResponse.json({
                        success: false,
                        error: `依赖安装失败: ${installError}`
                    }, { status: 500 });
                }

                console.log('✅ 依赖安装完成');
            } catch (installError: any) {
                console.error('依赖安装过程出错:', installError);
                return NextResponse.json({
                    success: false,
                    error: `依赖安装失败: ${installError.message}`
                }, { status: 500 });
            }
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
            port: PORTS.SANDBOX_DEFAULT, // sandbox项目配置的端口
            url: getSandboxUrl(PORTS.SANDBOX_DEFAULT)
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
        // 检查服务器状态 - 检查 3100-3199 范围
        const runningPort = await findRunningSandboxPort();

        if (runningPort) {
            return NextResponse.json({
                success: true,
                running: true,
                port: runningPort,
                url: getSandboxUrl(runningPort),
                message: `Sandbox 服务器正在运行 (端口 ${runningPort})`
            });
        }

        // 没有找到运行中的服务器
        return NextResponse.json({
            success: true,
            running: false,
            port: PORTS.SANDBOX_DEFAULT, // 默认端口
            message: 'Sandbox 服务器未运行'
        });
    } catch (error) {
        // 如果lsof命令失败，假设服务器未运行
        return NextResponse.json({
            success: true,
            running: false,
            port: PORTS.SANDBOX_DEFAULT,
            message: '无法检查服务器状态，假设未运行'
        });
    }
}
