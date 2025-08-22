import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface GitHubRepo {
    owner: string;
    repo: string;
    branch?: string;
    subfolder?: string;
}

export interface DownloadOptions {
    targetPath: string;
    cleanup?: boolean;
}

export class GitHubDownloader {
    private static instance: GitHubDownloader;

    static getInstance(): GitHubDownloader {
        if (!GitHubDownloader.instance) {
            GitHubDownloader.instance = new GitHubDownloader();
        }
        return GitHubDownloader.instance;
    }

    /**
     * 解析GitHub URL，支持多种格式
     */
    parseGitHubUrl(url: string): GitHubRepo {
        // 清理URL
        url = url.trim();

        // 支持的格式:
        // https://github.com/owner/repo
        // https://github.com/owner/repo/tree/branch
        // https://github.com/owner/repo/tree/branch/subfolder
        // git@github.com:owner/repo.git

        let match;

        // HTTPS格式
        match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)(?:\/(.+))?)?/);
        if (match) {
            const [, owner, repo, branch, subfolder] = match;
            return {
                owner,
                repo: repo.replace(/\.git$/, ''),
                branch: branch || 'main',
                subfolder
            };
        }

        // SSH格式
        match = url.match(/git@github\.com:([^\/]+)\/(.+)\.git/);
        if (match) {
            const [, owner, repo] = match;
            return {
                owner,
                repo,
                branch: 'main'
            };
        }

        throw new Error('无效的GitHub URL格式');
    }

    /**
     * 下载GitHub仓库到指定目录
     */
    async downloadRepository(url: string, options: DownloadOptions): Promise<void> {
        const repo = this.parseGitHubUrl(url);
        const { targetPath, cleanup = false } = options;

        try {
            // 如果目标目录存在且需要清理，先删除
            if (cleanup) {
                try {
                    await fs.access(targetPath);
                    await fs.rm(targetPath, { recursive: true, force: true });
                    console.log(`🧹 已清理目标目录: ${targetPath}`);
                } catch {
                    // 目录不存在，忽略
                }
            }

            // 确保父目录存在
            await fs.mkdir(path.dirname(targetPath), { recursive: true });

            console.log(`📥 开始下载仓库: ${repo.owner}/${repo.repo}@${repo.branch}`);

            // 使用git clone下载仓库
            await this.cloneRepository(repo, targetPath);

            // 如果指定了子文件夹，只保留子文件夹内容
            if (repo.subfolder) {
                await this.extractSubfolder(targetPath, repo.subfolder);
            }

            // 清理git相关文件
            await this.cleanupGitFiles(targetPath);

            console.log(`✅ 仓库下载完成: ${targetPath}`);
        } catch (error) {
            console.error(`❌ 下载仓库失败:`, error);
            throw error;
        }
    }

    /**
     * 使用git clone下载仓库
     */
    private async cloneRepository(repo: GitHubRepo, targetPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const gitUrl = `https://github.com/${repo.owner}/${repo.repo}.git`;
            const args = [
                'clone',
                '--depth', '1', // 浅克隆，只下载最新提交
                '--branch', repo.branch || 'main',
                '--single-branch',
                gitUrl,
                targetPath
            ];

            console.log(`🔗 执行git命令: git ${args.join(' ')}`);

            const gitProcess = spawn('git', args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let errorOutput = '';

            gitProcess.stdout?.on('data', (data) => {
                output += data.toString();
            });

            gitProcess.stderr?.on('data', (data) => {
                errorOutput += data.toString();
            });

            gitProcess.on('exit', (code) => {
                if (code === 0) {
                    console.log(`✅ Git克隆成功: ${repo.owner}/${repo.repo}`);
                    resolve();
                } else {
                    console.error(`❌ Git克隆失败:`, errorOutput);
                    reject(new Error(`Git克隆失败，退出代码: ${code}\n${errorOutput}`));
                }
            });

            gitProcess.on('error', (error) => {
                console.error(`❌ Git进程错误:`, error);
                reject(error);
            });

            // 3分钟超时
            setTimeout(() => {
                gitProcess.kill('SIGTERM');
                reject(new Error('Git克隆超时'));
            }, 180000);
        });
    }

    /**
     * 提取子文件夹内容到根目录
     */
    private async extractSubfolder(targetPath: string, subfolder: string): Promise<void> {
        const subfolderPath = path.join(targetPath, subfolder);

        try {
            // 检查子文件夹是否存在
            await fs.access(subfolderPath);

            // 创建临时目录
            const tempDir = path.join(path.dirname(targetPath), `temp_${randomUUID().slice(0, 8)}`);

            // 移动子文件夹内容到临时目录
            await fs.rename(subfolderPath, tempDir);

            // 删除原目录
            await fs.rm(targetPath, { recursive: true, force: true });

            // 重命名临时目录为目标目录
            await fs.rename(tempDir, targetPath);

            console.log(`📁 已提取子文件夹: ${subfolder}`);
        } catch (error) {
            throw new Error(`子文件夹不存在或提取失败: ${subfolder}`);
        }
    }

    /**
     * 清理Git相关文件
     */
    private async cleanupGitFiles(targetPath: string): Promise<void> {
        const gitDir = path.join(targetPath, '.git');
        try {
            await fs.rm(gitDir, { recursive: true, force: true });
            console.log(`🧹 已清理.git目录`);
        } catch {
            // .git目录可能不存在，忽略错误
        }
    }

    /**
     * 检查目录是否是有效的Node.js项目
     */
    async validateNodeProject(projectPath: string): Promise<{
        isValid: boolean;
        hasPackageJson: boolean;
        framework?: 'nextjs' | 'react' | 'vue' | 'other';
        errors: string[];
    }> {
        const errors: string[] = [];
        let hasPackageJson = false;
        let framework: 'nextjs' | 'react' | 'vue' | 'other' = 'other';

        try {
            // 检查package.json
            const packageJsonPath = path.join(projectPath, 'package.json');
            try {
                const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
                const packageJson = JSON.parse(packageContent);
                hasPackageJson = true;

                // 检测框架类型
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

                if (dependencies.next) {
                    framework = 'nextjs';
                } else if (dependencies.react) {
                    framework = 'react';
                } else if (dependencies.vue) {
                    framework = 'vue';
                }

                // 检查必要的脚本
                if (!packageJson.scripts || !packageJson.scripts.dev) {
                    errors.push('缺少dev启动脚本');
                }

                console.log(`📦 检测到${framework}项目`);
            } catch {
                errors.push('package.json文件不存在或格式错误');
            }

            // 检查源代码目录
            const srcDirs = ['src', 'app', 'pages', 'components'];
            let hasSrcDir = false;

            for (const dir of srcDirs) {
                try {
                    const dirPath = path.join(projectPath, dir);
                    await fs.access(dirPath);
                    hasSrcDir = true;
                    break;
                } catch {
                    // 目录不存在，继续检查下一个
                }
            }

            if (!hasSrcDir) {
                errors.push('未找到源代码目录 (src/app/pages/components)');
            }

        } catch (error) {
            errors.push(`项目验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }

        const isValid = hasPackageJson && errors.length === 0;

        return {
            isValid,
            hasPackageJson,
            framework,
            errors
        };
    }

    /**
     * 获取项目的基本信息
     */
    async getProjectInfo(projectPath: string): Promise<{
        name: string;
        description?: string;
        version?: string;
        framework: string;
        dependencies: Record<string, string>;
        scripts: Record<string, string>;
    }> {
        const packageJsonPath = path.join(projectPath, 'package.json');

        try {
            const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageContent);

            // 检测框架
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            let framework = 'other';

            if (dependencies.next) {
                framework = 'nextjs';
            } else if (dependencies.react) {
                framework = 'react';
            } else if (dependencies.vue) {
                framework = 'vue';
            } else if (dependencies.express) {
                framework = 'express';
            }

            return {
                name: packageJson.name || 'unknown',
                description: packageJson.description,
                version: packageJson.version,
                framework,
                dependencies: packageJson.dependencies || {},
                scripts: packageJson.scripts || {}
            };
        } catch (error) {
            throw new Error(`无法读取项目信息: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
}
