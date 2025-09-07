import {
    ProjectFile,
    Template,
    TemplateFile
} from '@prisma/client';

// 扩展模板类型
export interface TemplateWithFiles extends Template {
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
    projectId: string;
    templateId: string;
}

// 文件保存请求
export interface SaveFileRequest {
    projectId: string;
    filePath?: string;
    content?: string;
    batch?: { [path: string]: string };
}

// 系统统计信息
export interface SystemStats {
    totalProjects: number;
    totalTemplates: number;
    totalStorageUsedMB: number;
    projectsCreatedToday: number;
}

// 项目统计信息
export interface ProjectStats {
    fileCount: number;
    totalSize: number;
    lastModified: Date | null;
}

// 导出核心Prisma类型
export type {
    ProjectFile,
    Template,
    TemplateFile
};