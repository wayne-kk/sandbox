import { prisma } from '@/lib/prisma/client';
import { Project, ProjectFile, Template, ProjectVersion, User, CollaboratorRole } from '@prisma/client';
import crypto from 'crypto';

export interface FileData {
    path: string;
    content: string;
    lastModified: Date;
    size: number;
    hash: string;
    fileType: string;
}

export interface ProjectWithFiles extends Project {
    files: ProjectFile[];
    user: User;
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
     * 从模板创建新项目
     */
    async createProjectFromTemplate(
        userId: string,
        templateId: string,
        projectName: string,
        description?: string
    ): Promise<string> {
        return await prisma.$transaction(async (tx) => {
            // 获取模板信息
            const template = await tx.template.findUnique({
                where: { id: templateId },
                include: { files: true }
            });

            if (!template) {
                throw new Error('模板不存在');
            }

            // 创建项目
            const project = await tx.project.create({
                data: {
                    userId,
                    templateId,
                    name: projectName,
                    description,
                    framework: template.framework,
                    language: template.language,
                    dependencies: template.config,
                }
            });

            // 复制模板文件到项目
            if (template.files.length > 0) {
                await tx.projectFile.createMany({
                    data: template.files.map(file => ({
                        projectId: project.id,
                        filePath: file.filePath,
                        content: file.content,
                        fileType: file.fileType,
                        fileSizeBytes: Buffer.byteLength(file.content, 'utf8'),
                        contentHash: crypto.createHash('md5').update(file.content).digest('hex'),
                    }))
                });
            }

            // 更新模板使用次数
            await tx.template.update({
                where: { id: templateId },
                data: { usageCount: { increment: 1 } }
            });

            // 记录活动日志
            await tx.projectActivity.create({
                data: {
                    projectId: project.id,
                    userId,
                    activityType: 'PROJECT_CREATED',
                    description: `项目 "${projectName}" 创建成功`,
                    metadata: { templateId, templateName: template.name }
                }
            });

            console.log(`✨ 项目创建成功: ${project.id} (基于模板: ${template.name})`);
            return project.id;
        });
    }

    /**
     * 保存单个文件
     */
    async saveFile(
        userId: string,
        projectId: string,
        filePath: string,
        content: string
    ): Promise<void> {
        // 检查权限
        await this.checkProjectPermission(userId, projectId, CollaboratorRole.EDITOR);

        const fileSize = Buffer.byteLength(content, 'utf8');
        const contentHash = crypto.createHash('md5').update(content).digest('hex');
        const fileType = this.getFileType(filePath);

        await prisma.$transaction(async (tx) => {
            // 保存/更新文件
            await tx.projectFile.upsert({
                where: {
                    projectId_filePath: {
                        projectId,
                        filePath
                    }
                },
                update: {
                    content,
                    fileSizeBytes: fileSize,
                    contentHash,
                    lastAccessedAt: new Date(),
                    updatedAt: new Date(),
                },
                create: {
                    projectId,
                    filePath,
                    content,
                    fileType,
                    fileSizeBytes: fileSize,
                    contentHash,
                }
            });

            // 更新项目访问时间
            await tx.project.update({
                where: { id: projectId },
                data: {
                    lastAccessedAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // 记录活动日志
            await tx.projectActivity.create({
                data: {
                    projectId,
                    userId,
                    activityType: 'FILE_UPDATED',
                    description: `文件 ${filePath} 已更新`,
                    metadata: { filePath, fileSize }
                }
            });
        });

        console.log(`💾 文件已保存: ${projectId}/${filePath} (${fileSize} bytes)`);
    }

    /**
     * 批量保存文件
     */
    async saveFiles(
        userId: string,
        projectId: string,
        files: { [path: string]: string }
    ): Promise<void> {
        await this.checkProjectPermission(userId, projectId, CollaboratorRole.EDITOR);

        const fileEntries = Object.entries(files);

        await prisma.$transaction(async (tx) => {
            // 批量保存文件
            for (const [filePath, content] of fileEntries) {
                const fileSize = Buffer.byteLength(content, 'utf8');
                const contentHash = crypto.createHash('md5').update(content).digest('hex');
                const fileType = this.getFileType(filePath);

                await tx.projectFile.upsert({
                    where: {
                        projectId_filePath: {
                            projectId,
                            filePath
                        }
                    },
                    update: {
                        content,
                        fileSizeBytes: fileSize,
                        contentHash,
                        lastAccessedAt: new Date(),
                        updatedAt: new Date(),
                    },
                    create: {
                        projectId,
                        filePath,
                        content,
                        fileType,
                        fileSizeBytes: fileSize,
                        contentHash,
                    }
                });
            }

            // 更新项目时间
            await tx.project.update({
                where: { id: projectId },
                data: {
                    lastAccessedAt: new Date(),
                    updatedAt: new Date()
                }
            });

            // 记录活动
            await tx.projectActivity.create({
                data: {
                    projectId,
                    userId,
                    activityType: 'FILES_BATCH_UPDATED',
                    description: `批量更新 ${fileEntries.length} 个文件`,
                    metadata: {
                        fileCount: fileEntries.length,
                        filePaths: fileEntries.map(([path]) => path)
                    }
                }
            });
        });

        console.log(`💾 批量保存完成: ${projectId} (${fileEntries.length} 个文件)`);
    }

    /**
     * 读取文件
     */
    async readFile(
        userId: string,
        projectId: string,
        filePath: string
    ): Promise<string | null> {
        await this.checkProjectPermission(userId, projectId, CollaboratorRole.VIEWER);

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

        // 更新访问时间（异步，不阻塞）
        prisma.projectFile.update({
            where: { id: file.id },
            data: { lastAccessedAt: new Date() }
        }).catch(console.error);

        return file.content;
    }

    /**
     * 获取项目所有文件
     */
    async getProjectFiles(
        userId: string,
        projectId: string
    ): Promise<{ [path: string]: FileData }> {
        await this.checkProjectPermission(userId, projectId, CollaboratorRole.VIEWER);

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
                size: file.fileSizeBytes,
                hash: file.contentHash,
                fileType: file.fileType
            };
        });

        return fileMap;
    }

    /**
     * 获取项目详情
     */
    async getProject(
        userId: string,
        projectId: string
    ): Promise<ProjectWithFiles | null> {
        await this.checkProjectPermission(userId, projectId, CollaboratorRole.VIEWER);

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                files: {
                    orderBy: { filePath: 'asc' }
                },
                user: true,
                template: true,
            }
        });

        return project;
    }

    /**
     * 创建版本快照
     */
    async createVersion(
        userId: string,
        projectId: string,
        description?: string
    ): Promise<ProjectVersion> {
        await this.checkProjectPermission(userId, projectId, CollaboratorRole.EDITOR);

        return await prisma.$transaction(async (tx) => {
            // 获取项目和文件
            const project = await tx.project.findUnique({
                where: { id: projectId },
                include: { files: true }
            });

            if (!project) {
                throw new Error('项目不存在');
            }

            // 获取当前最大版本号
            const lastVersion = await tx.projectVersion.findFirst({
                where: { projectId },
                orderBy: { versionNumber: 'desc' }
            });

            const newVersionNumber = (lastVersion?.versionNumber || 0) + 1;

            // 创建快照数据
            const snapshotData = {
                project: {
                    id: project.id,
                    name: project.name,
                    framework: project.framework,
                    language: project.language,
                    dependencies: project.dependencies
                },
                files: project.files.reduce((acc, file) => {
                    acc[file.filePath] = {
                        path: file.filePath,
                        content: file.content,
                        fileType: file.fileType,
                        size: file.fileSizeBytes,
                        hash: file.contentHash
                    };
                    return acc;
                }, {} as Record<string, any>),
                timestamp: new Date().toISOString()
            };

            // 创建版本
            const version = await tx.projectVersion.create({
                data: {
                    projectId,
                    versionNumber: newVersionNumber,
                    description: description || `版本 ${newVersionNumber}`,
                    createdBy: userId,
                    snapshotData,
                    fileCount: project.files.length,
                    totalSizeBytes: project.files.reduce((sum, file) => sum + file.fileSizeBytes, 0)
                }
            });

            // 记录活动
            await tx.projectActivity.create({
                data: {
                    projectId,
                    userId,
                    activityType: 'VERSION_CREATED',
                    description: `创建版本 v${newVersionNumber}: ${description || '无描述'}`,
                    metadata: { versionNumber: newVersionNumber, fileCount: project.files.length }
                }
            });

            console.log(`📸 版本快照创建成功: ${projectId} v${newVersionNumber}`);
            return version;
        });
    }

    /**
     * 获取可用模板
     */
    async getTemplates(
        category?: string,
        framework?: string
    ): Promise<Template[]> {
        const where: any = { isPublic: true };

        if (category) where.category = category;
        if (framework) where.framework = framework;

        return await prisma.template.findMany({
            where,
            include: {
                creator: {
                    select: { username: true, displayName: true }
                },
                _count: {
                    select: { projects: true }
                }
            },
            orderBy: [
                { isFeatured: 'desc' },
                { usageCount: 'desc' },
                { createdAt: 'desc' }
            ]
        });
    }

    /**
     * 获取用户项目列表
     */
    async getUserProjects(
        userId: string,
        options: {
            includeArchived?: boolean;
            page?: number;
            limit?: number;
        } = {}
    ): Promise<{
        projects: Project[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const { includeArchived = false, page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;

        const where: any = {
            OR: [
                { userId }, // 用户拥有的项目
                {
                    collaborators: {
                        some: {
                            userId,
                            isActive: true
                        }
                    }
                } // 用户参与的协作项目
            ]
        };

        if (!includeArchived) {
            where.isArchived = false;
        }

        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                include: {
                    user: {
                        select: { username: true, displayName: true }
                    },
                    template: {
                        select: { name: true, displayName: true }
                    },
                    _count: {
                        select: { files: true, versions: true }
                    }
                },
                orderBy: { lastAccessedAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.project.count({ where })
        ]);

        return {
            projects,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * 检查项目权限
     */
    private async checkProjectPermission(
        userId: string,
        projectId: string,
        requiredRole: CollaboratorRole
    ): Promise<void> {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                userId: true,
                isPublic: true,
                collaborators: {
                    where: {
                        userId,
                        isActive: true
                    },
                    select: { role: true }
                }
            }
        });

        if (!project) {
            throw new Error('项目不存在');
        }

        // 项目所有者有所有权限
        if (project.userId === userId) {
            return;
        }

        // 公开项目的查看权限
        if (project.isPublic && requiredRole === CollaboratorRole.VIEWER) {
            return;
        }

        // 检查协作者权限
        const collaborator = project.collaborators[0];
        if (!collaborator) {
            throw new Error('没有访问权限');
        }

        // 权限级别检查
        const roleLevel = {
            [CollaboratorRole.OWNER]: 3,
            [CollaboratorRole.EDITOR]: 2,
            [CollaboratorRole.VIEWER]: 1
        };

        const userLevel = roleLevel[collaborator.role];
        const requiredLevel = roleLevel[requiredRole];

        if (userLevel < requiredLevel) {
            throw new Error('权限不足');
        }
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