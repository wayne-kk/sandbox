import { prisma } from '@/lib/prisma/client';
import { ProjectFile, Template, TemplateFile } from '@prisma/client';
import crypto from 'crypto';

// 定义文件数据接口
export interface FileData {
    path: string;
    content: string;
    lastModified: Date;
    size: number;
    hash: string;
    fileType: string;
}

// 定义项目接口（简化版，不依赖用户系统）
export interface Project {
    id: string;
    name: string;
    description?: string | null;
    framework: string;
    language: string;
    templateId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// 定义项目文件接口
export interface ProjectWithFiles extends Project {
    files: ProjectFile[];
    template?: Template | null;
}

export class PrismaFileStorageService {
    private static instance: PrismaFileStorageService;

    public static getInstance(): PrismaFileStorageService {
        if (!PrismaFileStorageService.instance) {
            PrismaFileStorageService.instance = new PrismaFileStorageService();
        }
        return PrismaFileStorageService.instance;
    }

    /**
     * 从模板创建项目文件
     */
    async createProjectFromTemplate(
        projectId: string,
        templateId: string
    ): Promise<void> {
        // 获取模板信息
        const template = await prisma.template.findUnique({
            where: { id: templateId },
            include: { files: true }
        });

        if (!template) {
            throw new Error('模板不存在');
        }

        // 复制模板文件到项目
        if (template.files.length > 0) {
            await prisma.projectFile.createMany({
                data: template.files.map(file => ({
                    projectId,
                    filePath: file.filePath,
                    content: file.content,
                    size: Buffer.byteLength(file.content, 'utf8'),
                    language: this.getFileType(file.filePath),
                }))
            });
        }

        console.log(`✨ 项目文件创建成功: ${projectId} (基于模板: ${template.name})`);
    }

    /**
     * 保存单个文件
     */
    async saveFile(
        projectId: string,
        filePath: string,
        content: string
    ): Promise<void> {
        const fileSize = Buffer.byteLength(content, 'utf8');
        const fileType = this.getFileType(filePath);

        // 保存/更新文件
        await prisma.projectFile.upsert({
            where: {
                projectId_filePath: {
                    projectId,
                    filePath
                }
            },
            update: {
                content,
                size: fileSize,
                language: fileType,
                updatedAt: new Date(),
            },
            create: {
                projectId,
                filePath,
                content,
                size: fileSize,
                language: fileType,
            }
        });

        console.log(`💾 文件已保存: ${projectId}/${filePath} (${fileSize} bytes)`);
    }

    /**
     * 批量保存文件
     */
    async saveFiles(
        projectId: string,
        files: { [path: string]: string }
    ): Promise<void> {
        const fileEntries = Object.entries(files);

        // 批量保存文件
        for (const [filePath, content] of fileEntries) {
            const fileSize = Buffer.byteLength(content, 'utf8');
            const fileType = this.getFileType(filePath);

            await prisma.projectFile.upsert({
                where: {
                    projectId_filePath: {
                        projectId,
                        filePath
                    }
                },
                update: {
                    content,
                    size: fileSize,
                    language: fileType,
                    updatedAt: new Date(),
                },
                create: {
                    projectId,
                    filePath,
                    content,
                    size: fileSize,
                    language: fileType,
                }
            });
        }

        console.log(`💾 批量保存完成: ${projectId} (${fileEntries.length} 个文件)`);
    }

    /**
     * 读取文件
     */
    async readFile(
        projectId: string,
        filePath: string
    ): Promise<string | null> {
        const file = await prisma.projectFile.findUnique({
            where: {
                projectId_filePath: {
                    projectId,
                    filePath
                }
            }
        });

        if (!file) {
            return null;
        }

        return file.content;
    }

    /**
     * 获取项目所有文件
     */
    async getProjectFiles(
        projectId: string
    ): Promise<{ [path: string]: FileData }> {
        const files = await prisma.projectFile.findMany({
            where: { projectId },
            orderBy: { filePath: 'asc' }
        });

        const fileMap: { [path: string]: FileData } = {};
        files.forEach(file => {
            fileMap[file.filePath] = {
                path: file.filePath,
                content: file.content,
                lastModified: file.updatedAt,
                size: file.size,
                hash: crypto.createHash('md5').update(file.content).digest('hex'),
                fileType: file.language || this.getFileType(file.filePath)
            };
        });

        return fileMap;
    }

    /**
     * 删除文件
     */
    async deleteFile(
        projectId: string,
        filePath: string
    ): Promise<void> {
        await prisma.projectFile.delete({
            where: {
                projectId_filePath: {
                    projectId,
                    filePath
                }
            }
        });

        console.log(`🗑️ 文件已删除: ${projectId}/${filePath}`);
    }

    /**
     * 删除项目所有文件
     */
    async deleteProjectFiles(
        projectId: string
    ): Promise<void> {
        await prisma.projectFile.deleteMany({
            where: { projectId }
        });

        console.log(`🗑️ 项目所有文件已删除: ${projectId}`);
    }

    /**
     * 获取可用模板
     */
    async getTemplates(
        framework?: string
    ): Promise<Template[]> {
        const where: any = { isActive: true };

        if (framework) where.framework = framework;

        return await prisma.template.findMany({
            where,
            include: {
                files: true
            },
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ]
        });
    }

    /**
     * 获取模板详情
     */
    async getTemplate(templateId: string): Promise<Template | null> {
        return await prisma.template.findUnique({
            where: { id: templateId },
            include: {
                files: true
            }
        });
    }

    /**
     * 获取项目文件统计
     */
    async getProjectStats(projectId: string): Promise<{
        fileCount: number;
        totalSize: number;
        lastModified: Date | null;
    }> {
        const files = await prisma.projectFile.findMany({
            where: { projectId },
            select: {
                size: true,
                updatedAt: true
            }
        });

        const fileCount = files.length;
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const lastModified = files.length > 0
            ? new Date(Math.max(...files.map(f => f.updatedAt.getTime())))
            : null;

        return {
            fileCount,
            totalSize,
            lastModified
        };
    }

    /**
     * 获取文件类型
     */
    private getFileType(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const typeMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'vue': 'vue',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'html': 'html',
            'htm': 'html',
            'json': 'json',
            'md': 'markdown',
            'yml': 'yaml',
            'yaml': 'yaml',
            'xml': 'xml',
            'svg': 'svg',
            'py': 'python',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'c',
            'hpp': 'cpp'
        };
        return typeMap[ext || ''] || 'text';
    }
}