import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
    try {
        const { fileName, content } = await request.json();

        if (!fileName || content === undefined) {
            return NextResponse.json(
                { error: "文件名和内容不能为空" },
                { status: 400 }
            );
        }

        // 创建沙箱目录
        const sandboxDir = path.join(process.cwd(), "sandbox");
        const filePath = path.join(sandboxDir, fileName);

        // 确保目录存在
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // 写入文件
        await fs.writeFile(filePath, content, "utf-8");

        return NextResponse.json({
            success: true,
            message: `文件 ${fileName} 保存成功`
        });
    } catch (error: any) {
        console.error("保存文件失败:", error);
        return NextResponse.json(
            { error: `保存文件失败: ${error.message}` },
            { status: 500 }
        );
    }
} 