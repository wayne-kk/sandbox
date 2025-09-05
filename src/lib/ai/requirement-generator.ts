/**
 * 需求清单生成器
 * 负责通过 Dify API 生成项目需求清单
 */
export class RequirementGenerator {
    private static instance: RequirementGenerator;
    private apiEndpoint: string;

    constructor(apiEndpoint?: string) {
        this.apiEndpoint = apiEndpoint || process.env.DIFY_API_ENDPOINT || '';
    }

    static getInstance(apiEndpoint?: string): RequirementGenerator {
        if (!RequirementGenerator.instance) {
            RequirementGenerator.instance = new RequirementGenerator(apiEndpoint);
        }
        return RequirementGenerator.instance;
    }

    /**
     * 生成需求清单
     */
    async generateRequirements(userPrompt: string, options: RequirementOptions = {}): Promise<any> {
        try {
            console.log('📋 开始生成需求清单...');

            // 调用需求清单生成的 Dify API
            const response = await this.callRequirementDifyAPI(userPrompt, options);
            console.log('response111111111', response);

            // 解析和验证响应
            const parsedResult = await this.parseRequirementResponse(response);

            console.log(`✅ 需求清单生成完成`);
            return parsedResult;

        } catch (error) {
            console.error('需求清单生成失败:', error);
            throw new Error(`需求清单生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
 * 调用需求清单生成的 Dify API
 */
    private async callRequirementDifyAPI(prompt: string, options: RequirementOptions): Promise<any> {
        console.log(`🌐 调用需求清单 Dify API: ${this.apiEndpoint}`);

        const requestBody = {
            inputs: {
                query: prompt,
                project_type: options.projectType || 'nextjs',
                context: options.context || ''
            },
            response_mode: "blocking",
            conversation_id: "",
            user: "abc-123",
        };

        console.log(`📦 发送给需求清单 Dify 的请求体:`, requestBody);

        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REQUIRMENT_DIFY_API_KEY}`,
                ...options.headers
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`需求清单 Dify API 请求失败: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    /**
     * 解析需求清单响应
     */
    private async parseRequirementResponse(difyResponse: any): Promise<any> {
        console.log('🔍 开始解析需求清单响应...');

        // 获取 Dify Workflow 响应内容
        const textContent = difyResponse.data?.outputs?.text;

        if (!textContent) {
            console.error('❌ 需求清单 Dify 响应内容为空', difyResponse);
            throw new Error('需求清单 Dify 响应为空');
        }

        // 解析嵌套的 JSON 格式
        let requirementData;
        try {
            requirementData = JSON.parse(textContent);
        } catch (error) {
            console.error('解析需求清单响应失败:', error);
            throw new Error('需求清单响应格式错误');
        }

        console.log('✅ 需求清单解析完成，直接返回原始数据');

        // 直接返回解析后的数据
        return requirementData;
    }
}

// 类型定义
export interface RequirementOptions {
    projectType?: 'nextjs' | 'react' | 'vue';
    context?: string;
    headers?: Record<string, string>;
}

// 简化的类型定义，现在直接返回原始数据
