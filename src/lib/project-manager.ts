import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { ProjectWebSocketManager } from './project-websocket';
import { getSandboxUrl } from './constants/ports';

import { GitHubDownloader } from './github-downloader';
import net from 'net';

export interface ProjectStatus {
    id: string;
    status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    port?: number;
    pid?: number;
    url?: string;
    logs: string[];
    framework: string;
    startedAt?: Date;
    error?: string;
    buildLogs: string[];
}

interface ProjectInstance {
    id: string;
    childProcess?: ChildProcess;
    status: ProjectStatus;
    workingDir: string;
    isUserProject: boolean;
    userId?: string;
}

export class ProjectManager {
    private static instance: ProjectManager;
    private projects: Map<string, ProjectInstance> = new Map();
    private wsManager: ProjectWebSocketManager;

    private githubDownloader: GitHubDownloader;
    private readonly tempDir = path.join(process.cwd(), 'temp', 'projects');
    private cleanupScheduler: NodeJS.Timeout | null = null;
    private pendingCleanups: Map<string, { path: string; scheduledAt: Date }> = new Map();

    private constructor() {
        this.wsManager = ProjectWebSocketManager.getInstance();

        this.githubDownloader = GitHubDownloader.getInstance();
        this.ensureTempDir();
        this.startCleanupScheduler();
    }

    static getInstance(): ProjectManager {
        if (!ProjectManager.instance) {
            ProjectManager.instance = new ProjectManager();
        }
        return ProjectManager.instance;
    }

    private async ensureTempDir() {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('创建临时目录失败:', error);
        }
    }

    async startProject(projectId: string): Promise<ProjectStatus> {
        try {
            let instance = this.projects.get(projectId);

            if (instance && instance.status.status === 'running') {
                return instance.status;
            }

            // 停止已存在的项目实例
            if (instance) {
                await this.stopProject(projectId);
            }

            let workingDir: string;

            let framework = 'react';

            // 使用默认sandbox目录
            workingDir = path.join(process.cwd(), 'sandbox');

            const status: ProjectStatus = {
                id: projectId,
                status: 'starting',
                logs: [],
                framework,
                buildLogs: [],
                startedAt: new Date()
            };

            instance = {
                id: projectId,
                status,
                workingDir,
                isUserProject: false
            };

            this.projects.set(projectId, instance);

            // 推送初始状态
            this.wsManager.onProjectStatusChange(projectId, status.status, status.url);

            // 启动开发服务器
            await this.startDevServer(instance);

            return instance.status;
        } catch (error) {
            console.error('启动项目失败:', error);
            const errorStatus: ProjectStatus = {
                id: projectId,
                status: 'error',
                logs: [],
                framework: 'react',
                error: error instanceof Error ? error.message : '启动失败',
                buildLogs: [],
                startedAt: new Date()
            };

            if (this.projects.has(projectId)) {
                this.projects.get(projectId)!.status = errorStatus;
            }

            this.wsManager.onProjectError(projectId, errorStatus.error || '启动失败');

            return errorStatus;
        }
    }



    /**
     * 安装项目依赖
     */
    private async installDependencies(workingDir: string): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log(`📦 开始安装依赖: ${workingDir}`);

            const installProcess = spawn('npm', ['install', '--silent'], {
                cwd: workingDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';

            installProcess.stdout?.on('data', (data) => {
                output += data.toString();
            });

            installProcess.stderr?.on('data', (data) => {
                output += data.toString();
            });

            installProcess.on('exit', (code) => {
                if (code === 0) {
                    console.log(`✅ 依赖安装成功: ${workingDir}`);
                    resolve();
                } else {
                    console.error(`❌ 依赖安装失败: ${workingDir}`, output);
                    reject(new Error(`依赖安装失败，退出代码: ${code}`));
                }
            });

            installProcess.on('error', (error) => {
                console.error(`❌ 依赖安装进程错误: ${workingDir}`, error);
                reject(error);
            });

            // 5分钟超时
            setTimeout(() => {
                installProcess.kill('SIGTERM');
                reject(new Error('依赖安装超时'));
            }, 300000);
        });
    }

    /**
     * 检查端口是否可用
     */
    private async isPortAvailable(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const server = net.createServer();

            server.listen(port, () => {
                server.close(() => resolve(true));
            });

            server.on('error', () => resolve(false));
        });
    }

    /**
     * 查找可用端口
     */
    private async findAvailablePort(startPort: number = 3100): Promise<number> {
        console.log(`🔍 开始查找可用端口，起始端口: ${startPort}`);

        for (let port = startPort; port < startPort + 100; port++) {
            const isAvailable = await this.isPortAvailable(port);
            console.log(`🔍 检查端口 ${port}: ${isAvailable ? '可用' : '被占用'}`);

            if (isAvailable) {
                console.log(`✅ 找到可用端口: ${port}`);
                return port;
            }
        }
        throw new Error(`找不到可用端口，已检查 ${startPort} 到 ${startPort + 99}`);
    }

    /**
     * 修改package.json中的dev脚本以使用指定端口
     */
    private async updatePackageJsonPort(workingDir: string, port: number): Promise<void> {
        const packageJsonPath = path.join(workingDir, 'package.json');

        try {
            const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageContent);

            console.log(`📝 更新package.json端口: ${port}`);
            console.log(`原始dev脚本: ${packageJson.scripts?.dev}`);

            // 更新dev脚本，移除硬编码的端口，使用环境变量
            if (packageJson.scripts && packageJson.scripts.dev) {
                // 移除现有的端口参数，然后添加新的端口
                let devScript = packageJson.scripts.dev
                    .replace(/-p\s+\d+/g, '') // 移除现有的 -p 端口参数
                    .replace(/--port\s+\d+/g, '') // 移除现有的 --port 端口参数
                    .replace(/\s+/g, ' ') // 清理多余空格
                    .trim();

                // 添加新的端口参数
                packageJson.scripts.dev = `${devScript} --port ${port}`;

                console.log(`更新后dev脚本: ${packageJson.scripts.dev}`);
            } else {
                console.warn('package.json中没有找到dev脚本');
            }

            await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log(`✅ 已更新package.json端口为: ${port}`);
        } catch (error) {
            console.error('更新package.json端口失败:', error);
            throw error; // 将错误抛出，让上层处理
        }
    }

    /**
     * 通过HTTP请求检测服务是否启动
     */
    private async checkServiceReady(port: number, maxRetries: number = 10): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await fetch(`http://localhost:${port}`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(2000) // 2秒超时
                });

                if (response.ok) {
                    console.log(`✅ HTTP检测成功: 端口 ${port} 服务已启动`);
                    return true;
                }
            } catch (error) {
                // 忽略错误，继续重试
            }

            // 等待1秒后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`❌ HTTP检测失败: 端口 ${port} 服务未响应`);
        return false;
    }

    private async startDevServer(instance: ProjectInstance): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                // 查找可用端口
                const port = await this.findAvailablePort();

                // 更新package.json中的端口配置
                await this.updatePackageJsonPort(instance.workingDir, port);

                console.log(`🚀 启动项目 ${instance.id}，使用端口: ${port}`);

                const childProcess = spawn('npm', ['run', 'dev'], {
                    cwd: instance.workingDir,
                    env: {
                        ...process.env,
                        PORT: port.toString(),
                        FORCE_COLOR: '1'
                    },
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                instance.childProcess = childProcess;
                instance.status.pid = childProcess.pid;
                instance.status.port = port;

                let hasStarted = false;
                let outputBuffer = '';

                const handleOutput = (data: Buffer) => {
                    const output = data.toString();
                    outputBuffer += output;

                    // 添加到构建日志
                    instance.status.buildLogs.push(output);
                    instance.status.logs.push(output);

                    // 推送日志更新
                    this.wsManager.onProjectLogsUpdate(instance.id, instance.status.logs);

                    // 调试日志
                    console.log(`📝 项目 ${instance.id} 输出:`, output.trim());

                    // 检查服务器是否已启动 - 更全面的检测
                    if (!hasStarted && (
                        output.includes('Local:') ||
                        output.includes('localhost') ||
                        output.includes('Network:') ||
                        output.includes('ready on') ||
                        output.includes('Ready on') ||
                        output.includes('started server on') ||
                        output.includes('Server ready') ||
                        output.includes(`http://localhost:${port}`) ||
                        output.includes(`http://127.0.0.1:${port}`) ||
                        // Next.js 15 的新输出格式
                        output.includes('- Local:') ||
                        output.includes('- Network:') ||
                        output.includes('✓ Ready') ||
                        output.includes('○ Ready') ||
                        // 通用的web服务器启动检测
                        (output.includes('port') && output.includes(port.toString()) && output.includes('ready')) ||
                        (output.includes('listening') && output.includes(port.toString())) ||
                        (output.includes('started') && output.includes(port.toString()))
                    )) {
                        hasStarted = true;
                        instance.status.status = 'running';
                        instance.status.url = getSandboxUrl(port);

                        // 推送状态更新
                        this.wsManager.onProjectStatusChange(instance.id, instance.status.status, instance.status.url);

                        console.log(`✅ 项目 ${instance.id} 启动成功，端口: ${port}, URL: ${instance.status.url}`);
                        resolve();
                    }

                    // 检查是否有端口占用错误
                    if (output.includes('EADDRINUSE') || output.includes('address already in use')) {
                        console.error(`❌ 端口 ${port} 被占用`);
                        instance.status.status = 'error';
                        instance.status.error = `端口 ${port} 被占用，请停止其他使用该端口的服务`;
                        this.wsManager.onProjectError(instance.id, instance.status.error);

                        // 立即关闭进程
                        if (childProcess && !childProcess.killed) {
                            childProcess.kill('SIGTERM');
                        }

                        if (!hasStarted) {
                            reject(new Error(`端口 ${port} 被占用，请停止其他使用该端口的服务`));
                        }
                        return; // 避免继续处理其他输出
                    }

                    // 检查编译错误
                    if (output.includes('Failed to compile') || output.includes('Module not found')) {
                        console.warn(`⚠️ 项目 ${instance.id} 编译错误:`, output);
                        // 编译错误不算启动失败，只是警告
                    }
                };

                childProcess.stdout?.on('data', handleOutput);
                childProcess.stderr?.on('data', handleOutput);

                childProcess.on('error', (error: Error) => {
                    console.error(`项目 ${instance.id} 进程错误:`, error);
                    instance.status.status = 'error';
                    instance.status.error = error.message;

                    this.wsManager.onProjectError(instance.id, error.message);

                    if (!hasStarted) {
                        reject(error);
                    }
                });

                childProcess.on('exit', (code: number | null, signal: string | null) => {
                    console.log(`项目 ${instance.id} 进程退出，代码: ${code}, 信号: ${signal}`);
                    instance.status.status = code === 0 ? 'stopped' : 'error';
                    if (code !== 0) {
                        instance.status.error = `进程异常退出，代码: ${code}`;
                    }

                    this.wsManager.onProjectStatusChange(instance.id, instance.status.status);

                    // 清理临时目录
                    if (instance.isUserProject) {
                        this.cleanupWorkspace(instance.workingDir);
                    }
                });

                // 备用检测：如果20秒后还没有通过日志检测，尝试HTTP检测
                setTimeout(async () => {
                    if (!hasStarted) {
                        console.log(`⏰ 项目 ${instance.id} 20秒后开始HTTP检测...`);
                        const isReady = await this.checkServiceReady(port, 5);

                        if (isReady && !hasStarted) {
                            hasStarted = true;
                            instance.status.status = 'running';
                            instance.status.url = getSandboxUrl(port);

                            // 推送状态更新
                            this.wsManager.onProjectStatusChange(instance.id, instance.status.status, instance.status.url);

                            console.log(`✅ 项目 ${instance.id} HTTP检测启动成功，端口: ${port}, URL: ${instance.status.url}`);
                            resolve();
                        }
                    }
                }, 20000);

                // 60秒超时（增加超时时间，因为npm install可能需要时间）
                setTimeout(() => {
                    if (!hasStarted) {
                        console.error(`❌ 项目 ${instance.id} 启动超时`);
                        instance.status.status = 'error';
                        instance.status.error = '启动超时';
                        this.wsManager.onProjectError(instance.id, '启动超时');
                        reject(new Error('启动超时'));
                    }
                }, 60000);

            } catch (error) {
                console.error(`启动开发服务器失败:`, error);
                reject(error);
            }
        });
    }

    async stopProject(projectId: string): Promise<void> {
        const instance = this.projects.get(projectId);
        if (!instance) {
            return;
        }

        console.log(`🛑 停止项目: ${projectId}`);

        instance.status.status = 'stopping';
        this.wsManager.onProjectStatusChange(projectId, instance.status.status);

        if (instance.childProcess) {
            instance.childProcess.kill('SIGTERM');

            // 强制杀死进程
            setTimeout(() => {
                if (instance.childProcess && !instance.childProcess.killed) {
                    instance.childProcess.kill('SIGKILL');
                }
            }, 5000);
        }

        instance.status.status = 'stopped';
        this.wsManager.onProjectStatusChange(projectId, instance.status.status);

        // 清理临时目录
        if (instance.isUserProject) {
            await this.cleanupWorkspace(instance.workingDir);
        }

        this.projects.delete(projectId);
    }

    private async cleanupWorkspace(workspacePath: string): Promise<void> {
        try {
            if (workspacePath.includes(this.tempDir)) {
                // 延迟清理：30分钟后删除，以便用户快速重启项目
                const workspaceId = path.basename(workspacePath);
                this.pendingCleanups.set(workspaceId, {
                    path: workspacePath,
                    scheduledAt: new Date()
                });

                console.log(`⏰ 工作空间已安排清理: ${workspacePath} (30分钟后删除)`);
            }
        } catch (error) {
            console.warn('安排工作空间清理失败:', error);
        }
    }

    getProjectStatus(projectId: string): ProjectStatus | null {
        const instance = this.projects.get(projectId);
        return instance ? instance.status : null;
    }

    getAllProjects(): ProjectStatus[] {
        return Array.from(this.projects.values()).map(instance => instance.status);
    }

    async saveProjectFiles(projectId: string, files: { [filePath: string]: string }): Promise<void> {
        let instance = this.projects.get(projectId);
        let workingDir: string;
        if (instance) {
            // 项目已存在，使用现有实例
            workingDir = instance.workingDir;
        } else {
            // 项目不存在，直接使用默认 sandbox 目录，无需启动
            workingDir = path.join(process.cwd(), 'sandbox');
            console.log(`📁 项目 ${projectId} 未启动，直接写入 sandbox 目录: ${workingDir}`);
        }

        // 直接写入文件
            for (const [filePath, content] of Object.entries(files)) {
                const fullPath = path.join(workingDir, filePath);
                const dirPath = path.dirname(fullPath);

                try {
                    await fs.mkdir(dirPath, { recursive: true });
                    await fs.writeFile(fullPath, content, 'utf-8');
                    console.log(`✅ 文件已保存: ${fullPath}`);
                } catch (error) {
                console.error(`❌ 写入文件失败 ${filePath}:`, error);
                throw error;
            }
        }



        console.log(`💾 项目文件已保存到 ${workingDir}: ${projectId}`);
    }

    /**
     * 从GitHub下载项目到sandbox
     */
    async downloadFromGitHub(githubUrl: string): Promise<{
        success: boolean;
        message: string;
        projectInfo?: any;
        error?: string;
    }> {
        try {
            console.log(`📥 开始从GitHub下载项目: ${githubUrl}`);

            // 停止所有正在运行的项目
            const runningProjects = Array.from(this.projects.keys());
            await Promise.all(runningProjects.map(id => this.stopProject(id)));

            const sandboxPath = path.join(process.cwd(), 'sandbox');

            // 下载GitHub仓库
            await this.githubDownloader.downloadRepository(githubUrl, {
                targetPath: sandboxPath,
                cleanup: true
            });

            // 验证项目
            const validation = await this.githubDownloader.validateNodeProject(sandboxPath);

            if (!validation.isValid) {
                return {
                    success: false,
                    message: '下载的项目不是有效的Node.js项目',
                    error: validation.errors.join(', ')
                };
            }

            // 获取项目信息
            const projectInfo = await this.githubDownloader.getProjectInfo(sandboxPath);

            // 安装依赖
            console.log(`📦 开始安装项目依赖...`);
            await this.installDependencies(sandboxPath);

            console.log(`✅ GitHub项目设置完成: ${projectInfo.name}`);

            return {
                success: true,
                message: '项目从GitHub下载并设置成功',
                projectInfo: {
                    ...projectInfo,
                    validation
                }
            };

        } catch (error) {
            console.error('从GitHub下载项目失败:', error);
            return {
                success: false,
                message: '下载项目失败',
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }

    /**
     * 清理所有项目
     */
    async cleanup(): Promise<void> {
        const projectIds = Array.from(this.projects.keys());
        await Promise.all(projectIds.map(id => this.stopProject(id)));

        // 停止清理调度器
        if (this.cleanupScheduler) {
            clearInterval(this.cleanupScheduler);
            this.cleanupScheduler = null;
        }

        // 立即清理所有待删除的工作空间
        for (const [workspaceId, info] of this.pendingCleanups.entries()) {
            try {
                await fs.rm(info.path, { recursive: true, force: true });
                console.log(`🗑️ 强制清理工作空间: ${workspaceId}`);
            } catch (error) {
                console.warn(`强制清理工作空间失败: ${workspaceId}`, error);
            }
        }
        this.pendingCleanups.clear();

        // 清理整个临时目录
        try {
            await fs.rm(this.tempDir, { recursive: true, force: true });
            console.log(`🧹 临时目录已清理: ${this.tempDir}`);
        } catch (error) {
            console.warn('清理临时目录失败:', error);
        }
    }

    /**
     * 启动清理调度器，每10分钟检查一次过期的工作空间
     */
    private startCleanupScheduler(): void {
        this.cleanupScheduler = setInterval(() => {
            this.cleanupExpiredWorkspaces();
        }, 10 * 60 * 1000); // 每10分钟执行一次

        console.log('🕒 工作空间清理调度器已启动');
    }

    /**
     * 清理过期的工作空间（30分钟后删除）
     */
    private async cleanupExpiredWorkspaces(): Promise<void> {
        const now = new Date();
        const expiredThreshold = 30 * 60 * 1000; // 30分钟

        for (const [workspaceId, info] of this.pendingCleanups.entries()) {
            const age = now.getTime() - info.scheduledAt.getTime();

            if (age >= expiredThreshold) {
                try {
                    await fs.rm(info.path, { recursive: true, force: true });
                    console.log(`🧹 已清理过期工作空间: ${workspaceId} (${Math.round(age / 1000 / 60)}分钟前)`);
                    this.pendingCleanups.delete(workspaceId);
                } catch (error) {
                    console.warn(`清理过期工作空间失败: ${workspaceId}`, error);
                }
            }
        }
    }
} 