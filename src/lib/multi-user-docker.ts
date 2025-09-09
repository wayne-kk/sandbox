import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface UserContainer {
    userId: string;
    containerId: string;
    containerName: string;
    port: number;
    status: 'creating' | 'running' | 'stopped' | 'error';
    createdAt: Date;
    lastActiveAt: Date;
    projectPath: string;
}

export interface ContainerResources {
    memory: string;      // 例如 "512m"
    cpus: string;        // 例如 "0.5"
    diskQuota: string;   // 例如 "1g"
}

export class MultiUserDockerManager {
    private containers: Map<string, UserContainer> = new Map();
    private portCounter = 3001;
    private maxContainers = 50; // 最大容器数量
    private baseImageName = 'node:22-alpine';
    private sandboxBasePath = '/tmp/sandboxes'; // 沙箱基础路径

    constructor() {
        this.initializeSandboxDirectory();
        this.startCleanupScheduler();
    }

    /**
     * 初始化沙箱目录
     */
    private async initializeSandboxDirectory(): Promise<void> {
        try {
            await fs.mkdir(this.sandboxBasePath, { recursive: true });
            console.log(`📁 沙箱目录已创建: ${this.sandboxBasePath}`);
        } catch (error) {
            console.error('创建沙箱目录失败:', error);
        }
    }

    /**
     * 为用户创建容器
     */
    async createUserContainer(
        userId: string,
        resources: ContainerResources = {
            memory: '512m',
            cpus: '0.5',
            diskQuota: '1g'
        }
    ): Promise<UserContainer> {

        // 检查用户是否已有容器
        const existingContainer = this.containers.get(userId);
        if (existingContainer) {
            if (existingContainer.status === 'running') {
                console.log(`用户 ${userId} 的容器已存在且正在运行`);
                return existingContainer;
            } else {
                // 清理旧容器
                await this.removeUserContainer(userId);
            }
        }

        // 检查容器数量限制
        if (this.containers.size >= this.maxContainers) {
            await this.cleanupInactiveContainers();
            if (this.containers.size >= this.maxContainers) {
                throw new Error('服务器容器数量已达上限，请稍后再试');
            }
        }

        const containerName = `user-${userId}-sandbox`;
        const port = this.getNextAvailablePort();
        const projectPath = path.join(this.sandboxBasePath, userId);

        // 创建用户项目目录
        await fs.mkdir(projectPath, { recursive: true });

        console.log(`🚀 为用户 ${userId} 创建容器: ${containerName}`);

        try {
            // 创建容器记录
            const container: UserContainer = {
                userId,
                containerId: '', // 待填充
                containerName,
                port,
                status: 'creating',
                createdAt: new Date(),
                lastActiveAt: new Date(),
                projectPath
            };

            this.containers.set(userId, container);

            // 创建并启动 Docker 容器
            const { stdout } = await execAsync(`
                docker run -d \\
                  --name ${containerName} \\
                  --memory=${resources.memory} \\
                  --cpus=${resources.cpus} \\
                  -p ${port}:3001 \\
                  -v "${projectPath}:/app" \\
                  -w /app \\
                  --restart=unless-stopped \\
                  --label="sandbox=true" \\
                  --label="user=${userId}" \\
                  ${this.baseImageName} \\
                  tail -f /dev/null
            `);

            const containerId = stdout.trim();

            // 更新容器信息
            container.containerId = containerId;
            container.status = 'running';

            console.log(`✅ 容器创建成功: ${containerId}`);

            // 初始化容器环境
            await this.initializeContainerEnvironment(containerId);

            return container;

        } catch (error) {
            // 清理失败的容器记录
            this.containers.delete(userId);
            await this.forceRemoveContainer(containerName);

            console.error(`容器创建失败: ${error}`);
            throw new Error(`为用户 ${userId} 创建容器失败: ${error instanceof Error ? error.message : error}`);
        }
    }

    /**
     * 获取用户容器信息
     */
    getUserContainer(userId: string): UserContainer | null {
        return this.containers.get(userId) || null;
    }

    /**
     * 获取所有容器状态
     */
    getAllContainers(): UserContainer[] {
        return Array.from(this.containers.values());
    }

    /**
     * 更新用户最后活跃时间
     */
    updateUserActivity(userId: string): void {
        const container = this.containers.get(userId);
        if (container) {
            container.lastActiveAt = new Date();
        }
    }

    /**
     * 移除用户容器
     */
    async removeUserContainer(userId: string): Promise<void> {
        const container = this.containers.get(userId);
        if (!container) {
            console.log(`用户 ${userId} 没有活跃容器`);
            return;
        }

        console.log(`🗑️ 移除用户 ${userId} 的容器: ${container.containerName}`);

        try {
            // 停止并删除容器
            await this.forceRemoveContainer(container.containerName);

            // 清理项目文件（可选，根据需求决定）
            // await fs.rm(container.projectPath, { recursive: true, force: true });

            // 从内存中移除记录
            this.containers.delete(userId);

            console.log(`✅ 用户 ${userId} 的容器已移除`);
        } catch (error) {
            console.error(`移除容器失败: ${error}`);
            // 即使删除失败，也从内存中移除记录
            this.containers.delete(userId);
        }
    }

    /**
     * 在容器中执行命令
     */
    async execInUserContainer(userId: string, command: string): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
    }> {
        const container = this.containers.get(userId);
        if (!container || container.status !== 'running') {
            throw new Error(`用户 ${userId} 没有运行中的容器`);
        }

        this.updateUserActivity(userId);

        try {
            const { stdout, stderr } = await execAsync(
                `docker exec ${container.containerName} sh -c "${command.replace(/"/g, '\\"')}"`
            );

            return {
                stdout: stdout || '',
                stderr: stderr || '',
                exitCode: 0
            };
        } catch (error: any) {
            return {
                stdout: '',
                stderr: error.message || '命令执行失败',
                exitCode: error.code || 1
            };
        }
    }

    /**
     * 获取容器资源使用情况
     */
    async getContainerStats(userId: string): Promise<{
        cpuUsage: string;
        memoryUsage: string;
        networkIO: string;
    } | null> {
        const container = this.containers.get(userId);
        if (!container) return null;

        try {
            const { stdout } = await execAsync(
                `docker stats ${container.containerName} --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.NetIO}}"`
            );

            const [cpuUsage, memoryUsage, networkIO] = stdout.trim().split(',');

            return {
                cpuUsage,
                memoryUsage,
                networkIO
            };
        } catch (error) {
            console.error('获取容器状态失败:', error);
            return null;
        }
    }

    /**
     * 清理非活跃容器（超过1小时未使用）
     */
    private async cleanupInactiveContainers(): Promise<void> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const inactiveUsers: string[] = [];

        for (const [userId, container] of this.containers.entries()) {
            if (container.lastActiveAt < oneHourAgo) {
                inactiveUsers.push(userId);
            }
        }

        console.log(`🧹 清理 ${inactiveUsers.length} 个非活跃容器`);

        for (const userId of inactiveUsers) {
            await this.removeUserContainer(userId);
        }
    }

    /**
     * 启动定时清理任务
     */
    private startCleanupScheduler(): void {
        // 每30分钟清理一次非活跃容器
        setInterval(() => {
            this.cleanupInactiveContainers().catch(console.error);
        }, 30 * 60 * 1000);

        console.log('🕒 容器清理调度器已启动');
    }

    /**
     * 获取下一个可用端口
     */
    private getNextAvailablePort(): number {
        const usedPorts = new Set(
            Array.from(this.containers.values()).map(c => c.port)
        );

        while (usedPorts.has(this.portCounter)) {
            this.portCounter++;
            if (this.portCounter > 4000) {
                this.portCounter = 3001; // 重置端口范围
            }
        }

        return this.portCounter++;
    }

    /**
     * 强制删除容器
     */
    private async forceRemoveContainer(containerName: string): Promise<void> {
        try {
            await execAsync(`docker stop ${containerName}`, { timeout: 10000 });
        } catch (error) {
            console.warn(`停止容器失败: ${error}`);
        }

        try {
            await execAsync(`docker rm -f ${containerName}`);
        } catch (error) {
            console.warn(`删除容器失败: ${error}`);
        }
    }

    /**
     * 初始化容器环境
     */
    private async initializeContainerEnvironment(containerId: string): Promise<void> {
        try {
            // 安装基础工具
            await execAsync(`docker exec ${containerId} sh -c "apk add --no-cache git curl"`);
            console.log('✅ 容器环境初始化完成');
        } catch (error) {
            console.warn('容器环境初始化失败:', error);
        }
    }

    /**
     * 获取服务器统计信息
     */
    async getServerStats(): Promise<{
        totalContainers: number;
        runningContainers: number;
        totalUsers: number;
        systemResources: {
            totalMemory: string;
            usedMemory: string;
            cpuCount: number;
        };
    }> {
        const containers = this.getAllContainers();
        const runningContainers = containers.filter(c => c.status === 'running');

        let systemResources;
        try {
            const { stdout } = await execAsync('docker system df');
            systemResources = {
                totalMemory: 'N/A',
                usedMemory: 'N/A',
                cpuCount: require('os').cpus().length
            };
        } catch (error) {
            systemResources = {
                totalMemory: 'N/A',
                usedMemory: 'N/A',
                cpuCount: require('os').cpus().length
            };
        }

        return {
            totalContainers: containers.length,
            runningContainers: runningContainers.length,
            totalUsers: containers.length,
            systemResources
        };
    }
} 