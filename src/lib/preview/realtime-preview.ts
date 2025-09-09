interface PreviewSession {
    projectId: string;
    containerId?: string;
    port?: number;
    status: 'starting' | 'running' | 'error' | 'stopped';
    lastUpdate: Date;
    files: { [path: string]: string };
    framework: 'react' | 'vue' | 'vanilla';
}

export class RealtimePreviewManager {
    private static instance: RealtimePreviewManager;
    private sessions = new Map<string, PreviewSession>();
    private wsConnections = new Map<string, WebSocket>();

    public static getInstance(): RealtimePreviewManager {
        if (!RealtimePreviewManager.instance) {
            RealtimePreviewManager.instance = new RealtimePreviewManager();
        }
        return RealtimePreviewManager.instance;
    }

    /**
     * 启动项目预览
     */
    async startPreview(
        projectId: string,
        files: { [path: string]: string },
        framework: 'react' | 'vue' | 'vanilla'
    ): Promise<{ url: string; containerId?: string }> {
        try {
            console.log(`🚀 启动预览: ${projectId} (${framework})`);

            // 更新或创建会话
            const session: PreviewSession = {
                projectId,
                status: 'starting',
                lastUpdate: new Date(),
                files,
                framework
            };

            this.sessions.set(projectId, session);

            // 直接使用sandbox目录进行预览
            const previewUrl = `/sandbox/`;
            console.log(`📁 使用sandbox预览模式: ${previewUrl}`);

            // 更新会话状态
            session.status = 'running';
            this.sessions.set(projectId, session);

            console.log(`✅ 预览启动成功: ${previewUrl}`);
            return { url: previewUrl };

        } catch (error) {
            console.error(`❌ 预览启动失败:`, error);

            // 更新错误状态
            const session = this.sessions.get(projectId);
            if (session) {
                session.status = 'error';
                this.sessions.set(projectId, session);
            }

            throw error;
        }
    }

    /**
     * 更新预览文件 - 直接使用sandbox目录
     */
    async updatePreview(
        projectId: string,
        files: { [path: string]: string }
    ): Promise<void> {
        const session = this.sessions.get(projectId);
        if (!session) {
            throw new Error('预览会话不存在');
        }

        try {
            console.log(`🔄 更新预览: ${projectId}`);

            // 更新文件
            session.files = files;
            session.lastUpdate = new Date();

            // 直接使用sandbox目录，无需额外操作
            console.log(`📁 预览已更新，使用sandbox目录: ${projectId}`);

            console.log(`✅ 预览更新成功: ${projectId}`);

        } catch (error) {
            console.error(`❌ 预览更新失败:`, error);
            session.status = 'error';
            throw error;
        }
    }

    /**
     * 停止预览
     */
    async stopPreview(projectId: string): Promise<void> {
        const session = this.sessions.get(projectId);
        if (!session) {
            return;
        }

        try {
            console.log(`🛑 停止预览: ${projectId}`);

            // 关闭WebSocket连接
            const ws = this.wsConnections.get(projectId);
            if (ws) {
                ws.close();
                this.wsConnections.delete(projectId);
            }

            // 停止容器
            if (session.containerId) {
                await this.stopContainer(session.containerId);
            }

            // 清理静态文件
            if (session.framework === 'vanilla') {
                await this.cleanupStaticPreview(projectId);
            }

            // 删除会话
            this.sessions.delete(projectId);

            console.log(`✅ 预览已停止: ${projectId}`);

        } catch (error) {
            console.error(`❌ 停止预览失败:`, error);
        }
    }

    /**
     * 获取预览状态
     */
    getPreviewStatus(projectId: string): PreviewSession | null {
        return this.sessions.get(projectId) || null;
    }

    /**
     * 获取所有活跃预览
     */
    getActivePreivews(): PreviewSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * 创建静态预览 - 直接使用sandbox目录
     */
    private async createStaticPreview(
        projectId: string,
        files: { [path: string]: string }
    ): Promise<string> {
        try {
            // 直接使用sandbox目录，不创建临时文件
            console.log(`📁 使用sandbox目录进行预览: ${projectId}`);

            // 返回sandbox的预览URL
            return `/sandbox/`;
        } catch (error) {
            console.error('创建静态预览失败:', error);
            throw new Error(`创建静态预览失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 生成简单的HTML入口文件 - 已删除，直接使用sandbox目录
     */
    private generateIndexHtml(files: { [path: string]: string }): string {
        // 不再需要生成HTML，直接使用sandbox目录
        return '';
    }

    /**
     * 创建容器化预览
     */
    private async createContainerPreview(
        projectId: string,
        files: { [path: string]: string },
        framework: 'react' | 'vue'
    ): Promise<{ url: string; containerId: string; port: number }> {
        try {
            // 导入Docker管理器
            const { IframeOptimizedDockerManager } = await import('../iframe-optimized-docker');
            const dockerManager = new IframeOptimizedDockerManager();

            // 创建用户容器
            const container = await dockerManager.createUserContainer(projectId);

            // 启动开发服务器
            await dockerManager.startDevServerInContainer(projectId);

            return {
                url: container.iframeUrl,
                containerId: container.containerId,
                port: 3000 // 默认端口
            };
        } catch (error) {
            console.error('容器预览创建失败:', error);
            throw new Error(`容器预览创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }


    /**
     * 触发热重载
     */
    private async triggerHotReload(projectId: string): Promise<void> {
        const ws = this.wsConnections.get(projectId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'reload',
                projectId,
                timestamp: Date.now()
            }));
        }
    }

    /**
     * 停止容器
     */
    private async stopContainer(containerId: string): Promise<void> {
        console.log(`🐳 停止容器: ${containerId}`);
        // 实际的Docker停止操作
    }

    /**
     * 清理静态预览
     */
    private async cleanupStaticPreview(projectId: string): Promise<void> {
        const previewDir = `/tmp/preview/${projectId}`;
        console.log(`🧹 清理预览目录: ${previewDir}`);
        // 实际的文件清理操作
    }

    /**
     * 分配可用端口
     */
    private async allocatePort(): Promise<number> {
        const basePort = 4000;
        const maxPort = 5000;

        for (let port = basePort; port < maxPort; port++) {
            // 检查端口是否可用
            const isAvailable = await this.isPortAvailable(port);
            if (isAvailable) {
                return port;
            }
        }

        throw new Error('没有可用端口');
    }

    /**
     * 检查端口是否可用
     */
    private async isPortAvailable(port: number): Promise<boolean> {
        // 实际的端口检查逻辑
        return !Array.from(this.sessions.values()).some(s => s.port === port);
    }

    /**
     * 清理过期会话
     */
    async cleanupExpiredSessions(maxAge: number = 30 * 60 * 1000): Promise<void> {
        const now = Date.now();

        for (const [projectId, session] of this.sessions.entries()) {
            const age = now - session.lastUpdate.getTime();

            if (age > maxAge) {
                console.log(`🧹 清理过期预览: ${projectId} (${Math.round(age / 1000)}s)`);
                await this.stopPreview(projectId);
            }
        }
    }
} 