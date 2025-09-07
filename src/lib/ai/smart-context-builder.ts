/**
 * 智能上下文构建器
 * 根据用户需求动态生成精简的组件上下文
 */

import { ComponentAnalyzer, type ComponentInfo, type ComponentDocumentation } from './component-analyzer';
import { ProjectContextAnalyzer } from './project-context-analyzer';

export class SmartContextBuilder {
    private static instance: SmartContextBuilder;
    private analyzer: ComponentAnalyzer;
    private projectAnalyzer: ProjectContextAnalyzer;
    private fullDocumentation: ComponentDocumentation | null = null;

    constructor() {
        this.analyzer = ComponentAnalyzer.getInstance();
        this.projectAnalyzer = ProjectContextAnalyzer.getInstance();
    }

    static getInstance(): SmartContextBuilder {
        if (!SmartContextBuilder.instance) {
            SmartContextBuilder.instance = new SmartContextBuilder();
        }
        return SmartContextBuilder.instance;
    }

    /**
     * 根据用户需求生成智能上下文
     */
    async buildSmartContext(userPrompt: string, options: SmartContextOptions = {}): Promise<string> {
        if (!this.fullDocumentation) {
            this.fullDocumentation = await this.analyzer.analyzeAllComponents();
        }

        // 分析用户需求，提取关键词
        const requirements = this.analyzeUserRequirements(userPrompt);

        // 根据需求选择相关组件
        const relevantComponents = this.selectRelevantComponents(requirements);

        // 获取项目上下文（可选）
        let projectContext = '';
        if (options.includeProjectContext) {
            projectContext = await this.projectAnalyzer.generateSimplifiedContext();
        }

        // 生成精简的上下文
        const context = this.buildContextFromComponents(relevantComponents, requirements, projectContext);

        return context;
    }

    /**
     * 分析用户需求
     */
    private analyzeUserRequirements(prompt: string): UserRequirements {
        const keywords = {
            form: ['表单', '输入', '登录', '注册', '提交', 'form', 'input', 'login', 'register'],
            layout: ['页面', '布局', '卡片', '对话框', '弹窗', 'layout', 'card', 'dialog', 'modal'],
            navigation: ['导航', '菜单', '面包屑', '标签页', 'nav', 'menu', 'tabs', 'breadcrumb'],
            display: ['表格', '列表', '分页', '折叠', 'table', 'list', 'pagination', 'accordion'],
            feedback: ['通知', '警告', '提示', '进度', 'alert', 'toast', 'notification', 'progress'],
            action: ['按钮', '操作', 'button', 'action', 'click'],
        };

        const categories: string[] = [];
        const components: string[] = [];
        const features: string[] = [];

        const lowerPrompt = prompt.toLowerCase();

        // 检测分类
        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(word => lowerPrompt.includes(word))) {
                categories.push(category);
            }
        }

        // 提取特定组件名称
        if (this.fullDocumentation) {
            for (const comp of this.fullDocumentation.components) {
                if (lowerPrompt.includes(comp.name.toLowerCase())) {
                    components.push(comp.name);
                }
            }
        }

        // 检测特殊功能需求
        if (lowerPrompt.includes('响应式') || lowerPrompt.includes('responsive')) {
            features.push('responsive');
        }
        if (lowerPrompt.includes('深色') || lowerPrompt.includes('dark')) {
            features.push('dark-mode');
        }
        if (lowerPrompt.includes('动画') || lowerPrompt.includes('animation')) {
            features.push('animation');
        }

        return {
            categories: categories.length > 0 ? categories : ['form', 'layout'], // 默认包含表单和布局
            specificComponents: components,
            features,
            complexity: this.assessComplexity(prompt)
        };
    }

    /**
     * 评估复杂度
     */
    private assessComplexity(prompt: string): 'simple' | 'medium' | 'complex' {
        const complexity_indicators = {
            simple: ['按钮', '输入框', '标签', 'button', 'input', 'label'],
            medium: ['表单', '卡片', '对话框', 'form', 'card', 'dialog'],
            complex: ['仪表板', '管理后台', '完整页面', 'dashboard', 'admin', 'full page']
        };

        const lowerPrompt = prompt.toLowerCase();

        if (complexity_indicators.complex.some(word => lowerPrompt.includes(word))) {
            return 'complex';
        }
        if (complexity_indicators.medium.some(word => lowerPrompt.includes(word))) {
            return 'medium';
        }
        return 'simple';
    }

    /**
     * 选择相关组件
     */
    private selectRelevantComponents(requirements: UserRequirements): ComponentInfo[] {
        if (!this.fullDocumentation) return [];

        const relevantComponents: ComponentInfo[] = [];

        // 1. 添加明确指定的组件
        for (const compName of requirements.specificComponents) {
            const comp = this.fullDocumentation.components.find(c => c.name === compName);
            if (comp) relevantComponents.push(comp);
        }

        // 2. 根据分类添加组件
        for (const category of requirements.categories) {
            const categoryComponents = this.fullDocumentation.components
                .filter(comp => comp.category === category)
                .slice(0, requirements.complexity === 'simple' ? 3 : 6); // 限制数量

            relevantComponents.push(...categoryComponents);
        }

        // 3. 始终包含基础组件
        const essentialComponents = ['button', 'card', 'input'];
        for (const essential of essentialComponents) {
            const comp = this.fullDocumentation.components.find(c => c.name === essential);
            if (comp && !relevantComponents.find(r => r.name === comp.name)) {
                relevantComponents.push(comp);
            }
        }

        // 去重并限制总数
        const uniqueComponents = relevantComponents.filter((comp, index, arr) =>
            arr.findIndex(c => c.name === comp.name) === index
        );

        // 根据复杂度限制组件数量
        const maxComponents = {
            simple: 8,
            medium: 15,
            complex: 25
        }[requirements.complexity];

        return uniqueComponents.slice(0, maxComponents);
    }

    /**
     * 构建精简上下文
     */
    private buildContextFromComponents(components: ComponentInfo[], requirements: UserRequirements, projectContext: string = ''): string {
        if (!this.fullDocumentation) return '';

        const sections = [
            `# 项目组件库 (精选 ${components.length} 个相关组件)`,
            '',
            `## 项目信息`,
            `- 框架: ${this.fullDocumentation.projectInfo.framework}`,
            `- UI库: ${this.fullDocumentation.projectInfo.uiLibrary}`,
            `- 样式: ${this.fullDocumentation.projectInfo.styling.system}`,
            '',
            `## 别名配置`,
            ...Object.entries(this.fullDocumentation.projectInfo.aliases).map(([key, value]) => `- ${key}: ${value}`),
            '',
            `## 可用组件`,
            ''
        ];

        // 按分类组织组件
        const componentsByCategory = this.groupComponentsByCategory(components);

        for (const [category, comps] of Object.entries(componentsByCategory)) {
            if (comps.length === 0) continue;

            const categoryNames = {
                form: '表单组件',
                layout: '布局组件',
                action: '操作组件',
                feedback: '反馈组件',
                display: '展示组件',
                navigation: '导航组件',
                other: '工具组件'
            };

            sections.push(`### ${categoryNames[category as keyof typeof categoryNames] || category} (${comps.length}个)`);
            sections.push('');

            for (const comp of comps) {
                sections.push(`#### ${comp.name}`);
                sections.push(`**导出**: ${comp.exports.join(', ')}`);

                // 只显示重要的 props
                if (comp.props.length > 0) {
                    const importantProps = comp.props.slice(0, 3); // 只显示前3个最重要的props
                    sections.push(`**主要属性**: ${importantProps.map(p => p.name).join(', ')}`);
                }

                // 显示使用示例
                if (comp.examples.length > 0) {
                    sections.push(`**示例**: \`${comp.examples[0]}\``);
                }

                sections.push('');
            }
        }

        // 添加使用指南
        sections.push('## 使用指南');
        sections.push('- 使用 @/ 别名导入组件');
        sections.push('- 优先使用组合模式');
        sections.push('- 支持 variant 和 size 属性');

        if (requirements.features.includes('responsive')) {
            sections.push('- 采用响应式设计');
        }
        if (requirements.features.includes('dark-mode')) {
            sections.push('- 支持深色模式');
        }

        return sections.join('\n');
    }

    /**
     * 按分类分组组件
     */
    private groupComponentsByCategory(components: ComponentInfo[]): Record<string, ComponentInfo[]> {
        const grouped: Record<string, ComponentInfo[]> = {};

        for (const comp of components) {
            if (!grouped[comp.category]) {
                grouped[comp.category] = [];
            }
            grouped[comp.category].push(comp);
        }

        return grouped;
    }

    /**
     * 获取组件关系图
     */
    async buildComponentRelationships(): Promise<string> {
        if (!this.fullDocumentation) {
            this.fullDocumentation = await this.analyzer.analyzeAllComponents();
        }

        const relationships = [
            '# 组件关系图',
            '',
            '## 常用组合',
            '- **表单组合**: Form + FormItem + FormLabel + FormControl + Input/Textarea + Button',
            '- **卡片布局**: Card + CardHeader + CardTitle + CardContent + CardFooter',
            '- **对话框**: Dialog + DialogTrigger + DialogContent + DialogHeader + DialogTitle',
            '- **导航菜单**: NavigationMenu + NavigationMenuList + NavigationMenuItem',
            '',
            '## 依赖关系',
            '- **基础组件**: Button, Input, Label (其他组件的基础)',
            '- **容器组件**: Card, Dialog, Sheet (包含其他组件)',
            '- **复合组件**: Form, Table, NavigationMenu (由多个子组件组成)',
        ];

        return relationships.join('\n');
    }
}

// 类型定义
interface UserRequirements {
    categories: string[];
    specificComponents: string[];
    features: string[];
    complexity: 'simple' | 'medium' | 'complex';
}

interface SmartContextOptions {
    maxTokens?: number;
    includeExamples?: boolean;
    includeRelationships?: boolean;
    includeProjectContext?: boolean;
}

export type { UserRequirements, SmartContextOptions };
