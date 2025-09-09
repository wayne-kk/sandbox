import { NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { DockerManager } from "@/lib/docker";

const execAsync = promisify(exec);
const dockerManager = new DockerManager();

export async function POST(request: Request) {
    try {
        const { type = "nextjs" } = await request.json();
        const sandboxDir = path.join(process.cwd(), "sandbox");

        // 确保沙箱目录存在
        await fs.mkdir(sandboxDir, { recursive: true });

        console.log(`运行项目: ${type} in ${sandboxDir}`);

        // 检查并创建基础文件
        const packageJsonPath = path.join(sandboxDir, "package.json");
        try {
            await fs.access(packageJsonPath);
        } catch {
            // 如果 package.json 不存在，创建一个基础的
            const defaultPackageJson = {
                name: "sandbox-project",
                version: "0.1.0",
                private: true,
                scripts: {
                    dev: "next dev -p 3001",
                    build: "next build",
                    start: "next start -p 3001",
                    lint: "next lint"
                },
                dependencies: {
                    next: "^14.0.0",
                    react: "^18",
                    "react-dom": "^18",
                },
                devDependencies: {
                    "@types/node": "^20",
                    "@types/react": "^18",
                    "@types/react-dom": "^18",
                    eslint: "^8",
                    "eslint-config-next": "^14.0.0",
                    typescript: "^5"
                }
            };

            await fs.writeFile(
                packageJsonPath,
                JSON.stringify(defaultPackageJson, null, 2)
            );
        }

        // 创建必要的配置文件
        await createConfigFiles(sandboxDir);

        let command = "";
        let timeout = 30000; // 30 seconds timeout

        // 检查 Docker 是否可用
        const useDocker = await dockerManager.isDockerAvailable();

        if (useDocker) {
            // 使用 Docker 运行
            try {
                // 如果容器未运行，先创建容器
                const isRunning = await dockerManager.isContainerRunning();
                if (!isRunning) {
                    await dockerManager.createContainer(sandboxDir);
                }

                // 在容器中安装依赖
                console.log('📦 在Docker容器中安装依赖...');
                const installResult = await dockerManager.execInContainer('npm install -g pnpm && pnpm install --silent');

                if (installResult.exitCode !== 0) {
                    console.error('Docker容器中依赖安装失败:', installResult.stderr);
                    throw new Error(`依赖安装失败: ${installResult.stderr}`);
                }

                console.log('✅ Docker容器中依赖安装完成');

                // 启动开发服务器
                console.log('🚀 在Docker容器中启动开发服务器...');
                const devResult = await dockerManager.execInContainer('pnpm run dev &');

                if (devResult.exitCode !== 0) {
                    console.error('Docker容器中启动开发服务器失败:', devResult.stderr);
                    throw new Error(`启动开发服务器失败: ${devResult.stderr}`);
                }

                return NextResponse.json({
                    success: true,
                    output: `项目类型: ${type}\n运行方式: Docker 容器\n\n✅ 项目启动中...\n📍 请稍等片刻，然后访问: http://localhost:3001\n💡 如果页面未加载，请点击"检查状态"按钮\n`,
                });

            } catch (dockerError: any) {
                console.error("Docker运行失败，切换到本地运行:", dockerError);
                // Docker失败，切换到本地运行
                command = `cd "${sandboxDir}" && npm install -g pnpm && pnpm install --silent`;
            }
        } else {
            // 本地运行
            if (type === "nextjs") {
                command = `cd "${sandboxDir}" && npm install -g pnpm && pnpm install --silent`;
            } else if (type === "react") {
                command = `cd "${sandboxDir}" && npm install -g pnpm && pnpm install --silent`;
            }
        }

        if (!command) {
            return NextResponse.json(
                { error: "不支持的项目类型" },
                { status: 400 }
            );
        }

        console.log("Running command:", command);

        // 先安装依赖
        console.log('📦 在本地环境中安装依赖...');
        const { stdout: installOutput, stderr: installError } = await execAsync(command, {
            timeout: 120000, // 增加到2分钟超时
            cwd: sandboxDir,
        });

        if (installError && !installOutput) {
            console.error('本地依赖安装失败:', installError);
            throw new Error(`依赖安装失败: ${installError}`);
        }

        console.log('✅ 本地依赖安装完成');

        // 在后台启动开发服务器
        if (!useDocker) {
            // 启动开发服务器但不等待它完成
            const child = spawn('npm', ['run', 'dev'], {
                cwd: sandboxDir,
                detached: true,
                stdio: 'ignore'
            });

            child.unref(); // 让父进程不等待子进程

            // 等待一下让服务器启动
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const output = installOutput || installError || "依赖安装完成";

        return NextResponse.json({
            success: true,
            output: `项目类型: ${type}\n运行方式: ${useDocker ? 'Docker 容器' : '本地进程'}\n\n${output}\n\n✅ 项目启动中...\n📍 请稍等片刻，然后访问: http://localhost:3001\n💡 如果页面未加载，请点击"检查状态"按钮\n`,
        });

    } catch (error: any) {
        console.error("运行项目失败:", error);

        let errorMessage = error.message;

        // 处理常见错误
        if (errorMessage.includes("docker")) {
            errorMessage = "Docker 未安装或未启动，已切换到本地运行模式。";
        } else if (errorMessage.includes("EADDRINUSE")) {
            errorMessage = "端口 3001 被占用，请关闭其他服务后重试。";
        } else if (errorMessage.includes("npm")) {
            errorMessage = `NPM 错误: ${errorMessage}`;
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            output: `❌ 运行失败: ${errorMessage}\n\n💡 提示:\n- 确保项目已初始化\n- 检查项目文件是否正确\n- 确保端口 3001 未被占用\n- 尝试重新运行项目\n`,
        }, { status: 500 });
    }
}

async function createConfigFiles(sandboxDir: string) {
    // 创建 next.config.js
    const nextConfigPath = path.join(sandboxDir, "next.config.js");
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
`;

    // 创建 tsconfig.json
    const tsconfigPath = path.join(sandboxDir, "tsconfig.json");
    const tsconfig = {
        compilerOptions: {
            target: "es5",
            lib: ["dom", "dom.iterable", "es6"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [
                {
                    name: "next"
                }
            ],
            paths: {
                "@/*": ["./*"]
            }
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"]
    };

    // 创建 tailwind.config.js
    const tailwindConfigPath = path.join(sandboxDir, "tailwind.config.js");
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
`;

    // 创建 postcss.config.js
    const postcssConfigPath = path.join(sandboxDir, "postcss.config.js");
    const postcssConfig = `module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
}
`;

    try {
        await fs.writeFile(nextConfigPath, nextConfig);
        await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
        await fs.writeFile(tailwindConfigPath, tailwindConfig);
        await fs.writeFile(postcssConfigPath, postcssConfig);
    } catch (error) {
        console.error("创建配置文件失败:", error);
    }
} 