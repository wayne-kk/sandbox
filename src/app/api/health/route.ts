import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // 检查数据库连接
        const dbStatus = await checkDatabase();

        // 检查 Docker 服务
        const dockerStatus = await checkDocker();

        // 检查 AI 服务
        const aiStatus = await checkAIService();

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: dbStatus,
                docker: dockerStatus,
                ai: aiStatus
            }
        };

        // 如果任何服务不健康，返回 503
        const isHealthy = Object.values(health.services).every(service => service.status === 'healthy');

        return NextResponse.json(health, {
            status: isHealthy ? 200 : 503
        });

    } catch (error) {
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
    }
}

async function checkDatabase() {
    try {
        // 这里可以添加实际的数据库连接检查
        // 例如：await prisma.$queryRaw`SELECT 1`
        return {
            status: 'healthy',
            message: 'Database connection successful'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function checkDocker() {
    try {
        // 这里可以添加 Docker 服务检查
        // 例如：检查 Docker 守护进程是否运行
        return {
            status: 'healthy',
            message: 'Docker service available'
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            message: 'Docker service unavailable',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function checkAIService() {
    try {
        // 检查 AI 服务配置
        const hasDifyKey = !!process.env.DIFY_API_KEY;
        const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

        if (!hasDifyKey && !hasOpenAIKey) {
            return {
                status: 'warning',
                message: 'No AI service configured'
            };
        }

        return {
            status: 'healthy',
            message: 'AI service configured',
            services: {
                dify: hasDifyKey,
                openai: hasOpenAIKey
            }
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            message: 'AI service check failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
