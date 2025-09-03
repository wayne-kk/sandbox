import { NextRequest, NextResponse } from 'next/server';
import { ErrorFixService } from '@/lib/vector/error-fix-service';

export async function POST(request: NextRequest) {
    try {
        const { projectId, projectPath, action, errorId, suggestionId } = await request.json();

        if (!projectId || !projectPath) {
            return NextResponse.json(
                { error: '缺少必要参数: projectId 和 projectPath' },
                { status: 400 }
            );
        }

        const errorFixService = new ErrorFixService();

        switch (action) {
            case 'detect':
                // 检测项目错误
                const errors = await errorFixService.detectProjectErrors(projectId, projectPath);
                return NextResponse.json({ success: true, errors });

            case 'analyze':
                // 分析特定错误
                if (!errorId) {
                    return NextResponse.json(
                        { error: '分析错误需要提供 errorId' },
                        { status: 400 }
                    );
                }

                // 这里需要从数据库获取错误信息，暂时模拟
                const mockError = {
                    id: errorId,
                    projectId,
                    errorType: 'build' as const,
                    errorMessage: '构建失败',
                    severity: 'medium' as const,
                    status: 'open' as const,
                    createdAt: new Date(),
                    fixAttempts: 0,
                    maxFixAttempts: 3
                };

                const suggestions = await errorFixService.analyzeErrorAndSuggestFixes(
                    projectId,
                    mockError
                );
                return NextResponse.json({ success: true, suggestions });

            case 'fix':
                // 自动修复错误
                if (!errorId || !suggestionId) {
                    return NextResponse.json(
                        { error: '修复错误需要提供 errorId 和 suggestionId' },
                        { status: 400 }
                    );
                }

                // 这里需要从数据库获取错误和建议信息，暂时模拟
                const mockErrorForFix = {
                    id: errorId,
                    projectId,
                    errorType: 'build' as const,
                    errorMessage: '构建失败',
                    severity: 'medium' as const,
                    status: 'open' as const,
                    createdAt: new Date(),
                    fixAttempts: 0,
                    maxFixAttempts: 3
                };

                const mockSuggestion = {
                    id: suggestionId,
                    errorId,
                    description: '修复构建错误',
                    codeChanges: [],
                    confidence: 0.8,
                    reasoning: '基于错误分析的建议',
                    estimatedTime: 5
                };

                const fixResult = await errorFixService.autoFixError(
                    projectId,
                    mockErrorForFix,
                    mockSuggestion,
                    projectPath
                );
                return NextResponse.json({ success: true, fixResult });

            case 'workflow':
                // 启动智能错误修复工作流
                const workflowResult = await errorFixService.intelligentErrorFixWorkflow(
                    projectId,
                    projectPath
                );
                return NextResponse.json({ success: true, workflowResult });

            default:
                return NextResponse.json(
                    { error: '不支持的操作类型' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('错误修复API调用失败:', error);
        return NextResponse.json(
            {
                error: '错误修复服务调用失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const projectPath = searchParams.get('projectPath');

        if (!projectId || !projectPath) {
            return NextResponse.json(
                { error: '缺少必要参数: projectId 和 projectPath' },
                { status: 400 }
            );
        }

        // 获取错误修复状态
        const errorFixService = new ErrorFixService();
        const errors = await errorFixService.detectProjectErrors(projectId, projectPath);

        return NextResponse.json({
            success: true,
            projectId,
            totalErrors: errors.length,
            errors: errors.map(error => ({
                id: error.id,
                type: error.errorType,
                message: error.errorMessage,
                severity: error.severity,
                status: error.status,
                createdAt: error.createdAt
            }))
        });

    } catch (error) {
        console.error('获取错误状态失败:', error);
        return NextResponse.json(
            {
                error: '获取错误状态失败',
                details: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}
