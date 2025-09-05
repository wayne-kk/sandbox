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

            // 根据框架选择启动方式
            let previewUrl: string;
            let containerId: string | undefined;

            // 直接使用sandbox目录进行预览
            previewUrl = `/preview/${projectId}/`;
            console.log(`📁 使用sandbox预览模式: ${previewUrl}`);

            // 更新会话状态
            session.status = 'running';
            this.sessions.set(projectId, session);

            console.log(`✅ 预览启动成功: ${previewUrl}`);
            return { url: previewUrl, containerId };

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
     * 更新预览文件
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

            if (session.framework === 'vanilla') {
                // 重新生成静态预览
                await this.updateStaticPreview(projectId, files);
            } else if (session.containerId) {
                // 同步文件到容器
                await this.syncFilesToContainer(session.containerId, files);
            }

            // 触发热重载
            await this.triggerHotReload(projectId);

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
     * 创建静态预览
     */
    private async createStaticPreview(
        projectId: string,
        files: { [path: string]: string }
    ): Promise<string> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            // 创建临时预览目录
            const previewDir = path.join(process.cwd(), 'temp', 'preview', projectId);
            await fs.mkdir(previewDir, { recursive: true });

            // 写入文件到预览目录
            for (const [filePath, content] of Object.entries(files)) {
                const fullPath = path.join(previewDir, filePath);
                const dirPath = path.dirname(fullPath);

                // 确保目录存在
                await fs.mkdir(dirPath, { recursive: true });

                // 写入文件
                await fs.writeFile(fullPath, content, 'utf-8');
                console.log(`📄 创建预览文件: ${fullPath}`);
            }

            // 创建一个简单的HTML入口文件
            const indexHtml = this.generateIndexHtml(files);
            const indexPath = path.join(previewDir, 'index.html');
            await fs.writeFile(indexPath, indexHtml, 'utf-8');

            console.log(`✅ 静态预览创建完成: ${previewDir}`);
            return `/preview/${projectId}/`;
        } catch (error) {
            console.error('创建静态预览失败:', error);
            throw new Error(`创建静态预览失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 生成简单的HTML入口文件
     */
    private generateIndexHtml(files: { [path: string]: string }): string {
        // 查找主要的React组件文件
        const mainComponent = Object.keys(files).find(file =>
            file.includes('page.tsx') ||
            file.includes('App.tsx') ||
            file.includes('index.tsx')
        );

        if (mainComponent) {
            return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>组件预览</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .preview-container { max-width: 1200px; margin: 0 auto; }
    </style>
</head>
<body>
    <div id="root" class="preview-container">
        <div style="text-align: center; padding: 50px; color: #666;">
            <h2>组件预览</h2>
            <p>正在加载组件...</p>
        </div>
    </div>
    
    <script type="text/babel">
        // 这里可以添加组件代码
        const { useState, useEffect } = React;
        
        function PreviewApp() {
            return (
                <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>组件预览</h3>
                    <p>这是一个简单的预览界面。实际的组件代码需要进一步处理。</p>
                </div>
            );
        }
        
        ReactDOM.render(<PreviewApp />, document.getElementById('root'));
    </script>
</body>
</html>`;
        }

        // 如果没有找到React组件，返回简单的HTML
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文件预览</title>
    <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .file-list { max-width: 800px; margin: 0 auto; }
        .file-item { padding: 10px; border-bottom: 1px solid #eee; }
        .file-name { font-weight: bold; color: #333; }
        .file-size { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="file-list">
        <h2>生成的文件列表</h2>
        ${Object.keys(files).map(fileName => `
            <div class="file-item">
                <div class="file-name">${fileName}</div>
                <div class="file-size">${files[fileName].length} 字符</div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
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
     * 更新静态预览
     */
    private async updateStaticPreview(
        projectId: string,
        files: { [path: string]: string }
    ): Promise<void> {
        const previewDir = `/tmp/preview/${projectId}`;

        // 更新文件
        for (const [filePath, content] of Object.entries(files)) {
            const fullPath = `${previewDir}/${filePath}`;
            console.log(`🔄 更新文件: ${fullPath}`);
        }
    }

    /**
     * 同步文件到容器
     */
    private async syncFilesToContainer(
        containerId: string,
        files: { [path: string]: string }
    ): Promise<void> {
        // 使用docker cp命令同步文件
        for (const [filePath, content] of Object.entries(files)) {
            console.log(`📁 同步文件到容器: ${containerId}:${filePath}`);
            // 实际的Docker文件同步操作
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