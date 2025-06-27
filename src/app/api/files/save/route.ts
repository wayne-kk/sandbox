import { NextRequest, NextResponse } from 'next/server';
import { FileStorageManager } from '@/lib/file-storage';

const storageManager = new FileStorageManager();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, files, action = 'save', filePath, content, description } = body;

        if (!userId) {
            return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
        }

        switch (action) {
            case 'save':
                if (filePath && content !== undefined) {
                    // 单文件保存
                    await storageManager.saveFile(userId, filePath, content);
                    return NextResponse.json({
                        success: true,
                        message: `文件 ${filePath} 保存成功`,
                        timestamp: new Date().toISOString()
                    });
                } else if (files && typeof files === 'object') {
                    // 批量保存
                    await storageManager.saveFiles(userId, files);
                    return NextResponse.json({
                        success: true,
                        message: `批量保存完成，共 ${Object.keys(files).length} 个文件`,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    return NextResponse.json({ error: '无效的保存参数' }, { status: 400 });
                }

            case 'createVersion':
                // 创建版本快照
                const version = await storageManager.createVersion(userId, description);
                return NextResponse.json({
                    success: true,
                    version: version.version,
                    message: '版本快照创建成功'
                });

            case 'export':
                // 导出项目
                const exportData = await storageManager.exportProject(userId);
                return new NextResponse(exportData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Disposition': `attachment; filename="${userId}-project.json"`
                    }
                });

            default:
                return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
        }
    } catch (error) {
        console.error('文件保存API错误:', error);
        return NextResponse.json({
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const filePath = searchParams.get('filePath');
        const action = searchParams.get('action') || 'read';

        if (!userId) {
            return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
        }

        switch (action) {
            case 'read':
                if (filePath) {
                    // 读取单个文件
                    const content = await storageManager.readFile(userId, filePath);
                    if (content === null) {
                        return NextResponse.json({ error: '文件不存在' }, { status: 404 });
                    }
                    return NextResponse.json({
                        content,
                        filePath,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    // 获取所有文件
                    const files = await storageManager.getProjectFiles(userId);
                    return NextResponse.json({ files });
                }

            case 'list':
                // 获取文件列表（不包含内容）
                const allFiles = await storageManager.getProjectFiles(userId);
                const fileList = Object.entries(allFiles).map(([path, file]) => ({
                    path: file.path,
                    size: file.size,
                    lastModified: file.lastModified,
                    hash: file.hash
                }));

                return NextResponse.json({
                    files: fileList,
                    total: fileList.length
                });

            default:
                return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
        }
    } catch (error) {
        console.error('文件读取API错误:', error);
        return NextResponse.json({
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 