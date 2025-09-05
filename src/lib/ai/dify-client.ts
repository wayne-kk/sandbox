import { ComponentAnalyzer } from './component-analyzer';
import { SmartContextBuilder } from './smart-context-builder';



/**
 * Dify API 客户端适配器
 * 负责与您的 Dify API 服务通信，并提供组件上下文
 */
export class DifyClient {
    private static instance: DifyClient;
    private componentAnalyzer: ComponentAnalyzer;
    private smartContextBuilder: SmartContextBuilder;
    private apiEndpoint: string;
    private conversationId?: string;
    private apiKey: string;

    constructor(apiEndpoint: string, apiKey?: string) {
        this.apiEndpoint = apiEndpoint;
        this.apiKey = apiKey || process.env.DIFY_API_KEY || '';
        this.componentAnalyzer = ComponentAnalyzer.getInstance();
        this.smartContextBuilder = SmartContextBuilder.getInstance();
    }

    static getInstance(apiEndpoint?: string, apiKey?: string): DifyClient {
        if (!DifyClient.instance) {
            if (!apiEndpoint) {
                throw new Error('首次创建 DifyClient 实例时需要提供 API 端点');
            }
            DifyClient.instance = new DifyClient(apiEndpoint, apiKey);
        }
        return DifyClient.instance;
    }

    /**
     * 创建新的 DifyClient 实例（用于不同的 API Key）
     */
    static createInstance(apiEndpoint: string, apiKey: string): DifyClient {
        return new DifyClient(apiEndpoint, apiKey);
    }

    /**
     * 生成 UI 代码
     */
    async generateUI(userPrompt: string, options: GenerateOptions = {}): Promise<GenerateResult> {
        try {
            console.log('🤖 开始使用 Dify 生成 UI 代码...');

            // 1. 获取智能组件上下文

            // 2. 构建完整的提示词
            // const enhancedPrompt = await this.buildEnhancedPrompt(userPrompt, componentContext, options);

            // console.log('🔄 调用 Dify API 接口...', enhancedPrompt);
            // 3. 调用您的 Dify API 接口
            const difyResponse = await this.callDifyAPI(userPrompt, options);
            console.log('🔄 Dify API 接口响应...', difyResponse);
            // 4. 解析和验证响应
            const parsedResult = await this.parseAndValidateResponse(difyResponse);
            console.log('🔄 解析和验证响应...', parsedResult);
            console.log(`✅ Dify 生成完成，共生成 ${parsedResult.files.length} 个文件`);
            return parsedResult;

        } catch (error) {
            console.error('Dify 生成失败:', error);
            throw new Error(`Dify 生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }


    /**
 * 调用您的 Dify API 接口
 */
    private async callDifyAPI(prompt: string, options: GenerateOptions): Promise<any> {
        console.log(`🌐 调用 Dify API 接口: ${this.apiEndpoint}`);
        console.log(`📝 发送给 Dify 的完整提示词长度: ${prompt.length} 字符`);
        console.log(`📋 提示词前 500 字符预览:`, prompt.substring(0, 500) + '...');
        console.log(`📋 options:`, options);

        const requestBody = {
            inputs: {
                query: prompt,
                project_type: options.projectType,
                component_type: options.component_type
            },
            response_mode: "blocking",
            conversation_id: "", // 可以根据需要填写
            user: "abc-123", // 替换为实际的用户标识
        };

        console.log(`📦 发送给 Dify 的请求体:`, requestBody);
        console.log(`🔄 options`, this.apiEndpoint, options);

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey || process.env.COMPONENT_DIFY_API_KEY}`,
                ...options.headers // 允许自定义请求头
            },
            body: JSON.stringify(requestBody)
        });

        console.log('🔄 Dify API 接口响应...', response);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dify API 请求失败: ${response.status} - ${errorText}`);
        }

        // 直接返回 JSON 响应
        return await response.json();
    }

    /**
 * 解析和验证响应
 */
    private async parseAndValidateResponse(difyResponse: any): Promise<GenerateResult> {
        console.log('🔍 开始解析 Dify 响应...');

        // 保存会话 ID（如果有）
        if (difyResponse.conversation_id) {
            this.conversationId = difyResponse.conversation_id;
        }

        // 获取 Dify Workflow 响应内容：data.outputs.text
        const textContent = difyResponse.data?.outputs?.text;

        if (!textContent) {
            console.error('❌ Dify 响应内容为空', difyResponse);
            throw new Error('Dify 响应为空');
        }

        // 解析嵌套的 {"result": "..."} 格式
        const nestedResult = JSON.parse(textContent);

        return this.validateGenerateResult(nestedResult);
    }

    /**
     * 验证生成结果
     */
    private validateGenerateResult(result: any): GenerateResult {
        if (!result.files || !Array.isArray(result.files)) {
            throw new Error('响应格式错误：缺少 files 数组');
        }

        const validatedFiles = result.files.map((file: any) => {
            if (!file.path || !file.content) {
                throw new Error('文件格式错误：缺少 path 或 content');
            }

            return {
                path: file.path,
                content: file.content,
                type: this.detectFileType(file.path)
            };
        });

        return {
            files: validatedFiles,
            description: result.description || '生成的 UI 代码',
            features: result.features || [],
            dependencies: result.dependencies || [],
            metadata: {
                generatedAt: new Date().toISOString(),
                model: 'dify',
                conversationId: this.conversationId
            }
        };
    }


    /**
     * 检测文件类型
     */
    private detectFileType(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase();
        return ext || 'tsx';
    }

    /**
     * 重置会话
     */
    resetConversation(): void {
        this.conversationId = undefined;
        console.log('🔄 Dify 会话已重置');
    }

    /**
     * 获取当前会话 ID
     */
    getCurrentConversationId(): string | undefined {
        return this.conversationId;
    }

    /**
     * 设置会话 ID（用于恢复会话）
     */
    setConversationId(conversationId: string): void {
        this.conversationId = conversationId;
    }
}

// 类型定义
interface GenerateOptions {
    projectType?: 'nextjs' | 'react' | 'vue';
    component_type?: string;
    user?: string;
    headers?: Record<string, string>;
    customParams?: Record<string, any>;
}

interface GenerateResult {
    files: GeneratedFile[];
    description: string;
    features: string[];
    dependencies: string[];
    metadata: {
        generatedAt: string;
        model: string;
        conversationId?: string;
    };
}

interface GeneratedFile {
    path: string;
    content: string;
    type: string;
}

export type { GenerateOptions, GenerateResult, GeneratedFile };
