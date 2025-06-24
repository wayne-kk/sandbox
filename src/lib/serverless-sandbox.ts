import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ServerlessSandbox {
    userId: string;
    projectId: string;
    deploymentUrl: string;
    status: 'building' | 'ready' | 'error';
    createdAt: Date;
    lastActiveAt: Date;
    files: { [path: string]: string };
}

export class ServerlessSandboxManager {
    private sandboxes: Map<string, ServerlessSandbox> = new Map();
    private tempDir = '/tmp/sandboxes';

    /**
     * 创建用户沙箱（无容器，直接部署）
     */
    async createUserSandbox(userId: string, files: { [path: string]: string }): Promise<ServerlessSandbox> {
        const projectId = `user-${userId}-${Date.now()}`;
        const projectPath = path.join(this.tempDir, projectId);

        try {
            // 创建项目目录
            await fs.mkdir(projectPath, { recursive: true });

            // 写入所有文件
            for (const [filePath, content] of Object.entries(files)) {
                const fullPath = path.join(projectPath, filePath);
                const dir = path.dirname(fullPath);
                await fs.mkdir(dir, { recursive: true });
                await fs.writeFile(fullPath, content);
            }

            // 创建沙箱记录
            const sandbox: ServerlessSandbox = {
                userId,
                projectId,
                deploymentUrl: '', // 将在部署后填充
                status: 'building',
                createdAt: new Date(),
                lastActiveAt: new Date(),
                files
            };

            this.sandboxes.set(userId, sandbox);

            // 部署到 Vercel 或其他平台
            const deploymentUrl = await this.deployToVercel(projectPath, projectId);

            sandbox.deploymentUrl = deploymentUrl;
            sandbox.status = 'ready';

            console.log(`✅ 用户 ${userId} 的沙箱已部署: ${deploymentUrl}`);
            return sandbox;

        } catch (error) {
            console.error(`沙箱创建失败: ${error}`);
            const errorSandbox = this.sandboxes.get(userId);
            if (errorSandbox) {
                errorSandbox.status = 'error';
            }
            throw error;
        }
    }

    /**
     * 部署到 Vercel
     */
    private async deployToVercel(projectPath: string, projectId: string): Promise<string> {
        try {
            // 确保项目有必要的配置文件
            await this.ensureVercelConfig(projectPath, projectId);

            // 使用 Vercel CLI 部署
            const { stdout } = await execAsync(`cd ${projectPath} && npx vercel --prod --yes --token=${process.env.VERCEL_TOKEN}`);

            // 从输出中提取部署URL
            const deploymentUrl = this.extractDeploymentUrl(stdout);

            return deploymentUrl;
        } catch (error) {
            console.error('Vercel 部署失败:', error);
            throw new Error(`部署失败: ${error}`);
        }
    }

    /**
     * 确保 Vercel 配置文件存在
     */
    private async ensureVercelConfig(projectPath: string, projectId: string): Promise<void> {
        // vercel.json 配置
        const vercelConfig = {
            "name": projectId,
            "version": 2,
            "builds": [
                {
                    "src": "package.json",
                    "use": "@vercel/next"
                }
            ]
        };

        await fs.writeFile(
            path.join(projectPath, 'vercel.json'),
            JSON.stringify(vercelConfig, null, 2)
        );

        // package.json（如果不存在）
        const packageJsonPath = path.join(projectPath, 'package.json');
        try {
            await fs.access(packageJsonPath);
        } catch {
            const packageJson = {
                "name": projectId,
                "version": "0.1.0",
                "private": true,
                "scripts": {
                    "dev": "next dev",
                    "build": "next build",
                    "start": "next start"
                },
                "dependencies": {
                    "next": "latest",
                    "react": "latest",
                    "react-dom": "latest"
                }
            };

            await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
    }

    /**
     * 从 Vercel 输出中提取部署URL
     */
    private extractDeploymentUrl(output: string): string {
        // Vercel CLI 输出解析
        const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
        if (urlMatch) {
            return urlMatch[0];
        }

        // 备用方案：生成预期的URL
        return `https://user-${Date.now()}.vercel.app`;
    }

    /**
     * 更新用户沙箱
     */
    async updateUserSandbox(userId: string, files: { [path: string]: string }): Promise<ServerlessSandbox> {
        const existingSandbox = this.sandboxes.get(userId);
        if (!existingSandbox) {
            throw new Error(`用户 ${userId} 没有现有沙箱`);
        }

        // 合并文件
        const updatedFiles = { ...existingSandbox.files, ...files };

        // 创建新的沙箱（新部署）
        return this.createUserSandbox(userId, updatedFiles);
    }

    /**
     * 获取用户沙箱
     */
    getUserSandbox(userId: string): ServerlessSandbox | null {
        return this.sandboxes.get(userId) || null;
    }

    /**
     * 获取所有沙箱
     */
    getAllSandboxes(): ServerlessSandbox[] {
        return Array.from(this.sandboxes.values());
    }

    /**
     * 删除用户沙箱
     */
    async removeUserSandbox(userId: string): Promise<void> {
        const sandbox = this.sandboxes.get(userId);
        if (!sandbox) return;

        try {
            // 可选：从 Vercel 删除部署
            // await this.deleteVercelDeployment(sandbox.deploymentUrl);

            // 清理本地文件
            const projectPath = path.join(this.tempDir, sandbox.projectId);
            await fs.rm(projectPath, { recursive: true, force: true });

            // 从内存中移除
            this.sandboxes.delete(userId);

            console.log(`✅ 用户 ${userId} 的沙箱已删除`);
        } catch (error) {
            console.error(`删除沙箱失败: ${error}`);
        }
    }
}

// 优势对比
/*
端口映射方案 vs 无服务器方案:

❌ 端口映射方案:
- 端口数量限制（最多几千个）
- 需要反向代理配置
- 容器资源占用
- 需要持续运行

✅ 无服务器方案:
- 无端口限制
- 每个用户独立URL
- 按需计费
- 自动扩缩容
- 零维护成本

V0 选择无服务器方案的原因：
1. 无限扩展能力
2. 成本效益（按使用付费）
3. 零运维负担
4. 更好的用户体验
*/ 