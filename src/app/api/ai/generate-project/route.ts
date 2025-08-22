import { NextResponse } from 'next/server';
import { ProjectGenerationWorkflow } from '@/lib/ai/project-generation-workflow';

/**
 * 完整项目生成 API
 * 串联需求清单生成和组件生成的完整流程
 */
export async function POST(request: Request) {
    try {
        const {
            prompt,
            projectType = 'nextjs',
            projectId = 'default-project',
            autoStart = false,
            context
        } = await request.json();

        if (!prompt) {
            return NextResponse.json({
                success: false,
                error: '请提供项目描述'
            }, { status: 400 });
        }

        console.log(`🚀 开始完整项目生成流程: ${prompt}`);

        // 获取工作流实例
        const workflow = ProjectGenerationWorkflow.getInstance();

        // 配置工作流（使用统一的 Dify API 端点和不同的密钥）
        workflow.configure({
            // 统一的 Dify API 端点
            apiEndpoint: process.env.DIFY_API_ENDPOINT,

            // 不同功能使用不同的密钥
            componentApiKey: process.env.COMPONENT_DIFY_API_KEY,
            requirementApiKey: process.env.REQUIRMENT_DIFY_API_KEY
        });

        // 检查配置状态
        const configStatus = workflow.getConfigurationStatus();
        if (!configStatus.requirementGeneratorConfigured) {
            return NextResponse.json({
                success: false,
                error: '需求清单生成器配置错误，请检查 DIFY_API_ENDPOINT 和 REQUIRMENT_DIFY_API_KEY'
            }, { status: 500 });
        }

        if (!configStatus.componentGeneratorConfigured) {
            return NextResponse.json({
                success: false,
                error: '组件生成器配置错误，请检查 DIFY_API_ENDPOINT 和 COMPONENT_DIFY_API_KEY'
            }, { status: 500 });
        }

        // 执行完整的项目生成工作流
        const result = await workflow.generateProject(prompt, {
            projectId,
            projectType,
            context,
            autoStart
        });

        console.log(`✅ 项目生成完成: ${projectId}`);

        // 构建返回结果
        const responseData = {
            success: result.success,
            message: '🎉 完整项目生成成功！',
            data: {
                projectId: result.projectId,
                steps: result.steps,

                // 需求清单信息
                requirement: result.requirement ? {
                    title: result.requirement.title,
                    description: result.requirement.description,
                    pagesCount: result.requirement.pages ? result.requirement.pages.length : 0,
                    navigationCount: result.requirement.navigation ? result.requirement.navigation.length : 0,
                    hasFooter: !!result.requirement.footer
                } : null,

                // Section 生成结果信息
                sectionGeneration: result.sectionGenerationResults ? {
                    totalSections: result.sectionGenerationResults.length,
                    successCount: result.sectionGenerationResults.filter(r => r.success).length,
                    failCount: result.sectionGenerationResults.filter(r => !r.success).length,
                    sections: result.sectionGenerationResults.map(s => ({
                        pageName: s.pageName,
                        sectionName: s.sectionName,
                        success: s.success,
                        error: s.error,
                        filesGenerated: s.result ? (s.result.files ? s.result.files.length : 0) : 0
                    }))
                } : null,

                // 项目整合结果信息
                projectIntegration: result.projectIntegrationResult ? {
                    componentsWritten: result.projectIntegrationResult.componentsWritten,
                    integrationFilesWritten: result.projectIntegrationResult.integrationFilesWritten,
                    totalFilesWritten: result.projectIntegrationResult.componentsWritten + result.projectIntegrationResult.integrationFilesWritten,
                    generatedComponents: result.projectIntegrationResult.generatedComponents.map(comp => ({
                        pageName: comp.pageName,
                        sectionName: comp.sectionName,
                        componentName: comp.componentName,
                        filePath: comp.filePath,
                        fileType: comp.fileType
                    }))
                } : null,

                // 生成结果信息（保留用于兼容性）
                generation: result.generationResult ? {
                    filesGenerated: result.generationResult.files.length,
                    files: result.generationResult.files.map(f => ({
                        path: f.path,
                        size: f.content.length,
                        type: f.type
                    })),
                    description: result.generationResult.description,
                    features: result.generationResult.features,
                    dependencies: result.generationResult.dependencies
                } : null,

                // 项目状态信息
                projectStatus: result.projectStatus ? {
                    status: result.projectStatus.status,
                    url: result.projectStatus.url,
                    port: result.projectStatus.port
                } : null,

                // 元数据
                metadata: result.metadata
            }
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('完整项目生成失败:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '项目生成失败',
            message: '项目生成过程中发生错误'
        }, { status: 500 });
    }
}

/**
 * 获取项目生成配置状态
 */
export async function GET() {
    try {
        const workflow = ProjectGenerationWorkflow.getInstance();

        // 尝试配置工作流以检查环境变量
        workflow.configure({
            apiEndpoint: process.env.DIFY_API_ENDPOINT,
            componentApiKey: process.env.COMPONENT_DIFY_API_KEY,
            requirementApiKey: process.env.REQUIRMENT_DIFY_API_KEY
        });

        const configStatus = workflow.getConfigurationStatus();

        return NextResponse.json({
            success: true,
            data: {
                configStatus,
                environment: {
                    apiEndpoint: !!process.env.DIFY_API_ENDPOINT,
                    requirementApiKey: !!process.env.REQUIRMENT_DIFY_API_KEY,
                    componentApiKey: !!process.env.COMPONENT_DIFY_API_KEY
                }
            }
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '获取配置状态失败'
        }, { status: 500 });
    }
}
