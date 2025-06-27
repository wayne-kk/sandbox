import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

export interface TemplateInfo {
    id: string;
    name: string;
    displayName: string;
    description: string;
    framework: string;
    files: { [path: string]: string };
}

export interface ProjectTemplate {
    name: string;
    displayName: string;
    description: string;
    framework: string;
    files: { [path: string]: string };
}

export class TemplateService {
    private static instance: TemplateService;
    private prisma: PrismaClient;
    private templatesPath: string;

    private constructor() {
        this.prisma = new PrismaClient();
        this.templatesPath = path.join(process.cwd(), 'templates');
    }

    static getInstance(): TemplateService {
        if (!TemplateService.instance) {
            TemplateService.instance = new TemplateService();
        }
        return TemplateService.instance;
    }

    /**
     * 获取所有可用模板
     */
    async getAvailableTemplates(): Promise<TemplateInfo[]> {
        try {
            // 从数据库获取模板
            const dbTemplates = await this.prisma.template.findMany({
                where: { isActive: true },
                include: { files: true },
                orderBy: { sortOrder: 'asc' }
            });

            const templates: TemplateInfo[] = [];

            for (const template of dbTemplates) {
                const files: { [path: string]: string } = {};
                template.files.forEach(file => {
                    files[file.filePath] = file.content;
                });

                templates.push({
                    id: template.id,
                    name: template.name,
                    displayName: template.displayName,
                    description: template.description || '',
                    framework: template.framework,
                    files
                });
            }

            // 如果数据库中没有模板，从文件系统加载默认模板
            if (templates.length === 0) {
                const defaultTemplate = await this.loadDefaultTemplate();
                if (defaultTemplate) {
                    templates.push(defaultTemplate);
                }
            }

            return templates;
        } catch (error) {
            console.error('获取模板失败:', error);
            // 降级到文件系统模板
            const defaultTemplate = await this.loadDefaultTemplate();
            return defaultTemplate ? [defaultTemplate] : [];
        }
    }

    /**
     * 根据名称获取特定模板
     */
    async getTemplate(templateName: string): Promise<TemplateInfo | null> {
        try {
            const template = await this.prisma.template.findUnique({
                where: { name: templateName },
                include: { files: true }
            });

            if (!template) {
                // 尝试从文件系统加载
                if (templateName === 'default') {
                    return await this.loadDefaultTemplate();
                }
                return null;
            }

            const files: { [path: string]: string } = {};
            template.files.forEach(file => {
                files[file.filePath] = file.content;
            });

            return {
                id: template.id,
                name: template.name,
                displayName: template.displayName,
                description: template.description || '',
                framework: template.framework,
                files
            };
        } catch (error) {
            console.error('获取模板失败:', error);
            return null;
        }
    }

    /**
     * 从sandbox目录加载默认模板
     */
    private async loadDefaultTemplate(): Promise<TemplateInfo | null> {
        try {
            const sandboxPath = path.join(process.cwd(), 'sandbox');
            const files = await this.readDirectoryRecursive(sandboxPath);

            return {
                id: 'default',
                name: 'default',
                displayName: 'React 默认模板',
                description: '基于 Next.js 的 React 开发模板',
                framework: 'react',
                files
            };
        } catch (error) {
            console.error('加载默认模板失败:', error);
            return null;
        }
    }

    /**
     * 递归读取目录中的所有文件
     */
    private async readDirectoryRecursive(dirPath: string, relativePath: string = ''): Promise<{ [path: string]: string }> {
        const files: { [path: string]: string } = {};

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const fileRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

                // 跳过一些不需要的文件和目录
                if (this.shouldIgnoreFile(entry.name)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    const subFiles = await this.readDirectoryRecursive(fullPath, fileRelativePath);
                    Object.assign(files, subFiles);
                } else {
                    try {
                        const content = await fs.readFile(fullPath, 'utf-8');
                        files[fileRelativePath] = content;
                    } catch (error) {
                        console.warn(`读取文件失败: ${fullPath}`, error);
                    }
                }
            }
        } catch (error) {
            console.error(`读取目录失败: ${dirPath}`, error);
        }

        return files;
    }

    /**
     * 判断是否应该忽略某个文件或目录
     */
    private shouldIgnoreFile(name: string): boolean {
        const ignorePatterns = [
            'node_modules',
            '.git',
            '.next',
            'dist',
            'build',
            '.env',
            '.env.local',
            'package-lock.json',
            'yarn.lock',
            '.DS_Store',
            'Thumbs.db'
        ];

        return ignorePatterns.some(pattern =>
            name === pattern || name.startsWith('.') && name !== '.gitignore'
        );
    }

    /**
     * 创建新的模板（管理员功能）
     */
    async createTemplate(template: Omit<ProjectTemplate, 'id'>): Promise<string> {
        try {
            const createdTemplate = await this.prisma.template.create({
                data: {
                    name: template.name,
                    displayName: template.displayName,
                    description: template.description,
                    framework: template.framework,
                    files: {
                        create: Object.entries(template.files).map(([filePath, content]) => ({
                            filePath,
                            content
                        }))
                    }
                }
            });

            return createdTemplate.id;
        } catch (error) {
            console.error('创建模板失败:', error);
            throw new Error('创建模板失败');
        }
    }

    /**
     * 更新模板
     */
    async updateTemplate(templateId: string, updates: Partial<ProjectTemplate>): Promise<void> {
        try {
            await this.prisma.template.update({
                where: { id: templateId },
                data: {
                    displayName: updates.displayName,
                    description: updates.description,
                    framework: updates.framework,
                    ...(updates.files && {
                        files: {
                            deleteMany: {},
                            create: Object.entries(updates.files).map(([filePath, content]) => ({
                                filePath,
                                content
                            }))
                        }
                    })
                }
            });
        } catch (error) {
            console.error('更新模板失败:', error);
            throw new Error('更新模板失败');
        }
    }

    /**
     * 初始化默认模板到数据库
     */
    async initializeDefaultTemplates(): Promise<void> {
        try {
            // 检查是否已有模板
            const count = await this.prisma.template.count();
            if (count > 0) {
                return;
            }

            console.log('正在初始化默认模板...');

            // 从 sandbox 目录加载默认模板
            const defaultTemplate = await this.loadDefaultTemplate();
            if (defaultTemplate) {
                await this.createTemplate({
                    name: 'default',
                    displayName: 'React 默认模板',
                    description: '基于 Next.js 的 React 开发模板，包含基础的组件和样式',
                    framework: 'react',
                    files: defaultTemplate.files
                });

                console.log('✅ 默认模板初始化完成');
            }
        } catch (error) {
            console.error('初始化默认模板失败:', error);
        }
    }

    /**
     * 清理资源
     */
    async cleanup(): Promise<void> {
        await this.prisma.$disconnect();
    }
} 