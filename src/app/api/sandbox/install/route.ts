import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function POST() {
    try {
        console.log('📦 手动触发 Sandbox 依赖安装...');

        // 检查 sandbox 目录是否存在
        const sandboxPath = path.join(process.cwd(), 'sandbox');

        try {
            await fs.access(sandboxPath);
        } catch (error) {
            return NextResponse.json({
                success: false,
                error: 'Sandbox 目录不存在，请先初始化项目'
            }, { status: 404 });
        }

        // 检查 package.json 是否存在
        const packageJsonPath = path.join(sandboxPath, 'package.json');
        try {
            await fs.access(packageJsonPath);
        } catch (error) {
            return NextResponse.json({
                success: false,
                error: 'package.json 文件不存在，请先初始化项目'
            }, { status: 400 });
        }

        // 执行 npm install
        console.log('🔄 开始安装依赖...');
        const { stdout: installOutput, stderr: installError } = await execAsync('cd sandbox && npm install --silent', {
            timeout: 180000 // 3分钟超时
        });

        if (installError && !installOutput) {
            console.error('依赖安装失败:', installError);
            return NextResponse.json({
                success: false,
                error: `依赖安装失败: ${installError}`,
                output: installError
            }, { status: 500 });
        }

        console.log('✅ 依赖安装完成');

        return NextResponse.json({
            success: true,
            message: '依赖安装完成',
            output: installOutput || '依赖安装成功，没有输出信息'
        });

    } catch (error: any) {
        console.error('依赖安装过程出错:', error);

        let errorMessage = error.message;
        if (error.code === 'TIMEOUT') {
            errorMessage = '依赖安装超时，请检查网络连接或重试';
        } else if (error.message.includes('ENOENT')) {
            errorMessage = 'npm 命令未找到，请确保 Node.js 已正确安装';
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            output: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        // 检查 sandbox 目录和依赖状态
        const sandboxPath = path.join(process.cwd(), 'sandbox');
        const packageJsonPath = path.join(sandboxPath, 'package.json');
        const nodeModulesPath = path.join(sandboxPath, 'node_modules');

        let status = {
            sandboxExists: false,
            packageJsonExists: false,
            nodeModulesExists: false,
            needsInstall: false
        };

        try {
            await fs.access(sandboxPath);
            status.sandboxExists = true;

            try {
                await fs.access(packageJsonPath);
                status.packageJsonExists = true;

                try {
                    await fs.access(nodeModulesPath);
                    status.nodeModulesExists = true;
                } catch {
                    status.needsInstall = true;
                }
            } catch {
                // package.json 不存在
            }
        } catch {
            // sandbox 目录不存在
        }

        return NextResponse.json({
            success: true,
            status,
            message: status.needsInstall ? '需要安装依赖' : '依赖已安装'
        });

    } catch (error: any) {
        console.error('检查依赖状态失败:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
