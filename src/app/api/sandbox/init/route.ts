import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { createProjectFromTemplate } from "@/lib/templates";
import { ProjectManager } from "@/lib/project-manager";

const projectManager = ProjectManager.getInstance();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type = "nextjs", githubUrl } = body;

    const sandboxPath = path.join(process.cwd(), "sandbox");

    // 如果提供了GitHub URL，从GitHub下载项目
    if (githubUrl) {
      console.log(`📥 从GitHub初始化项目: ${githubUrl}`);

      const result = await projectManager.downloadFromGitHub(githubUrl);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || "从GitHub初始化项目失败",
            details: result
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "项目从GitHub初始化成功",
        path: sandboxPath,
        projectInfo: result.projectInfo,
        source: "github",
        githubUrl
      });
    }

    // 如果没有GitHub URL，使用模板初始化
    // 如果 sandbox 目录存在，先清理它
    try {
      await fs.access(sandboxPath);
      // 如果目录存在，我们直接使用现有的项目
      console.log("Sandbox directory already exists, using existing project");
    } catch {
      // 如果目录不存在，创建新的项目
      console.log("Creating new sandbox project");
      await createProjectFromTemplate(type === "react" ? "react-vite" : "nextjs-starter", sandboxPath);
    }

    return NextResponse.json({
      success: true,
      message: `项目初始化成功 (${type})`,
      path: sandboxPath,
      source: "template",
      type
    });
  } catch (error) {
    console.error("Initialize project error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误"
      },
      { status: 500 }
    );
  }
} 