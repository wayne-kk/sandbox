import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface IframeContainer {
    userId: string;
    containerId: string;
    containerName: string;
    status: 'creating' | 'running' | 'stopped' | 'error';
    createdAt: Date;
    lastActiveAt: Date;
    projectPath: string;
    previewPath: string;      // /preview/user-123/
    iframeUrl: string;        // http://localhost:3000/preview/user-123/
}

export class IframeOptimizedDockerManager {
    private containers: Map<string, IframeContainer> = new Map();
    private nginxConfigPath = '/tmp/nginx-iframe.conf';
    private maxContainers = 500; // 针对iframe优化的限制
    private baseImageName = 'node:22-alpine';
    private sandboxBasePath = '/tmp/sandboxes';
    private mainAppPort = 3000; // 主应用端口

    constructor() {
        this.initializeNginxForIframe();
        this.startCleanupScheduler();
    }

    /**
     * 为iframe优化的容器创建
     */
    async createUserContainer(userId: string): Promise<IframeContainer> {
        const existingContainer = this.containers.get(userId);
        if (existingContainer?.status === 'running') {
            return existingContainer;
        }

        const containerName = `iframe-sandbox-${userId}`;
        const projectPath = path.join(this.sandboxBasePath, userId);
        const previewPath = `/preview/${userId}/`;
        const iframeUrl = `http://localhost:${this.mainAppPort}${previewPath}`;

        await fs.mkdir(projectPath, { recursive: true });

        console.log(`🖼️ 创建iframe容器: ${containerName}`);

        try {
            // 创建容器 - 重点：不映射外部端口，只在内部网络
            const { stdout } = await execAsync(`
                docker run -d \\
                  --name ${containerName} \\
                  --memory=256m \\
                  --cpus=0.3 \\
                  -v "${projectPath}:/app" \\
                  -w /app \\
                  --network=iframe-network \\
                  --label="iframe-sandbox=true" \\
                  --label="user=${userId}" \\
                  ${this.baseImageName} \\
                  tail -f /dev/null
            `);

            const containerId = stdout.trim();

            const container: IframeContainer = {
                userId,
                containerId,
                containerName,
                status: 'running',
                createdAt: new Date(),
                lastActiveAt: new Date(),
                projectPath,
                previewPath,
                iframeUrl
            };

            this.containers.set(userId, container);

            // 更新 Nginx 配置
            await this.updateNginxForIframe();

            console.log(`✅ iframe容器创建成功: ${iframeUrl}`);
            return container;

        } catch (error) {
            console.error(`iframe容器创建失败: ${error}`);
            throw error;
        }
    }

    /**
     * 初始化专门为iframe优化的Nginx配置
     */
    private async initializeNginxForIframe(): Promise<void> {
        try {
            // 创建专用网络
            await execAsync('docker network create iframe-network').catch(() => {
                // 网络可能已存在
            });

            // 检查是否为开发环境
            const isDevelopment = process.env.NODE_ENV === 'development' ||
                process.env.NEXT_PUBLIC_NODE_ENV === 'development' ||
                !process.env.NODE_ENV;

            // 根据环境设置不同的 CSP 配置
            const frameAncestors = isDevelopment
                ? "'self' http://localhost:* http://127.0.0.1:*"  // 开发环境允许 localhost
                : "'self' *.wayne.beer";  // 生产环境限制特定域名

            const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    # 重要：添加iframe相关的安全头
    add_header Content-Security-Policy "frame-ancestors ${frameAncestors}" always;
    
    # 主应用代理
    upstream main-app {
        server host.docker.internal:${this.mainAppPort};
    }

    server {
        listen 80;
        server_name localhost;
        
        # 主应用 - 编辑器界面
        location / {
            proxy_pass http://main-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # 允许 iframe 嵌套
            proxy_hide_header X-Frame-Options;
        }

        # iframe 预览路由 - 将在这里动态添加
        # IFRAME_ROUTES_PLACEHOLDER
        
        # WebSocket 支持（Next.js 热重载需要）
        location /_next/webpack-hmr {
            proxy_pass http://main-app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
}`;

            await fs.writeFile(this.nginxConfigPath, nginxConfig);
            console.log('📝 iframe专用Nginx配置已创建');

        } catch (error) {
            console.error('初始化iframe Nginx配置失败:', error);
        }
    }

    /**
     * 更新iframe路由配置
     */
    private async updateNginxForIframe(): Promise<void> {
        try {
            let config = await fs.readFile(this.nginxConfigPath, 'utf-8');

            // 生成所有iframe沙箱的路由
            let iframeRoutes = '';
            for (const container of this.containers.values()) {
                if (container.status === 'running') {
                    iframeRoutes += `
        # iframe预览: 用户 ${container.userId}
        location ${container.previewPath} {
            # 代理到用户容器
            proxy_pass http://${container.containerName}:3001/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # 重要：iframe相关配置
            proxy_hide_header X-Frame-Options;
            proxy_hide_header Content-Security-Policy;
            
            # WebSocket 支持（热重载）
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # 移除路径前缀
            rewrite ^${container.previewPath}(.*)$ /$1 break;
        }
`;
                }
            }

            // 替换占位符
            config = config.replace('        # IFRAME_ROUTES_PLACEHOLDER', iframeRoutes);

            await fs.writeFile(this.nginxConfigPath, config);
            await this.reloadNginxProxy();

            console.log('🔄 iframe路由配置已更新');

        } catch (error) {
            console.error('更新iframe路由失败:', error);
        }
    }

    /**
     * 启动或重新加载Nginx代理
     */
    private async reloadNginxProxy(): Promise<void> {
        try {
            const { stdout } = await execAsync('docker ps --filter "name=nginx-iframe-proxy" --format "{{.ID}}"');

            if (stdout.trim()) {
                await execAsync('docker exec nginx-iframe-proxy nginx -s reload');
                console.log('🔄 Nginx已重新加载');
            } else {
                await this.startNginxProxy();
            }
        } catch (error) {
            console.warn('重新加载Nginx失败:', error);
        }
    }

    /**
     * 启动专用的Nginx代理
     */
    private async startNginxProxy(): Promise<void> {
        try {
            // 停止现有的代理（如果有）
            await execAsync('docker stop nginx-iframe-proxy 2>/dev/null || true');
            await execAsync('docker rm nginx-iframe-proxy 2>/dev/null || true');

            // 启动新的代理
            await execAsync(`
                docker run -d \\
                  --name nginx-iframe-proxy \\
                  --network=iframe-network \\
                  -p 80:80 \\
                  -v ${this.nginxConfigPath}:/etc/nginx/nginx.conf:ro \\
                  --restart=unless-stopped \\
                  nginx:alpine
            `);

            console.log('🚀 iframe专用Nginx代理已启动');
        } catch (error) {
            console.error('启动iframe Nginx代理失败:', error);
        }
    }

    /**
     * 获取用户的iframe URL
     */
    getUserIframeUrl(userId: string): string | null {
        const container = this.containers.get(userId);
        return container?.iframeUrl || null;
    }

    /**
     * 在容器中启动Next.js开发服务器
     */
    async startDevServerInContainer(userId: string): Promise<void> {
        const container = this.containers.get(userId);
        if (!container) {
            throw new Error(`用户 ${userId} 没有容器`);
        }

        try {
            // 在后台启动开发服务器
            exec(`docker exec -d ${container.containerName} sh -c "cd /app && npm run dev"`);

            console.log(`🚀 用户 ${userId} 的开发服务器已启动`);

            // 等待服务器启动
            await this.waitForDevServer(container.containerName);

        } catch (error) {
            console.error(`启动开发服务器失败: ${error}`);
            throw error;
        }
    }

    /**
     * 等待开发服务器启动
     */
    private async waitForDevServer(containerName: string): Promise<void> {
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const { stdout } = await execAsync(`docker exec ${containerName} curl -s -o /dev/null -w "%{http_code}" localhost:3001`);

                if (stdout.trim() === '200') {
                    console.log('✅ 开发服务器已准备就绪');
                    return;
                }
            } catch (error) {
                // 忽略错误，继续等待
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error('开发服务器启动超时');
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
            await this.updateNginxForIframe();

            console.log(`✅ 用户 ${userId} 的iframe容器已移除`);
        } catch (error) {
            console.error(`移除iframe容器失败: ${error}`);
            this.containers.delete(userId);
        }
    }

    /**
     * 获取所有容器信息
     */
    getAllContainers(): IframeContainer[] {
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

// 使用示例:
/*
主应用: http://localhost:3000
用户A的iframe预览: http://localhost:3000/preview/user-abc123/
用户B的iframe预览: http://localhost:3000/preview/user-def456/

在React组件中使用:
<iframe 
    src={`/preview/${userId}/`}
    width="100%" 
    height="600px"
    frameBorder="0"
    title="预览"
/>
*/ 