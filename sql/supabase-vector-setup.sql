-- Supabase 向量数据库设置脚本
-- 执行前请确保在 Supabase 项目中启用了 vector 扩展

-- 1. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- 用于文本搜索

-- 2. 创建代码片段向量表
CREATE TABLE IF NOT EXISTS code_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('component', 'function', 'type', 'style', 'config', 'api')),
  code_snippet TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536), -- OpenAI ada-002 维度
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建项目上下文向量表
CREATE TABLE IF NOT EXISTS project_context_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('structure', 'dependencies', 'config', 'api', 'theme')),
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(1536),
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建对话历史向量表
CREATE TABLE IF NOT EXISTS conversation_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  project_id TEXT,
  user_intent TEXT NOT NULL,
  ai_response_summary TEXT,
  embedding vector(1536),
  tokens_saved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建组件库知识向量表
CREATE TABLE IF NOT EXISTS component_knowledge_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_name TEXT NOT NULL,
  component_path TEXT NOT NULL,
  props_info TEXT,
  usage_examples TEXT,
  related_components TEXT[] DEFAULT '{}',
  embedding vector(1536),
  usage_frequency INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建向量索引（提高搜索性能）
CREATE INDEX IF NOT EXISTS code_embeddings_embedding_idx 
ON code_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS project_context_embedding_idx 
ON project_context_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS conversation_embedding_idx 
ON conversation_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS component_knowledge_embedding_idx 
ON component_knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 7. 创建常规索引（提高查询性能）
CREATE INDEX IF NOT EXISTS code_embeddings_project_id_idx ON code_embeddings(project_id);
CREATE INDEX IF NOT EXISTS code_embeddings_file_path_idx ON code_embeddings(file_path);
CREATE INDEX IF NOT EXISTS code_embeddings_content_type_idx ON code_embeddings(content_type);
CREATE INDEX IF NOT EXISTS code_embeddings_tags_idx ON code_embeddings USING GIN(tags);

CREATE INDEX IF NOT EXISTS project_context_project_id_idx ON project_context_embeddings(project_id);
CREATE INDEX IF NOT EXISTS project_context_type_idx ON project_context_embeddings(context_type);
CREATE INDEX IF NOT EXISTS project_context_importance_idx ON project_context_embeddings(importance_score DESC);

CREATE INDEX IF NOT EXISTS conversation_conversation_id_idx ON conversation_embeddings(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_project_id_idx ON conversation_embeddings(project_id);

CREATE INDEX IF NOT EXISTS component_name_idx ON component_knowledge_embeddings(component_name);
CREATE INDEX IF NOT EXISTS component_usage_frequency_idx ON component_knowledge_embeddings(usage_frequency DESC);

-- 8. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_code_embeddings_updated_at BEFORE UPDATE
    ON code_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_context_updated_at BEFORE UPDATE
    ON project_context_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_knowledge_updated_at BEFORE UPDATE
    ON component_knowledge_embeddings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 创建向量搜索函数

-- 搜索代码片段
CREATE OR REPLACE FUNCTION search_code_embeddings(
  search_project_id TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  project_id TEXT,
  file_path TEXT,
  content_type TEXT,
  code_snippet TEXT,
  description TEXT,
  tags TEXT[],
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.project_id,
    ce.file_path,
    ce.content_type,
    ce.code_snippet,
    ce.description,
    ce.tags,
    ce.metadata,
    1 - (ce.embedding <=> query_embedding) AS similarity
  FROM code_embeddings ce
  WHERE ce.project_id = search_project_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 搜索项目上下文
CREATE OR REPLACE FUNCTION search_project_context(
  search_project_id TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 3
)
RETURNS TABLE(
  id UUID,
  project_id TEXT,
  context_type TEXT,
  content TEXT,
  summary TEXT,
  importance_score FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pce.id,
    pce.project_id,
    pce.context_type,
    pce.content,
    pce.summary,
    pce.importance_score,
    1 - (pce.embedding <=> query_embedding) AS similarity
  FROM project_context_embeddings pce
  WHERE pce.project_id = search_project_id
    AND 1 - (pce.embedding <=> query_embedding) > match_threshold
  ORDER BY 
    pce.importance_score DESC,
    pce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 搜索组件知识
CREATE OR REPLACE FUNCTION search_component_knowledge(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  component_name TEXT,
  component_path TEXT,
  props_info TEXT,
  usage_examples TEXT,
  related_components TEXT[],
  usage_frequency INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cke.id,
    cke.component_name,
    cke.component_path,
    cke.props_info,
    cke.usage_examples,
    cke.related_components,
    cke.usage_frequency,
    1 - (cke.embedding <=> query_embedding) AS similarity
  FROM component_knowledge_embeddings cke
  WHERE 1 - (cke.embedding <=> query_embedding) > match_threshold
  ORDER BY 
    cke.usage_frequency DESC,
    cke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 搜索对话历史
CREATE OR REPLACE FUNCTION search_conversation_history(
  search_conversation_id TEXT,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 3
)
RETURNS TABLE(
  id UUID,
  conversation_id TEXT,
  project_id TEXT,
  user_intent TEXT,
  ai_response_summary TEXT,
  tokens_saved INTEGER,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.conversation_id,
    ce.project_id,
    ce.user_intent,
    ce.ai_response_summary,
    ce.tokens_saved,
    1 - (ce.embedding <=> query_embedding) AS similarity,
    ce.created_at
  FROM conversation_embeddings ce
  WHERE ce.conversation_id = search_conversation_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.created_at DESC, ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 10. 创建统计视图
CREATE OR REPLACE VIEW vector_statistics AS
SELECT 
  'code_embeddings' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT project_id) as unique_projects,
  AVG(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as embedding_coverage
FROM code_embeddings
UNION ALL
SELECT 
  'project_context_embeddings' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT project_id) as unique_projects,
  AVG(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as embedding_coverage
FROM project_context_embeddings
UNION ALL
SELECT 
  'conversation_embeddings' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT project_id) as unique_projects,
  AVG(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as embedding_coverage
FROM conversation_embeddings
UNION ALL
SELECT 
  'component_knowledge_embeddings' as table_name,
  COUNT(*) as total_records,
  0 as unique_projects, -- 组件知识不区分项目
  AVG(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as embedding_coverage
FROM component_knowledge_embeddings;

-- 11. 创建清理函数（定期清理旧数据）
CREATE OR REPLACE FUNCTION cleanup_old_vectors(
  days_old INTEGER DEFAULT 30
)
RETURNS TABLE(
  table_name TEXT,
  deleted_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  code_deleted INTEGER;
  conv_deleted INTEGER;
BEGIN
  -- 清理旧的对话记录（保留最近的）
  DELETE FROM conversation_embeddings 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
  GET DIAGNOSTICS conv_deleted = ROW_COUNT;
  
  -- 返回清理结果
  RETURN QUERY VALUES 
    ('conversation_embeddings'::TEXT, conv_deleted);
END;
$$;

-- 12. 设置 RLS (Row Level Security) 策略
-- 注意：根据实际需求调整安全策略

-- 启用 RLS
ALTER TABLE code_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_context_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- 创建基本的访问策略（允许服务密钥访问）
CREATE POLICY "Service role can access all data" ON code_embeddings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all data" ON project_context_embeddings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all data" ON conversation_embeddings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all data" ON component_knowledge_embeddings
  FOR ALL USING (auth.role() = 'service_role');

-- 13. 创建性能监控函数
CREATE OR REPLACE FUNCTION get_vector_performance_stats()
RETURNS TABLE(
  metric_name TEXT,
  metric_value NUMERIC,
  description TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'avg_embedding_generation_time'::TEXT,
    0::NUMERIC, -- 这里可以集成实际的性能监控
    'Average time to generate embeddings'::TEXT
  UNION ALL
  SELECT 
    'total_vector_searches_today'::TEXT,
    0::NUMERIC,
    'Total vector searches performed today'::TEXT
  UNION ALL
  SELECT 
    'index_efficiency'::TEXT,
    1.0::NUMERIC,
    'Vector index performance efficiency'::TEXT;
END;
$$;

-- 14. 添加一些示例数据（可选，用于测试）
-- 注意：实际使用时应该删除此部分

/*
-- 示例组件知识
INSERT INTO component_knowledge_embeddings (
  component_name, 
  component_path, 
  props_info, 
  usage_examples, 
  related_components,
  embedding
) VALUES (
  'Button',
  'components/ui/button.tsx',
  'variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link", size: "default" | "sm" | "lg" | "icon"',
  '<Button variant="outline" size="sm">Click me</Button>',
  ARRAY['Input', 'Form'],
  -- 这里需要实际的向量数据，可以通过 API 生成
  NULL
);
*/

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '向量数据库设置完成！';
  RAISE NOTICE '请确保：';
  RAISE NOTICE '1. 已在 Supabase 项目设置中启用 vector 扩展';
  RAISE NOTICE '2. 配置了正确的环境变量';
  RAISE NOTICE '3. 测试向量搜索功能';
END $$;
