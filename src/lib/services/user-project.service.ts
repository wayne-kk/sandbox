import { PrismaClient } from '@prisma/client';
import { TemplateService } from './template.service';

export interface UserProjectInfo {
    id: string;
    name: string;
    description: string | null;
    framework: string;
    template: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastOpenAt: Date;
    fileCount: number;
}

export interface ProjectFiles {
    [filePath: string]: string;
}

export interface CreateProjectRequest {
    name: string;
    description?: string;
    templateName: string;
    framework?: string;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    isPublic?: boolean;
    files?: ProjectFiles;
}

export class UserProjectService {
    private static instance: UserProjectService;
    public prisma: PrismaClient;
    private templateService: TemplateService;

    private constructor() {
        this.prisma = new PrismaClient();
        this.templateService = TemplateService.getInstance();
    }

    static getInstance(): UserProjectService {
        if (!UserProjectService.instance) {
            UserProjectService.instance = new UserProjectService();
        }
        return UserProjectService.instance;
    }

    /**
     * 获取用户的所有项目
     */
    async getUserProjects(userId: string, page: number = 1, limit: number = 20): Promise<{
        projects: UserProjectInfo[];
        total: number;
        hasMore: boolean;
    }> {
        try {
            const offset = (page - 1) * limit;

            const [projects, total] = await Promise.all([
                this.prisma.userProject.findMany({
                    where: { userId },
                    include: {
                        _count: {
                            select: { files: true }
                        }
                    },
                    orderBy: { lastOpenAt: 'desc' },
                    skip: offset,
                    take: limit
                }),
                this.prisma.userProject.count({ where: { userId } })
            ]);

            const projectsInfo: UserProjectInfo[] = projects.map(project => ({
                id: project.id,
                name: project.name,
                description: project.description,
                framework: project.framework,
                template: project.template,
                isPublic: project.isPublic,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                lastOpenAt: project.lastOpenAt,
                fileCount: project._count.files
            }));

            return {
                projects: projectsInfo,
                total,
                hasMore: offset + projects.length < total
            };
        } catch (error) {
            console.error('获取用户项目失败:', error);
            throw new Error('获取用户项目失败');
        }
    }

    /**
     * 根据ID获取项目详情
     */
    async getProject(userId: string, projectId: string): Promise<{
        project: UserProjectInfo;
        files: ProjectFiles;
    } | null> {
        try {
            const project = await this.prisma.userProject.findFirst({
                where: {
                    id: projectId,
                    userId
                },
                include: {
                    files: true,
                    _count: {
                        select: { files: true }
                    }
                }
            });

            if (!project) {
                return null;
            }

            // 更新最后打开时间
            await this.prisma.userProject.update({
                where: { id: projectId },
                data: { lastOpenAt: new Date() }
            });

            const files: ProjectFiles = {};
            project.files.forEach(file => {
                files[file.filePath] = file.content;
            });

            return {
                project: {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    framework: project.framework,
                    template: project.template,
                    isPublic: project.isPublic,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                    lastOpenAt: project.lastOpenAt,
                    fileCount: project._count.files
                },
                files
            };
        } catch (error) {
            console.error('获取项目详情失败:', error);
            throw new Error('获取项目详情失败');
        }
    }

    /**
     * 确保用户存在，如果不存在则创建
     */
    private async ensureUserExists(userId: string): Promise<void> {
        try {
            const existingUser = await this.prisma.user.findUnique({
                where: { id: userId }
            });

            if (!existingUser) {
                // 创建新用户
                await this.prisma.user.create({
                    data: {
                        id: userId,
                        email: `${userId}@anonymous.local`, // 为匿名用户生成邮箱
                        name: `Anonymous User ${userId.split('-')[1]?.toUpperCase() || ''}`,
                    }
                });
                console.log(`👤 创建新用户: ${userId}`);
            }
        } catch (error) {
            console.error('确保用户存在失败:', error);
            throw new Error('用户创建失败');
        }
    }

    /**
     * 创建新项目
     */
    async createProject(userId: string, request: CreateProjectRequest): Promise<string> {
        try {
            // 确保用户存在
            await this.ensureUserExists(userId);

            // 获取模板
            const template = await this.templateService.getTemplate(request.templateName);
            if (!template) {
                throw new Error(`模板 "${request.templateName}" 不存在`);
            }

            // 创建项目
            const project = await this.prisma.userProject.create({
                data: {
                    userId,
                    name: request.name,
                    description: request.description,
                    framework: request.framework || template.framework,
                    template: request.templateName,
                    files: {
                        create: Object.entries(template.files).map(([filePath, content]) => ({
                            filePath,
                            content,
                            language: this.getFileLanguage(filePath),
                            size: Buffer.byteLength(content, 'utf-8')
                        }))
                    }
                }
            });

            console.log(`✅ 项目创建成功: ${project.name} (${project.id})`);
            return project.id;
        } catch (error) {
            console.error('创建项目失败:', error);
            throw new Error(error instanceof Error ? error.message : '创建项目失败');
        }
    }

    /**
     * 更新项目
     */
    async updateProject(userId: string, projectId: string, updates: UpdateProjectRequest): Promise<void> {
        try {
            // 验证项目所有权
            const existingProject = await this.prisma.userProject.findFirst({
                where: { id: projectId, userId }
            });

            if (!existingProject) {
                throw new Error('项目不存在或无权限');
            }

            // 准备更新数据
            const updateData: any = {
                updatedAt: new Date()
            };

            if (updates.name !== undefined) updateData.name = updates.name;
            if (updates.description !== undefined) updateData.description = updates.description;
            if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;

            // 如果有文件更新
            if (updates.files) {
                updateData.files = {
                    deleteMany: {}, // 删除所有现有文件
                    create: Object.entries(updates.files).map(([filePath, content]) => ({
                        filePath,
                        content,
                        language: this.getFileLanguage(filePath),
                        size: Buffer.byteLength(content, 'utf-8')
                    }))
                };
            }

            await this.prisma.userProject.update({
                where: { id: projectId },
                data: updateData
            });

            console.log(`✅ 项目更新成功: ${projectId}`);
        } catch (error) {
            console.error('更新项目失败:', error);
            throw new Error(error instanceof Error ? error.message : '更新项目失败');
        }
    }

    /**
     * 保存单个文件
     */
    async saveFile(userId: string, projectId: string, filePath: string, content: string): Promise<void> {
        try {
            // 验证项目是否存在（不验证用户权限）
            const project = await this.prisma.userProject.findUnique({
                where: { id: projectId }
            });

            if (!project) {
                throw new Error('项目不存在');
            }

            // 保存或更新文件
            await this.prisma.projectFile.upsert({
                where: {
                    projectId_filePath: {
                        projectId,
                        filePath
                    }
                },
                create: {
                    projectId,
                    filePath,
                    content,
                    language: this.getFileLanguage(filePath),
                    size: Buffer.byteLength(content, 'utf-8')
                },
                update: {
                    content,
                    size: Buffer.byteLength(content, 'utf-8'),
                    updatedAt: new Date()
                }
            });

            // 更新项目修改时间
            await this.prisma.userProject.update({
                where: { id: projectId },
                data: { updatedAt: new Date() }
            });

            console.log(`✅ 文件保存成功: ${filePath}`);
        } catch (error) {
            console.error('保存文件失败:', error);
            throw new Error('保存文件失败');
        }
    }

    /**
     * 批量保存文件
     */
    async saveFiles(userId: string, projectId: string, files: ProjectFiles): Promise<void> {
        try {
            // 验证项目是否存在（不验证用户权限）
            const project = await this.prisma.userProject.findUnique({
                where: { id: projectId }
            });

            if (!project) {
                throw new Error('项目不存在');
            }

            await this.prisma.$transaction(async (tx) => {
                // 删除现有文件
                await tx.projectFile.deleteMany({
                    where: { projectId }
                });

                // 创建新文件
                await tx.projectFile.createMany({
                    data: Object.entries(files).map(([filePath, content]) => ({
                        projectId,
                        filePath,
                        content,
                        language: this.getFileLanguage(filePath),
                        size: Buffer.byteLength(content, 'utf-8')
                    }))
                });

                // 更新项目修改时间
                await tx.userProject.update({
                    where: { id: projectId },
                    data: { updatedAt: new Date() }
                });
            });

            console.log(`✅ 批量保存文件成功: ${Object.keys(files).length} 个文件`);
        } catch (error) {
            console.error('批量保存文件失败:', error);
            throw new Error('批量保存文件失败');
        }
    }

    /**
     * 删除项目
     */
    async deleteProject(userId: string, projectId: string): Promise<void> {
        try {
            const result = await this.prisma.userProject.deleteMany({
                where: {
                    id: projectId,
                    userId
                }
            });

            if (result.count === 0) {
                throw new Error('项目不存在或无权限');
            }

            console.log(`✅ 项目删除成功: ${projectId}`);
        } catch (error) {
            console.error('删除项目失败:', error);
            throw new Error('删除项目失败');
        }
    }

    /**
     * 复制项目
     */
    async duplicateProject(userId: string, projectId: string, newName: string): Promise<string> {
        try {
            const originalProject = await this.getProject(userId, projectId);
            if (!originalProject) {
                throw new Error('原项目不存在');
            }

            const newProjectId = await this.createProject(userId, {
                name: newName,
                description: originalProject.project.description || undefined,
                templateName: originalProject.project.template,
                framework: originalProject.project.framework
            });

            // 更新为原项目的文件内容
            await this.saveFiles(userId, newProjectId, originalProject.files);

            console.log(`✅ 项目复制成功: ${newProjectId}`);
            return newProjectId;
        } catch (error) {
            console.error('复制项目失败:', error);
            throw new Error('复制项目失败');
        }
    }

    /**
     * 获取文件语言类型
     */
    private getFileLanguage(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'vue': 'vue',
            'css': 'css',
            'scss': 'scss',
            'less': 'less',
            'html': 'html',
            'json': 'json',
            'md': 'markdown',
            'yml': 'yaml',
            'yaml': 'yaml'
        };
        return languageMap[ext || ''] || 'plaintext';
    }

    /**
     * 搜索项目
     */
    async searchProjects(userId: string, query: string, limit: number = 10): Promise<UserProjectInfo[]> {
        try {
            const projects = await this.prisma.userProject.findMany({
                where: {
                    userId,
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                include: {
                    _count: {
                        select: { files: true }
                    }
                },
                orderBy: { lastOpenAt: 'desc' },
                take: limit
            });

            return projects.map(project => ({
                id: project.id,
                name: project.name,
                description: project.description,
                framework: project.framework,
                template: project.template,
                isPublic: project.isPublic,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                lastOpenAt: project.lastOpenAt,
                fileCount: project._count.files
            }));
        } catch (error) {
            console.error('搜索项目失败:', error);
            throw new Error('搜索项目失败');
        }
    }

    /**
     * 清理资源
     */
    async cleanup(): Promise<void> {
        await this.prisma.$disconnect();
    }
} 