import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
    try {
        // 尝试停止正在运行的 Next.js 进程
        const commands = [
            // 杀死占用 3001 端口的进程
            "lsof -ti:3001 | xargs kill -9",
            // 杀死所有 Next.js 进程
            "pkill -f 'next dev'",
            // 杀死所有 npm 进程
            "pkill -f 'npm run dev'"
        ];

        let output = "正在停止项目...\n";

        for (const command of commands) {
            try {
                const { stdout, stderr } = await execAsync(command);
                if (stdout || stderr) {
                    output += `执行命令: ${command}\n`;
                    output += stdout || stderr;
                }
            } catch (error: any) {
                // 忽略错误，因为进程可能不存在
                output += `命令执行完成: ${command}\n`;
            }
        }

        // 额外尝试停止 Docker 容器（如果使用 Docker）
        try {
            const { stdout } = await execAsync("docker ps --format '{{.Names}}' | grep sandbox");
            if (stdout) {
                const containerNames = stdout.trim().split('\n');
                for (const name of containerNames) {
                    await execAsync(`docker stop ${name}`);
                    output += `停止 Docker 容器: ${name}\n`;
                }
            }
        } catch (error) {
            // Docker 不可用或没有容器在运行
        }

        output += "\n✅ 项目停止命令已执行\n";
        output += "💡 如果项目仍在运行，请手动刷新页面或重启终端\n";

        return NextResponse.json({
            success: true,
            output: output
        });

    } catch (error: any) {
        console.error("停止项目失败:", error);
        return NextResponse.json({
            success: false,
            error: `停止项目失败: ${error.message}`,
            output: `❌ 停止失败: ${error.message}\n\n💡 提示: 可以手动重启终端或刷新页面\n`
        }, { status: 500 });
    }
} 