import { NextRequest, NextResponse } from 'next/server';
import { FileStorageManager } from '@/lib/file-storage';

const storageManager = new FileStorageManager();

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const version = searchParams.get('version');

        if (!userId) {
            return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
        }

        if (version) {
            // 获取特定版本详情
            const versions = await (storageManager as any).getVersionHistory(userId);
            const targetVersion = versions.find((v: any) => v.version === parseInt(version));

            if (!targetVersion) {
                return NextResponse.json({ error: '版本不存在' }, { status: 404 });
            }

            return NextResponse.json({ version: targetVersion });
        } else {
            // 获取版本历史列表
            const versions = await (storageManager as any).getVersionHistory(userId);
            const versionList = versions.map((v: any) => ({
                version: v.version,
                description: v.snapshot.description,
                createdAt: v.snapshot.createdAt,
                changesCount: v.changes.length,
                parentVersion: v.parentVersion
            }));

            return NextResponse.json({ versions: versionList });
        }
    } catch (error) {
        console.error('版本查询API错误:', error);
        return NextResponse.json({
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, action, version, description } = body;

        if (!userId) {
            return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
        }

        switch (action) {
            case 'restore':
                if (!version) {
                    return NextResponse.json({ error: '缺少版本号' }, { status: 400 });
                }

                await storageManager.restoreVersion(userId, parseInt(version));
                return NextResponse.json({
                    success: true,
                    message: `已恢复到版本 ${version}`,
                    timestamp: new Date().toISOString()
                });

            case 'create':
                const newVersion = await storageManager.createVersion(userId, description);
                return NextResponse.json({
                    success: true,
                    version: newVersion.version,
                    message: '版本创建成功'
                });

            default:
                return NextResponse.json({ error: '无效的操作类型' }, { status: 400 });
        }
    } catch (error) {
        console.error('版本操作API错误:', error);
        return NextResponse.json({
            error: '服务器内部错误',
            details: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
} 