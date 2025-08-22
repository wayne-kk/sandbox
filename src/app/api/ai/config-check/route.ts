import { NextResponse } from 'next/server';

/**
 * AI 配置检查 API
 * 验证两个不同的 Dify API 配置是否正确
 */
export async function GET() {
    try {
        // 检查统一的 API 端点
        const apiEndpoint = process.env.DIFY_API_ENDPOINT;

        // 检查不同功能的 API 密钥
        const requirementApiKey = process.env.REQUIRMENT_DIFY_API_KEY;
        const componentApiKey = process.env.COMPONENT_DIFY_API_KEY;

        const config = {
            apiEndpoint: {
                configured: !!apiEndpoint,
                description: 'Dify API 接口地址 - 统一的 Dify API 端点'
            },
            requirementGeneration: {
                apiKey: !!requirementApiKey,
                configured: !!(apiEndpoint && requirementApiKey),
                description: '需求清单生成 - 使用 REQUIRMENT_DIFY_API_KEY'
            },
            componentGeneration: {
                apiKey: !!componentApiKey,
                configured: !!(apiEndpoint && componentApiKey),
                description: '组件生成 - 使用 COMPONENT_DIFY_API_KEY'
            }
        };

        const allConfigured = config.apiEndpoint.configured && config.requirementGeneration.configured && config.componentGeneration.configured;

        let recommendations = [];

        if (!config.apiEndpoint.configured) {
            recommendations.push({
                type: 'error',
                message: 'Dify API 端点未配置',
                action: '请设置 DIFY_API_ENDPOINT 环境变量'
            });
        }

        if (!config.requirementGeneration.configured) {
            recommendations.push({
                type: 'error',
                message: '需求清单生成 API 密钥未配置',
                action: '请设置 REQUIRMENT_DIFY_API_KEY 环境变量'
            });
        }

        if (!config.componentGeneration.configured) {
            recommendations.push({
                type: 'error',
                message: '组件生成 API 密钥未配置',
                action: '请设置 COMPONENT_DIFY_API_KEY 环境变量'
            });
        }

        if (allConfigured) {
            recommendations.push({
                type: 'success',
                message: '所有 AI API 配置正确',
                action: '可以开始使用完整项目生成工作流'
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                configuration: config,
                allConfigured,
                recommendations,
                workflow: {
                    step1: {
                        name: '需求分析',
                        api: 'requirement-generation',
                        status: config.requirementGeneration.configured ? 'ready' : 'not-configured'
                    },
                    step2: {
                        name: '代码生成',
                        api: 'component-generation',
                        status: config.componentGeneration.configured ? 'ready' : 'not-configured'
                    }
                }
            }
        });

    } catch (error) {
        console.error('配置检查失败:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '配置检查失败',
            data: {
                allConfigured: false,
                recommendations: [{
                    type: 'error',
                    message: '配置检查过程中发生错误',
                    action: '请检查服务器日志获取详细信息'
                }]
            }
        }, { status: 500 });
    }
}

/**
 * 测试 API 连接
 */
export async function POST(request: Request) {
    try {
        const { testType } = await request.json();

        let testResult;

        if (testType === 'requirement') {
            // 测试需求清单生成 API
            testResult = await testRequirementAPI();
        } else if (testType === 'component') {
            // 测试组件生成 API  
            testResult = await testComponentAPI();
        } else {
            return NextResponse.json({
                success: false,
                error: '无效的测试类型，请使用 "requirement" 或 "component"'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: testResult
        });

    } catch (error) {
        console.error('API 测试失败:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'API 测试失败'
        }, { status: 500 });
    }
}

async function testRequirementAPI() {
    const endpoint = process.env.REQUIREMENT_DIFY_API_ENDPOINT;
    const apiKey = process.env.REQUIRMENT_DIFY_API_KEY;

    if (!endpoint || !apiKey) {
        throw new Error('需求清单生成 API 配置不完整');
    }

    // 这里可以发送一个简单的测试请求
    // 注意：实际测试时请确保不会消耗过多 API 配额
    return {
        endpoint: endpoint.substring(0, 50) + '...',
        apiKeyConfigured: true,
        status: 'configured',
        message: '需求清单生成 API 配置正确'
    };
}

async function testComponentAPI() {
    const endpoint = process.env.DIFY_API_ENDPOINT;
    const apiKey = process.env.DIFY_API_KEY;

    if (!endpoint || !apiKey) {
        throw new Error('组件生成 API 配置不完整');
    }

    // 这里可以发送一个简单的测试请求
    // 注意：实际测试时请确保不会消耗过多 API 配额
    return {
        endpoint: endpoint.substring(0, 50) + '...',
        apiKeyConfigured: true,
        status: 'configured',
        message: '组件生成 API 配置正确'
    };
}
