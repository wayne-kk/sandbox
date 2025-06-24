import { NextResponse } from 'next/server';
import { MultiUserDockerManager } from '@/lib/multi-user-docker';

// 创建单例管理器
const multiUserManager = new MultiUserDockerManager();

// 管理员API - 获取所有容器状态
export async function GET() {
    try {
        const [containers, serverStats] = await Promise.all([
            multiUserManager.getAllContainers(),
            multiUserManager.getServerStats()
        ]);

        // 获取每个容器的详细状态
        const containerDetails = await Promise.all(
            containers.map(async (container) => {
                const stats = await multiUserManager.getContainerStats(container.userId);
                return {
                    ...container,
                    stats,
                    uptime: Date.now() - container.createdAt.getTime(),
                    idleTime: Date.now() - container.lastActiveAt.getTime()
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: {
                containers: containerDetails,
                serverStats,
                summary: {
                    totalUsers: containers.length,
                    activeContainers: containers.filter(c => c.status === 'running').length,
                    inactiveContainers: containers.filter(c => c.status !== 'running').length,
                    portRange: {
                        start: 3001,
                        end: 4000,
                        used: containers.map(c => c.port)
                    }
                }
            }
        });
    } catch (error) {
        console.error('获取容器信息失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

// 管理员API - 容器操作
export async function POST(request: Request) {
    try {
        const { action, userId, resources } = await request.json();

        switch (action) {
            case 'create':
                if (!userId) {
                    return NextResponse.json({
                        success: false,
                        error: '缺少 userId 参数'
                    }, { status: 400 });
                }

                const container = await multiUserManager.createUserContainer(userId, resources);
                return NextResponse.json({
                    success: true,
                    message: `用户 ${userId} 的容器创建成功`,
                    data: container
                });

            case 'remove':
                if (!userId) {
                    return NextResponse.json({
                        success: false,
                        error: '缺少 userId 参数'
                    }, { status: 400 });
                }

                await multiUserManager.removeUserContainer(userId);
                return NextResponse.json({
                    success: true,
                    message: `用户 ${userId} 的容器已移除`
                });

            case 'cleanup':
                // 清理所有非活跃容器
                const beforeCount = multiUserManager.getAllContainers().length;
                await multiUserManager['cleanupInactiveContainers']();
                const afterCount = multiUserManager.getAllContainers().length;

                return NextResponse.json({
                    success: true,
                    message: `清理完成，移除了 ${beforeCount - afterCount} 个非活跃容器`
                });

            case 'stats':
                if (!userId) {
                    return NextResponse.json({
                        success: false,
                        error: '缺少 userId 参数'
                    }, { status: 400 });
                }

                const stats = await multiUserManager.getContainerStats(userId);
                return NextResponse.json({
                    success: true,
                    data: stats
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: '不支持的操作'
                }, { status: 400 });
        }
    } catch (error) {
        console.error('容器操作失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 