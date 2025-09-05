import { NextRequest, NextResponse } from 'next/server';
import { ProjectVectorizer } from '@/lib/vector/project-vectorizer';
import { EmbeddingService } from '@/lib/vector/embedding-service';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const { testType, projectId = 'test-project' } = await request.json();

        console.log(`🧪 开始向量化测试: ${testType}`);

        const vectorizer = new ProjectVectorizer();
        const embeddingService = new EmbeddingService();

        switch (testType) {
            case 'navigation_component':
                return await testNavigationComponent(vectorizer, embeddingService, projectId);

            case 'utility_functions':
                return await testUtilityFunctions(vectorizer, embeddingService, projectId);

            case 'search_quality':
                return await testSearchQuality(embeddingService, projectId);

            default:
                return NextResponse.json(
                    { success: false, error: `不支持的测试类型: ${testType}` },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('向量化测试失败:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : '测试失败',
                details: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

/**
 * 测试 Navigation 组件的向量化效果
 */
async function testNavigationComponent(vectorizer: ProjectVectorizer, embeddingService: EmbeddingService, projectId: string) {
    try {
        // 读取 Navigation 组件文件
        const navigationPath = path.join(process.cwd(), 'sandbox/components/Navigation.tsx');
        const content = await fs.readFile(navigationPath, 'utf-8');

        // 删除旧的测试数据
        await embeddingService.deleteProjectVectors(projectId);

        // 向量化 Navigation 组件
        await vectorizer.updateFileVectors(projectId, 'components/Navigation.tsx', content);

        // 测试搜索效果
        const testQueries = [
            'CSS类名工具函数',
            '移动端菜单控制',
            '导航组件',
            'classNames函数',
            '条件样式处理'
        ];

        const searchResults = [];
        for (const query of testQueries) {
            const results = await embeddingService.searchRelevantCode(projectId, query, 3, 0.6);
            searchResults.push({
                query,
                results: results.map(r => ({
                    file_path: r.file_path,
                    content_type: r.content_type,
                    description: r.description,
                    tags: r.tags,
                    metadata: r.metadata
                }))
            });
        }

        return NextResponse.json({
            success: true,
            testType: 'navigation_component',
            data: {
                projectId,
                filePath: 'components/Navigation.tsx',
                searchResults,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        throw new Error(`Navigation 组件测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
}

/**
 * 测试工具函数的向量化效果
 */
async function testUtilityFunctions(vectorizer: ProjectVectorizer, embeddingService: EmbeddingService, projectId: string) {
    try {
        // 创建一个包含多种工具函数的测试文件
        const testContent = `
'use client';

import React from 'react';

// 工具函数1: CSS类名组合
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// 工具函数2: 防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 工具函数3: 格式化日期
function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// 工具函数4: 验证邮箱
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 主组件
const TestComponent = () => {
  const [email, setEmail] = React.useState('');
  const [isValid, setIsValid] = React.useState(false);

  const handleEmailChange = debounce((value: string) => {
    setEmail(value);
    setIsValid(validateEmail(value));
  }, 300);

  return (
    <div className={classNames('container', isValid ? 'valid' : 'invalid')}>
      <input 
        type="email" 
        onChange={(e) => handleEmailChange(e.target.value)}
        className={classNames('input', email && 'has-value')}
      />
      <p>当前日期: {formatDate(new Date())}</p>
    </div>
  );
};

export default TestComponent;
`;

        // 删除旧的测试数据
        await embeddingService.deleteProjectVectors(projectId);

        // 向量化测试文件
        await vectorizer.updateFileVectors(projectId, 'components/TestComponent.tsx', testContent);

        // 测试各种工具函数的搜索效果
        const testQueries = [
            'CSS类名组合工具',
            '防抖函数实现',
            '日期格式化',
            '邮箱验证',
            '字符串处理工具',
            '异步处理函数'
        ];

        const searchResults = [];
        for (const query of testQueries) {
            const results = await embeddingService.searchRelevantCode(projectId, query, 3, 0.6);
            searchResults.push({
                query,
                results: results.map(r => ({
                    file_path: r.file_path,
                    content_type: r.content_type,
                    description: r.description,
                    tags: r.tags,
                    metadata: r.metadata
                }))
            });
        }

        return NextResponse.json({
            success: true,
            testType: 'utility_functions',
            data: {
                projectId,
                filePath: 'components/TestComponent.tsx',
                searchResults,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        throw new Error(`工具函数测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
}

/**
 * 测试搜索质量
 */
async function testSearchQuality(embeddingService: EmbeddingService, projectId: string) {
    try {
        // 测试各种搜索查询的准确性
        const testCases = [
            {
                query: 'classNames函数',
                expectedFeatures: ['CSS类名工具', '字符串处理'],
                description: '应该找到classNames相关的工具函数'
            },
            {
                query: '移动端菜单',
                expectedFeatures: ['移动端菜单状态管理', '移动端菜单切换控制'],
                description: '应该找到移动端菜单相关的代码'
            },
            {
                query: '表单处理',
                expectedFeatures: ['表单提交处理', '数据验证'],
                description: '应该找到表单相关的处理逻辑'
            },
            {
                query: '导航组件',
                expectedFeatures: ['导航链接组件', '用户界面图标按钮'],
                description: '应该找到导航相关的组件'
            }
        ];

        const testResults = [];
        for (const testCase of testCases) {
            const results = await embeddingService.searchRelevantCode(projectId, testCase.query, 5, 0.5);

            // 分析搜索结果的质量
            const qualityAnalysis = {
                totalResults: results.length,
                relevantResults: 0,
                descriptions: results.map(r => r.description),
                tags: results.map(r => r.tags).flat(),
                features: results.map(r => r.metadata?.features || []).flat()
            };

            // 检查是否包含期望的特征
            const hasExpectedFeatures = testCase.expectedFeatures.some(feature =>
                qualityAnalysis.features.includes(feature) ||
                qualityAnalysis.descriptions.some(desc => desc.includes(feature))
            );

            testResults.push({
                query: testCase.query,
                expected: testCase.description,
                hasExpectedFeatures,
                analysis: qualityAnalysis
            });
        }

        return NextResponse.json({
            success: true,
            testType: 'search_quality',
            data: {
                projectId,
                testResults,
                summary: {
                    totalTests: testResults.length,
                    passedTests: testResults.filter(t => t.hasExpectedFeatures).length,
                    successRate: (testResults.filter(t => t.hasExpectedFeatures).length / testResults.length * 100).toFixed(2) + '%'
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        throw new Error(`搜索质量测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
}
