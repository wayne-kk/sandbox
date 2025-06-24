import { NextResponse } from "next/server";
import { templates } from "@/lib/templates";

export async function GET() {
    try {
        const templateList = templates.map((template) => ({
            id: template.name,
            name: template.name,
            description: template.description,
            type: template.type
        }));

        return NextResponse.json({
            success: true,
            templates: templateList
        });
    } catch (error: any) {
        console.error("获取模板列表失败:", error);
        return NextResponse.json(
            { error: `获取模板列表失败: ${error.message}` },
            { status: 500 }
        );
    }
} 