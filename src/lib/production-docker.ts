import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ProductionContainer {
    userId: string;
    containerId: string;
    containerName: string;
    internalPort: number;  // 容器内部端口（固定3001）
    status: 'creating' | 'running' | 'stopped' | 'error';
    createdAt: Date;
    lastActiveAt: Date;
    projectPath: string;
    proxyPath: string;     // 代理路径 /sandbox/user-123/
}

export class ProductionDockerManager {
    private containers: Map<string, ProductionContainer> = new Map();
    private nginxConfigPath = '/tmp/nginx-sandbox.conf';
    private maxContainers = 1000; // 大幅提升容器数量限制
    private baseImageName = 'node:18-alpine';
    private sandboxBasePath = '/tmp/sandboxes';

    constructor() {
        this.initializeNginxConfig();
        this.startCleanupScheduler();
    }

    /**
     * 创建用户容器（无端口映射）
     */
    async createUserContainer(userId: string): Promise<ProductionContainer> {
        const existingContainer = this.containers.get(userId);
        if (existingContainer?.status === 'running') {
            return existingContainer;
        }

        const containerName = `sandbox-${userId}`;
        const projectPath = path.join(this.sandboxBasePath, userId);
        const proxyPath = `/sandbox/${userId}/`;

        await fs.mkdir(projectPath, { recursive: true });

        console.log(`🚀 创建容器: ${containerName} (内部端口)`);

        try {
            // 创建容器 - 注意：没有 -p 端口映射！
            const { stdout } = await execAsync(`
                docker run -d \\
                  --name ${containerName} \\
                  --memory=512m \\
                  --cpus=0.5 \\
                  -v "${projectPath}:/app" \\
                  -w /app \\
                  --network=sandbox-network \\
                  --label="sandbox=true" \\
                  --label="user=${userId}" \\
                  ${this.baseImageName} \\
                  tail -f /dev/null
            `);

            const containerId = stdout.trim();

            const container: ProductionContainer = {
                userId,
                containerId,
                containerName,
                internalPort: 3001, // 所有容器都用相同的内部端口
                status: 'running',
                createdAt: new Date(),
                lastActiveAt: new Date(),
                projectPath,
                proxyPath
            };

            this.containers.set(userId, container);

            // 更新 Nginx 配置
            await this.updateNginxConfig();

            console.log(`✅ 容器创建成功: ${containerId}`);
            return container;

        } catch (error) {
            console.error(`容器创建失败: ${error}`);
            throw error;
        }
    }

    /**
     * 初始化 Nginx 配置
     */
    private async initializeNginxConfig(): Promise<void> {
        try {
            // 创建 Docker 网络（如果不存在）
            await execAsync('docker network create sandbox-network').catch(() => {
                // 网络可能已存在，忽略错误
            });

            // 基础 Nginx 配置
            const baseConfig = `
events {
    worker_connections 1024;
}

http {
    upstream app {
        server host.docker.internal:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # 主应用
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # 沙箱代理配置将在这里动态添加
        # SANDBOX_ROUTES_PLACEHOLDER
    }
}`;

            await fs.writeFile(this.nginxConfigPath, baseConfig);
            console.log('📝 Nginx 基础配置已创建');

        } catch (error) {
            console.error('初始化 Nginx 配置失败:', error);
        }
    }

    /**
     * 动态更新 Nginx 配置
     */
    private async updateNginxConfig(): Promise<void> {
        try {
            let config = await fs.readFile(this.nginxConfigPath, 'utf-8');

            // 生成所有沙箱的代理规则
            let sandboxRoutes = '';
            for (const container of this.containers.values()) {
                if (container.status === 'running') {
                    sandboxRoutes += `
        # 用户 ${container.userId} 的沙箱
        location ${container.proxyPath} {
            proxy_pass http://${container.containerName}:${container.internalPort}/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # 重写路径，移除 /sandbox/user-xxx 前缀
            rewrite ^${container.proxyPath}(.*)$ /$1 break;
        }
`;
                }
            }

            // 替换占位符
            config = config.replace('        # SANDBOX_ROUTES_PLACEHOLDER', sandboxRoutes);

            await fs.writeFile(this.nginxConfigPath, config);

            // 重新加载 Nginx（如果运行中）
            await this.reloadNginx();

            console.log('🔄 Nginx 配置已更新');

        } catch (error) {
            console.error('更新 Nginx 配置失败:', error);
        }
    }

    /**
     * 重新加载 Nginx
     */
    private async reloadNginx(): Promise<void> {
        try {
            // 检查是否有 Nginx 容器运行
            const { stdout } = await execAsync('docker ps --filter "name=nginx-proxy" --format "{{.ID}}"');

            if (stdout.trim()) {
                // 重新加载配置
                await execAsync('docker exec nginx-proxy nginx -s reload');
                console.log('🔄 Nginx 已重新加载');
            } else {
                // 启动 Nginx 容器
                await this.startNginxProxy();
            }
        } catch (error) {
            console.warn('重新加载 Nginx 失败:', error);
        }
    }

    /**
     * 启动 Nginx 代理容器
     */
    private async startNginxProxy(): Promise<void> {
        try {
            await execAsync(`
                docker run -d \\
                  --name nginx-proxy \\
                  --network=sandbox-network \\
                  -p 80:80 \\
                  -v ${this.nginxConfigPath}:/etc/nginx/nginx.conf:ro \\
                  --restart=unless-stopped \\
                  nginx:alpine
            `);

            console.log('🚀 Nginx 代理容器已启动');
        } catch (error) {
            console.error('启动 Nginx 代理失败:', error);
        }
    }

    /**
     * 获取用户预览URL
     */
    getUserPreviewUrl(userId: string, baseUrl: string = 'http://localhost'): string | null {
        const container = this.containers.get(userId);
        if (!container || container.status !== 'running') {
            return null;
        }

        return `${baseUrl}${container.proxyPath}`;
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
     * 移除用户容器
     */
    async removeUserContainer(userId: string): Promise<void> {
        const container = this.containers.get(userId);
        if (!container) return;

        try {
            await execAsync(`docker stop ${container.containerName}`);
            await execAsync(`docker rm ${container.containerName}`);

            this.containers.delete(userId);

            // 更新 Nginx 配置
            await this.updateNginxConfig();

            console.log(`✅ 用户 ${userId} 的容器已移除`);
        } catch (error) {
            console.error(`移除容器失败: ${error}`);
            this.containers.delete(userId);
        }
    }

    /**
     * 获取所有容器
     */
    getAllContainers(): ProductionContainer[] {
        return Array.from(this.containers.values());
    }

    /**
     * 启动定时清理
     */
    private startCleanupScheduler(): void {
        setInterval(() => {
            this.cleanupInactiveContainers();
        }, 30 * 60 * 1000);
    }

    private async cleanupInactiveContainers(): Promise<void> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        for (const [userId, container] of this.containers.entries()) {
            if (container.lastActiveAt < oneHourAgo) {
                await this.removeUserContainer(userId);
            }
        }
    }
}

// 使用示例：
// 用户A访问: http://yourdomain.com/sandbox/user-abc123/
// 用户B访问: http://yourdomain.com/sandbox/user-def456/
// 主应用: http://yourdomain.com/ 