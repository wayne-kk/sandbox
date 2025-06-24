import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ContainerInfo {
    id: string;
    name: string;
    status: string;
    ports: string[];
}

export interface ExecResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export class DockerManager {
    private containerName = 'nextjs-sandbox';
    private imageName = 'nextjs-sandbox:latest';
    private sandboxPort = 3001;
    private containerWorkDir = '/app';

    /**
     * 检查 Docker 是否可用
     */
    async isDockerAvailable(): Promise<boolean> {
        try {
            await execAsync('docker --version');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 构建沙箱镜像
     */
    async buildSandboxImage(): Promise<boolean> {
        console.log('构建沙箱 Docker 镜像...');

        try {
            // 创建 Dockerfile
            const dockerfile = `
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装基础工具
RUN apk add --no-cache git curl

# 暴露端口
EXPOSE 3001

# 默认命令
CMD ["tail", "-f", "/dev/null"]
`;

            const dockerfilePath = path.join(process.cwd(), 'sandbox.dockerfile');
            await fs.writeFile(dockerfilePath, dockerfile.trim());

            // 构建镜像
            const { stdout, stderr } = await execAsync(
                `docker build -f sandbox.dockerfile -t ${this.imageName} .`,
                { timeout: 60000 } // 60秒超时
            );

            console.log('镜像构建完成:', stdout);
            if (stderr) console.warn('构建警告:', stderr);
            return true;
        } catch (error) {
            console.error('镜像构建失败:', error);
            return false;
        }
    }

    /**
     * 创建并启动沙箱容器
     */
    async createContainer(projectPath: string): Promise<string> {
        // 停止现有容器
        await this.stopContainer();
        await this.removeContainer();

        console.log('创建新的沙箱容器...');

        // 确保项目目录存在
        await fs.mkdir(projectPath, { recursive: true });

        // 尝试构建自定义镜像，失败则使用标准镜像
        const buildSuccess = await this.buildSandboxImage();
        let imageToUse = this.imageName;

        if (!buildSuccess) {
            console.log('镜像构建失败，使用标准 Node.js 镜像');
            imageToUse = 'node:18-alpine';
        }

        try {
            // 尝试拉取镜像（如果本地没有）
            if (imageToUse === 'node:18-alpine') {
                try {
                    console.log('检查并拉取 Node.js 镜像...');
                    await execAsync(`docker pull ${imageToUse}`, { timeout: 60000 });
                    console.log('Node.js 镜像拉取成功');
                } catch (pullError) {
                    console.error('无法拉取 Node.js 镜像:', pullError);

                    // 检查是否有其他可用的 Node 镜像
                    try {
                        const { stdout: images } = await execAsync('docker images --format "{{.Repository}}:{{.Tag}}" | grep node');
                        const availableImages = images.trim().split('\n').filter(img => img.trim());

                        if (availableImages.length > 0) {
                            imageToUse = availableImages[0];
                            console.log(`使用现有镜像: ${imageToUse}`);
                        } else {
                            throw new Error('没有可用的 Node.js 镜像，且无法从网络下载。请检查网络连接或手动拉取 node:18-alpine 镜像。');
                        }
                    } catch {
                        throw new Error('没有可用的 Node.js 镜像，且无法从网络下载。请检查网络连接或手动拉取 node:18-alpine 镜像。');
                    }
                }
            }

            // 创建并启动容器
            const { stdout } = await execAsync(`
        docker run -d \
          --name ${this.containerName} \
          -p ${this.sandboxPort}:3001 \
          -v "${projectPath}:${this.containerWorkDir}" \
          -w ${this.containerWorkDir} \
          ${imageToUse} \
          tail -f /dev/null
      `);

            const containerId = stdout.trim();
            console.log('容器创建成功:', containerId);
            return containerId;
        } catch (error) {
            console.error('容器创建失败:', error);
            throw new Error(`容器创建失败: ${error instanceof Error ? error.message : error}`);
        }
    }

    /**
     * 在容器中执行命令
     */
    async execInContainer(command: string): Promise<ExecResult> {
        try {
            console.log(`在容器中执行命令: ${command}`);

            const { stdout, stderr } = await execAsync(
                `docker exec ${this.containerName} sh -c "${command}"`
            );

            return {
                stdout: stdout || '',
                stderr: stderr || '',
                exitCode: 0
            };
        } catch (error: any) {
            console.error('命令执行失败:', error);
            return {
                stdout: '',
                stderr: error.message || '命令执行失败',
                exitCode: error.code || 1
            };
        }
    }

    /**
     * 流式执行命令（实时输出）
     */
    async execInContainerStream(
        command: string,
        onData: (data: string) => void,
        onError: (error: string) => void,
        onClose: (code: number) => void
    ): Promise<void> {
        return new Promise((resolve) => {
            const process = spawn('docker', [
                'exec',
                '-i',
                this.containerName,
                'sh',
                '-c',
                command
            ]);

            process.stdout.on('data', (data) => {
                onData(data.toString());
            });

            process.stderr.on('data', (data) => {
                onError(data.toString());
            });

            process.on('close', (code) => {
                onClose(code || 0);
                resolve();
            });

            process.on('error', (error) => {
                onError(error.message);
                onClose(1);
                resolve();
            });
        });
    }

    /**
     * 获取容器信息
     */
    async getContainerInfo(): Promise<ContainerInfo | null> {
        try {
            const { stdout } = await execAsync(
                `docker ps -a --filter name=${this.containerName} --format "{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"`
            );

            if (!stdout.trim()) {
                return null;
            }

            const [id, name, status, ports] = stdout.trim().split('\t');
            return {
                id,
                name,
                status,
                ports: ports ? ports.split(',').map(p => p.trim()) : []
            };
        } catch {
            return null;
        }
    }

    /**
     * 停止容器
     */
    async stopContainer(): Promise<void> {
        try {
            await execAsync(`docker stop ${this.containerName}`);
            console.log('容器已停止');
        } catch (error) {
            // 容器可能不存在或已停止，忽略错误
        }
    }

    /**
     * 删除容器
     */
    async removeContainer(): Promise<void> {
        try {
            await execAsync(`docker rm ${this.containerName}`);
            console.log('容器已删除');
        } catch (error) {
            // 容器可能不存在，忽略错误
        }
    }

    /**
     * 检查容器是否运行
     */
    async isContainerRunning(): Promise<boolean> {
        const info = await this.getContainerInfo();
        return info ? info.status.includes('Up') : false;
    }

    /**
     * 启动项目开发服务器
     */
    async startDevServer(): Promise<ExecResult> {
        return this.execInContainer('npm run dev');
    }

    /**
     * 安装依赖
     */
    async installDependencies(): Promise<ExecResult> {
        return this.execInContainer('npm install');
    }

    /**
     * 构建项目
     */
    async buildProject(): Promise<ExecResult> {
        return this.execInContainer('npm run build');
    }

    /**
     * 获取项目文件列表
     */
    async listFiles(directory: string = '.'): Promise<string[]> {
        const result = await this.execInContainer(`find ${directory} -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" | head -50`);
        return result.stdout.split('\n').filter(line => line.trim());
    }

    /**
     * 读取容器中的文件
     */
    async readFileFromContainer(filePath: string): Promise<string> {
        const result = await this.execInContainer(`cat "${filePath}"`);
        if (result.exitCode === 0) {
            return result.stdout;
        }
        throw new Error(`读取文件失败: ${result.stderr}`);
    }

    /**
     * 写入文件到容器
     */
    async writeFileToContainer(filePath: string, content: string): Promise<void> {
        // 转义特殊字符
        const escapedContent = content.replace(/'/g, "'\"'\"'").replace(/\$/g, '\\$');
        const result = await this.execInContainer(`echo '${escapedContent}' > "${filePath}"`);

        if (result.exitCode !== 0) {
            throw new Error(`写入文件失败: ${result.stderr}`);
        }
    }

    /**
     * 清理所有相关资源
     */
    async cleanup(): Promise<void> {
        await this.stopContainer();
        await this.removeContainer();

        try {
            await execAsync(`docker rmi ${this.imageName}`);
            console.log('镜像已删除');
        } catch {
            // 镜像可能不存在，忽略错误
        }
    }
}

// 默认的运行配置
export const DEFAULT_CONFIGS = {
    nextjs: {
        image: "node:18",
        command: 'bash -c "npm install --silent && npm run dev"',
        ports: ["3001:3001"],
        environment: {
            NODE_ENV: "development"
        }
    },
    react: {
        image: "node:18",
        command: 'bash -c "npm install --silent && npm start"',
        ports: ["3001:3000"],
        environment: {
            NODE_ENV: "development"
        }
    }
}; 