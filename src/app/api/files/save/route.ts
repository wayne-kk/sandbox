import { NextRequest, NextResponse } from 'next/server';
import { PrismaFileStorageService } from '@/lib/services/file-storage.service';

const fileStorage = PrismaFileStorageService.getInstance();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, files, action = 'save', filePath, content } = body;

        if (!projectId) {
            return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
        }

        switch (action) {
            case 'save':
                if (filePath && content !== undefined) {
                    // 单文件保存
                    await fileStorage.saveFile(projectId, filePath, content);
                    return NextResponse.json({
                        success: true,
                        message: `文件 ${filePath} 保存成功`,
                        timestamp: new Date().toISOString()
                    });
                } else if (files && typeof files === 'object') {
                    // 批量保存
                    await fileStorage.saveFiles(projectId, files);
                    return NextResponse.json({
                        success: true,
                        message: `批量保存完成，共 ${Object.keys(files).length} 个文件`,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    return NextResponse.json({ error: '无效的保存参数' }, { status: 400 });
                }

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
        const projectId = searchParams.get('projectId');
        const filePath = searchParams.get('filePath');
        const action = searchParams.get('action') || 'read';

        if (!projectId) {
            return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
        }

        switch (action) {
            case 'read':
                if (filePath) {
                    // 读取单个文件
                    const content = await fileStorage.readFile(projectId, filePath);
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
                    const files = await fileStorage.getProjectFiles(projectId);
                    return NextResponse.json({ files });
                }

            case 'list':
                // 获取文件列表（不包含内容）
                const allFiles = await fileStorage.getProjectFiles(projectId);
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