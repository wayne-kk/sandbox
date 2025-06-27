import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 客户端实例（用于前端）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// 服务端实例（用于服务端操作，跳过RLS）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

// 数据库类型定义
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    username: string;
                    display_name: string | null;
                    avatar_url: string | null;
                    plan_type: 'free' | 'pro' | 'enterprise';
                    storage_quota_mb: number;
                    storage_used_mb: number;
                    created_at: string;
                    updated_at: string;
                    last_active_at: string;
                    is_active: boolean;
                    settings: Record<string, any>;
                };
                Insert: {
                    id?: string;
                    email: string;
                    username: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    plan_type?: 'free' | 'pro' | 'enterprise';
                    storage_quota_mb?: number;
                    storage_used_mb?: number;
                    created_at?: string;
                    updated_at?: string;
                    last_active_at?: string;
                    is_active?: boolean;
                    settings?: Record<string, any>;
                };
                Update: {
                    id?: string;
                    email?: string;
                    username?: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    plan_type?: 'free' | 'pro' | 'enterprise';
                    storage_quota_mb?: number;
                    storage_used_mb?: number;
                    created_at?: string;
                    updated_at?: string;
                    last_active_at?: string;
                    is_active?: boolean;
                    settings?: Record<string, any>;
                };
            };
            templates: {
                Row: {
                    id: string;
                    name: string;
                    display_name: string;
                    description: string | null;
                    category: string;
                    framework: string;
                    language: string;
                    tags: string[];
                    thumbnail_url: string | null;
                    is_public: boolean;
                    is_featured: boolean;
                    created_by: string | null;
                    created_at: string;
                    updated_at: string;
                    usage_count: number;
                    config: Record<string, any>;
                };
                Insert: {
                    id?: string;
                    name: string;
                    display_name: string;
                    description?: string | null;
                    category: string;
                    framework: string;
                    language: string;
                    tags?: string[];
                    thumbnail_url?: string | null;
                    is_public?: boolean;
                    is_featured?: boolean;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    usage_count?: number;
                    config?: Record<string, any>;
                };
                Update: {
                    id?: string;
                    name?: string;
                    display_name?: string;
                    description?: string | null;
                    category?: string;
                    framework?: string;
                    language?: string;
                    tags?: string[];
                    thumbnail_url?: string | null;
                    is_public?: boolean;
                    is_featured?: boolean;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    usage_count?: number;
                    config?: Record<string, any>;
                };
            };
            template_files: {
                Row: {
                    id: string;
                    template_id: string;
                    file_path: string;
                    content: string;
                    file_type: string;
                    is_entry_point: boolean;
                    is_editable: boolean;
                    order_index: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    template_id: string;
                    file_path: string;
                    content: string;
                    file_type: string;
                    is_entry_point?: boolean;
                    is_editable?: boolean;
                    order_index?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    template_id?: string;
                    file_path?: string;
                    content?: string;
                    file_type?: string;
                    is_entry_point?: boolean;
                    is_editable?: boolean;
                    order_index?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            projects: {
                Row: {
                    id: string;
                    user_id: string;
                    template_id: string | null;
                    name: string;
                    description: string | null;
                    is_public: boolean;
                    is_archived: boolean;
                    thumbnail_url: string | null;
                    last_accessed_at: string;
                    created_at: string;
                    updated_at: string;
                    framework: string;
                    language: string;
                    dependencies: Record<string, any>;
                    dev_dependencies: Record<string, any>;
                    build_settings: Record<string, any>;
                    environment_variables: Record<string, any>;
                    view_count: number;
                    fork_count: number;
                    like_count: number;
                    forked_from: string | null;
                    status: 'active' | 'building' | 'error' | 'archived';
                    storage_used_mb: number;
                    search_vector: unknown;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    template_id?: string | null;
                    name: string;
                    description?: string | null;
                    is_public?: boolean;
                    is_archived?: boolean;
                    thumbnail_url?: string | null;
                    last_accessed_at?: string;
                    created_at?: string;
                    updated_at?: string;
                    framework: string;
                    language: string;
                    dependencies?: Record<string, any>;
                    dev_dependencies?: Record<string, any>;
                    build_settings?: Record<string, any>;
                    environment_variables?: Record<string, any>;
                    view_count?: number;
                    fork_count?: number;
                    like_count?: number;
                    forked_from?: string | null;
                    status?: 'active' | 'building' | 'error' | 'archived';
                    storage_used_mb?: number;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    template_id?: string | null;
                    name?: string;
                    description?: string | null;
                    is_public?: boolean;
                    is_archived?: boolean;
                    thumbnail_url?: string | null;
                    last_accessed_at?: string;
                    created_at?: string;
                    updated_at?: string;
                    framework?: string;
                    language?: string;
                    dependencies?: Record<string, any>;
                    dev_dependencies?: Record<string, any>;
                    build_settings?: Record<string, any>;
                    environment_variables?: Record<string, any>;
                    view_count?: number;
                    fork_count?: number;
                    like_count?: number;
                    forked_from?: string | null;
                    status?: 'active' | 'building' | 'error' | 'archived';
                    storage_used_mb?: number;
                };
            };
            project_files: {
                Row: {
                    id: string;
                    project_id: string;
                    file_path: string;
                    content: string;
                    file_type: string;
                    file_size_bytes: number;
                    content_hash: string;
                    is_binary: boolean;
                    encoding: string;
                    created_at: string;
                    updated_at: string;
                    last_accessed_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    file_path: string;
                    content: string;
                    file_type: string;
                    file_size_bytes?: number;
                    content_hash?: string;
                    is_binary?: boolean;
                    encoding?: string;
                    created_at?: string;
                    updated_at?: string;
                    last_accessed_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    file_path?: string;
                    content?: string;
                    file_type?: string;
                    file_size_bytes?: number;
                    content_hash?: string;
                    is_binary?: boolean;
                    encoding?: string;
                    created_at?: string;
                    updated_at?: string;
                    last_accessed_at?: string;
                };
            };
            project_versions: {
                Row: {
                    id: string;
                    project_id: string;
                    version_number: number;
                    description: string | null;
                    tag_name: string | null;
                    created_by: string;
                    created_at: string;
                    snapshot_data: Record<string, any>;
                    changes_summary: Record<string, any>;
                    parent_version_id: string | null;
                    is_major: boolean;
                    is_published: boolean;
                    file_count: number;
                    total_size_bytes: number;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    version_number: number;
                    description?: string | null;
                    tag_name?: string | null;
                    created_by: string;
                    created_at?: string;
                    snapshot_data: Record<string, any>;
                    changes_summary?: Record<string, any>;
                    parent_version_id?: string | null;
                    is_major?: boolean;
                    is_published?: boolean;
                    file_count?: number;
                    total_size_bytes?: number;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    version_number?: number;
                    description?: string | null;
                    tag_name?: string | null;
                    created_by?: string;
                    created_at?: string;
                    snapshot_data?: Record<string, any>;
                    changes_summary?: Record<string, any>;
                    parent_version_id?: string | null;
                    is_major?: boolean;
                    is_published?: boolean;
                    file_count?: number;
                    total_size_bytes?: number;
                };
            };
            project_collaborators: {
                Row: {
                    id: string;
                    project_id: string;
                    user_id: string;
                    role: 'owner' | 'editor' | 'viewer';
                    permissions: Record<string, any>;
                    invited_by: string | null;
                    invited_at: string;
                    accepted_at: string | null;
                    last_active_at: string | null;
                    is_active: boolean;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_id: string;
                    role?: 'owner' | 'editor' | 'viewer';
                    permissions?: Record<string, any>;
                    invited_by?: string | null;
                    invited_at?: string;
                    accepted_at?: string | null;
                    last_active_at?: string | null;
                    is_active?: boolean;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    user_id?: string;
                    role?: 'owner' | 'editor' | 'viewer';
                    permissions?: Record<string, any>;
                    invited_by?: string | null;
                    invited_at?: string;
                    accepted_at?: string | null;
                    last_active_at?: string | null;
                    is_active?: boolean;
                };
            };
            project_activities: {
                Row: {
                    id: string;
                    project_id: string;
                    user_id: string | null;
                    activity_type: string;
                    description: string;
                    metadata: Record<string, any>;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    project_id: string;
                    user_id?: string | null;
                    activity_type: string;
                    description: string;
                    metadata?: Record<string, any>;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    project_id?: string;
                    user_id?: string | null;
                    activity_type?: string;
                    description?: string;
                    metadata?: Record<string, any>;
                    created_at?: string;
                };
            };
            system_settings: {
                Row: {
                    id: string;
                    key: string;
                    value: Record<string, any>;
                    description: string | null;
                    is_public: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    key: string;
                    value: Record<string, any>;
                    description?: string | null;
                    is_public?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    key?: string;
                    value?: Record<string, any>;
                    description?: string | null;
                    is_public?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
    };
}

// 用于创建类型化的Supabase客户端
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin; 