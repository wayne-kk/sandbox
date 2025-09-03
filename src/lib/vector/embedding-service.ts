import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AzureOpenAI, OpenAI } from 'openai';
import { encode } from 'gpt-tokenizer';

export interface CodeEmbedding {
    id?: string;
    project_id: string;
    file_path: string;
    content_type: 'component' | 'function' | 'type' | 'style' | 'config' | 'api';
    code_snippet: string;
    description: string;
    tags: string[];
    embedding?: number[];
    metadata: Record<string, any>;
}

export interface ProjectContext {
    id?: string;
    project_id: string;
    context_type: 'structure' | 'dependencies' | 'config' | 'api' | 'theme';
    content: string;
    summary: string;
    importance_score: number;
    embedding?: number[];
}

export interface ConversationEmbedding {
    id?: string;
    conversation_id: string;
    project_id: string;
    user_intent: string;
    ai_response_summary: string;
    embedding?: number[];
    tokens_saved: number;
}

export interface ComponentKnowledge {
    id?: string;
    component_name: string;
    component_path: string;
    props_info: string;
    usage_examples: string;
    related_components: string[];
    embedding?: number[];
    usage_frequency: number;
    last_used_at?: Date;
}

export class EmbeddingService {
    private supabase: SupabaseClient;
    private azureOpenAI: AzureOpenAI;
    private openAI: OpenAI;

    constructor() {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            throw new Error('Supabase 配置缺失: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 必须设置');
        }

        if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
            throw new Error('Azure OpenAI 配置缺失: AZURE_OPENAI_API_KEY 和 AZURE_OPENAI_ENDPOINT 必须设置');
        }

        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // 使用 Azure OpenAI 配置 (仅用于向量嵌入)
        this.azureOpenAI = new AzureOpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: process.env.AZURE_OPENAI_ENDPOINT,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-01"
        });

        // 使用 OpenAI 配置 (用于聊天对话)
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI 配置缺失: OPENAI_API_KEY 必须设置');
        }

        this.openAI = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL || undefined
        });
    }

    /**
     * 生成文本向量嵌入
     * 使用 Azure OpenAI text-embedding-3-large 模型
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            // text-embedding-3-large 支持更长的输入，最大 8192 tokens
            const tokens = encode(text);
            const truncatedText = tokens.length > 8000
                ? this.truncateText(text, 8000)
                : text;

            const response = await this.azureOpenAI.embeddings.create({
                model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "text-embedding-3-large",
                input: truncatedText,
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error('生成向量嵌入失败:', error);
            throw new Error(`Azure OpenAI 向量生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 批量生成文本向量嵌入
     * 使用 Azure OpenAI text-embedding-3-large 模型
     */
    async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            // 过滤空文本并截断过长的文本
            const processedTexts = texts
                .filter(text => text.trim().length > 0)
                .map(text => {
                    const tokens = encode(text);
                    return tokens.length > 8000 ? this.truncateText(text, 8000) : text;
                });

            if (processedTexts.length === 0) {
                return [];
            }

            const response = await this.azureOpenAI.embeddings.create({
                model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "text-embedding-3-large",
                input: processedTexts,
            });

            return response.data.map((item: any) => item.embedding);
        } catch (error) {
            console.error('批量生成向量嵌入失败:', error);
            throw new Error(`Azure OpenAI 批量向量生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 存储代码片段向量
     */
    async storeCodeEmbedding(data: Omit<CodeEmbedding, 'id' | 'embedding'>): Promise<string> {
        try {
            // 生成描述 (如果没有提供)
            const description = data.description || await this.generateCodeDescription(data.code_snippet);

            // 生成向量
            const embeddingText = `${description}\n\n文件路径: ${data.file_path}\n类型: ${data.content_type}\n\n${data.code_snippet}`;
            console.log('description', description, 'embeddingText', embeddingText);
            const embedding = await this.generateEmbedding(embeddingText);

            // 提取标签
            const tags = data.tags.length > 0 ? data.tags : this.extractTags(data.code_snippet, data.content_type);

            const { data: result, error } = await this.supabase
                .from('code_embeddings')
                .insert({
                    project_id: data.project_id,
                    file_path: data.file_path,
                    content_type: data.content_type,
                    code_snippet: data.code_snippet,
                    description,
                    tags,
                    embedding,
                    metadata: data.metadata
                })
                .select('id')
                .single();

            if (error) {
                throw new Error(`存储代码向量失败: ${error.message}`);
            }

            console.log(`✅ 代码向量已存储: ${data.file_path} (${data.content_type})`);
            return result.id;
        } catch (error) {
            console.error('存储代码向量失败:', error);
            throw error;
        }
    }

    /**
     * 批量存储代码片段向量
     */
    async storeBatchCodeEmbeddings(dataArray: Omit<CodeEmbedding, 'id' | 'embedding'>[]): Promise<string[]> {
        try {
            if (dataArray.length === 0) return [];

            // 准备批量处理的文本
            const texts: string[] = [];
            const processedData: Array<Omit<CodeEmbedding, 'id' | 'embedding'> & { description: string; tags: string[] }> = [];

            for (const data of dataArray) {
                const description = data.description || await this.generateCodeDescription(data.code_snippet);
                const tags = data.tags.length > 0 ? data.tags : this.extractTags(data.code_snippet, data.content_type);

                const embeddingText = `${description}\n\n文件路径: ${data.file_path}\n类型: ${data.content_type}\n\n${data.code_snippet}`;
                texts.push(embeddingText);

                processedData.push({
                    ...data,
                    description,
                    tags
                });
            }

            // 批量生成向量
            const embeddings = await this.generateBatchEmbeddings(texts);

            // 批量插入数据库
            const insertData = processedData.map((data, index) => ({
                project_id: data.project_id,
                file_path: data.file_path,
                content_type: data.content_type,
                code_snippet: data.code_snippet,
                description: data.description,
                tags: data.tags,
                embedding: embeddings[index],
                metadata: data.metadata
            }));

            const { data: result, error } = await this.supabase
                .from('code_embeddings')
                .insert(insertData)
                .select('id');

            if (error) {
                throw new Error(`批量存储代码向量失败: ${error.message}`);
            }

            console.log(`✅ 批量代码向量已存储: ${result.length} 个文件`);
            return result.map((item: any) => item.id);
        } catch (error) {
            console.error('批量存储代码向量失败:', error);
            throw error;
        }
    }

    /**
     * 存储项目上下文向量
     */
    async storeProjectContext(data: Omit<ProjectContext, 'id' | 'embedding'>): Promise<string> {
        try {
            const summary = data.summary || await this.generateContextSummary(data.content, data.context_type);
            const embeddingText = `${data.context_type}: ${summary}\n\n${data.content}`;
            const embedding = await this.generateEmbedding(embeddingText);

            const { data: result, error } = await this.supabase
                .from('project_context_embeddings')
                .insert({
                    project_id: data.project_id,
                    context_type: data.context_type,
                    content: data.content,
                    summary,
                    embedding,
                    importance_score: data.importance_score
                })
                .select('id')
                .single();

            if (error) {
                throw new Error(`存储项目上下文失败: ${error.message}`);
            }

            console.log(`✅ 项目上下文已存储: ${data.project_id} (${data.context_type})`);
            return result.id;
        } catch (error) {
            console.error('存储项目上下文失败:', error);
            throw error;
        }
    }

    /**
     * 存储对话历史向量
     */
    async storeConversationHistory(data: Omit<ConversationEmbedding, 'id' | 'embedding'>): Promise<string> {
        try {
            const embeddingText = `用户意图: ${data.user_intent}\nAI回应: ${data.ai_response_summary}`;
            const embedding = await this.generateEmbedding(embeddingText);

            const { data: result, error } = await this.supabase
                .from('conversation_embeddings')
                .insert({
                    conversation_id: data.conversation_id,
                    project_id: data.project_id,
                    user_intent: data.user_intent,
                    ai_response_summary: data.ai_response_summary,
                    embedding,
                    tokens_saved: data.tokens_saved
                })
                .select('id')
                .single();

            if (error) {
                throw new Error(`存储对话历史失败: ${error.message}`);
            }

            return result.id;
        } catch (error) {
            console.error('存储对话历史失败:', error);
            throw error;
        }
    }

    /**
     * 存储组件知识向量
     */
    async storeComponentKnowledge(data: Omit<ComponentKnowledge, 'id' | 'embedding'>): Promise<string> {
        try {
            const embeddingText = `组件: ${data.component_name}\n路径: ${data.component_path}\n属性: ${data.props_info}\n用法: ${data.usage_examples}`;
            const embedding = await this.generateEmbedding(embeddingText);

            const { data: result, error } = await this.supabase
                .from('component_knowledge_embeddings')
                .insert({
                    component_name: data.component_name,
                    component_path: data.component_path,
                    props_info: data.props_info,
                    usage_examples: data.usage_examples,
                    related_components: data.related_components,
                    embedding,
                    usage_frequency: data.usage_frequency,
                    last_used_at: data.last_used_at
                })
                .select('id')
                .single();

            if (error) {
                throw new Error(`存储组件知识失败: ${error.message}`);
            }

            return result.id;
        } catch (error) {
            console.error('存储组件知识失败:', error);
            throw error;
        }
    }

    /**
     * 搜索相关代码片段
     */
    async searchRelevantCode(
        projectId: string,
        query: string,
        limit: number = 5,
        threshold: number = 0.7
    ): Promise<CodeEmbedding[]> {
        try {
            const queryEmbedding = await this.generateEmbedding(query);

            const { data, error } = await this.supabase.rpc('search_code_embeddings', {
                search_project_id: projectId,
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: limit
            });

            if (error) {
                throw new Error(`搜索代码失败: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('搜索相关代码失败:', error);
            return [];
        }
    }

    /**
     * 搜索项目上下文
     */
    async searchProjectContext(
        projectId: string,
        query: string,
        limit: number = 3,
        threshold: number = 0.7
    ): Promise<ProjectContext[]> {
        try {
            const queryEmbedding = await this.generateEmbedding(query);

            const { data, error } = await this.supabase.rpc('search_project_context', {
                search_project_id: projectId,
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: limit
            });

            if (error) {
                throw new Error(`搜索项目上下文失败: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('搜索项目上下文失败:', error);
            return [];
        }
    }

    /**
     * 搜索相关组件
     */
    async searchRelevantComponents(
        query: string,
        limit: number = 5,
        threshold: number = 0.7
    ): Promise<ComponentKnowledge[]> {
        try {
            const queryEmbedding = await this.generateEmbedding(query);

            const { data, error } = await this.supabase.rpc('search_component_knowledge', {
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: limit
            });

            if (error) {
                throw new Error(`搜索组件知识失败: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('搜索相关组件失败:', error);
            return [];
        }
    }

    /**
     * 搜索对话历史
     */
    async searchConversationHistory(
        conversationId: string,
        query: string,
        limit: number = 3,
        threshold: number = 0.7
    ): Promise<ConversationEmbedding[]> {
        try {
            const queryEmbedding = await this.generateEmbedding(query);

            const { data, error } = await this.supabase.rpc('search_conversation_history', {
                search_conversation_id: conversationId,
                query_embedding: queryEmbedding,
                match_threshold: threshold,
                match_count: limit
            });

            if (error) {
                throw new Error(`搜索对话历史失败: ${error.message}`);
            }

            return data || [];
        } catch (error) {
            console.error('搜索对话历史失败:', error);
            return [];
        }
    }

    /**
     * 删除项目的所有向量数据
     */
    async deleteProjectVectors(projectId: string): Promise<void> {
        try {
            // 删除代码向量
            await this.supabase
                .from('code_embeddings')
                .delete()
                .eq('project_id', projectId);

            // 删除项目上下文向量
            await this.supabase
                .from('project_context_embeddings')
                .delete()
                .eq('project_id', projectId);

            // 删除对话历史向量
            await this.supabase
                .from('conversation_embeddings')
                .delete()
                .eq('project_id', projectId);

            console.log(`🗑️ 项目向量数据已删除: ${projectId}`);
        } catch (error) {
            console.error('删除项目向量失败:', error);
            throw error;
        }
    }

    /**
     * 删除文件的向量数据
     */
    async deleteFileVectors(projectId: string, filePath: string): Promise<void> {
        try {
            await this.supabase
                .from('code_embeddings')
                .delete()
                .eq('project_id', projectId)
                .eq('file_path', filePath);

            console.log(`🗑️ 文件向量数据已删除: ${filePath}`);
        } catch (error) {
            console.error('删除文件向量失败:', error);
            throw error;
        }
    }

    /**
     * 生成代码描述
     */
    private async generateCodeDescription(code: string): Promise<string> {
        try {
            // 使用 OpenAI 生成简洁描述
            const response = await this.openAI.chat.completions.create({
                model: process.env.OPENAI_MODEL || "gpt-4.1",
                messages: [{
                    role: "user",
                    content: `请用一句话简洁描述这段代码的功能（不超过50字）：\n\n${code.substring(0, 800)}`
                }],
                max_tokens: 100,
                temperature: 0.3
            });

            return response.choices[0].message?.content?.trim() || "代码片段";
        } catch (error) {
            console.warn('生成代码描述失败，使用默认描述:', error);
            // 回退到简单的代码分析
            return this.extractSimpleDescription(code);
        }
    }

    /**
     * 生成上下文摘要
     */
    private async generateContextSummary(content: string, contextType: string): Promise<string> {
        try {
            const response = await this.openAI.chat.completions.create({
                model: process.env.OPENAI_MODEL || "gpt-4",
                messages: [{
                    role: "user",
                    content: `请总结这个${contextType}的关键信息（不超过100字）：\n\n${content.substring(0, 1000)}`
                }],
                max_tokens: 150,
                temperature: 0.3
            });

            return response.choices[0].message?.content?.trim() || `${contextType}配置`;
        } catch (error) {
            console.warn('生成上下文摘要失败，使用默认摘要:', error);
            return `${contextType}配置 - ${content.substring(0, 100)}`;
        }
    }

    /**
     * 提取代码标签
     */
    private extractTags(code: string, contentType: string): string[] {
        const tags: string[] = [contentType];

        // React 相关标签
        if (code.includes('React') || code.includes('JSX')) tags.push('react');
        if (code.includes('useState') || code.includes('useEffect')) tags.push('hooks');
        if (code.includes('export default')) tags.push('component');

        // 样式相关标签
        if (code.includes('className') || code.includes('tailwind')) tags.push('styling');
        if (code.includes('css') || code.includes('styled')) tags.push('css');

        // 功能相关标签
        if (code.includes('async') || code.includes('await')) tags.push('async');
        if (code.includes('fetch') || code.includes('api')) tags.push('api');
        if (code.includes('form') || code.includes('input')) tags.push('form');

        // TypeScript 相关标签
        if (code.includes('interface') || code.includes('type')) tags.push('typescript');

        return [...new Set(tags)]; // 去重
    }

    /**
     * 截断文本以适应 token 限制
     */
    private truncateText(text: string, maxTokens: number): string {
        const tokens = encode(text);
        if (tokens.length <= maxTokens) return text;

        // 简单截断到指定 token 数量
        const truncatedTokens = tokens.slice(0, maxTokens);
        // 这里应该有一个 decode 函数，简化处理
        return text.substring(0, Math.floor(text.length * maxTokens / tokens.length));
    }

    /**
     * 简单的代码描述提取
     */
    private extractSimpleDescription(code: string): string {
        const lines = code.split('\n').filter(line => line.trim());
        const firstLine = lines[0]?.trim() || '';

        // 尝试从函数/组件名提取描述
        if (firstLine.includes('function ')) {
            const match = firstLine.match(/function\s+(\w+)/);
            return match ? `${match[1]} 函数` : '函数定义';
        }

        if (firstLine.includes('const ') && firstLine.includes('=')) {
            const match = firstLine.match(/const\s+(\w+)/);
            return match ? `${match[1]} 定义` : '常量定义';
        }

        if (firstLine.includes('export default')) {
            return '默认导出组件';
        }

        return '代码片段';
    }

    /**
     * 获取 Azure OpenAI 配置信息
     */
    getAzureOpenAIConfig() {
        return {
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-02-01",
            embeddingModel: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "text-embedding-3-large"
        };
    }

    /**
     * 获取 OpenAI 配置信息
     */
    getOpenAIConfig() {
        return {
            apiKey: process.env.OPENAI_API_KEY ? '***已设置***' : '未设置',
            baseURL: process.env.OPENAI_BASE_URL || '默认',
            model: process.env.OPENAI_MODEL || "gpt-4"
        };
    }
}
