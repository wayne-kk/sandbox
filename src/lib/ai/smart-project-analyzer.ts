import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export interface ProjectInsight {
    projectStructure: {
        totalFiles: number;
        fileTypes: { [key: string]: number };
        directories: string[];
        mainEntryPoints: string[];
    };
    dependencies: {
        packages: string[];
        frameworks: string[];
        devDependencies: string[];
    };
    components: {
        total: number;
        uiComponents: string[];
        customComponents: string[];
        componentPatterns: string[];
    };
    styling: {
        framework: string;
        customStyles: boolean;
        themeFiles: string[];
    };
    routing: {
        pages: string[];
        apiRoutes: string[];
        dynamicRoutes: string[];
    };
    codeQuality: {
        typescriptUsage: number;
        testCoverage: boolean;
        linting: boolean;
    };
}

export interface GenerationContext {
    userIntent: string;
    projectInsight: ProjectInsight;
    relevantFiles: string[];
    suggestedApproach: string[];
    potentialConflicts: string[];
    integrationPoints: string[];
}

export class SmartProjectAnalyzer {
    private projectPath: string;

    constructor(projectPath: string = 'sandbox') {
        this.projectPath = projectPath;
    }

    /**
     * 分析项目并生成智能洞察
     */
    async analyzeProject(): Promise<ProjectInsight> {
        console.log('🔍 开始智能项目分析...');

        try {
            const [
                projectStructure,
                dependencies,
                components,
                styling,
                routing,
                codeQuality
            ] = await Promise.all([
                this.analyzeProjectStructure(),
                this.analyzeDependencies(),
                this.analyzeComponents(),
                this.analyzeStyling(),
                this.analyzeRouting(),
                this.analyzeCodeQuality()
            ]);

            const insight: ProjectInsight = {
                projectStructure,
                dependencies,
                components,
                styling,
                routing,
                codeQuality
            };

            console.log('✅ 项目分析完成');
            return insight;
        } catch (error) {
            console.error('项目分析失败:', error);
            throw error;
        }
    }

    /**
     * 为特定生成请求构建上下文
     */
    async buildGenerationContext(
        userPrompt: string,
        projectInsight: ProjectInsight
    ): Promise<GenerationContext> {
        console.log('🧠 构建生成上下文...');

        const userIntent = this.analyzeUserIntent(userPrompt);
        const relevantFiles = await this.findRelevantFiles(userPrompt, projectInsight);
        const suggestedApproach = this.suggestApproach(userPrompt, projectInsight);
        const potentialConflicts = this.identifyPotentialConflicts(userPrompt, projectInsight);
        const integrationPoints = this.findIntegrationPoints(userPrompt, projectInsight);

        return {
            userIntent,
            projectInsight,
            relevantFiles,
            suggestedApproach,
            potentialConflicts,
            integrationPoints
        };
    }

    /**
     * 分析项目结构
     */
    private async analyzeProjectStructure(): Promise<ProjectInsight['projectStructure']> {
        const files = await this.scanProjectFiles();
        const fileTypes: { [key: string]: number } = {};
        const directories = new Set<string>();
        const mainEntryPoints: string[] = [];

        for (const file of files) {
            const ext = path.extname(file).substring(1);
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;

            const dir = path.dirname(file);
            if (dir !== '.') {
                directories.add(dir);
            }

            // 识别主要入口点
            if (file.includes('page.tsx') || file.includes('layout.tsx') || file.includes('app.tsx')) {
                mainEntryPoints.push(file);
            }
        }

        return {
            totalFiles: files.length,
            fileTypes,
            directories: Array.from(directories).sort(),
            mainEntryPoints
        };
    }

    /**
     * 分析依赖关系
     */
    private async analyzeDependencies(): Promise<ProjectInsight['dependencies']> {
        try {
            const packagePath = path.join(this.projectPath, 'package.json');
            const packageContent = await fs.readFile(packagePath, 'utf-8');
            const packageJson = JSON.parse(packageContent);

            const packages = Object.keys(packageJson.dependencies || {});
            const devDependencies = Object.keys(packageJson.devDependencies || {});

            // 识别框架
            const frameworks = packages.filter(pkg =>
                ['next', 'react', 'vue', 'angular', 'svelte'].includes(pkg)
            );

            return {
                packages,
                frameworks,
                devDependencies
            };
        } catch (error) {
            console.warn('无法读取 package.json:', error);
            return {
                packages: [],
                frameworks: [],
                devDependencies: []
            };
        }
    }

    /**
     * 分析组件
     */
    private async analyzeComponents(): Promise<ProjectInsight['components']> {
        const componentFiles = await glob('**/*.{tsx,jsx}', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**']
        });

        const uiComponents: string[] = [];
        const customComponents: string[] = [];
        const componentPatterns: string[] = [];

        for (const file of componentFiles) {
            try {
                const content = await fs.readFile(path.join(this.projectPath, file), 'utf-8');

                if (this.isUIComponent(content)) {
                    uiComponents.push(file);
                } else {
                    customComponents.push(file);
                }

                // 分析组件模式
                if (content.includes('useState') || content.includes('useEffect')) {
                    componentPatterns.push('hooks');
                }
                if (content.includes('forwardRef')) {
                    componentPatterns.push('forwardRef');
                }
                if (content.includes('memo')) {
                    componentPatterns.push('memo');
                }
            } catch (error) {
                console.warn(`分析组件文件失败: ${file}`, error);
            }
        }

        return {
            total: componentFiles.length,
            uiComponents,
            customComponents,
            componentPatterns: [...new Set(componentPatterns)]
        };
    }

    /**
     * 分析样式
     */
    private async analyzeStyling(): Promise<ProjectInsight['styling']> {
        const styleFiles = await glob('**/*.{css,scss,sass}', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**']
        });

        const themeFiles = await glob('**/*theme*', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**']
        });

        // 检测样式框架
        let framework = 'css';
        try {
            const tailwindConfig = await fs.access(path.join(this.projectPath, 'tailwind.config.js')).then(() => true).catch(() => false);
            if (tailwindConfig) framework = 'tailwind';

            const styledComponents = await glob('**/*.styled.{ts,tsx}', { cwd: this.projectPath });
            if (styledComponents.length > 0) framework = 'styled-components';

            const emotionFiles = await glob('**/*.{css,ts,tsx}', { cwd: this.projectPath });
            const hasEmotion = emotionFiles.some(async (file) => {
                try {
                    const content = await fs.readFile(path.join(this.projectPath, file), 'utf-8');
                    return content.includes('@emotion') || content.includes('emotion');
                } catch {
                    return false;
                }
            });
            if (hasEmotion) framework = 'emotion';
        } catch (error) {
            console.warn('样式分析失败:', error);
        }

        return {
            framework,
            customStyles: styleFiles.length > 0,
            themeFiles
        };
    }

    /**
     * 分析路由
     */
    private async analyzeRouting(): Promise<ProjectInsight['routing']> {
        const pages = await glob('**/page.{tsx,jsx}', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**']
        });

        const apiRoutes = await glob('**/route.{ts,js}', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**']
        });

        const dynamicRoutes = pages.filter(page =>
            page.includes('[') && page.includes(']')
        );

        return {
            pages,
            apiRoutes,
            dynamicRoutes
        };
    }

    /**
     * 分析代码质量
     */
    private async analyzeCodeQuality(): Promise<ProjectInsight['codeQuality']> {
        const tsFiles = await glob('**/*.{ts,tsx}', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**']
        });

        const jsFiles = await glob('**/*.{js,jsx}', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**']
        });

        const totalFiles = tsFiles.length + jsFiles.length;
        const typescriptUsage = totalFiles > 0 ? (tsFiles.length / totalFiles) * 100 : 0;

        // 检查测试和linting配置
        const testFiles = await glob('**/*.{test,spec}.{ts,tsx,js,jsx}', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**']
        });

        const hasLinting = await fs.access(path.join(this.projectPath, '.eslintrc')).then(() => true).catch(() => false) ||
            await fs.access(path.join(this.projectPath, 'eslint.config')).then(() => true).catch(() => false);

        return {
            typescriptUsage: Math.round(typescriptUsage),
            testCoverage: testFiles.length > 0,
            linting: hasLinting
        };
    }

    /**
     * 扫描项目文件
     */
    private async scanProjectFiles(): Promise<string[]> {
        const files = await glob('**/*', {
            cwd: this.projectPath,
            ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**']
        });

        return files.filter(file => {
            const ext = path.extname(file);
            return ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.sass', '.json', '.md'].includes(ext);
        });
    }

    /**
     * 判断是否为UI组件
     */
    private isUIComponent(content: string): boolean {
        const uiPatterns = [
            /export\s+default\s+function\s+\w+.*Props/,
            /interface\s+\w+Props/,
            /className\s*=/,
            /tailwind/,
            /@apply/
        ];

        return uiPatterns.some(pattern => pattern.test(content));
    }

    /**
     * 分析用户意图
     */
    private analyzeUserIntent(prompt: string): string {
        const intent = prompt.toLowerCase();

        if (intent.includes('创建') || intent.includes('新建')) return 'create';
        if (intent.includes('修改') || intent.includes('更新')) return 'modify';
        if (intent.includes('添加') || intent.includes('增加')) return 'add';
        if (intent.includes('优化') || intent.includes('改进')) return 'optimize';
        if (intent.includes('修复') || intent.includes('调试')) return 'fix';

        return 'general';
    }

    /**
     * 查找相关文件
     */
    private async findRelevantFiles(prompt: string, insight: ProjectInsight): Promise<string[]> {
        const relevantFiles: string[] = [];
        const promptLower = prompt.toLowerCase();

        // 基于用户提示查找相关文件
        if (promptLower.includes('组件') || promptLower.includes('component')) {
            relevantFiles.push(...insight.components.uiComponents.slice(0, 5));
        }

        if (promptLower.includes('样式') || promptLower.includes('style')) {
            relevantFiles.push(...insight.projectStructure.mainEntryPoints.slice(0, 3));
        }

        if (promptLower.includes('页面') || promptLower.includes('page')) {
            relevantFiles.push(...insight.routing.pages.slice(0, 5));
        }

        if (promptLower.includes('api') || promptLower.includes('接口')) {
            relevantFiles.push(...insight.routing.apiRoutes.slice(0, 3));
        }

        return relevantFiles;
    }

    /**
     * 建议实现方法
     */
    private suggestApproach(prompt: string, insight: ProjectInsight): string[] {
        const suggestions: string[] = [];
        const promptLower = prompt.toLowerCase();

        // 基于项目结构给出建议
        if (insight.components.total > 0) {
            suggestions.push('复用现有的组件模式');
        }

        if (insight.styling.framework === 'tailwind') {
            suggestions.push('使用 Tailwind CSS 类名保持一致性');
        }

        if (insight.codeQuality.typescriptUsage > 80) {
            suggestions.push('遵循项目的 TypeScript 类型定义');
        }

        if (insight.routing.pages.length > 0) {
            suggestions.push('参考现有页面的结构和布局');
        }

        return suggestions;
    }

    /**
     * 识别潜在冲突
     */
    private identifyPotentialConflicts(prompt: string, insight: ProjectInsight): string[] {
        const conflicts: string[] = [];
        const promptLower = prompt.toLowerCase();

        // 检查命名冲突
        if (promptLower.includes('button') && insight.components.uiComponents.some(c => c.includes('button'))) {
            conflicts.push('Button 组件已存在，考虑扩展或重命名');
        }

        if (promptLower.includes('form') && insight.components.uiComponents.some(c => c.includes('form'))) {
            conflicts.push('Form 组件已存在，检查是否需要合并');
        }

        // 检查样式冲突
        if (promptLower.includes('theme') && insight.styling.themeFiles.length > 0) {
            conflicts.push('主题文件已存在，确保新样式与现有主题兼容');
        }

        return conflicts;
    }

    /**
     * 找到集成点
     */
    private findIntegrationPoints(prompt: string, insight: ProjectInsight): string[] {
        const integrationPoints: string[] = [];
        const promptLower = prompt.toLowerCase();

        // 找到可以集成的现有功能
        if (promptLower.includes('状态管理') && insight.dependencies.packages.includes('zustand')) {
            integrationPoints.push('集成到现有的 Zustand store');
        }

        if (promptLower.includes('路由') && insight.routing.pages.length > 0) {
            integrationPoints.push('添加到现有的页面路由结构');
        }

        if (promptLower.includes('样式') && insight.styling.framework === 'tailwind') {
            integrationPoints.push('使用现有的 Tailwind 配置和主题');
        }

        return integrationPoints;
    }
}
