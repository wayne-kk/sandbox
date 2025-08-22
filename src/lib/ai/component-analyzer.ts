import fs from 'fs/promises';
import path from 'path';

/**
 * 组件分析器 - 解析 sandbox 项目中的 UI 组件
 * 为 Dify 提供组件上下文信息
 */
export class ComponentAnalyzer {
    private static instance: ComponentAnalyzer;
    private componentCache: Map<string, ComponentInfo> = new Map();
    private readonly sandboxPath = path.join(process.cwd(), 'sandbox');

    static getInstance(): ComponentAnalyzer {
        if (!ComponentAnalyzer.instance) {
            ComponentAnalyzer.instance = new ComponentAnalyzer();
        }
        return ComponentAnalyzer.instance;
    }

    /**
     * 分析所有组件并生成文档
     */
    async analyzeAllComponents(): Promise<ComponentDocumentation> {
        console.log('🔍 开始分析 sandbox 项目组件...');

        const componentsDir = path.join(this.sandboxPath, 'components', 'ui');
        const componentFiles = await this.getComponentFiles(componentsDir);

        const components: ComponentInfo[] = [];

        for (const file of componentFiles) {
            try {
                const componentInfo = await this.analyzeComponent(file);
                if (componentInfo) {
                    components.push(componentInfo);
                    this.componentCache.set(componentInfo.name, componentInfo);
                }
            } catch (error) {
                console.warn(`分析组件失败: ${file}`, error);
            }
        }

        // 分析项目配置
        const projectConfig = await this.analyzeProjectConfig();

        const documentation: ComponentDocumentation = {
            projectInfo: projectConfig,
            components,
            usage: await this.generateUsageExamples(),
            patterns: await this.analyzeDesignPatterns(),
            updatedAt: new Date().toISOString()
        };

        console.log(`✅ 组件分析完成，共找到 ${components.length} 个组件`);
        return documentation;
    }

    /**
     * 获取组件文件列表
     */
    private async getComponentFiles(dir: string): Promise<string[]> {
        try {
            const files = await fs.readdir(dir);
            return files
                .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
                .map(file => path.join(dir, file));
        } catch (error) {
            console.error('读取组件目录失败:', error);
            return [];
        }
    }

    /**
     * 分析单个组件
     */
    private async analyzeComponent(filePath: string): Promise<ComponentInfo | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const fileName = path.basename(filePath, path.extname(filePath));

            // 解析组件内容
            const analysis = this.parseComponentContent(content, fileName);

            return {
                name: fileName,
                filePath: path.relative(this.sandboxPath, filePath),
                exports: analysis.exports,
                props: analysis.props,
                variants: analysis.variants,
                dependencies: analysis.dependencies,
                description: analysis.description,
                examples: analysis.examples,
                category: this.categorizeComponent(fileName, analysis)
            };
        } catch (error) {
            console.error(`分析组件失败: ${filePath}`, error);
            return null;
        }
    }

    /**
     * 解析组件内容
     */
    private parseComponentContent(content: string, fileName: string): ComponentAnalysis {
        const exports: string[] = [];
        const props: ComponentProp[] = [];
        const variants: ComponentVariant[] = [];
        const dependencies: string[] = [];

        // 提取导出
        const exportMatches = content.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g);
        for (const match of exportMatches) {
            exports.push(match[1]);
        }

        // 提取 destructured exports
        const destructuredExports = content.match(/export\s*\{\s*([^}]+)\s*\}/);
        if (destructuredExports) {
            const items = destructuredExports[1].split(',').map(item => item.trim());
            exports.push(...items);
        }

        // 提取依赖
        const importMatches = content.matchAll(/import\s+.*?from\s+['"`]([^'"`]+)['"`]/g);
        for (const match of importMatches) {
            if (!match[1].startsWith('.') && !match[1].startsWith('@/')) {
                dependencies.push(match[1]);
            }
        }

        // 提取 variant 信息 (cva)
        const variantMatch = content.match(/const\s+\w+Variants\s*=\s*cva\(([\s\S]*?)\)/);
        if (variantMatch) {
            variants.push(...this.extractVariants(variantMatch[1]));
        }

        // 提取 props 接口
        const interfaceMatches = content.matchAll(/interface\s+(\w+)\s*\{([^}]+)\}/g);
        for (const match of interfaceMatches) {
            const interfaceName = match[1];
            const interfaceBody = match[2];
            props.push(...this.extractPropsFromInterface(interfaceBody, interfaceName));
        }

        // 提取函数参数类型
        const functionMatches = content.matchAll(/function\s+(\w+)\s*\(\s*\{([^}]+)\}/g);
        for (const match of functionMatches) {
            const functionName = match[1];
            const params = match[2];
            props.push(...this.extractPropsFromParams(params, functionName));
        }

        return {
            exports,
            props,
            variants,
            dependencies,
            description: this.generateDescription(fileName, exports, variants),
            examples: this.generateExamples(fileName, exports, variants, props)
        };
    }

    /**
     * 提取 variant 信息
     */
    private extractVariants(variantContent: string): ComponentVariant[] {
        const variants: ComponentVariant[] = [];

        try {
            // 简单的 variant 解析 - 在实际项目中可能需要更复杂的 AST 解析
            const variantMatch = variantContent.match(/variants:\s*\{([^}]+)\}/);
            if (variantMatch) {
                const variantBody = variantMatch[1];
                const variantNames = variantBody.match(/(\w+):\s*\{/g);

                if (variantNames) {
                    for (const name of variantNames) {
                        const variantName = name.replace(/:\s*\{/, '');
                        variants.push({
                            name: variantName,
                            type: 'enum',
                            options: this.extractVariantOptions(variantBody, variantName)
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('解析 variant 失败:', error);
        }

        return variants;
    }

    /**
     * 提取 variant 选项
     */
    private extractVariantOptions(content: string, variantName: string): string[] {
        try {
            const pattern = new RegExp(`${variantName}:\\s*\\{([^}]+)\\}`);
            const match = content.match(pattern);

            if (match) {
                const options = match[1].match(/(\w+):/g);
                return options ? options.map(opt => opt.replace(':', '')) : [];
            }
        } catch (error) {
            console.warn(`解析 ${variantName} 选项失败:`, error);
        }

        return [];
    }

    /**
     * 从接口提取 props
     */
    private extractPropsFromInterface(interfaceBody: string, interfaceName: string): ComponentProp[] {
        const props: ComponentProp[] = [];

        // 简单的 prop 解析
        const propMatches = interfaceBody.matchAll(/(\w+)\??:\s*([^;\n]+)/g);

        for (const match of propMatches) {
            const propName = match[1];
            const propType = match[2].trim();
            const isOptional = match[0].includes('?:');

            props.push({
                name: propName,
                type: propType,
                optional: isOptional,
                description: `${interfaceName} 的 ${propName} 属性`
            });
        }

        return props;
    }

    /**
     * 从函数参数提取 props
     */
    private extractPropsFromParams(params: string, functionName: string): ComponentProp[] {
        const props: ComponentProp[] = [];

        // 解析解构参数
        const paramMatches = params.matchAll(/(\w+)(?:\s*:\s*([^,\n]+))?/g);

        for (const match of paramMatches) {
            const propName = match[1];
            const propType = match[2] || 'unknown';

            props.push({
                name: propName,
                type: propType.trim(),
                optional: false,
                description: `${functionName} 的 ${propName} 参数`
            });
        }

        return props;
    }

    /**
     * 生成组件描述
     */
    private generateDescription(fileName: string, exports: string[], variants: ComponentVariant[]): string {
        const hasVariants = variants.length > 0;
        const variantText = hasVariants ? ` 支持 ${variants.map(v => v.name).join(', ')} 变体` : '';

        return `${fileName} 组件，导出: ${exports.join(', ')}。${variantText}`;
    }

    /**
     * 生成使用示例
     */
    private generateExamples(fileName: string, exports: string[], variants: ComponentVariant[], props: ComponentProp[]): string[] {
        const examples: string[] = [];
        const mainExport = exports.find(exp => exp.toLowerCase() === fileName.toLowerCase()) || exports[0];

        if (mainExport) {
            // 基础示例
            examples.push(`<${mainExport} />`);

            // 带 props 的示例
            if (props.length > 0) {
                const sampleProps = props.slice(0, 2).map(prop => {
                    const value = this.getSampleValue(prop.type);
                    return `${prop.name}={${value}}`;
                }).join(' ');

                examples.push(`<${mainExport} ${sampleProps} />`);
            }

            // variant 示例
            if (variants.length > 0) {
                const variantProps = variants.map(variant => {
                    const option = variant.options[0] || 'default';
                    return `${variant.name}="${option}"`;
                }).join(' ');

                examples.push(`<${mainExport} ${variantProps} />`);
            }
        }

        return examples;
    }

    /**
     * 获取类型的示例值
     */
    private getSampleValue(type: string): string {
        if (type.includes('string')) return '"example"';
        if (type.includes('number')) return '42';
        if (type.includes('boolean')) return 'true';
        if (type.includes('function') || type.includes('=>')) return '() => {}';
        if (type.includes('ReactNode') || type.includes('React.ReactNode')) return '"内容"';
        return '"value"';
    }

    /**
     * 组件分类
     */
    private categorizeComponent(fileName: string, analysis: ComponentAnalysis): ComponentCategory {
        const name = fileName.toLowerCase();

        if (['button', 'link'].includes(name)) return 'action';
        if (['input', 'textarea', 'select', 'checkbox', 'radio', 'form'].some(word => name.includes(word))) return 'form';
        if (['card', 'dialog', 'modal', 'sheet', 'popover'].some(word => name.includes(word))) return 'layout';
        if (['alert', 'toast', 'badge', 'progress'].some(word => name.includes(word))) return 'feedback';
        if (['table', 'pagination', 'tabs', 'accordion'].some(word => name.includes(word))) return 'display';
        if (['menu', 'nav', 'breadcrumb'].some(word => name.includes(word))) return 'navigation';

        return 'other';
    }

    /**
     * 分析项目配置
     */
    private async analyzeProjectConfig(): Promise<ProjectConfig> {
        try {
            // 读取 components.json
            const componentsConfigPath = path.join(this.sandboxPath, 'components.json');
            const componentsConfig = JSON.parse(await fs.readFile(componentsConfigPath, 'utf-8'));

            // 读取 package.json
            const packageJsonPath = path.join(this.sandboxPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

            // 读取 tailwind.config
            const tailwindConfigPath = path.join(this.sandboxPath, 'tailwind.config.js');
            let tailwindConfig = null;
            try {
                const tailwindContent = await fs.readFile(tailwindConfigPath, 'utf-8');
                tailwindConfig = { content: tailwindContent };
            } catch {
                // tailwind config 可能不存在
            }

            return {
                name: packageJson.name || 'sandbox-project',
                framework: this.detectFramework(packageJson),
                uiLibrary: 'shadcn/ui',
                aliases: componentsConfig.aliases || {},
                iconLibrary: componentsConfig.iconLibrary || 'lucide',
                styling: {
                    system: 'tailwind',
                    config: tailwindConfig,
                    prefix: componentsConfig.tailwind?.prefix || ''
                }
            };
        } catch (error) {
            console.error('分析项目配置失败:', error);
            return {
                name: 'unknown-project',
                framework: 'nextjs',
                uiLibrary: 'unknown',
                aliases: {},
                iconLibrary: 'lucide',
                styling: { system: 'tailwind', config: null, prefix: '' }
            };
        }
    }

    /**
     * 检测框架类型
     */
    private detectFramework(packageJson: any): string {
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (dependencies.next) return 'nextjs';
        if (dependencies.react && dependencies['react-dom']) return 'react';
        if (dependencies.vue) return 'vue';
        if (dependencies.svelte) return 'svelte';

        return 'unknown';
    }

    /**
     * 生成使用示例
     */
    private async generateUsageExamples(): Promise<UsageExample[]> {
        return [
            {
                title: '基础按钮',
                description: '如何使用 Button 组件',
                code: `import { Button } from "@/components/ui/button"

export function Example() {
    return (
        <div className="space-x-2">
            <Button>默认按钮</Button>
            <Button variant="secondary">次要按钮</Button>
            <Button variant="outline">边框按钮</Button>
            <Button variant="ghost">幽灵按钮</Button>
        </div>
    )
}`,
                category: 'action'
            },
            {
                title: '卡片布局',
                description: '如何使用 Card 组件创建布局',
                code: `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export function Example() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>卡片标题</CardTitle>
                <CardDescription>卡片描述</CardDescription>
            </CardHeader>
            <CardContent>
                卡片内容
            </CardContent>
        </Card>
    )
}`,
                category: 'layout'
            }
        ];
    }

    /**
     * 分析设计模式
     */
    private async analyzeDesignPatterns(): Promise<DesignPattern[]> {
        return [
            {
                name: 'Component Composition',
                description: '使用组合模式构建复杂组件',
                example: 'Card + CardHeader + CardContent 的组合使用'
            },
            {
                name: 'Variant System',
                description: '通过 variant 属性控制组件样式',
                example: 'Button 的 variant="outline" 创建边框样式'
            },
            {
                name: 'Accessible Components',
                description: '所有组件都遵循无障碍设计原则',
                example: '自动处理 ARIA 属性和键盘导航'
            }
        ];
    }

    /**
     * 获取组件文档（用于 Dify 上下文）
     */
    async getComponentDocumentation(): Promise<string> {
        const docs = await this.analyzeAllComponents();

        return `# ${docs.projectInfo.name} 组件库文档

## 项目信息
- 框架: ${docs.projectInfo.framework}
- UI库: ${docs.projectInfo.uiLibrary}
- 图标库: ${docs.projectInfo.iconLibrary}
- 样式系统: ${docs.projectInfo.styling.system}

## 别名配置
${Object.entries(docs.projectInfo.aliases).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## 可用组件

${docs.components.map(comp => `### ${comp.name}
**文件**: ${comp.filePath}
**分类**: ${comp.category}
**描述**: ${comp.description}
**导出**: ${comp.exports.join(', ')}

**Props**:
${comp.props.map(prop => `- ${prop.name}${prop.optional ? '?' : ''}: ${prop.type} - ${prop.description}`).join('\n')}

**Variants**:
${comp.variants.map(variant => `- ${variant.name}: ${variant.options.join(' | ')}`).join('\n')}

**使用示例**:
\`\`\`tsx
${comp.examples.join('\n')}
\`\`\`

**依赖**:
${comp.dependencies.map(dep => `- ${dep}`).join('\n')}
`).join('\n---\n')}

## 设计模式
${docs.patterns.map(pattern => `- **${pattern.name}**: ${pattern.description}`).join('\n')}

## 使用建议
1. 始终使用 @/ 别名导入组件
2. 优先使用组合模式而不是复杂的单一组件
3. 充分利用 variant 系统来控制样式
4. 遵循现有的设计模式和命名约定

---
文档更新时间: ${docs.updatedAt}`;
    }
}

// 类型定义
interface ComponentInfo {
    name: string;
    filePath: string;
    exports: string[];
    props: ComponentProp[];
    variants: ComponentVariant[];
    dependencies: string[];
    description: string;
    examples: string[];
    category: ComponentCategory;
}

interface ComponentProp {
    name: string;
    type: string;
    optional: boolean;
    description: string;
}

interface ComponentVariant {
    name: string;
    type: 'enum' | 'string' | 'number';
    options: string[];
}

interface ComponentAnalysis {
    exports: string[];
    props: ComponentProp[];
    variants: ComponentVariant[];
    dependencies: string[];
    description: string;
    examples: string[];
}

interface ComponentDocumentation {
    projectInfo: ProjectConfig;
    components: ComponentInfo[];
    usage: UsageExample[];
    patterns: DesignPattern[];
    updatedAt: string;
}

interface ProjectConfig {
    name: string;
    framework: string;
    uiLibrary: string;
    aliases: Record<string, string>;
    iconLibrary: string;
    styling: {
        system: string;
        config: any;
        prefix: string;
    };
}

interface UsageExample {
    title: string;
    description: string;
    code: string;
    category: ComponentCategory;
}

interface DesignPattern {
    name: string;
    description: string;
    example: string;
}

type ComponentCategory = 'action' | 'form' | 'layout' | 'feedback' | 'display' | 'navigation' | 'other';

export type {
    ComponentInfo,
    ComponentDocumentation,
    ProjectConfig,
    UsageExample,
    DesignPattern,
    ComponentCategory
};
