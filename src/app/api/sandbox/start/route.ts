import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PORTS, findRunningSandboxPort, findAvailableSandboxPort, getSandboxUrl, checkPortAvailable } from '@/lib/constants/ports';

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

        // 强制使用3100端口，如果被占用就kill掉
        console.log('🔍 检查3100端口是否被占用...');
        const isPort3100InUse = !(await checkPortAvailable(3100));

        if (isPort3100InUse) {
            console.log('⚠️ 3100端口被占用，正在kill掉占用进程...');
            try {
                // 查找占用3100端口的进程并kill掉
                const { stdout: pidOutput } = await execAsync('lsof -ti:3100');
                if (pidOutput.trim()) {
                    const pids = pidOutput.trim().split('\n');
                    for (const pid of pids) {
                        console.log(`🔪 正在kill进程 ${pid}...`);
                        await execAsync(`kill -9 ${pid}`);
                    }
                    console.log('✅ 已kill掉占用3100端口的进程');
                    // 等待一下让端口释放
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.warn('kill进程时出错:', error);
            }
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
                // 智能安装：检查是否需要增量更新
                const checkCommand = 'cd sandbox && if [ -d "node_modules" ]; then if [ "package.json" -nt "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then echo "update"; else echo "skip"; fi; else echo "install"; fi';
                const { stdout: checkResult } = await execAsync(checkCommand);
                const action = checkResult.trim();

                let installCommand = '';
                if (action === 'install') {
                    console.log('首次安装依赖...');
                    installCommand = 'cd sandbox && npm config set registry https://registry.npmmirror.com/ && npm install --silent --prefer-offline --no-audit --no-fund';
                } else if (action === 'update') {
                    console.log('检测到依赖变化，增量更新...');
                    installCommand = 'cd sandbox && npm config set registry https://registry.npmmirror.com/ && npm ci --silent --prefer-offline --no-audit --no-fund';
                } else {
                    console.log('依赖已是最新，跳过安装');
                    installCommand = 'echo "依赖已是最新"';
                }

                const { stdout: installOutput, stderr: installError } = await execAsync(installCommand, {
                    timeout: 180000 // 3分钟超时
                });

                if (installError && !installOutput && action !== 'skip') {
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

        // 启动开发服务器 - 强制使用3100端口
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
            port: 3100, // 强制使用3100端口
            url: getSandboxUrl(3100)
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
        // 只检查3100端口
        const isPort3100InUse = !(await checkPortAvailable(3100));

        if (isPort3100InUse) {
            return NextResponse.json({
                success: true,
                running: true,
                port: 3100,
                url: getSandboxUrl(3100),
                message: `Sandbox 服务器正在运行 (端口 3100)`
            });
        }

        // 3100端口没有被占用
        return NextResponse.json({
            success: true,
            running: false,
            port: 3100,
            message: 'Sandbox 服务器未运行'
        });
    } catch (error) {
        // 如果检查失败，假设服务器未运行
        return NextResponse.json({
            success: true,
            running: false,
            port: 3100,
            message: '无法检查服务器状态，假设未运行'
        });
    }
}
