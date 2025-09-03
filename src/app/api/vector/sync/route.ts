import { NextRequest, NextResponse } from 'next/server';
import { ProjectVectorizer } from '@/lib/vector/project-vectorizer';
import { EmbeddingService } from '@/lib/vector/embedding-service';

export async function POST(request: NextRequest) {
    try {
        const { projectId, files, action, options } = await request.json();

        if (!projectId) {
            return NextResponse.json(
                { success: false, error: '缺少 projectId 参数' },
                { status: 400 }
            );
        }

        console.log(`🔄 向量同步请求: ${action} for project ${projectId}`);

        const vectorizer = new ProjectVectorizer();
        const embeddingService = new EmbeddingService();

        switch (action) {
            case 'full_sync':
                // 完整项目向量化
                await vectorizer.vectorizeProject(projectId, options?.projectPath || 'sandbox');
                break;

            case 'incremental_sync':
                // 增量文件向量化
                if (!files || typeof files !== 'object') {
                    return NextResponse.json(
                        { success: false, error: '增量同步需要提供 files 参数' },
                        { status: 400 }
                    );
                }

                for (const [filePath, content] of Object.entries(files)) {
                    if (typeof content === 'string') {
                        await vectorizer.updateFileVectors(projectId, filePath, content);
                    }
                }
                break;

            case 'delete_project':
                // 删除项目所有向量
                await embeddingService.deleteProjectVectors(projectId);
                break;

            case 'delete_file':
                // 删除特定文件向量
                const { filePath } = options || {};
                if (!filePath) {
                    return NextResponse.json(
                        { success: false, error: '删除文件向量需要提供 filePath' },
                        { status: 400 }
                    );
                }
                await embeddingService.deleteFileVectors(projectId, filePath);
                break;

            default:
                return NextResponse.json(
                    { success: false, error: `不支持的操作: ${action}` },
                    { status: 400 }
                );
        }

        console.log(`✅ 向量同步完成: ${action} for project ${projectId}`);

        return NextResponse.json({
            success: true,
            message: `向量同步完成: ${action}`,
            data: {
                projectId,
                action,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('向量同步失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '向量同步失败',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const action = searchParams.get('action') || 'stats';

        if (!projectId && action === 'stats') {
            return NextResponse.json(
                { success: false, error: '获取统计信息需要提供 projectId' },
                { status: 400 }
            );
        }

        const embeddingService = new EmbeddingService();

        switch (action) {
            case 'stats':
                // 获取项目向量统计
                const contextRetriever = await import('@/lib/vector/context-retriever');
                const retriever = new contextRetriever.ContextRetriever();
                const stats = await retriever.getContextStats(projectId!);

                return NextResponse.json({
                    success: true,
                    data: {
                        projectId,
                        stats,
                        timestamp: new Date().toISOString()
                    }
                });

            case 'health':
                // 健康检查
                try {
                    // 测试基本的向量操作
                    await embeddingService.generateEmbedding('测试文本');

                    return NextResponse.json({
                        success: true,
                        data: {
                            status: 'healthy',
                            services: {
                                embedding: 'ok',
                                database: 'ok'
                            },
                            timestamp: new Date().toISOString()
                        }
                    });
                } catch (error) {
                    return NextResponse.json({
                        success: false,
                        data: {
                            status: 'unhealthy',
                            error: error instanceof Error ? error.message : '服务异常',
                            timestamp: new Date().toISOString()
                        }
                    });
                }

            default:
                return NextResponse.json(
                    { success: false, error: `不支持的查询操作: ${action}` },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('向量服务查询失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '查询失败'
            },
            { status: 500 }
        );
    }
}
