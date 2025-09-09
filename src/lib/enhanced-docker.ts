import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

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
    duration: number;
}

export interface CommandExecution {
    id: string;
    command: string;
    startTime: Date;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    process?: any;
    output: Array<{
        type: 'stdout' | 'stderr' | 'system';
        data: string;
        timestamp: Date;
    }>;
}

export class EnhancedDockerManager extends EventEmitter {
    private containerName = 'nextjs-sandbox';
    private imageName = 'nextjs-sandbox:latest';
    private sandboxPort = 3001;
    private containerWorkDir = '/app';
    private runningCommands = new Map<string, CommandExecution>();
    private commandHistory: string[] = [];

    constructor() {
        super();
        this.setMaxListeners(50); // 增加监听器限制
    }

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
     * 检查 Docker 守护进程是否运行
     */
    async isDockerDaemonRunning(): Promise<boolean> {
        try {
            await execAsync('docker ps', { timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 获取容器状态
     */
    async getContainerStatus(): Promise<{
        isRunning: boolean;
        info: ContainerInfo | null;
        dockerAvailable: boolean;
        daemonRunning: boolean;
    }> {
        const dockerAvailable = await this.isDockerAvailable();
        const daemonRunning = await this.isDockerDaemonRunning();

        if (!dockerAvailable || !daemonRunning) {
            return {
                isRunning: false,
                info: null,
                dockerAvailable,
                daemonRunning
            };
        }

        const info = await this.getContainerInfo();
        const isRunning = info ? info.status.includes('Up') : false;

        return {
            isRunning,
            info,
            dockerAvailable,
            daemonRunning
        };
    }

    /**
     * 获取容器信息
     */
    async getContainerInfo(): Promise<ContainerInfo | null> {
        try {
            const { stdout } = await execAsync(
                `docker ps -a --filter name=${this.containerName} --format "{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"`,
                { timeout: 5000 }
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
     * 强制清理容器
     */
    async forceCleanupContainer(): Promise<void> {
        try {
            await execAsync(`docker rm -f ${this.containerName} 2>/dev/null || true`, { timeout: 15000 });
            this.emit('container-cleaned');
        } catch (error) {
            console.log('容器清理时出现问题:', error instanceof Error ? error.message : error);
        }
    }

    /**
     * 创建容器
     */
    async createContainer(projectPath: string): Promise<string> {
        // 检查 Docker 环境
        const status = await this.getContainerStatus();
        if (!status.dockerAvailable) {
            throw new Error('Docker 未安装。请安装 Docker Desktop 并重启应用。');
        }
        if (!status.daemonRunning) {
            throw new Error('Docker 守护进程未运行。请启动 Docker Desktop 应用程序。');
        }

        // 强制清理现有容器
        await this.forceCleanupContainer();

        // 确保项目目录存在
        await fs.mkdir(projectPath, { recursive: true });

        // 尝试使用node:22-alpine镜像
        let imageToUse = 'node:22-alpine';

        try {
            // 检查镜像是否存在，不存在则拉取
            try {
                await execAsync(`docker image inspect ${imageToUse}`, { timeout: 5000 });
            } catch {
                this.emit('pulling-image', imageToUse);
                await execAsync(`docker pull ${imageToUse}`, { timeout: 120000 });
                this.emit('image-pulled', imageToUse);
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
            `, { timeout: 30000 });

            const containerId = stdout.trim();
            this.emit('container-created', { containerId, image: imageToUse });
            return containerId;
        } catch (error) {
            this.emit('container-create-failed', error);
            throw new Error(`容器创建失败: ${error instanceof Error ? error.message : error}`);
        }
    }

    /**
     * 增强的命令执行（带取消功能）
     */
    async executeCommand(
        command: string,
        options: {
            timeout?: number;
            cwd?: string;
            onOutput?: (type: 'stdout' | 'stderr', data: string) => void;
            onProgress?: (progress: { phase: string; percentage?: number }) => void;
        } = {}
    ): Promise<{ success: boolean; output: string; error?: string; executionId: string }> {

        const executionId = Math.random().toString(36).substr(2, 9);
        const { timeout = 60000, onOutput, onProgress } = options;

        // 记录命令历史
        this.commandHistory.unshift(command);
        if (this.commandHistory.length > 50) {
            this.commandHistory = this.commandHistory.slice(0, 50);
        }

        const execution: CommandExecution = {
            id: executionId,
            command,
            startTime: new Date(),
            status: 'running',
            output: []
        };

        this.runningCommands.set(executionId, execution);
        this.emit('command-started', { executionId, command });

        try {
            const result = await new Promise<ExecResult>((resolve, reject) => {
                const startTime = Date.now();
                let stdout = '';
                let stderr = '';

                onProgress?.({ phase: '准备执行命令' });

                // 处理长时间运行的命令
                const isLongRunning = command.includes('yarn dev') || command.includes('npm run dev') || command.includes('next dev');

                let actualCommand = command;
                if (isLongRunning) {
                    // 长时间运行的命令在后台运行
                    actualCommand = `nohup ${command} > /tmp/dev-output.log 2>&1 & echo "Started in background with PID: $!" && sleep 2 && ps aux | grep -E "(yarn|next)" | grep -v grep | head -3`;
                }

                const dockerProcess = spawn('docker', [
                    'exec',
                    '-i',
                    this.containerName,
                    'sh',
                    '-c',
                    actualCommand
                ]);

                execution.process = dockerProcess;

                // 设置超时
                const timeoutHandle = setTimeout(() => {
                    dockerProcess.kill('SIGTERM');
                    setTimeout(() => {
                        if (!dockerProcess.killed) {
                            dockerProcess.kill('SIGKILL');
                        }
                    }, 5000);
                    reject(new Error(`命令执行超时 (${timeout}ms)`));
                }, timeout);

                dockerProcess.stdout.on('data', (data) => {
                    const output = data.toString();
                    stdout += output;

                    execution.output.push({
                        type: 'stdout',
                        data: output,
                        timestamp: new Date()
                    });

                    onOutput?.('stdout', output);
                    this.emit('command-output', { executionId, type: 'stdout', data: output });

                    // 检测进度信息
                    if (output.includes('npm install')) {
                        onProgress?.({ phase: '安装依赖中', percentage: 50 });
                    } else if (output.includes('compiled successfully')) {
                        onProgress?.({ phase: '编译成功', percentage: 100 });
                    }
                });

                dockerProcess.stderr.on('data', (data) => {
                    const output = data.toString();
                    stderr += output;

                    execution.output.push({
                        type: 'stderr',
                        data: output,
                        timestamp: new Date()
                    });

                    onOutput?.('stderr', output);
                    this.emit('command-output', { executionId, type: 'stderr', data: output });
                });

                dockerProcess.on('close', (code) => {
                    clearTimeout(timeoutHandle);
                    const duration = Date.now() - startTime;

                    execution.status = code === 0 ? 'completed' : 'failed';
                    execution.output.push({
                        type: 'system',
                        data: `命令执行完成，退出码: ${code}，耗时: ${duration}ms`,
                        timestamp: new Date()
                    });

                    onProgress?.({ phase: '执行完成', percentage: 100 });
                    this.emit('command-finished', { executionId, exitCode: code, duration });

                    resolve({
                        stdout,
                        stderr,
                        exitCode: code || 0,
                        duration
                    });
                });

                dockerProcess.on('error', (error) => {
                    clearTimeout(timeoutHandle);
                    execution.status = 'failed';
                    this.emit('command-error', { executionId, error: error.message });
                    reject(error);
                });
            });

            return {
                success: result.exitCode === 0,
                output: result.stdout,
                error: result.stderr,
                executionId
            };

        } catch (error) {
            execution.status = 'failed';
            this.emit('command-error', { executionId, error: error instanceof Error ? error.message : String(error) });

            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : String(error),
                executionId
            };
        } finally {
            // 延迟清理执行记录
            setTimeout(() => {
                this.runningCommands.delete(executionId);
            }, 30000);
        }
    }

    /**
     * 取消命令执行
     */
    async cancelCommand(executionId: string): Promise<boolean> {
        const execution = this.runningCommands.get(executionId);
        if (!execution || execution.status !== 'running') {
            return false;
        }

        try {
            if (execution.process) {
                execution.process.kill('SIGTERM');
                setTimeout(() => {
                    if (execution.process && !execution.process.killed) {
                        execution.process.kill('SIGKILL');
                    }
                }, 3000);
            }

            execution.status = 'cancelled';
            execution.output.push({
                type: 'system',
                data: '命令已被用户取消',
                timestamp: new Date()
            });

            this.emit('command-cancelled', { executionId });
            return true;
        } catch (error) {
            console.error('取消命令失败:', error);
            return false;
        }
    }

    /**
     * 获取运行中的命令
     */
    getRunningCommands(): CommandExecution[] {
        return Array.from(this.runningCommands.values()).filter(cmd => cmd.status === 'running');
    }

    /**
     * 获取命令历史
     */
    getCommandHistory(): string[] {
        return [...this.commandHistory];
    }

    /**
     * 获取常用命令
     */
    getCommonCommands() {
        return [
            {
                name: '📦 安装依赖',
                command: 'npm install',
                description: '安装 package.json 中的所有依赖',
                category: 'setup'
            },
            {
                name: '🚀 启动开发',
                command: 'npm run dev',
                description: '启动 Next.js 开发服务器',
                category: 'dev'
            },
            {
                name: '🔨 构建项目',
                command: 'npm run build',
                description: '构建生产版本',
                category: 'build'
            },
            {
                name: '📋 查看文件',
                command: 'ls -la',
                description: '列出当前目录文件',
                category: 'info'
            },
            {
                name: '🔍 查看端口',
                command: 'netstat -tulpn | grep :3001',
                description: '检查端口 3001 使用情况',
                category: 'info'
            },
            {
                name: '⚡ 查看进程',
                command: 'ps aux | grep node',
                description: '查看 Node.js 进程',
                category: 'info'
            },
            {
                name: '🧹 清理缓存',
                command: 'npm cache clean --force',
                description: '清理 npm 缓存',
                category: 'maintenance'
            },
            {
                name: '📊 磁盘使用',
                command: 'df -h',
                description: '查看磁盘使用情况',
                category: 'info'
            }
        ];
    }

    /**
     * 健康检查
     */
    async healthCheck(): Promise<{
        docker: boolean;
        daemon: boolean;
        container: boolean;
        network: boolean;
    }> {
        const docker = await this.isDockerAvailable();
        const daemon = docker ? await this.isDockerDaemonRunning() : false;

        let container = false;
        let network = false;

        if (daemon) {
            const status = await this.getContainerStatus();
            container = status.isRunning;

            if (container) {
                try {
                    await execAsync(`docker exec ${this.containerName} echo "health-check"`, { timeout: 5000 });
                    network = true;
                } catch {
                    network = false;
                }
            }
        }

        return { docker, daemon, container, network };
    }

    /**
     * 清理所有资源
     */
    async cleanup(): Promise<void> {
        // 取消所有运行中的命令
        for (const [id] of this.runningCommands) {
            await this.cancelCommand(id);
        }

        // 清理容器
        await this.forceCleanupContainer();

        // 清理事件监听器
        this.removeAllListeners();
    }
} 