import { supabaseAdmin } from './supabase-client';
import type { Database } from './supabase-client';
import crypto from 'crypto';

type Tables = Database['public']['Tables'];
type ProjectFile = Tables['project_files']['Row'];
type ProjectVersion = Tables['project_versions']['Row'];
type Project = Tables['projects']['Row'];
type Template = Tables['templates']['Row'];

export interface FileData {
    path: string;
    content: string;
    lastModified: Date;
    size: number;
    hash: string;
    fileType: string;
}

export interface ProjectSnapshot {
    id: string;
    userId: string;
    name: string;
    files: { [path: string]: FileData };
    createdAt: Date;
    description?: string;
    framework: string;
    language: string;
}

export class SupabaseFileStorageManager {
    private memoryCache: Map<string, ProjectSnapshot> = new Map();
    private maxCacheSize = 100;
    private autoSaveInterval = 3000;

    constructor() {
        this.startAutoSaveScheduler();
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
        try {
            // 获取模板信息
            const { data: template, error: templateError } = await supabaseAdmin
                .from('templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (templateError || !template) {
                throw new Error('模板不存在');
            }

            // 获取模板文件
            const { data: templateFiles, error: filesError } = await supabaseAdmin
                .from('template_files')
                .select('*')
                .eq('template_id', templateId)
                .order('order_index');

            if (filesError) {
                throw new Error('获取模板文件失败');
            }

            // 创建项目
            const { data: project, error: projectError } = await supabaseAdmin
                .from('projects')
                .insert({
                    user_id: userId,
                    template_id: templateId,
                    name: projectName,
                    description,
                    framework: template.framework,
                    language: template.language,
                    dependencies: template.config?.dependencies || {},
                    status: 'active'
                })
                .select()
                .single();

            if (projectError || !project) {
                throw new Error('创建项目失败');
            }

            // 复制模板文件到项目
            const projectFiles = templateFiles.map(file => ({
                project_id: project.id,
                file_path: file.file_path,
                content: file.content,
                file_type: file.file_type
            }));

            const { error: insertError } = await supabaseAdmin
                .from('project_files')
                .insert(projectFiles);

            if (insertError) {
                throw new Error('复制模板文件失败');
            }

            console.log(`✨ 项目创建成功: ${project.id} (基于模板: ${template.name})`);
            return project.id;
        } catch (error) {
            console.error('创建项目失败:', error);
            throw error;
        }
    }

    /**
     * 保存单个文件
     */
    async saveFile(userId: string, projectId: string, filePath: string, content: string): Promise<void> {
        try {
            // 计算文件信息
            const fileSize = Buffer.byteLength(content, 'utf8');
            const contentHash = crypto.createHash('md5').update(content).digest('hex');
            const fileType = this.getFileType(filePath);

            // 保存到数据库（使用 upsert）
            const { error } = await supabaseAdmin
                .from('project_files')
                .upsert({
                    project_id: projectId,
                    file_path: filePath,
                    content,
                    file_type: fileType,
                    file_size_bytes: fileSize,
                    content_hash: contentHash,
                    last_accessed_at: new Date().toISOString()
                }, {
                    onConflict: 'project_id,file_path'
                });

            if (error) {
                throw new Error(`保存文件失败: ${error.message}`);
            }

            console.log(`💾 文件已保存: ${projectId}/${filePath} (${fileSize} bytes)`);
        } catch (error) {
            console.error('保存文件失败:', error);
            throw error;
        }
    }

    /**
     * 读取文件
     */
    async readFile(userId: string, projectId: string, filePath: string): Promise<string | null> {
        try {
            // 从数据库读取
            const { data: file, error } = await supabaseAdmin
                .from('project_files')
                .select('content')
                .eq('project_id', projectId)
                .eq('file_path', filePath)
                .single();

            if (error || !file) {
                return null;
            }

            return file.content;
        } catch (error) {
            console.error('读取文件失败:', error);
            return null;
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
            'html': 'html',
            'json': 'json',
            'md': 'markdown'
        };
        return typeMap[ext || ''] || 'text';
    }

    /**
     * 启动自动保存调度器
     */
    private startAutoSaveScheduler(): void {
        setInterval(() => {
            this.performAutoSave();
        }, this.autoSaveInterval);
    }

    /**
     * 执行自动保存
     */
    private async performAutoSave(): Promise<void> {
        // 清理过期缓存
        for (const [projectKey, project] of this.memoryCache.entries()) {
            const cacheAge = Date.now() - project.createdAt.getTime();
            if (cacheAge > 10 * 60 * 1000) {
                this.memoryCache.delete(projectKey);
            }
        }
    }
}
