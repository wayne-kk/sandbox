import {
    User,
    Project,
    ProjectFile,
    Template,
    TemplateFile,
    ProjectVersion,
    ProjectCollaborator,
    ProjectActivity,
    SystemSetting,
    PlanType,
    ProjectStatus,
    CollaboratorRole
} from '@prisma/client';

// 扩展用户类型
export interface UserWithStats extends User {
    _count: {
        projects: number;
        templates: number;
        collaborations: number;
    };
    storageUsagePercent: number;
}

// 扩展项目类型
export interface ProjectWithDetails extends Project {
    user: Pick<User, 'id' | 'username' | 'displayName'>;
    template?: Pick<Template, 'id' | 'name' | 'displayName'> | null;
    files: ProjectFile[];
    _count: {
        files: number;
        versions: number;
        collaborators: number;
    };
}

// 扩展模板类型
export interface TemplateWithFiles extends Template {
    creator?: Pick<User, 'id' | 'username' | 'displayName'> | null;
    files: TemplateFile[];
    _count: {
        projects: number;
    };
}

// 项目文件树结构
export interface FileTreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileTreeNode[];
    file?: ProjectFile;
}

// 版本对比结果
export interface VersionComparison {
    added: string[];
    modified: string[];
    deleted: string[];
    details: {
        [filePath: string]: {
            status: 'added' | 'modified' | 'deleted';
            oldContent?: string;
            newContent?: string;
            sizeDiff?: number;
        };
    };
}

// API响应类型
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    total: number;
    page: number;
    totalPages: number;
}

// 项目创建请求
export interface CreateProjectRequest {
    templateId: string;
    name: string;
    description?: string;
}

// 文件保存请求
export interface SaveFileRequest {
    filePath?: string;
    content?: string;
    batch?: { [path: string]: string };
}

// 协作邀请请求
export interface InviteCollaboratorRequest {
    email: string;
    role: CollaboratorRole;
    permissions?: Record<string, boolean>;
}

// 系统统计信息
export interface SystemStats {
    totalUsers: number;
    totalProjects: number;
    totalTemplates: number;
    totalStorageUsedMB: number;
    activeUsers24h: number;
    projectsCreatedToday: number;
}

// 用户统计信息
export interface UserStats {
    projectsCount: number;
    templatesCount: number;
    collaborationsCount: number;
    storageUsedMB: number;
    storageQuotaMB: number;
    lastActiveAt: Date;
}

// 导出核心Prisma类型
export type {
    User,
    Project,
    ProjectFile,
    Template,
    TemplateFile,
    ProjectVersion,
    ProjectCollaborator,
    ProjectActivity,
    SystemSetting,
    PlanType,
    ProjectStatus,
    CollaboratorRole
}; 