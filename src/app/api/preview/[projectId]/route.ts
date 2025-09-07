import { NextRequest, NextResponse } from 'next/server';
import { RealtimePreviewManager } from '@/lib/preview/realtime-preview';

const previewManager = RealtimePreviewManager.getInstance();

// GET /api/preview/[projectId] - 获取预览状态
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        const status = previewManager.getPreviewStatus(projectId);

        return NextResponse.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('获取预览状态失败:', error);
        return NextResponse.json(
            { error: '获取预览状态失败' },
            { status: 500 }
        );
    }
}

// POST /api/preview/[projectId] - 启动预览
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        // 直接从sandbox目录读取文件
        const fs = await import('fs/promises');
        const path = await import('path');

        const sandboxPath = path.join(process.cwd(), 'sandbox');
        const files: { [path: string]: string } = {};

        try {
            // 读取sandbox目录中的所有文件
            const readDir = async (dir: string, basePath: string = '') => {
                const items = await fs.readdir(dir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    const relativePath = path.join(basePath, item.name);

                    if (item.isDirectory()) {
                        // 跳过node_modules等目录
                        if (!['node_modules', '.next', '.git'].includes(item.name)) {
                            await readDir(fullPath, relativePath);
                        }
                    } else if (item.isFile()) {
                        // 只读取相关文件
                        if (['.tsx', '.ts', '.jsx', '.js', '.css', '.html', '.json'].some(ext => item.name.endsWith(ext))) {
                            try {
                                const content = await fs.readFile(fullPath, 'utf-8');
                                files[relativePath] = content;
                            } catch (error) {
                                console.warn(`无法读取文件 ${fullPath}:`, error);
                            }
                        }
                    }
                }
            };

            await readDir(sandboxPath);
            console.log(`📁 从sandbox目录读取了 ${Object.keys(files).length} 个文件`);

        } catch (error) {
            console.error('读取sandbox文件失败:', error);
            return NextResponse.json({ error: '无法读取项目文件' }, { status: 500 });
        }

        // 启动预览（默认使用React框架）
        const result = await previewManager.startPreview(
            projectId,
            files,
            'react' as 'react' | 'vue' | 'vanilla'
        );

        return NextResponse.json({
            success: true,
            data: {
                url: result.url,
                containerId: result.containerId,
                status: 'running',
                files: files // 返回文件内容供预览页面使用
            }
        });

    } catch (error) {
        console.error('启动预览失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '启动预览失败' },
            { status: 500 }
        );
    }
}

// PUT /api/preview/[projectId] - 更新预览
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        // 直接从sandbox目录读取最新文件
        const fs = await import('fs/promises');
        const path = await import('path');

        const sandboxPath = path.join(process.cwd(), 'sandbox');
        const files: { [path: string]: string } = {};

        try {
            // 读取sandbox目录中的所有文件
            const readDir = async (dir: string, basePath: string = '') => {
                const items = await fs.readdir(dir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    const relativePath = path.join(basePath, item.name);

                    if (item.isDirectory()) {
                        // 跳过node_modules等目录
                        if (!['node_modules', '.next', '.git'].includes(item.name)) {
                            await readDir(fullPath, relativePath);
                        }
                    } else if (item.isFile()) {
                        // 只读取相关文件
                        if (['.tsx', '.ts', '.jsx', '.js', '.css', '.html', '.json'].some(ext => item.name.endsWith(ext))) {
                            try {
                                const content = await fs.readFile(fullPath, 'utf-8');
                                files[relativePath] = content;
                            } catch (error) {
                                console.warn(`无法读取文件 ${fullPath}:`, error);
                            }
                        }
                    }
                }
            };

            await readDir(sandboxPath);
            console.log(`📁 更新预览，从sandbox目录读取了 ${Object.keys(files).length} 个文件`);

        } catch (error) {
            console.error('读取sandbox文件失败:', error);
            return NextResponse.json({ error: '无法读取项目文件' }, { status: 500 });
        }

        // 更新预览
        await previewManager.updatePreview(projectId, files);

        return NextResponse.json({
            success: true,
            message: '预览已更新'
        });

    } catch (error) {
        console.error('更新预览失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '更新预览失败' },
            { status: 500 }
        );
    }
}

// DELETE /api/preview/[projectId] - 停止预览
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        await previewManager.stopPreview(projectId);

        return NextResponse.json({
            success: true,
            message: '预览已停止'
        });

    } catch (error) {
        console.error('停止预览失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '停止预览失败' },
            { status: 500 }
        );
    }
} 