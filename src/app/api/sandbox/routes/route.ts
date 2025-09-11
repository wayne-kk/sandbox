import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface RouteInfo {
    path: string;
    name: string;
    component: string;
    isPage: boolean;
    hasLayout: boolean;
    filePath: string;
}

export async function GET() {
    try {
        const sandboxPath = path.join(process.cwd(), 'sandbox');
        const appPath = path.join(sandboxPath, 'app');

        // 检查 app 目录是否存在
        try {
            await fs.access(appPath);
        } catch (error) {
            return NextResponse.json({
                success: false,
                error: 'Sandbox app 目录不存在'
            }, { status: 404 });
        }

        const routes: RouteInfo[] = [];

        // 递归扫描 app 目录
        const scanDirectory = async (dir: string, routePath: string = ''): Promise<void> => {
            try {
                const items = await fs.readdir(dir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    const relativePath = path.join(routePath, item.name);

                    if (item.isDirectory()) {
                        // 跳过特殊目录
                        if (!['node_modules', '.next', '.git', '__pycache__'].includes(item.name)) {
                            await scanDirectory(fullPath, relativePath);
                        }
                    } else if (item.isFile()) {
                        // 检查是否是页面文件
                        if (item.name === 'page.tsx' || item.name === 'page.ts' || item.name === 'page.jsx' || item.name === 'page.js') {
                            const routeName = routePath || 'home';
                            const componentName = routePath ? routePath.split('/').pop() || 'Page' : 'HomePage';

                            // 检查是否有对应的 layout 文件
                            const layoutPath = path.join(dir, 'layout.tsx');
                            let hasLayout = false;
                            try {
                                await fs.access(layoutPath);
                                hasLayout = true;
                            } catch {
                                // 没有 layout 文件
                            }

                            routes.push({
                                path: routePath ? `/${routePath}` : '/',
                                name: routeName,
                                component: componentName,
                                isPage: true,
                                hasLayout,
                                filePath: relativePath
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn(`扫描目录失败 ${dir}:`, error);
            }
        };

        await scanDirectory(appPath);

        // 按路径排序
        routes.sort((a, b) => {
            if (a.path === '/') return -1;
            if (b.path === '/') return 1;
            return a.path.localeCompare(b.path);
        });

        console.log(`🔍 发现 ${routes.length} 个路由页面:`, routes.map(r => r.path));

        // 检查是否为开发环境
        const isDevelopment = process.env.NODE_ENV === 'development' ||
            process.env.NEXT_PUBLIC_NODE_ENV === 'development' ||
            !process.env.NODE_ENV;

        const baseUrl = isDevelopment ? 'http://localhost:3100' : 'https://sandbox.wayne.beer';

        return NextResponse.json({
            success: true,
            data: {
                routes,
                total: routes.length,
                baseUrl
            }
        });

    } catch (error) {
        console.error('扫描路由失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '扫描路由失败'
        }, { status: 500 });
    }
}
