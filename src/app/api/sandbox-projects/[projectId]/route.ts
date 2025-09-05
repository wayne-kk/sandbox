import { NextRequest, NextResponse } from "next/server";
import { SandboxProjectManager } from "@/lib/sandbox-project-manager";

const sandboxManager = SandboxProjectManager.getInstance();

// 获取特定 Sandbox 项目信息
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const project = sandboxManager.getProject(projectId);

        if (!project) {
            return NextResponse.json(
                { success: false, error: "项目不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            project: {
                id: project.id,
                name: project.name,
                port: project.port,
                status: project.status,
                createdAt: project.createdAt,
                lastActiveAt: project.lastActiveAt,
                url: `http://localhost:${project.port}`,
                files: project.files
            }
        });
    } catch (error) {
        console.error("获取 Sandbox 项目失败:", error);
        return NextResponse.json(
            { success: false, error: "获取项目失败" },
            { status: 500 }
        );
    }
}

// 更新 Sandbox 项目文件
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const { files } = await request.json();

        if (!files) {
            return NextResponse.json(
                { success: false, error: "文件内容不能为空" },
                { status: 400 }
            );
        }

        // 检查项目是否存在
        const project = sandboxManager.getProject(projectId);
        if (!project) {
            return NextResponse.json(
                { success: false, error: "项目不存在" },
                { status: 404 }
            );
        }

        // 更新项目文件
        await sandboxManager.updateProjectFiles(projectId, files);

        return NextResponse.json({
            success: true,
            message: "项目文件更新成功"
        });
    } catch (error) {
        console.error("更新 Sandbox 项目失败:", error);
        return NextResponse.json(
            { success: false, error: "更新项目失败" },
            { status: 500 }
        );
    }
}

// 删除 Sandbox 项目
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        // 检查项目是否存在
        const project = sandboxManager.getProject(projectId);
        if (!project) {
            return NextResponse.json(
                { success: false, error: "项目不存在" },
                { status: 404 }
            );
        }

        // 停止项目
        await sandboxManager.stopProject(projectId);

        return NextResponse.json({
            success: true,
            message: "项目删除成功"
        });
    } catch (error) {
        console.error("删除 Sandbox 项目失败:", error);
        return NextResponse.json(
            { success: false, error: "删除项目失败" },
            { status: 500 }
        );
    }
}
