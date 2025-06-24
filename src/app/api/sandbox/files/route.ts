import { NextResponse } from "next/server";
import { DockerManager } from "@/lib/docker";
import fs from "fs/promises";
import path from "path";

const dockerManager = new DockerManager();

export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const useContainer = searchParams.get('container') === 'true';

        if (useContainer) {
            // 从容器中获取文件列表
            const isRunning = await dockerManager.isContainerRunning();
            if (!isRunning) {
                return NextResponse.json({
                    success: false,
                    error: '容器未运行'
                }, { status: 400 });
            }

            const files = await dockerManager.listFiles();
            const fileTree = buildFileTree(files);

            return NextResponse.json({
                success: true,
                files: fileTree,
                source: 'container'
            });
        } else {
            // 从本地文件系统获取（主要用于备份）
            const sandboxPath = path.join(process.cwd(), 'sandbox');
            const files = await scanDirectory(sandboxPath);

            return NextResponse.json({
                success: true,
                files,
                source: 'local'
            });
        }
    } catch (error) {
        console.error('获取文件列表失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { action, filePath, content, useContainer = true } = await request.json();

        if (action === 'read') {
            if (useContainer) {
                // 从容器中读取文件
                const isRunning = await dockerManager.isContainerRunning();
                if (!isRunning) {
                    return NextResponse.json({
                        success: false,
                        error: '容器未运行'
                    }, { status: 400 });
                }

                const fileContent = await dockerManager.readFileFromContainer(filePath);
                return NextResponse.json({
                    success: true,
                    content: fileContent,
                    filePath,
                    source: 'container'
                });
            } else {
                // 从本地读取
                const fullPath = path.join(process.cwd(), 'sandbox', filePath);
                const fileContent = await fs.readFile(fullPath, 'utf-8');
                return NextResponse.json({
                    success: true,
                    content: fileContent,
                    filePath,
                    source: 'local'
                });
            }
        }

        if (action === 'write') {
            if (useContainer) {
                // 写入到容器
                const isRunning = await dockerManager.isContainerRunning();
                if (!isRunning) {
                    return NextResponse.json({
                        success: false,
                        error: '容器未运行'
                    }, { status: 400 });
                }

                await dockerManager.writeFileToContainer(filePath, content);

                // 同时写入本地作为备份
                try {
                    const localPath = path.join(process.cwd(), 'sandbox', filePath);
                    await fs.mkdir(path.dirname(localPath), { recursive: true });
                    await fs.writeFile(localPath, content, 'utf-8');
                } catch (error) {
                    console.warn('本地备份写入失败:', error);
                }

                return NextResponse.json({
                    success: true,
                    message: '文件保存成功',
                    filePath,
                    target: 'container'
                });
            } else {
                // 写入到本地
                const fullPath = path.join(process.cwd(), 'sandbox', filePath);
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, content, 'utf-8');

                return NextResponse.json({
                    success: true,
                    message: '文件保存成功',
                    filePath,
                    target: 'local'
                });
            }
        }

        return NextResponse.json({
            success: false,
            error: '不支持的操作'
        }, { status: 400 });

    } catch (error) {
        console.error('文件操作失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
        }, { status: 500 });
    }
}

// 构建文件树结构
function buildFileTree(files: string[]): FileNode[] {
    const tree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();

    // 按路径深度排序
    files.sort((a, b) => a.split('/').length - b.split('/').length);

    for (const filePath of files) {
        if (!filePath.trim()) continue;

        const parts = filePath.split('/').filter(p => p);
        const fileName = parts[parts.length - 1];
        const dirPath = parts.slice(0, -1).join('/');

        const node: FileNode = {
            name: fileName,
            path: filePath,
            type: 'file'
        };

        if (dirPath) {
            // 确保父目录存在
            if (!pathMap.has(dirPath)) {
                const dirParts = dirPath.split('/');
                for (let i = 1; i <= dirParts.length; i++) {
                    const currentPath = dirParts.slice(0, i).join('/');
                    if (!pathMap.has(currentPath)) {
                        const dirNode: FileNode = {
                            name: dirParts[i - 1],
                            path: currentPath,
                            type: 'directory',
                            children: []
                        };
                        pathMap.set(currentPath, dirNode);

                        // 添加到父目录或根目录
                        const parentPath = dirParts.slice(0, i - 1).join('/');
                        if (parentPath) {
                            const parent = pathMap.get(parentPath);
                            if (parent && parent.children) {
                                parent.children.push(dirNode);
                            }
                        } else {
                            tree.push(dirNode);
                        }
                    }
                }
            }

            const parent = pathMap.get(dirPath);
            if (parent && parent.children) {
                parent.children.push(node);
            }
        } else {
            tree.push(node);
        }

        pathMap.set(filePath, node);
    }

    return tree;
}

// 扫描本地目录
async function scanDirectory(dirPath: string): Promise<FileNode[]> {
    const result: FileNode[] = [];

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            // 跳过特定目录
            if (['.next', 'node_modules', '.git'].includes(entry.name)) {
                continue;
            }

            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(path.join(process.cwd(), 'sandbox'), fullPath);

            if (entry.isDirectory()) {
                const children = await scanDirectory(fullPath);
                result.push({
                    name: entry.name,
                    path: relativePath,
                    type: 'directory',
                    children
                });
            } else if (entry.isFile() && isValidFile(entry.name)) {
                result.push({
                    name: entry.name,
                    path: relativePath,
                    type: 'file'
                });
            }
        }
    } catch (error) {
        console.error(`扫描目录失败: ${dirPath}`, error);
    }

    return result;
}

// 检查是否为有效文件
function isValidFile(fileName: string): boolean {
    const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.scss', '.html'];
    return validExtensions.some(ext => fileName.endsWith(ext)) ||
        ['package.json', 'tsconfig.json', 'next.config.js', 'tailwind.config.js'].includes(fileName);
} 