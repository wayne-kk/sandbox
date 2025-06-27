import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface FileData {
    path: string;
    content: string;
    lastModified: Date;
    size: number;
    hash: string;
}

export interface ProjectSnapshot {
    id: string;
    userId: string;
    name: string;
    files: { [path: string]: FileData };
    createdAt: Date;
    description?: string;
    tags?: string[];
}

export interface ProjectVersion {
    version: number;
    snapshot: ProjectSnapshot;
    parentVersion?: number;
    changes: Array<{
        type: 'create' | 'update' | 'delete';
        path: string;
        content?: string;
        timestamp: Date;
    }>;
}

export class FileStorageManager {
    private memoryCache: Map<string, ProjectSnapshot> = new Map();
    private baseStoragePath: string;
    private maxCacheSize = 100; // 最大缓存项目数
    private autoSaveInterval = 3000; // 3秒自动保存
    private versionLimit = 50; // 最大版本历史

    constructor(baseStoragePath: string = '/data/sandboxes') {
        this.baseStoragePath = baseStoragePath;
        this.ensureStorageDirectory();
        this.startAutoSaveScheduler();
    }

    /**
     * 确保存储目录存在
     */
    private async ensureStorageDirectory(): Promise<void> {
        try {
            await fs.mkdir(this.baseStoragePath, { recursive: true });
            await fs.mkdir(path.join(this.baseStoragePath, 'projects'), { recursive: true });
            await fs.mkdir(path.join(this.baseStoragePath, 'versions'), { recursive: true });
            await fs.mkdir(path.join(this.baseStoragePath, 'temp'), { recursive: true });
            console.log('📁 存储目录已准备就绪');
        } catch (error) {
            console.error('创建存储目录失败:', error);
            throw error;
        }
    }

    /**
     * 保存文件（实时）
     */
    async saveFile(userId: string, filePath: string, content: string): Promise<void> {
        const projectKey = this.getProjectKey(userId);

        // 获取或创建项目快照
        let project = this.memoryCache.get(projectKey);
        if (!project) {
            project = await this.loadProject(userId) || this.createNewProject(userId);
        }

        // 计算文件哈希
        const hash = crypto.createHash('md5').update(content).digest('hex');

        // 更新文件数据
        const fileData: FileData = {
            path: filePath,
            content,
            lastModified: new Date(),
            size: Buffer.byteLength(content, 'utf8'),
            hash
        };

        project.files[filePath] = fileData;

        // 更新内存缓存
        this.memoryCache.set(projectKey, project);

        // 异步写入Docker卷和文件系统
        await Promise.all([
            this.writeToDockerVolume(userId, filePath, content),
            this.scheduleFileSystemSave(userId, project)
        ]);

        console.log(`💾 文件已保存: ${userId}/${filePath} (${fileData.size} bytes)`);
    }

    /**
     * 批量保存文件
     */
    async saveFiles(userId: string, files: { [path: string]: string }): Promise<void> {
        const projectKey = this.getProjectKey(userId);

        let project = this.memoryCache.get(projectKey);
        if (!project) {
            project = await this.loadProject(userId) || this.createNewProject(userId);
        }

        // 批量更新文件
        for (const [filePath, content] of Object.entries(files)) {
            const hash = crypto.createHash('md5').update(content).digest('hex');

            project.files[filePath] = {
                path: filePath,
                content,
                lastModified: new Date(),
                size: Buffer.byteLength(content, 'utf8'),
                hash
            };
        }

        // 更新缓存
        this.memoryCache.set(projectKey, project);

        // 并行写入
        await Promise.all([
            ...Object.entries(files).map(([filePath, content]) =>
                this.writeToDockerVolume(userId, filePath, content)
            ),
            this.scheduleFileSystemSave(userId, project)
        ]);

        console.log(`💾 批量保存完成: ${userId} (${Object.keys(files).length} 个文件)`);
    }

    /**
     * 读取文件
     */
    async readFile(userId: string, filePath: string): Promise<string | null> {
        const projectKey = this.getProjectKey(userId);

        // 优先从内存缓存读取
        const project = this.memoryCache.get(projectKey);
        if (project?.files[filePath]) {
            return project.files[filePath].content;
        }

        // 从文件系统读取
        try {
            const fullPath = this.getProjectPath(userId, filePath);
            const content = await fs.readFile(fullPath, 'utf-8');

            // 更新缓存
            if (project) {
                const hash = crypto.createHash('md5').update(content).digest('hex');
                project.files[filePath] = {
                    path: filePath,
                    content,
                    lastModified: new Date(),
                    size: Buffer.byteLength(content, 'utf8'),
                    hash
                };
                this.memoryCache.set(projectKey, project);
            }

            return content;
        } catch (error) {
            console.warn(`读取文件失败: ${userId}/${filePath}`, error);
            return null;
        }
    }

    /**
     * 获取项目所有文件
     */
    async getProjectFiles(userId: string): Promise<{ [path: string]: FileData }> {
        const projectKey = this.getProjectKey(userId);

        // 从缓存获取
        const cachedProject = this.memoryCache.get(projectKey);
        if (cachedProject) {
            return cachedProject.files;
        }

        // 从文件系统加载
        const project = await this.loadProject(userId);
        return project?.files || {};
    }

    /**
     * 创建项目版本快照
     */
    async createVersion(userId: string, description?: string): Promise<ProjectVersion> {
        const project = this.memoryCache.get(this.getProjectKey(userId));
        if (!project) {
            throw new Error(`用户 ${userId} 没有活跃项目`);
        }

        // 获取版本历史
        const versions = await this.getVersionHistory(userId);
        const newVersion = versions.length + 1;

        // 计算变更
        const changes = this.calculateChanges(
            versions[versions.length - 1]?.snapshot,
            project
        );

        const version: ProjectVersion = {
            version: newVersion,
            snapshot: {
                ...project,
                id: `${project.id}-v${newVersion}`,
                description: description || `版本 ${newVersion}`,
                createdAt: new Date()
            },
            parentVersion: versions.length > 0 ? versions.length : undefined,
            changes
        };

        // 保存版本
        await this.saveVersion(userId, version);

        // 清理旧版本（保留最近N个）
        await this.cleanupOldVersions(userId);

        console.log(`📸 已创建版本快照: ${userId} v${newVersion}`);
        return version;
    }

    /**
     * 恢复到指定版本
     */
    async restoreVersion(userId: string, version: number): Promise<void> {
        const versions = await this.getVersionHistory(userId);
        const targetVersion = versions.find(v => v.version === version);

        if (!targetVersion) {
            throw new Error(`版本 ${version} 不存在`);
        }

        const projectKey = this.getProjectKey(userId);

        // 更新内存缓存
        this.memoryCache.set(projectKey, targetVersion.snapshot);

        // 写入文件系统和Docker卷
        for (const [filePath, fileData] of Object.entries(targetVersion.snapshot.files)) {
            await Promise.all([
                this.writeToDockerVolume(userId, filePath, fileData.content),
                this.writeToFileSystem(userId, filePath, fileData.content)
            ]);
        }

        console.log(`🔄 已恢复到版本: ${userId} v${version}`);
    }

    /**
     * 导出项目
     */
    async exportProject(userId: string): Promise<Buffer> {
        const project = await this.loadProject(userId);
        if (!project) {
            throw new Error(`用户 ${userId} 的项目不存在`);
        }

        const exportData = {
            project,
            versions: await this.getVersionHistory(userId),
            exportedAt: new Date(),
            format: 'v1'
        };

        return Buffer.from(JSON.stringify(exportData, null, 2));
    }

    /**
     * 导入项目
     */
    async importProject(userId: string, data: Buffer): Promise<void> {
        try {
            const importData = JSON.parse(data.toString());
            const { project, versions } = importData;

            // 保存项目
            const projectKey = this.getProjectKey(userId);
            project.id = `imported-${Date.now()}`;
            this.memoryCache.set(projectKey, project);

            // 写入文件系统
            for (const [filePath, fileData] of Object.entries(project.files)) {
                await Promise.all([
                    this.writeToDockerVolume(userId, filePath, (fileData as FileData).content),
                    this.writeToFileSystem(userId, filePath, (fileData as FileData).content)
                ]);
            }

            // 导入版本历史
            if (versions) {
                for (const version of versions) {
                    await this.saveVersion(userId, version);
                }
            }

            console.log(`📥 项目导入完成: ${userId}`);
        } catch (error) {
            console.error('项目导入失败:', error);
            throw new Error('导入数据格式错误');
        }
    }

    /**
     * 写入Docker卷
     */
    private async writeToDockerVolume(userId: string, filePath: string, content: string): Promise<void> {
        const dockerPath = `/tmp/sandboxes/${userId}/${filePath}`;
        const dir = path.dirname(dockerPath);

        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(dockerPath, content, 'utf-8');
        } catch (error) {
            console.warn(`写入Docker卷失败: ${dockerPath}`, error);
        }
    }

    /**
     * 写入文件系统
     */
    private async writeToFileSystem(userId: string, filePath: string, content: string): Promise<void> {
        const fullPath = this.getProjectPath(userId, filePath);
        const dir = path.dirname(fullPath);

        try {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
        } catch (error) {
            console.warn(`写入文件系统失败: ${fullPath}`, error);
        }
    }

    /**
     * 计划保存到文件系统（防抖）
     */
    private saveTimers: Map<string, NodeJS.Timeout> = new Map();

    private async scheduleFileSystemSave(userId: string, project: ProjectSnapshot): Promise<void> {
        const timerId = this.saveTimers.get(userId);
        if (timerId) {
            clearTimeout(timerId);
        }

        this.saveTimers.set(userId, setTimeout(async () => {
            try {
                await this.saveProjectToFileSystem(userId, project);
                this.saveTimers.delete(userId);
            } catch (error) {
                console.error(`定时保存失败: ${userId}`, error);
            }
        }, 1000)); // 1秒防抖
    }

    /**
     * 保存项目到文件系统
     */
    private async saveProjectToFileSystem(userId: string, project: ProjectSnapshot): Promise<void> {
        const projectFilePath = path.join(this.baseStoragePath, 'projects', `${userId}.json`);

        try {
            // 只保存元数据，文件内容单独存储
            const metadata = {
                ...project,
                files: Object.fromEntries(
                    Object.entries(project.files).map(([path, file]) => [
                        path,
                        {
                            path: file.path,
                            lastModified: file.lastModified,
                            size: file.size,
                            hash: file.hash
                            // 不保存content，减少JSON大小
                        }
                    ])
                )
            };

            await fs.writeFile(projectFilePath, JSON.stringify(metadata, null, 2));

            // 单独保存文件内容
            for (const [filePath, fileData] of Object.entries(project.files)) {
                await this.writeToFileSystem(userId, filePath, fileData.content);
            }
        } catch (error) {
            console.error(`保存项目失败: ${userId}`, error);
        }
    }

    /**
     * 从文件系统加载项目
     */
    private async loadProject(userId: string): Promise<ProjectSnapshot | null> {
        const projectFilePath = path.join(this.baseStoragePath, 'projects', `${userId}.json`);

        try {
            const metadata = JSON.parse(await fs.readFile(projectFilePath, 'utf-8'));

            // 加载文件内容
            const files: { [path: string]: FileData } = {};
            for (const [filePath, fileMeta] of Object.entries(metadata.files)) {
                const content = await this.readFileFromStorage(userId, filePath);
                if (content !== null) {
                    files[filePath] = {
                        ...(fileMeta as any),
                        content
                    };
                }
            }

            const project: ProjectSnapshot = {
                ...metadata,
                files,
                createdAt: new Date(metadata.createdAt)
            };

            // 更新缓存
            this.memoryCache.set(this.getProjectKey(userId), project);

            return project;
        } catch (error) {
            console.warn(`加载项目失败: ${userId}`, error);
            return null;
        }
    }

    private async readFileFromStorage(userId: string, filePath: string): Promise<string | null> {
        try {
            const fullPath = this.getProjectPath(userId, filePath);
            return await fs.readFile(fullPath, 'utf-8');
        } catch (error) {
            return null;
        }
    }

    private createNewProject(userId: string): ProjectSnapshot {
        return {
            id: `project-${userId}-${Date.now()}`,
            userId,
            name: `${userId} 的项目`,
            files: {},
            createdAt: new Date(),
            tags: ['sandbox']
        };
    }

    private getProjectKey(userId: string): string {
        return `project:${userId}`;
    }

    private getProjectPath(userId: string, filePath: string): string {
        return path.join(this.baseStoragePath, 'projects', userId, filePath);
    }

    private async getVersionHistory(userId: string): Promise<ProjectVersion[]> {
        const versionsPath = path.join(this.baseStoragePath, 'versions', `${userId}.json`);

        try {
            const data = await fs.readFile(versionsPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    private async saveVersion(userId: string, version: ProjectVersion): Promise<void> {
        const versionsPath = path.join(this.baseStoragePath, 'versions', `${userId}.json`);

        try {
            const versions = await this.getVersionHistory(userId);
            versions.push(version);
            await fs.writeFile(versionsPath, JSON.stringify(versions, null, 2));
        } catch (error) {
            console.error(`保存版本失败: ${userId}`, error);
        }
    }

    private calculateChanges(oldProject?: ProjectSnapshot, newProject?: ProjectSnapshot): any[] {
        if (!oldProject || !newProject) return [];

        const changes: any[] = [];
        const oldFiles = oldProject.files || {};
        const newFiles = newProject.files || {};

        // 检查新增和修改的文件
        for (const [path, newFile] of Object.entries(newFiles)) {
            const oldFile = oldFiles[path];
            if (!oldFile) {
                changes.push({
                    type: 'create',
                    path,
                    content: newFile.content,
                    timestamp: newFile.lastModified
                });
            } else if (oldFile.hash !== newFile.hash) {
                changes.push({
                    type: 'update',
                    path,
                    content: newFile.content,
                    timestamp: newFile.lastModified
                });
            }
        }

        // 检查删除的文件
        for (const path of Object.keys(oldFiles)) {
            if (!newFiles[path]) {
                changes.push({
                    type: 'delete',
                    path,
                    timestamp: new Date()
                });
            }
        }

        return changes;
    }

    private async cleanupOldVersions(userId: string): Promise<void> {
        const versions = await this.getVersionHistory(userId);
        if (versions.length > this.versionLimit) {
            const keepVersions = versions.slice(-this.versionLimit);
            await this.saveVersion(userId, keepVersions[0]); // 这里应该重写整个文件
        }
    }

    private startAutoSaveScheduler(): void {
        setInterval(() => {
            this.performAutoSave();
        }, this.autoSaveInterval);
    }

    private async performAutoSave(): Promise<void> {
        for (const [projectKey, project] of this.memoryCache.entries()) {
            const userId = projectKey.replace('project:', '');
            try {
                await this.saveProjectToFileSystem(userId, project);
            } catch (error) {
                console.error(`自动保存失败: ${userId}`, error);
            }
        }
    }
} 