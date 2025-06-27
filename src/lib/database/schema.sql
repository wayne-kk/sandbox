-- ===================================
-- Supabase 数据库架构设计
-- 在线代码编辑器完整数据库方案
-- ===================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================
-- 1. 用户表 (users)
-- ===================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
    storage_quota_mb INTEGER DEFAULT 100,
    storage_used_mb INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb
);

-- 添加用户表索引
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- ===================================
-- 2. 模板表 (templates)
-- ===================================
CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'react', 'vue', 'node', 'vanilla', etc.
    framework TEXT NOT NULL, -- 'react', 'next', 'vite', etc.
    language TEXT NOT NULL, -- 'typescript', 'javascript', 'python', etc.
    tags TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb -- 模板配置信息
);

-- 添加模板表索引
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_framework ON public.templates(framework);
CREATE INDEX idx_templates_is_public ON public.templates(is_public);
CREATE INDEX idx_templates_created_at ON public.templates(created_at);

-- ===================================
-- 3. 模板文件表 (template_files)
-- ===================================
CREATE TABLE public.template_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'javascript', 'typescript', 'css', 'html', etc.
    is_entry_point BOOLEAN DEFAULT false,
    is_editable BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加模板文件表索引和约束
CREATE INDEX idx_template_files_template_id ON public.template_files(template_id);
CREATE INDEX idx_template_files_file_path ON public.template_files(file_path);
CREATE UNIQUE INDEX idx_template_files_unique_path ON public.template_files(template_id, file_path);

-- ===================================
-- 4. 项目表 (projects)
-- ===================================
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    thumbnail_url TEXT,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 项目配置
    framework TEXT NOT NULL,
    language TEXT NOT NULL,
    dependencies JSONB DEFAULT '{}'::jsonb,
    dev_dependencies JSONB DEFAULT '{}'::jsonb,
    build_settings JSONB DEFAULT '{}'::jsonb,
    environment_variables JSONB DEFAULT '{}'::jsonb,
    
    -- 统计信息
    view_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- 原项目信息（如果是fork）
    forked_from UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    
    -- 项目状态
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'building', 'error', 'archived')),
    
    -- 存储信息
    storage_used_mb DECIMAL(10,2) DEFAULT 0,
    
    -- 搜索优化
    search_vector tsvector
);

-- 添加项目表索引
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_template_id ON public.projects(template_id);
CREATE INDEX idx_projects_is_public ON public.projects(is_public);
CREATE INDEX idx_projects_created_at ON public.projects(created_at);
CREATE INDEX idx_projects_last_accessed_at ON public.projects(last_accessed_at);
CREATE INDEX idx_projects_framework ON public.projects(framework);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_search_vector ON public.projects USING gin(search_vector);

-- ===================================
-- 5. 项目文件表 (project_files)
-- ===================================
CREATE TABLE public.project_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    content_hash TEXT NOT NULL, -- MD5 hash for change detection
    is_binary BOOLEAN DEFAULT false,
    encoding TEXT DEFAULT 'utf8',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加项目文件表索引和约束
CREATE INDEX idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX idx_project_files_file_path ON public.project_files(file_path);
CREATE INDEX idx_project_files_updated_at ON public.project_files(updated_at);
CREATE INDEX idx_project_files_content_hash ON public.project_files(content_hash);
CREATE UNIQUE INDEX idx_project_files_unique_path ON public.project_files(project_id, file_path);

-- ===================================
-- 6. 项目版本表 (project_versions)
-- ===================================
CREATE TABLE public.project_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    description TEXT,
    tag_name TEXT, -- 如 'v1.0.0'
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 版本快照数据
    snapshot_data JSONB NOT NULL, -- 完整的文件快照
    
    -- 变更信息
    changes_summary JSONB DEFAULT '{}'::jsonb, -- 变更统计
    parent_version_id UUID REFERENCES public.project_versions(id) ON DELETE SET NULL,
    
    -- 版本状态
    is_major BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    
    -- 元数据
    file_count INTEGER DEFAULT 0,
    total_size_bytes INTEGER DEFAULT 0
);

-- 添加项目版本表索引和约束
CREATE INDEX idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX idx_project_versions_version_number ON public.project_versions(version_number);
CREATE INDEX idx_project_versions_created_at ON public.project_versions(created_at);
CREATE INDEX idx_project_versions_tag_name ON public.project_versions(tag_name);
CREATE UNIQUE INDEX idx_project_versions_unique_number ON public.project_versions(project_id, version_number);

-- ===================================
-- 7. 项目协作表 (project_collaborators)
-- ===================================
CREATE TABLE public.project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}'::jsonb,
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- 添加协作表索引和约束
CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE UNIQUE INDEX idx_project_collaborators_unique ON public.project_collaborators(project_id, user_id);

-- ===================================
-- 8. 项目活动日志表 (project_activities)
-- ===================================
CREATE TABLE public.project_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL, -- 'file_created', 'file_updated', 'file_deleted', 'version_created', etc.
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加活动日志表索引
CREATE INDEX idx_project_activities_project_id ON public.project_activities(project_id);
CREATE INDEX idx_project_activities_user_id ON public.project_activities(user_id);
CREATE INDEX idx_project_activities_created_at ON public.project_activities(created_at);
CREATE INDEX idx_project_activities_activity_type ON public.project_activities(activity_type);

-- ===================================
-- 9. 系统配置表 (system_settings)
-- ===================================
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加系统配置表索引
CREATE INDEX idx_system_settings_key ON public.system_settings(key);

-- ===================================
-- 触发器和函数
-- ===================================

-- 更新 updated_at 字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有需要的表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_template_files_updated_at BEFORE UPDATE ON public.template_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_files_updated_at BEFORE UPDATE ON public.project_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 计算文件大小的函数
CREATE OR REPLACE FUNCTION calculate_file_size()
RETURNS TRIGGER AS $$
BEGIN
    NEW.file_size_bytes = length(NEW.content);
    NEW.content_hash = md5(NEW.content);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 project_files 表添加文件大小计算触发器
CREATE TRIGGER calculate_project_file_size BEFORE INSERT OR UPDATE ON public.project_files FOR EACH ROW EXECUTE FUNCTION calculate_file_size();

-- 更新项目存储使用量的函数
CREATE OR REPLACE FUNCTION update_project_storage()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新项目存储使用量
    UPDATE public.projects 
    SET storage_used_mb = (
        SELECT COALESCE(SUM(file_size_bytes), 0) / (1024 * 1024.0)
        FROM public.project_files 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 为 project_files 表添加存储更新触发器
CREATE TRIGGER update_project_storage_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON public.project_files 
    FOR EACH ROW EXECUTE FUNCTION update_project_storage();

-- 更新搜索向量的函数
CREATE OR REPLACE FUNCTION update_project_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector = to_tsvector('english', 
        COALESCE(NEW.name, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(NEW.framework, '') || ' ' || 
        COALESCE(NEW.language, '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 projects 表添加搜索向量更新触发器
CREATE TRIGGER update_projects_search_vector 
    BEFORE INSERT OR UPDATE ON public.projects 
    FOR EACH ROW EXECUTE FUNCTION update_project_search_vector();

-- ===================================
-- Row Level Security (RLS) 策略
-- ===================================

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 项目访问策略
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (
        user_id = auth.uid() OR 
        is_public = true OR
        EXISTS (
            SELECT 1 FROM public.project_collaborators 
            WHERE project_id = id AND user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can create projects" ON public.projects
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_collaborators 
            WHERE project_id = id AND user_id = auth.uid() AND role IN ('owner', 'editor') AND is_active = true
        )
    );

-- 项目文件访问策略
CREATE POLICY "Users can view project files" ON public.project_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND (
                p.user_id = auth.uid() OR 
                p.is_public = true OR
                EXISTS (
                    SELECT 1 FROM public.project_collaborators 
                    WHERE project_id = p.id AND user_id = auth.uid() AND is_active = true
                )
            )
        )
    );

CREATE POLICY "Users can modify project files" ON public.project_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND (
                p.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.project_collaborators 
                    WHERE project_id = p.id AND user_id = auth.uid() AND role IN ('owner', 'editor') AND is_active = true
                )
            )
        )
    );

-- 模板访问策略（公开只读）
CREATE POLICY "Anyone can view public templates" ON public.templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own templates" ON public.templates
    FOR SELECT USING (created_by = auth.uid());

-- ===================================
-- 初始化数据
-- ===================================

-- 插入系统配置
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('max_file_size_mb', '10', '单个文件最大大小限制（MB）', true),
('max_project_files', '100', '单个项目最大文件数', true),
('default_storage_quota_mb', '100', '免费用户默认存储配额（MB）', true),
('pro_storage_quota_mb', '1000', 'Pro用户存储配额（MB）', true),
('enterprise_storage_quota_mb', '10000', '企业用户存储配额（MB）', true);

-- 插入默认模板
INSERT INTO public.templates (name, display_name, description, category, framework, language, is_public, is_featured, config) VALUES
('react-ts-basic', 'React + TypeScript', 'React with TypeScript starter template', 'frontend', 'react', 'typescript', true, true, '{"dependencies": {"react": "^18.0.0", "@types/react": "^18.0.0"}}'),
('vue3-ts-basic', 'Vue 3 + TypeScript', 'Vue 3 with TypeScript starter template', 'frontend', 'vue', 'typescript', true, true, '{"dependencies": {"vue": "^3.0.0"}}'),
('next-js-basic', 'Next.js', 'Next.js full-stack starter template', 'fullstack', 'nextjs', 'typescript', true, true, '{"dependencies": {"next": "^14.0.0", "react": "^18.0.0"}}'),
('node-express-basic', 'Node.js + Express', 'Node.js with Express backend template', 'backend', 'express', 'typescript', true, false, '{"dependencies": {"express": "^4.18.0", "@types/express": "^4.17.0"}}'),
('vanilla-js-basic', 'Vanilla JavaScript', 'Pure JavaScript starter template', 'frontend', 'vanilla', 'javascript', true, false, '{}');

-- 为模板插入示例文件
INSERT INTO public.template_files (template_id, file_path, content, file_type, is_entry_point, order_index) 
SELECT 
    t.id,
    'src/App.tsx',
    'import React from ''react'';

function App() {
  return (
    <div className="App">
      <h1>Hello React + TypeScript!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  );
}

export default App;',
    'typescript',
    true,
    1
FROM public.templates t WHERE t.name = 'react-ts-basic';

-- 注释：实际部署时需要为每个模板插入完整的文件结构 