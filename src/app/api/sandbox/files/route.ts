import { NextRequest, NextResponse } from 'next/server';
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

interface FileItem {
    path: string;
    content: string;
    isDirectory: boolean;
}

async function readDirectoryRecursive(dirPath: string, basePath: string = ''): Promise<{ [key: string]: string }> {
    const files: { [key: string]: string } = {};

    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
          const fullPath = path.join(dirPath, item.name);
          const relativePath = basePath ? `${basePath}/${item.name}` : item.name;

          // 跳过不需要的目录和文件
          if (item.name.startsWith('.') ||
              item.name === 'node_modules' ||
              item.name === '.next' ||
              item.name === 'dist' ||
              item.name === 'build') {
              continue;
          }

        if (item.isDirectory()) {
            // 递归读取子目录
            const subFiles = await readDirectoryRecursive(fullPath, relativePath);
            Object.assign(files, subFiles);
        } else {
          // 只读取文本文件
          const ext = path.extname(item.name).toLowerCase();
          const textExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.html', '.md', '.json', '.txt', '.yml', '.yaml'];

              if (textExtensions.includes(ext)) {
                  try {
                      const content = await fs.readFile(fullPath, 'utf-8');
                      files[relativePath] = content;
                  } catch (error) {
                      console.error(`Error reading file ${fullPath}:`, error);
                  }
              }
          }
      }
  } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
  }

    return files;
}

export async function GET(request: NextRequest) {
    try {
      const sandboxPath = path.join(process.cwd(), 'sandbox');

      // 检查sandbox目录是否存在
      try {
          await fs.access(sandboxPath);
      } catch {
          return NextResponse.json(
              { success: false, error: 'Sandbox directory not found' },
              { status: 404 }
          );
      }

      // 递归读取所有文件
      const files = await readDirectoryRecursive(sandboxPath);

      return NextResponse.json({
          success: true,
        files,
        count: Object.keys(files).length
    });

    } catch (error) {
        console.error('Error reading sandbox files:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to read sandbox files' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { files } = await request.json();

        if (!files || typeof files !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Invalid files data' },
                { status: 400 }
            );
        }

      const sandboxPath = path.join(process.cwd(), 'sandbox');

      // 写入文件
      for (const [filePath, content] of Object.entries(files)) {
          if (typeof content !== 'string') continue;

        const fullPath = path.join(sandboxPath, filePath);
        const dir = path.dirname(fullPath);

        // 确保目录存在
        await fs.mkdir(dir, { recursive: true });

        // 写入文件
        await fs.writeFile(fullPath, content, 'utf-8');
    }

      return NextResponse.json({
          success: true,
        message: `Updated ${Object.keys(files).length} files`
    });

  } catch (error) {
      console.error('Error writing sandbox files:', error);
      return NextResponse.json(
          { success: false, error: 'Failed to write files' },
          { status: 500 }
      );
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

// 递归删除目录
async function removeDirectoryRecursive(dirPath: string): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            await removeDirectoryRecursive(fullPath);
        } else {
            await fs.unlink(fullPath);
        }
    }

    await fs.rmdir(dirPath);
}

// 检查并删除空的父级目录
async function removeEmptyParentDirectories(dirPath: string, sandboxPath: string): Promise<string[]> {
    const removedDirs: string[] = [];
    let currentPath = path.dirname(dirPath);

    // 确保不会删除 sandbox 目录本身
    while (currentPath !== sandboxPath && currentPath !== path.dirname(sandboxPath)) {
        try {
            const entries = await fs.readdir(currentPath);

            // 如果目录为空，删除它
            if (entries.length === 0) {
                await fs.rmdir(currentPath);
                const relativePath = path.relative(sandboxPath, currentPath);
                removedDirs.push(relativePath);
                console.log(`🗑️ 删除空目录: ${relativePath}`);

                // 继续检查上一级目录
                currentPath = path.dirname(currentPath);
            } else {
                // 目录不为空，停止删除
                break;
            }
        } catch (error) {
            // 目录不存在或无法访问，停止删除
            break;
        }
    }

    return removedDirs;
}

// 删除路由文件夹
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const routePath = searchParams.get('path');

        if (!routePath) {
            return NextResponse.json(
                { success: false, error: 'Route path is required' },
                { status: 400 }
            );
        }

        const sandboxPath = path.join(process.cwd(), 'sandbox');
        const fullPath = path.join(sandboxPath, routePath);

        // 安全检查：确保路径在 sandbox 目录内
        const resolvedPath = path.resolve(fullPath);
        const resolvedSandboxPath = path.resolve(sandboxPath);

        if (!resolvedPath.startsWith(resolvedSandboxPath)) {
            return NextResponse.json(
                { success: false, error: 'Invalid route path' },
                { status: 403 }
            );
        }

        // 检查路径是否存在
        try {
            const stats = await fs.stat(fullPath);
            if (!stats.isDirectory()) {
                return NextResponse.json(
                    { success: false, error: 'Path is not a directory' },
                    { status: 400 }
                );
            }
        } catch {
            return NextResponse.json(
                { success: false, error: 'Route directory not found' },
                { status: 404 }
            );
        }

        // 检查是否为受保护的目录（不允许删除）
        const protectedDirs = [
            'app',
            'components',
            'lib',
            'public',
            'styles'
        ];

        // 只允许删除 app 目录下的子目录（路由目录）
        if (!routePath.startsWith('app/') || routePath === 'app') {
            return NextResponse.json(
                { success: false, error: 'Can only delete route directories under app/' },
                { status: 403 }
            );
        }

        // 检查是否为重要路由目录（不允许删除）
        const protectedRoutes = [
            'app/layout.tsx',
            'app/page.tsx',
            'app/globals.css'
        ];

        if (protectedRoutes.some(protectedRoute => routePath.includes(protectedRoute))) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete protected route' },
                { status: 403 }
            );
        }

        // 删除整个路由目录
        await removeDirectoryRecursive(fullPath);

        // 检查并删除空的父级目录
        const removedParentDirs = await removeEmptyParentDirectories(fullPath, sandboxPath);

        console.log(`✅ 路由目录删除成功: ${routePath}`);
        if (removedParentDirs.length > 0) {
            console.log(`🗑️ 同时删除了 ${removedParentDirs.length} 个空父级目录:`, removedParentDirs);
        }

        return NextResponse.json({
            success: true,
            message: `Route directory deleted successfully: ${routePath}`,
            deletedPath: routePath,
            removedParentDirs: removedParentDirs
        });

    } catch (error) {
        console.error('Error deleting route directory:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete route directory' },
            { status: 500 }
        );
    }
} 