import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface SandboxProject {
    id: string;
    name: string;
    port: number;
    status: 'creating' | 'running' | 'stopped' | 'error';
    containerId?: string;
    createdAt: Date;
    lastActiveAt: Date;
    files: { [filePath: string]: string };
}

export class SandboxProjectManager {
    private static instance: SandboxProjectManager;
    private projects: Map<string, SandboxProject> = new Map();
    private basePort = 3001;
    private maxPort = 3010;
    private usedPorts = new Set<number>();

    private constructor() {
        // 初始化时不创建 Docker 实例
    }

    public static getInstance(): SandboxProjectManager {
        if (!SandboxProjectManager.instance) {
            SandboxProjectManager.instance = new SandboxProjectManager();
        }
        return SandboxProjectManager.instance;
    }

    /**
     * 创建新的 Sandbox 项目
     */
    async createProject(projectId: string, files: { [filePath: string]: string }): Promise<SandboxProject> {
        console.log(`🚀 创建 Sandbox 项目: ${projectId}`);

        // 分配端口
        const port = this.allocatePort();
        if (!port) {
            throw new Error('没有可用的端口');
        }

        // 创建项目记录
        const project: SandboxProject = {
            id: projectId,
            name: `sandbox-${projectId}`,
            port,
            status: 'creating',
            createdAt: new Date(),
            lastActiveAt: new Date(),
            files
        };

        this.projects.set(projectId, project);

        try {
            // 创建项目目录
            const projectDir = path.join(process.cwd(), 'sandbox-projects', projectId);
            await fs.mkdir(projectDir, { recursive: true });

            // 写入文件
            for (const [filePath, content] of Object.entries(files)) {
                const fullPath = path.join(projectDir, filePath);
                const dir = path.dirname(fullPath);
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(fullPath, content, 'utf-8');
            }

            // 创建 package.json（如果不存在）
            const packageJsonPath = path.join(projectDir, 'package.json');
            try {
                await fs.access(packageJsonPath);
            } catch {
                const defaultPackageJson = {
                    name: `sandbox-${projectId}`,
                    version: "0.1.0",
                    private: true,
                    scripts: {
                        dev: `next dev -p ${port}`,
                        build: "next build",
                        start: `next start -p ${port}`,
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

                await fs.writeFile(packageJsonPath, JSON.stringify(defaultPackageJson, null, 2));
            }

            // 创建 Docker 容器
            const container = await this.createContainer(projectId, projectDir, port);
            project.containerId = container.id;
            project.status = 'running';

            console.log(`✅ Sandbox 项目创建成功: ${projectId} (端口: ${port})`);
            return project;

        } catch (error) {
            console.error(`❌ Sandbox 项目创建失败: ${projectId}`, error);
            project.status = 'error';
            this.releasePort(port);
            throw error;
        }
    }

    /**
     * 创建 Docker 容器（简化版本）
     */
    private async createContainer(projectId: string, projectDir: string, port: number): Promise<any> {
        // 简化版本：直接启动开发服务器，不使用 Docker
        const startCommand = `cd ${projectDir} && npm run dev -- --port ${port}`;
        
        const childProcess = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
            cwd: projectDir,
            stdio: 'pipe'
        });

        // 返回一个模拟的容器对象
        return {
            id: `sandbox-${projectId}-${Date.now()}`,
            childProcess
        };
    }

    /**
     * 分配端口
     */
    private allocatePort(): number | null {
        for (let port = this.basePort; port <= this.maxPort; port++) {
            if (!this.usedPorts.has(port)) {
                this.usedPorts.add(port);
                return port;
            }
        }
        return null;
    }

    /**
     * 释放端口
     */
    private releasePort(port: number): void {
        this.usedPorts.delete(port);
    }

    /**
     * 停止项目
     */
    async stopProject(projectId: string): Promise<void> {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`项目不存在: ${projectId}`);
        }

        // 简化版本：直接杀死进程
        try {
            await execAsync(`pkill -f "sandbox-${projectId}"`);
        } catch (error) {
            console.warn(`停止项目进程失败: ${projectId}`, error);
        }

        project.status = 'stopped';
        this.releasePort(project.port);
        
        console.log(`🛑 Sandbox 项目已停止: ${projectId}`);
    }

    /**
     * 获取项目信息
     */
    getProject(projectId: string): SandboxProject | undefined {
        return this.projects.get(projectId);
    }

    /**
     * 获取所有项目
     */
    getAllProjects(): SandboxProject[] {
        return Array.from(this.projects.values());
    }

    /**
     * 更新项目文件
     */
    async updateProjectFiles(projectId: string, files: { [filePath: string]: string }): Promise<void> {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`项目不存在: ${projectId}`);
        }

        const projectDir = path.join(process.cwd(), 'sandbox-projects', projectId);

        // 写入文件
        for (const [filePath, content] of Object.entries(files)) {
            const fullPath = path.join(projectDir, filePath);
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
        }

        // 更新项目记录
        project.files = { ...project.files, ...files };
        project.lastActiveAt = new Date();

        console.log(`📝 项目文件已更新: ${projectId}`);
    }
}
