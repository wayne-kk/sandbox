import { NextRequest, NextResponse } from "next/server";
import { SandboxProjectManager } from "@/lib/sandbox-project-manager";

const sandboxManager = SandboxProjectManager.getInstance();

// 获取所有 Sandbox 项目
export async function GET(request: NextRequest) {
    try {
        const projects = sandboxManager.getAllProjects();

        return NextResponse.json({
            success: true,
            projects: projects.map(project => ({
                id: project.id,
                name: project.name,
                port: project.port,
                status: project.status,
                createdAt: project.createdAt,
                lastActiveAt: project.lastActiveAt,
                url: `http://localhost:${project.port}`
            }))
        });
    } catch (error) {
        console.error("获取 Sandbox 项目失败:", error);
        return NextResponse.json(
            { success: false, error: "获取项目列表失败" },
            { status: 500 }
        );
    }
}

// 创建新的 Sandbox 项目
export async function POST(request: NextRequest) {
    try {
        const { projectId, files } = await request.json();

        if (!projectId || !files) {
            return NextResponse.json(
                { success: false, error: "项目ID和文件内容不能为空" },
                { status: 400 }
            );
        }

        // 检查项目是否已存在
        const existingProject = sandboxManager.getProject(projectId);
        if (existingProject) {
            return NextResponse.json(
                { success: false, error: "项目已存在" },
                { status: 409 }
            );
        }

        // 创建新项目
        const project = await sandboxManager.createProject(projectId, files);

        return NextResponse.json({
            success: true,
            project: {
                id: project.id,
                name: project.name,
                port: project.port,
                status: project.status,
                createdAt: project.createdAt,
                url: `http://localhost:${project.port}`
            },
            message: "Sandbox 项目创建成功"
        });
    } catch (error) {
        console.error("创建 Sandbox 项目失败:", error);
        return NextResponse.json(
            { success: false, error: "创建项目失败" },
            { status: 500 }
        );
    }
}
