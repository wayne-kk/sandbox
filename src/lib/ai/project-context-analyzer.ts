/**
 * 项目上下文分析器
 * 分析项目中已有的页面、组件和结构，为大模型提供项目全貌
 */

import fs from 'fs/promises';
import path from 'path';

export class ProjectContextAnalyzer {
    private static instance: ProjectContextAnalyzer;
    private projectRoot = process.cwd();

    static getInstance(): ProjectContextAnalyzer {
        if (!ProjectContextAnalyzer.instance) {
            ProjectContextAnalyzer.instance = new ProjectContextAnalyzer();
        }
        return ProjectContextAnalyzer.instance;
    }

    /**
     * 分析项目结构和现有页面
     */
    async analyzeProjectStructure(): Promise<ProjectStructure> {
        console.log('🔍 分析项目结构...');

        const structure: ProjectStructure = {
            pages: await this.analyzePages(),
            components: await this.analyzeCustomComponents(),
            apis: await this.analyzeApiRoutes(),
            styles: await this.analyzeStyles(),
            config: await this.analyzeConfigs(),
            summary: ''
        };

        structure.summary = this.generateProjectSummary(structure);

        console.log('✅ 项目结构分析完成');
        return structure;
    }

    /**
     * 分析页面结构
     */
    private async analyzePages(): Promise<PageInfo[]> {
        const pages: PageInfo[] = [];
        const appDir = path.join(this.projectRoot, 'src', 'app');

        try {
            await this.scanPagesRecursively(appDir, pages, '/');
        } catch (error) {
            console.warn('扫描页面失败:', error);
        }

        return pages;
    }

    /**
     * 递归扫描页面
     */
    private async scanPagesRecursively(dir: string, pages: PageInfo[], routePath: string): Promise<void> {
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    // 处理动态路由
                    const isDynamic = item.name.startsWith('[') && item.name.endsWith(']');
                    const segment = isDynamic ? `:${item.name.slice(1, -1)}` : item.name;
                    const newPath = routePath === '/' ? `/${segment}` : `${routePath}/${segment}`;

                    await this.scanPagesRecursively(
                        path.join(dir, item.name),
                        pages,
                        newPath
                    );
                } else if (item.name === 'page.tsx' || item.name === 'page.ts') {
                    // 分析页面文件
                    const pageInfo = await this.analyzePageFile(path.join(dir, item.name), routePath);
                    if (pageInfo) {
                        pages.push(pageInfo);
                    }
                }
            }
        } catch (error) {
            console.warn(`扫描目录失败: ${dir}`, error);
        }
    }

    /**
     * 分析单个页面文件
     */
    private async analyzePageFile(filePath: string, routePath: string): Promise<PageInfo | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');

            return {
                path: routePath,
                file: path.relative(this.projectRoot, filePath),
                type: this.detectPageType(content, routePath),
                components: this.extractUsedComponents(content),
                features: this.extractPageFeatures(content),
                description: this.generatePageDescription(routePath, content)
            };
        } catch (error) {
            console.warn(`分析页面失败: ${filePath}`, error);
            return null;
        }
    }

    /**
     * 检测页面类型
     */
    private detectPageType(content: string, routePath: string): PageType {
        const lowerContent = content.toLowerCase();

        if (routePath.includes('dashboard') || lowerContent.includes('dashboard')) return 'dashboard';
        if (routePath.includes('editor') || lowerContent.includes('editor')) return 'editor';
        if (routePath.includes('auth') || lowerContent.includes('login') || lowerContent.includes('register')) return 'auth';
        if (routePath.includes('api') || routePath.startsWith('/api')) return 'api';
        if (routePath === '/') return 'home';
        if (routePath.includes('admin')) return 'admin';

        return 'page';
    }

    /**
     * 提取页面使用的组件
     */
    private extractUsedComponents(content: string): string[] {
        const components: string[] = [];

        // 提取 import 语句中的组件
        const importMatches = content.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"`]([^'"`]+)['"`]/g);

        for (const match of importMatches) {
            const importedItems = match[1].split(',').map(item => item.trim());
            const importPath = match[2];

            // 只关注 UI 组件
            if (importPath.includes('@/components') || importPath.includes('./components')) {
                components.push(...importedItems);
            }
        }

        return [...new Set(components)]; // 去重
    }

    /**
     * 提取页面特性
     */
    private extractPageFeatures(content: string): string[] {
        const features: string[] = [];

        if (content.includes('useState') || content.includes('useEffect')) {
            features.push('交互式');
        }
        if (content.includes('form') || content.includes('Form')) {
            features.push('表单');
        }
        if (content.includes('api/') || content.includes('fetch')) {
            features.push('数据获取');
        }
        if (content.includes('router') || content.includes('useRouter')) {
            features.push('路由导航');
        }
        if (content.includes('auth') || content.includes('session')) {
            features.push('身份验证');
        }
        if (content.includes('responsive') || content.includes('md:') || content.includes('lg:')) {
            features.push('响应式');
        }

        return features;
    }

    /**
     * 生成页面描述
     */
    private generatePageDescription(routePath: string, content: string): string {
        const type = this.detectPageType(content, routePath);
        const features = this.extractPageFeatures(content);

        const typeDescriptions = {
            home: '首页',
            dashboard: '仪表板页面',
            editor: '编辑器页面',
            auth: '身份验证页面',
            admin: '管理后台页面',
            api: 'API 端点',
            page: '普通页面'
        };

        const baseDescription = typeDescriptions[type] || '页面';
        const featureText = features.length > 0 ? `，包含${features.join('、')}功能` : '';

        return `${baseDescription}${featureText}`;
    }

    /**
     * 分析自定义组件
     */
    private async analyzeCustomComponents(): Promise<ComponentInfo[]> {
        const components: ComponentInfo[] = [];
        const componentsDir = path.join(this.projectRoot, 'src', 'components');

        try {
            await this.scanComponentsRecursively(componentsDir, components);
        } catch (error) {
            console.warn('扫描组件失败:', error);
        }

        return components;
    }

    /**
     * 递归扫描组件
     */
    private async scanComponentsRecursively(dir: string, components: ComponentInfo[]): Promise<void> {
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    await this.scanComponentsRecursively(path.join(dir, item.name), components);
                } else if ((item.name.endsWith('.tsx') || item.name.endsWith('.ts')) && !item.name.includes('.d.ts')) {
                    const componentInfo = await this.analyzeComponentFile(path.join(dir, item.name));
                    if (componentInfo) {
                        components.push(componentInfo);
                    }
                }
            }
        } catch (error) {
            console.warn(`扫描组件目录失败: ${dir}`, error);
        }
    }

    /**
     * 分析组件文件
     */
    private async analyzeComponentFile(filePath: string): Promise<ComponentInfo | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const relativePath = path.relative(this.projectRoot, filePath);
            const componentName = path.basename(filePath, path.extname(filePath));

            return {
                name: componentName,
                path: relativePath,
                type: this.detectComponentType(content, relativePath),
                exports: this.extractExports(content),
                dependencies: this.extractDependencies(content),
                description: this.generateComponentDescription(componentName, content)
            };
        } catch (error) {
            console.warn(`分析组件失败: ${filePath}`, error);
            return null;
        }
    }

    /**
     * 检测组件类型
     */
    private detectComponentType(content: string, filePath: string): ComponentType {
        if (filePath.includes('ui/')) return 'ui';
        if (filePath.includes('layout') || content.includes('layout')) return 'layout';
        if (filePath.includes('form') || content.includes('form')) return 'form';
        if (filePath.includes('feature') || filePath.includes('Feature')) return 'feature';
        return 'component';
    }

    /**
     * 提取导出
     */
    private extractExports(content: string): string[] {
        const exports: string[] = [];

        // 提取 export default
        const defaultExport = content.match(/export\s+default\s+(\w+)/);
        if (defaultExport) {
            exports.push(defaultExport[1]);
        }

        // 提取命名导出
        const namedExports = content.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g);
        for (const match of namedExports) {
            exports.push(match[1]);
        }

        return exports;
    }

    /**
     * 提取依赖
     */
    private extractDependencies(content: string): string[] {
        const dependencies: string[] = [];
        const importMatches = content.matchAll(/import\s+.*?from\s+['"`]([^'"`]+)['"`]/g);

        for (const match of importMatches) {
            if (!match[1].startsWith('.') && !match[1].startsWith('@/')) {
                dependencies.push(match[1]);
            }
        }

        return [...new Set(dependencies)];
    }

    /**
     * 生成组件描述
     */
    private generateComponentDescription(name: string, content: string): string {
        if (content.includes('interface') && content.includes('props')) {
            return `${name} 组件，支持自定义属性`;
        }
        if (content.includes('useState') || content.includes('useEffect')) {
            return `${name} 交互式组件`;
        }
        return `${name} 组件`;
    }

    /**
     * 分析 API 路由
     */
    private async analyzeApiRoutes(): Promise<ApiRoute[]> {
        const routes: ApiRoute[] = [];
        const apiDir = path.join(this.projectRoot, 'src', 'app', 'api');

        try {
            await this.scanApiRoutesRecursively(apiDir, routes, '/api');
        } catch (error) {
            console.warn('扫描 API 路由失败:', error);
        }

        return routes;
    }

    /**
     * 递归扫描 API 路由
     */
    private async scanApiRoutesRecursively(dir: string, routes: ApiRoute[], routePath: string): Promise<void> {
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory()) {
                    const isDynamic = item.name.startsWith('[') && item.name.endsWith(']');
                    const segment = isDynamic ? `:${item.name.slice(1, -1)}` : item.name;
                    const newPath = `${routePath}/${segment}`;

                    await this.scanApiRoutesRecursively(path.join(dir, item.name), routes, newPath);
                } else if (item.name === 'route.ts' || item.name === 'route.tsx') {
                    const routeInfo = await this.analyzeApiRoute(path.join(dir, item.name), routePath);
                    if (routeInfo) {
                        routes.push(routeInfo);
                    }
                }
            }
        } catch (error) {
            console.warn(`扫描 API 目录失败: ${dir}`, error);
        }
    }

    /**
     * 分析 API 路由文件
     */
    private async analyzeApiRoute(filePath: string, routePath: string): Promise<ApiRoute | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');

            return {
                path: routePath,
                file: path.relative(this.projectRoot, filePath),
                methods: this.extractHttpMethods(content),
                description: this.generateApiDescription(routePath, content)
            };
        } catch (error) {
            console.warn(`分析 API 路由失败: ${filePath}`, error);
            return null;
        }
    }

    /**
     * 提取 HTTP 方法
     */
    private extractHttpMethods(content: string): string[] {
        const methods: string[] = [];
        const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

        for (const method of httpMethods) {
            if (content.includes(`export async function ${method}`)) {
                methods.push(method);
            }
        }

        return methods;
    }

    /**
     * 生成 API 描述
     */
    private generateApiDescription(routePath: string, content: string): string {
        if (routePath.includes('auth')) return '身份验证 API';
        if (routePath.includes('user')) return '用户管理 API';
        if (routePath.includes('project')) return '项目管理 API';
        if (routePath.includes('ai')) return 'AI 服务 API';
        if (routePath.includes('debug')) return '调试工具 API';

        return 'API 端点';
    }

    /**
     * 分析样式文件
     */
    private async analyzeStyles(): Promise<StyleInfo[]> {
        const styles: StyleInfo[] = [];

        // 分析全局样式
        const globalCssPath = path.join(this.projectRoot, 'src', 'app', 'globals.css');
        try {
            const content = await fs.readFile(globalCssPath, 'utf-8');
            styles.push({
                file: 'src/app/globals.css',
                type: 'global',
                features: this.extractCssFeatures(content)
            });
        } catch {
            // 文件可能不存在
        }

        // 分析 Tailwind 配置
        const tailwindConfigPath = path.join(this.projectRoot, 'tailwind.config.js');
        try {
            const content = await fs.readFile(tailwindConfigPath, 'utf-8');
            styles.push({
                file: 'tailwind.config.js',
                type: 'config',
                features: this.extractTailwindFeatures(content)
            });
        } catch {
            // 文件可能不存在
        }

        return styles;
    }

    /**
     * 提取 CSS 特性
     */
    private extractCssFeatures(content: string): string[] {
        const features: string[] = [];

        if (content.includes('@tailwind')) features.push('Tailwind CSS');
        if (content.includes('dark:')) features.push('深色模式');
        if (content.includes('--')) features.push('CSS 变量');
        if (content.includes('@media')) features.push('响应式设计');

        return features;
    }

    /**
     * 提取 Tailwind 特性
     */
    private extractTailwindFeatures(content: string): string[] {
        const features: string[] = [];

        if (content.includes('darkMode')) features.push('深色模式支持');
        if (content.includes('extend')) features.push('自定义扩展');
        if (content.includes('colors')) features.push('自定义颜色');
        if (content.includes('plugins')) features.push('插件系统');

        return features;
    }

    /**
     * 分析配置文件
     */
    private async analyzeConfigs(): Promise<ConfigInfo[]> {
        const configs: ConfigInfo[] = [];

        const configFiles = [
            'package.json',
            'next.config.ts',
            'tsconfig.json',
            'components.json'
        ];

        for (const configFile of configFiles) {
            try {
                const configPath = path.join(this.projectRoot, configFile);
                const content = await fs.readFile(configPath, 'utf-8');

                configs.push({
                    file: configFile,
                    type: this.getConfigType(configFile),
                    summary: this.generateConfigSummary(configFile, content)
                });
            } catch {
                // 文件可能不存在
            }
        }

        return configs;
    }

    /**
     * 获取配置类型
     */
    private getConfigType(filename: string): string {
        if (filename === 'package.json') return 'dependencies';
        if (filename.includes('next.config')) return 'next';
        if (filename.includes('tsconfig')) return 'typescript';
        if (filename === 'components.json') return 'components';
        return 'config';
    }

    /**
     * 生成配置摘要
     */
    private generateConfigSummary(filename: string, content: string): string {
        try {
            if (filename === 'package.json') {
                const pkg = JSON.parse(content);
                const depCount = Object.keys(pkg.dependencies || {}).length;
                const devDepCount = Object.keys(pkg.devDependencies || {}).length;
                return `${depCount} 个依赖，${devDepCount} 个开发依赖`;
            }

            if (filename === 'components.json') {
                const config = JSON.parse(content);
                return `UI 库配置，使用 ${config.ui || 'unknown'} 组件库`;
            }
        } catch {
            // 解析失败
        }

        return '配置文件';
    }

    /**
     * 生成项目摘要
     */
    private generateProjectSummary(structure: ProjectStructure): string {
        const summary = [
            `## 项目概览`,
            `- **页面总数**: ${structure.pages.length} 个`,
            `- **自定义组件**: ${structure.components.length} 个`,
            `- **API 路由**: ${structure.apis.length} 个`,
            ``,
            `### 主要页面`,
            ...structure.pages.slice(0, 5).map(page => `- ${page.path}: ${page.description}`),
            ``,
            `### 核心组件`,
            ...structure.components.filter(c => c.type === 'feature').slice(0, 3).map(comp => `- ${comp.name}: ${comp.description}`),
            ``,
            `### API 服务`,
            ...structure.apis.slice(0, 3).map(api => `- ${api.path}: ${api.description}`)
        ];

        return summary.join('\n');
    }

    /**
     * 生成简化的项目上下文（供大模型使用）
     */
    async generateSimplifiedContext(): Promise<string> {
        const structure = await this.analyzeProjectStructure();

        const context = [
            `# 项目结构概览`,
            ``,
            structure.summary,
            ``,
            `## 技术栈`,
            `- 框架: Next.js + TypeScript`,
            `- 样式: Tailwind CSS + shadcn/ui`,
            `- 图标: Lucide React`,
            ``,
            `## 项目特点`,
            `- 支持响应式设计`,
            `- 内置深色模式`,
            `- 组件化开发`,
            `- API 路由支持`
        ];

        return context.join('\n');
    }
}

// 类型定义
interface ProjectStructure {
    pages: PageInfo[];
    components: ComponentInfo[];
    apis: ApiRoute[];
    styles: StyleInfo[];
    config: ConfigInfo[];
    summary: string;
}

interface PageInfo {
    path: string;
    file: string;
    type: PageType;
    components: string[];
    features: string[];
    description: string;
}

interface ComponentInfo {
    name: string;
    path: string;
    type: ComponentType;
    exports: string[];
    dependencies: string[];
    description: string;
}

interface ApiRoute {
    path: string;
    file: string;
    methods: string[];
    description: string;
}

interface StyleInfo {
    file: string;
    type: 'global' | 'config' | 'component';
    features: string[];
}

interface ConfigInfo {
    file: string;
    type: string;
    summary: string;
}

type PageType = 'home' | 'dashboard' | 'editor' | 'auth' | 'admin' | 'api' | 'page';
type ComponentType = 'ui' | 'layout' | 'form' | 'feature' | 'component';

export type { ProjectStructure, PageInfo, ComponentInfo, ApiRoute };
