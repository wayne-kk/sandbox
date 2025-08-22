import { NextRequest, NextResponse } from 'next/server';
import { GitHubDownloader } from '@/lib/github-downloader';
import path from 'path';
import fs from 'fs/promises';

const downloader = GitHubDownloader.getInstance();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { githubUrl } = body;

        if (!githubUrl) {
            return NextResponse.json(
                { success: false, error: '缺少GitHub URL' },
                { status: 400 }
            );
        }

        console.log(`📥 开始从GitHub下载项目: ${githubUrl}`);

        // 解析GitHub URL
        const repo = downloader.parseGitHubUrl(githubUrl);

        // 设置下载目标路径为sandbox目录
        const sandboxPath = path.join(process.cwd(), 'sandbox');

        // 下载仓库到sandbox目录
        await downloader.downloadRepository(githubUrl, {
            targetPath: sandboxPath,
            cleanup: true // 清理现有目录
        });

        // 验证下载的项目
        const validation = await downloader.validateNodeProject(sandboxPath);

        if (!validation.isValid) {
            // 如果项目无效，提供详细错误信息
            return NextResponse.json({
                success: false,
                error: '下载的项目不是有效的Node.js项目',
                details: {
                    errors: validation.errors,
                    hasPackageJson: validation.hasPackageJson
                }
            }, { status: 400 });
        }

        // 获取项目信息
        const projectInfo = await downloader.getProjectInfo(sandboxPath);

        console.log(`✅ GitHub项目下载完成: ${repo.owner}/${repo.repo}`);

        return NextResponse.json({
            success: true,
            message: '项目从GitHub下载成功',
            data: {
                repo: {
                    owner: repo.owner,
                    name: repo.repo,
                    branch: repo.branch || 'main',
                    subfolder: repo.subfolder
                },
                project: projectInfo,
                path: sandboxPath,
                validation
            }
        });

    } catch (error) {
        console.error('GitHub下载失败:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '下载失败',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json(
                { success: false, error: '缺少GitHub URL参数' },
                { status: 400 }
            );
        }

        // 只解析URL，不下载
        const repo = downloader.parseGitHubUrl(url);

        return NextResponse.json({
            success: true,
            data: repo
        });

    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'URL解析失败'
            },
            { status: 400 }
        );
    }
}
