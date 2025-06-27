import { NextRequest, NextResponse } from 'next/server';
import { UserProjectService } from '@/lib/services/user-project.service';

const projectService = UserProjectService.getInstance();

export async function GET(request: NextRequest) {
    try {
        const projectId = 'cmcep34zs0010zulmw0udboqp';

        console.log(`🔍 测试访问项目: ${projectId}`);

        // 直接从数据库获取项目
        const dbProject = await projectService.prisma.userProject.findUnique({
            where: { id: projectId },
            include: {
                files: true,
                _count: {
                    select: { files: true }
                }
            }
        });

        if (!dbProject) {
            return NextResponse.json({
                success: false,
                error: '项目不存在',
                projectId
            });
        }

        const files: { [path: string]: string } = {};
        dbProject.files.forEach(file => {
            files[file.filePath] = file.content;
        });

        return NextResponse.json({
            success: true,
            data: {
                project: {
                    id: dbProject.id,
                    name: dbProject.name,
                    description: dbProject.description,
                    framework: dbProject.framework,
                    template: dbProject.template,
                    fileCount: dbProject._count.files
                },
                files
            },
            message: '项目访问成功'
        });
    } catch (error) {
        console.error('测试项目访问失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '测试失败'
            },
            { status: 500 }
        );
    }
} 