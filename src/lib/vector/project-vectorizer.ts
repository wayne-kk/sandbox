import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { EmbeddingService, CodeEmbedding, ProjectContext } from './embedding-service';

export interface CodeBlock {
    type: 'component' | 'function' | 'type' | 'style' | 'config' | 'api';
    code: string;
    lineStart: number;
    lineEnd: number;
    exports: string[];
    name?: string;
}

export interface FileInfo {
    path: string;
    relativePath: string;
    extension: string;
    size: number;
}

export class ProjectVectorizer {
    private embeddingService: EmbeddingService;

    constructor() {
        this.embeddingService = new EmbeddingService();
    }

    /**
     * 向量化整个项目
     */
    async vectorizeProject(projectId: string, projectPath: string): Promise<void> {
        console.log(`🔍 开始向量化项目: ${projectId}`);

        try {
            // 清理现有的项目向量数据
            await this.embeddingService.deleteProjectVectors(projectId);

            // 1. 扫描并向量化代码文件
            await this.vectorizeCodeFiles(projectId, projectPath);

            // 2. 向量化项目配置
            await this.vectorizeProjectConfig(projectId, projectPath);

            // 3. 向量化组件库信息
            await this.vectorizeComponentLibrary(projectId, projectPath);

            // 4. 向量化API路由信息
            await this.vectorizeAPIRoutes(projectId, projectPath);

            console.log(`✅ 项目向量化完成: ${projectId}`);
        } catch (error) {
            console.error(`❌ 项目向量化失败: ${projectId}`, error);
            throw error;
        }
    }

    /**
     * 向量化代码文件
     */
    private async vectorizeCodeFiles(projectId: string, projectPath: string): Promise<void> {
        console.log(`📁 扫描代码文件: ${projectPath}`);

        const files = await this.scanCodeFiles(projectPath);
        let processedCount = 0;

        for (const file of files) {
            try {
                const content = await fs.readFile(file.path, 'utf-8');

                // 跳过空文件或过大的文件
                if (!content.trim() || content.length > 50000) {
                    console.log(`⏭️ 跳过文件: ${file.relativePath} (${content.length > 50000 ? '过大' : '空文件'})`);
                    continue;
                }

                // 按代码块分割并向量化
                const codeBlocks = this.parseCodeBlocks(content, file.extension);

                for (const block of codeBlocks) {
                    await this.embeddingService.storeCodeEmbedding({
                        project_id: projectId,
                        file_path: file.relativePath,
                        content_type: block.type,
                        code_snippet: block.code,
                        description: '',
                        tags: [],
                        metadata: {
                            language: file.extension,
                            lineStart: block.lineStart,
                            lineEnd: block.lineEnd,
                            exports: block.exports,
                            name: block.name,
                            fileSize: file.size
                        }
                    });
                }

                processedCount++;
                if (processedCount % 5 === 0) {
                    console.log(`📝 已处理 ${processedCount}/${files.length} 个文件`);
                }
            } catch (error) {
                console.error(`❌ 处理文件失败: ${file.relativePath}`, error);
            }
        }

        console.log(`✅ 代码文件向量化完成: ${processedCount} 个文件`);
    }

    /**
     * 向量化项目配置
     */
    private async vectorizeProjectConfig(projectId: string, projectPath: string): Promise<void> {
        console.log(`⚙️ 向量化项目配置`);

        const configFiles = [
            { path: 'package.json', type: 'dependencies' as const },
            { path: 'next.config.js', type: 'config' as const },
            { path: 'next.config.ts', type: 'config' as const },
            { path: 'tailwind.config.js', type: 'config' as const },
            { path: 'tsconfig.json', type: 'config' as const },
            { path: 'components.json', type: 'config' as const },
            { path: '.env.example', type: 'config' as const },
            { path: 'README.md', type: 'structure' as const }
        ];

        for (const config of configFiles) {
            try {
                const configPath = path.join(projectPath, config.path);
                const exists = await fs.access(configPath).then(() => true).catch(() => false);

                if (!exists) continue;

                const content = await fs.readFile(configPath, 'utf-8');

                await this.embeddingService.storeProjectContext({
                    project_id: projectId,
                    context_type: config.type,
                    content,
                    summary: '',
                    importance_score: config.type === 'dependencies' ? 0.9 : 0.7
                });

                console.log(`✅ 配置文件已向量化: ${config.path}`);
            } catch (error) {
                console.error(`❌ 处理配置文件失败: ${config.path}`, error);
            }
        }
    }

    /**
     * 向量化组件库信息
     */
    private async vectorizeComponentLibrary(projectId: string, projectPath: string): Promise<void> {
        console.log(`🎨 向量化组件库信息`);

        try {
            const componentsPath = path.join(projectPath, 'components');
            const exists = await fs.access(componentsPath).then(() => true).catch(() => false);

            if (!exists) {
                console.log(`⏭️ 组件库目录不存在: ${componentsPath}`);
                return;
            }

            // 扫描组件目录
            const componentFiles = await glob('**/*.{tsx,jsx,ts,js}', {
                cwd: componentsPath,
                absolute: true
            });

            let componentCount = 0;
            for (const filePath of componentFiles) {
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    const relativePath = path.relative(projectPath, filePath);

                    // 分析组件信息
                    const componentInfo = this.analyzeComponent(content, relativePath);

                    if (componentInfo) {
                        await this.embeddingService.storeComponentKnowledge({
                            component_name: componentInfo.name,
                            component_path: relativePath,
                            props_info: componentInfo.props,
                            usage_examples: componentInfo.examples,
                            related_components: componentInfo.related,
                            usage_frequency: 0
                        });

                        componentCount++;
                    }
                } catch (error) {
                    console.error(`❌ 分析组件失败: ${filePath}`, error);
                }
            }

            console.log(`✅ 组件库向量化完成: ${componentCount} 个组件`);
        } catch (error) {
            console.error('❌ 组件库向量化失败:', error);
        }
    }

    /**
     * 向量化API路由信息
     */
    private async vectorizeAPIRoutes(projectId: string, projectPath: string): Promise<void> {
        console.log(`🔌 向量化API路由信息`);

        try {
            const apiPath = path.join(projectPath, 'app/api');
            const exists = await fs.access(apiPath).then(() => true).catch(() => false);

            if (!exists) {
                console.log(`⏭️ API目录不存在: ${apiPath}`);
                return;
            }

            const apiFiles = await glob('**/route.{ts,js}', {
                cwd: apiPath,
                absolute: true
            });

            for (const filePath of apiFiles) {
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    const relativePath = path.relative(projectPath, filePath);

                    // 分析API路由
                    const apiInfo = this.analyzeAPIRoute(content, relativePath);

                    await this.embeddingService.storeProjectContext({
                        project_id: projectId,
                        context_type: 'api',
                        content: JSON.stringify(apiInfo),
                        summary: `API路由: ${apiInfo.route} - ${apiInfo.methods.join(', ')}`,
                        importance_score: 0.8
                    });
                } catch (error) {
                    console.error(`❌ 分析API路由失败: ${filePath}`, error);
                }
            }

            console.log(`✅ API路由向量化完成`);
        } catch (error) {
            console.error('❌ API路由向量化失败:', error);
        }
    }

    /**
     * 增量更新文件向量
     */
    async updateFileVectors(projectId: string, filePath: string, content: string): Promise<void> {
        console.log(`🔄 更新文件向量: ${filePath}`);

        try {
            // 删除旧向量
            await this.embeddingService.deleteFileVectors(projectId, filePath);

            // 解析新的代码块
            const extension = path.extname(filePath).substring(1);
            const codeBlocks = this.parseCodeBlocks(content, extension);

            // 存储新向量
            for (const block of codeBlocks) {
                await this.embeddingService.storeCodeEmbedding({
                    project_id: projectId,
                    file_path: filePath,
                    content_type: block.type,
                    code_snippet: block.code,
                    description: '',
                    tags: [],
                    metadata: {
                        language: extension,
                        lineStart: block.lineStart,
                        lineEnd: block.lineEnd,
                        exports: block.exports,
                        name: block.name
                    }
                });
            }

            console.log(`✅ 文件向量更新完成: ${filePath}`);
        } catch (error) {
            console.error(`❌ 文件向量更新失败: ${filePath}`, error);
            throw error;
        }
    }

    /**
     * 扫描代码文件
     */
    private async scanCodeFiles(projectPath: string): Promise<FileInfo[]> {
        const patterns = [
            '**/*.{tsx,jsx,ts,js}',
            '**/*.{css,scss,sass}',
            '**/*.{json,md}'
        ];

        const excludePatterns = [
            '**/node_modules/**',
            '**/.next/**',
            '**/dist/**',
            '**/build/**',
            '**/*.d.ts',
            '**/coverage/**'
        ];

        const files: FileInfo[] = [];

        for (const pattern of patterns) {
            const matchedFiles = await glob(pattern, {
                cwd: projectPath,
                absolute: true,
                ignore: excludePatterns
            });

            for (const filePath of matchedFiles) {
                try {
                    const stats = await fs.stat(filePath);
                    const relativePath = path.relative(projectPath, filePath);
                    const extension = path.extname(filePath).substring(1);

                    files.push({
                        path: filePath,
                        relativePath,
                        extension,
                        size: stats.size
                    });
                } catch (error) {
                    console.warn(`无法获取文件信息: ${filePath}`, error);
                }
            }
        }

        return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    }

    /**
     * 解析代码块
     */
    private parseCodeBlocks(content: string, extension: string): CodeBlock[] {
        const blocks: CodeBlock[] = [];

        try {
            if (extension === 'tsx' || extension === 'jsx') {
                blocks.push(...this.parseReactComponents(content));
                blocks.push(...this.parseReactHooks(content));
            }

            if (extension === 'ts' || extension === 'js' || extension === 'tsx' || extension === 'jsx') {
                blocks.push(...this.parseFunctions(content));
                blocks.push(...this.parseTypes(content));
            }

            if (extension === 'css' || extension === 'scss' || extension === 'sass') {
                blocks.push(...this.parseStyles(content));
            }

            if (extension === 'json') {
                blocks.push(this.parseJSON(content));
            }

            // 如果没有找到特定的代码块，将整个文件作为一个块
            if (blocks.length === 0 && content.trim()) {
                blocks.push({
                    type: 'config',
                    code: content,
                    lineStart: 1,
                    lineEnd: content.split('\n').length,
                    exports: [],
                    name: `完整文件内容`
                });
            }
        } catch (error) {
            console.error('解析代码块失败:', error);
            // 回退到整个文件
            blocks.push({
                type: 'config',
                code: content,
                lineStart: 1,
                lineEnd: content.split('\n').length,
                exports: [],
                name: '文件内容'
            });
        }

        return blocks;
    }

    /**
     * 解析 React 组件
     */
    private parseReactComponents(content: string): CodeBlock[] {
        const blocks: CodeBlock[] = [];
        const lines = content.split('\n');

        // 简单的组件匹配模式
        const componentPatterns = [
            /export\s+default\s+function\s+(\w+)/,
            /export\s+const\s+(\w+)\s*=.*=>/,
            /function\s+(\w+)\s*\([^)]*\)\s*{/,
            /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (const pattern of componentPatterns) {
                const match = line.match(pattern);
                if (match) {
                    const componentName = match[1];

                    // 尝试找到组件的结束位置
                    const { endLine, code } = this.extractBlock(lines, i, '{', '}');

                    if (code.length > 20) { // 过滤太短的代码块
                        blocks.push({
                            type: 'component',
                            code,
                            lineStart: i + 1,
                            lineEnd: endLine + 1,
                            exports: line.includes('export') ? [componentName] : [],
                            name: componentName
                        });
                    }
                    break;
                }
            }
        }

        return blocks;
    }

    /**
     * 解析 React Hooks
     */
    private parseReactHooks(content: string): CodeBlock[] {
        const blocks: CodeBlock[] = [];
        const lines = content.split('\n');

        const hookPattern = /export\s+const\s+(use\w+)\s*=/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(hookPattern);

            if (match) {
                const hookName = match[1];
                const { endLine, code } = this.extractBlock(lines, i, '(', ')');

                blocks.push({
                    type: 'function',
                    code,
                    lineStart: i + 1,
                    lineEnd: endLine + 1,
                    exports: [hookName],
                    name: hookName
                });
            }
        }

        return blocks;
    }

    /**
     * 解析函数
     */
    private parseFunctions(content: string): CodeBlock[] {
        const blocks: CodeBlock[] = [];
        const lines = content.split('\n');

        const functionPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(functionPattern);

            if (match) {
                const functionName = match[1];
                const { endLine, code } = this.extractBlock(lines, i, '{', '}');

                if (code.length > 20) {
                    blocks.push({
                        type: 'function',
                        code,
                        lineStart: i + 1,
                        lineEnd: endLine + 1,
                        exports: line.includes('export') ? [functionName] : [],
                        name: functionName
                    });
                }
            }
        }

        return blocks;
    }

    /**
     * 解析类型定义
     */
    private parseTypes(content: string): CodeBlock[] {
        const blocks: CodeBlock[] = [];
        const lines = content.split('\n');

        const typePatterns = [
            /(?:export\s+)?interface\s+(\w+)/,
            /(?:export\s+)?type\s+(\w+)\s*=/,
            /(?:export\s+)?enum\s+(\w+)/
        ];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (const pattern of typePatterns) {
                const match = line.match(pattern);
                if (match) {
                    const typeName = match[1];
                    const { endLine, code } = this.extractTypeBlock(lines, i);

                    blocks.push({
                        type: 'type',
                        code,
                        lineStart: i + 1,
                        lineEnd: endLine + 1,
                        exports: line.includes('export') ? [typeName] : [],
                        name: typeName
                    });
                    break;
                }
            }
        }

        return blocks;
    }

    /**
     * 解析样式
     */
    private parseStyles(content: string): CodeBlock[] {
        // CSS 文件通常作为一个整体处理
        return [{
            type: 'style',
            code: content,
            lineStart: 1,
            lineEnd: content.split('\n').length,
            exports: [],
            name: '样式定义'
        }];
    }

    /**
     * 解析 JSON 配置
     */
    private parseJSON(content: string): CodeBlock {
        return {
            type: 'config',
            code: content,
            lineStart: 1,
            lineEnd: content.split('\n').length,
            exports: [],
            name: 'JSON配置'
        };
    }

    /**
     * 提取代码块
     */
    private extractBlock(lines: string[], startLine: number, openChar: string, closeChar: string): { endLine: number; code: string } {
        let braceCount = 0;
        let endLine = startLine;
        let started = false;

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];

            for (const char of line) {
                if (char === openChar) {
                    braceCount++;
                    started = true;
                } else if (char === closeChar && started) {
                    braceCount--;
                    if (braceCount === 0) {
                        endLine = i;
                        break;
                    }
                }
            }

            if (braceCount === 0 && started) break;
        }

        const code = lines.slice(startLine, endLine + 1).join('\n');
        return { endLine, code };
    }

    /**
     * 提取类型块
     */
    private extractTypeBlock(lines: string[], startLine: number): { endLine: number; code: string } {
        let endLine = startLine;

        // 对于类型定义，通常查找到下一个空行或新的声明
        for (let i = startLine + 1; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === '' || line.startsWith('export') || line.startsWith('interface') || line.startsWith('type')) {
                endLine = i - 1;
                break;
            }

            if (line.includes('}') && !line.includes('{')) {
                endLine = i;
                break;
            }
        }

        const code = lines.slice(startLine, endLine + 1).join('\n');
        return { endLine, code };
    }

    /**
     * 分析组件信息
     */
    private analyzeComponent(content: string, filePath: string): {
        name: string;
        props: string;
        examples: string;
        related: string[];
    } | null {
        try {
            // 提取组件名
            const nameMatch = content.match(/(?:export\s+default\s+function\s+(\w+)|export\s+const\s+(\w+))/);
            const name = nameMatch?.[1] || nameMatch?.[2];

            if (!name) return null;

            // 提取 Props 接口
            const propsMatch = content.match(/interface\s+\w*Props\s*{([^}]+)}/);
            const props = propsMatch?.[1] || '';

            // 提取使用示例（JSX 部分）
            const jsxMatch = content.match(/return\s*\(([\s\S]+?)\)/);
            const examples = jsxMatch?.[1] || '';

            // 查找相关组件（导入的组件）
            const importMatches = content.match(/import.*from\s+['"].*components.*['"]/g) || [];
            const related = importMatches.map(imp => {
                const match = imp.match(/import\s+{([^}]+)}/);
                return match?.[1]?.split(',').map(s => s.trim()) || [];
            }).flat();

            return {
                name,
                props: props.trim(),
                examples: examples.trim(),
                related
            };
        } catch (error) {
            console.error('分析组件信息失败:', error);
            return null;
        }
    }

    /**
     * 分析API路由信息
     */
    private analyzeAPIRoute(content: string, filePath: string): {
        route: string;
        methods: string[];
        description: string;
    } {
        // 从文件路径提取路由
        const route = filePath
            .replace(/app\/api/, '')
            .replace(/\/route\.(ts|js)$/, '')
            .replace(/\[([^\]]+)\]/g, ':$1') || '/';

        // 提取HTTP方法
        const methods: string[] = [];
        const methodPattern = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g;
        let match;
        while ((match = methodPattern.exec(content)) !== null) {
            methods.push(match[1]);
        }

        // 提取描述（从注释或第一行）
        const commentMatch = content.match(/\/\*\*(.*?)\*\//);
        const description = commentMatch?.[1]?.replace(/\*/g, '').trim() || `API路由: ${route}`;

        return {
            route,
            methods,
            description
        };
    }
}
