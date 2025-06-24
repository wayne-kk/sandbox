import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { createProjectFromTemplate } from "@/lib/templates";

export async function POST(request: Request) {
  try {
    const { type = "nextjs" } = await request.json();

    const sandboxPath = path.join(process.cwd(), "sandbox");

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
      path: sandboxPath
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