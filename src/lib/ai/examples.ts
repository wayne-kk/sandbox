/**
 * AI 模块使用示例
 * 展示如何使用不同的 Dify API 配置
 */

import {
    DifyClient,
    RequirementGenerator,
    ProjectGenerationWorkflow
} from './index';

/**
 * 示例 1: 使用需求清单生成器
 * 使用统一端点和 REQUIRMENT_DIFY_API_KEY 配置
 */
export async function exampleRequirementGeneration() {
    try {
        // 初始化需求清单生成器（使用统一端点）
        const requirementGenerator = RequirementGenerator.getInstance(
            process.env.DIFY_API_ENDPOINT!
        );

        // 生成需求清单
        const requirement = await requirementGenerator.generateRequirements(
            "创建一个电商网站，包含商品展示、购物车、用户登录注册、订单管理等功能",
            {
                projectType: 'nextjs',
                context: '电商项目需求分析'
            }
        );

        console.log('需求清单生成完成:', requirement);
        return requirement;

    } catch (error) {
        console.error('需求清单生成失败:', error);
        throw error;
    }
}

/**
 * 示例 2: 使用组件生成器
 * 使用统一端点和 COMPONENT_DIFY_API_KEY 配置
 */
export async function exampleComponentGeneration() {
    try {
        // 创建组件生成 Dify 客户端（使用统一端点）
        const difyClient = DifyClient.createInstance(
            process.env.DIFY_API_ENDPOINT!,
            process.env.COMPONENT_DIFY_API_KEY!
        );

        // 生成组件代码
        const result = await difyClient.generateUI(
            "创建一个商品展示卡片组件，包含图片、标题、价格和购买按钮",
            {
                projectType: 'nextjs',
                context: '电商商品组件'
            }
        );

        console.log('组件代码生成完成:', result);
        return result;

    } catch (error) {
        console.error('组件代码生成失败:', error);
        throw error;
    }
}

/**
 * 示例 3: 使用完整项目生成工作流
 * 自动配置两个不同的 Dify API
 */
export async function exampleFullProjectGeneration() {
    try {
        // 获取工作流实例
        const workflow = ProjectGenerationWorkflow.getInstance();

        // 配置统一端点和不同密钥
        workflow.configure({
            // 统一的 Dify API 端点
            apiEndpoint: process.env.DIFY_API_ENDPOINT,

            // 不同功能使用不同的密钥
            requirementApiKey: process.env.REQUIRMENT_DIFY_API_KEY,
            componentApiKey: process.env.COMPONENT_DIFY_API_KEY
        });

        // 执行完整项目生成
        const result = await workflow.generateProject(
            "创建一个在线教育平台，包含课程展示、视频播放、用户学习进度追踪、讨论区等功能",
            {
                projectId: 'education-platform',
                projectType: 'nextjs',
                autoStart: true,
                context: '在线教育平台'
            }
        );

        console.log('完整项目生成完成:', result);
        return result;

    } catch (error) {
        console.error('完整项目生成失败:', error);
        throw error;
    }
}

/**
 * 环境变量配置检查
 */
export function checkConfiguration() {
    const config = {
        // 统一的 API 端点
        apiEndpoint: !!process.env.DIFY_API_ENDPOINT,

        // 不同功能的 API 密钥
        requirementApiKey: !!process.env.REQUIRMENT_DIFY_API_KEY,
        componentApiKey: !!process.env.COMPONENT_DIFY_API_KEY
    };

    console.log('环境配置检查:', config);

    // 检查必需的配置
    const missingConfigs = [];
    if (!config.apiEndpoint) missingConfigs.push('DIFY_API_ENDPOINT');
    if (!config.requirementApiKey) missingConfigs.push('REQUIRMENT_DIFY_API_KEY');
    if (!config.componentApiKey) missingConfigs.push('COMPONENT_DIFY_API_KEY');

    if (missingConfigs.length > 0) {
        console.warn('缺少以下环境变量:', missingConfigs);
        return false;
    }

    console.log('✅ 所有必需的环境变量都已配置');
    return true;
}

/**
 * 配置说明
 */
export const CONFIG_GUIDE = {
    description: `
AI 模块使用统一的 Dify API 端点和不同的密钥：

配置项：
- DIFY_API_ENDPOINT: 统一的 Dify API 接口地址
- REQUIRMENT_DIFY_API_KEY: 需求清单生成功能的专用密钥
- COMPONENT_DIFY_API_KEY: 组件代码生成功能的专用密钥

工作原理：
- 使用同一个 API 端点处理不同类型的请求
- 通过不同的 API 密钥区分需求分析和代码生成功能
- 需求清单生成：分析用户需求，生成结构化的项目需求清单
- 组件生成：基于需求清单生成具体的代码文件
  `,

    envExample: `
# .env.local 示例配置
# 统一的 Dify API 端点
DIFY_API_ENDPOINT=https://api.dify.ai/v1/workflows/your-workflow-id/run

# 需求清单生成的专用密钥
REQUIRMENT_DIFY_API_KEY=app-your-requirement-api-key

# 组件生成的专用密钥  
COMPONENT_DIFY_API_KEY=app-your-component-api-key
  `
};
