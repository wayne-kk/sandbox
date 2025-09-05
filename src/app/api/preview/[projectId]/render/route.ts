import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        // 读取sandbox目录中的文件
        const sandboxPath = path.join(process.cwd(), 'sandbox');
        const files: { [path: string]: string } = {};

        // 递归读取文件
        const readDir = async (dir: string, basePath: string = '') => {
            const items = await readdir(dir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                const relativePath = path.join(basePath, item.name);

                if (item.isDirectory()) {
                    if (!['node_modules', '.next', '.git'].includes(item.name)) {
                        await readDir(fullPath, relativePath);
                    }
                } else if (item.isFile()) {
                    if (['.tsx', '.ts', '.jsx', '.js', '.css', '.html', '.json'].some(ext => item.name.endsWith(ext))) {
                        try {
                            const content = await readFile(fullPath, 'utf-8');
                            files[relativePath] = content;
                        } catch (error) {
                            console.warn(`无法读取文件 ${fullPath}:`, error);
                        }
                    }
                }
            }
        };

        await readDir(sandboxPath);

        // 查找主要的组件文件
        const componentFiles = Object.entries(files).filter(([path, content]) =>
            path.endsWith('.tsx') &&
            !path.includes('layout') &&
            !path.includes('page') &&
            content.includes('export')
        );

        if (componentFiles.length === 0) {
            return NextResponse.json({
                success: false,
                error: '没有找到可预览的组件文件'
            }, { status: 404 });
        }

        // 生成预览HTML
        const previewHtml = generatePreviewHtml(componentFiles, files);

        return new NextResponse(previewHtml, {
            headers: {
                'Content-Type': 'text/html',
            },
        });

    } catch (error) {
        console.error('预览渲染失败:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '预览渲染失败' },
            { status: 500 }
        );
    }
}

function generatePreviewHtml(componentFiles: [string, string][], allFiles: { [path: string]: string }): string {
    const mainComponent = componentFiles[0];
    const componentName = extractComponentName(mainComponent[1]);

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>组件预览 - ${componentName}</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            padding: 20px;
        }
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .preview-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .preview-content {
            padding: 40px;
            min-height: 400px;
        }
        .component-info {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .file-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }
        .file-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
        }
        .file-name {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .file-size {
            color: #64748b;
            font-size: 0.875rem;
        }
        .error-message {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .success-message {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #16a34a;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h1>🎨 组件预览</h1>
            <p>生成的React组件实时预览</p>
        </div>
        
        <div class="preview-content">
            <div class="success-message">
                ✅ 组件已成功生成并保存到sandbox目录
            </div>
            
            <div class="component-info">
                <h3>📋 组件信息</h3>
                <p><strong>主组件:</strong> ${componentName}</p>
                <p><strong>文件路径:</strong> ${mainComponent[0]}</p>
                <p><strong>文件大小:</strong> ${mainComponent[1].length} 字符</p>
                <p><strong>生成时间:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div>
                <h3>📁 生成的文件列表</h3>
                <div class="file-list">
                    ${Object.entries(allFiles).map(([filePath, content]) => `
                        <div class="file-item">
                            <div class="file-name">${filePath}</div>
                            <div class="file-size">${content.length} 字符</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
                <button onclick="window.open('http://localhost:3001', '_blank')" 
                        style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 12px;">
                    🚀 查看完整预览
                </button>
                <button onclick="copyCode()" 
                        style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    📋 复制代码
                </button>
            </div>
        </div>
    </div>
    
    <script>
        function copyCode() {
            const code = \`${mainComponent[1].replace(/`/g, '\\`')}\`;
            navigator.clipboard.writeText(code).then(() => {
                alert('代码已复制到剪贴板！');
            }).catch(() => {
                alert('复制失败，请手动复制代码');
            });
        }
        
        // 尝试渲染组件（简化版本）
        try {
            // 这里可以添加更复杂的组件渲染逻辑
            console.log('组件预览页面已加载');
        } catch (error) {
            console.error('预览加载失败:', error);
        }
    </script>
</body>
</html>`;
}

function extractComponentName(content: string): string {
    // 查找 export default 或 export const 的组件
    const defaultMatch = content.match(/export\s+default\s+(\w+)/);
    if (defaultMatch) return defaultMatch[1];

    const constMatch = content.match(/export\s+const\s+(\w+)/);
    if (constMatch) return constMatch[1];

    const functionMatch = content.match(/export\s+function\s+(\w+)/);
    if (functionMatch) return functionMatch[1];

    // 如果找不到，返回第一个大写的标识符
    const componentMatch = content.match(/(\w+):\s*React\.FC|function\s+(\w+)|const\s+(\w+)\s*=/);
    if (componentMatch) return componentMatch[1] || componentMatch[2] || componentMatch[3];

    return 'UnknownComponent';
}
