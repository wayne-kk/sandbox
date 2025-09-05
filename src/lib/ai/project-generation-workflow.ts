import { RequirementGenerator } from './requirement-generator';
import { DifyClient, GenerateResult } from './dify-client';
import { ProjectManager } from '../project-manager';

/**
 * 项目生成工作流管理器
 * 负责协调整个项目生成流程：需求清单生成 -> 组件生成 -> 项目构建
 */
export class ProjectGenerationWorkflow {
    private static instance: ProjectGenerationWorkflow;
    private requirementGenerator?: RequirementGenerator;
    private componentDifyClient?: DifyClient;
    private projectManager: ProjectManager;

    private constructor() {
        this.projectManager = ProjectManager.getInstance();
    }

    static getInstance(): ProjectGenerationWorkflow {
        if (!ProjectGenerationWorkflow.instance) {
            ProjectGenerationWorkflow.instance = new ProjectGenerationWorkflow();
        }
        return ProjectGenerationWorkflow.instance;
    }

    /**
     * 配置工作流（使用统一的 Dify API 端点和不同的密钥）
     */
    configure(config: WorkflowConfig): void {
        const apiEndpoint = config.apiEndpoint || process.env.DIFY_API_ENDPOINT;

        if (!apiEndpoint) {
            throw new Error('请配置 DIFY_API_ENDPOINT 环境变量');
        }

        // 初始化需求清单生成器（使用统一端点）
        this.requirementGenerator = RequirementGenerator.getInstance(apiEndpoint);

        // 初始化组件生成 Dify 客户端（使用统一端点）
        this.componentDifyClient = DifyClient.createInstance(
            apiEndpoint,
            config.componentApiKey || process.env.COMPONENT_DIFY_API_KEY || ''
        );
    }

    /**
 * 执行完整的项目生成工作流
 */
    async generateProject(userPrompt: string, options: ProjectGenerationOptions = {}): Promise<ProjectGenerationResult> {
        try {
            console.log('🚀 开始执行项目生成工作流...');
            console.log('📝 用户输入:', userPrompt);

            const result: ProjectGenerationResult = {
                success: false,
                steps: [],
                projectId: options.projectId || 'default-project',
                metadata: {
                    startedAt: new Date().toISOString(),
                    userPrompt
                }
            };

            // 步骤 1: 调用需求清单生成器
            console.log('📋 步骤 1: 调用需求清单生成器...');
            result.steps.push({
                step: 1,
                name: '调用需求清单生成器',
                status: 'running',
                startedAt: new Date().toISOString()
            });

            // 检查需求清单生成器是否已配置
            if (!this.requirementGenerator) {
                throw new Error('需求清单生成器未配置，请先调用 configure() 方法设置 DIFY_API_ENDPOINT 和 REQUIRMENT_DIFY_API_KEY');
            }

            console.log('🔄 正在调用 Dify 需求清单生成 API...');
            console.log('📊 使用的配置:', {
                hasRequirementGenerator: !!this.requirementGenerator,
                projectType: options.projectType || 'nextjs',
                context: options.context || '项目生成'
            });

            // 调用需求清单生成器
            const requirement = await this.requirementGenerator.generateRequirements(userPrompt, {
                projectType: options.projectType || 'nextjs',
                context: options.context || '项目生成'
            });
            console.log('requirement', requirement)
            // 验证需求清单生成结果
            if (!requirement || !requirement.title) {
                throw new Error('需求清单生成失败：返回结果为空或格式不正确');
            }

            console.log('✅ 需求清单生成成功！');
            console.log('📋 项目标题:', requirement.title);
            console.log('📝 项目描述:', requirement.description);
            console.log('📄 页面数量:', requirement.pages ? requirement.pages.length : 0);
            console.log('🧭 导航组件:', requirement.navigation ? `${requirement.navigation.section_name} (${requirement.navigation.section_type})` : '未配置');
            console.log('📍 页脚组件:', requirement.footer ? `${requirement.footer.section_name} (${requirement.footer.section_type})` : '未配置');

            // 保存需求清单结果
            result.requirement = requirement;
            result.steps[0].status = 'completed';
            result.steps[0].completedAt = new Date().toISOString();

            console.log('📋 步骤 1 完成: 需求清单生成器调用成功');

            // 步骤 2: 为每个页面的每个 section 生成组件代码
            console.log('🎨 步骤 2: 为每个 section 生成组件代码...');
            result.steps.push({
                step: 2,
                name: '为每个 section 生成组件代码',
                status: 'running',
                startedAt: new Date().toISOString()
            });

            if (!this.componentDifyClient) {
                throw new Error('组件生成器未配置，请先调用 configure() 方法设置 DIFY_API_ENDPOINT 和 COMPONENT_DIFY_API_KEY');
            }

            // 收集所有的 sections
            const allSections = this.collectAllSections(requirement);
            console.log(`📋 总共需要生成 ${allSections.length} 个 section 组件`);

            // 为每个 section 异步生成组件代码
            console.log(`🚀 开始异步生成 ${allSections.length} 个 section 组件...`);

            const sectionGenerationPromises = allSections.map(async (section, index) => {
                const sectionIndex = index + 1;
                console.log(`🔄 开始生成第 ${sectionIndex}/${allSections.length} 个 section: ${section.pageName} - ${section.sectionName}`);

                try {
                    // 直接使用 section 的描述作为提示词
                    const sectionPrompt = this.buildSectionPrompt(userPrompt, requirement, section);

                    console.log(`📝 提示词: ${sectionPrompt.substring(0, 100)}${sectionPrompt.length > 100 ? '...' : ''}`);

                    // 调用 generateUI
                    const sectionResult = await this.componentDifyClient!.generateUI(sectionPrompt, {
                        projectType: options.projectType || 'nextjs',
                        context: `${section.pageName} 页面的 ${section.sectionName} 组件`,
                        component_type: section.sectionName,
                        designRules: requirement.designRules
                    });

                    console.log(`✅ ${section.pageName} - ${section.sectionName} 组件生成完成`);

                    return {
                        pageName: section.pageName,
                        sectionName: section.sectionName,
                        result: sectionResult,
                        success: true
                    };

                } catch (error) {
                    console.error(`❌ ${section.pageName} - ${section.sectionName} 组件生成失败:`, error);

                    return {
                        pageName: section.pageName,
                        sectionName: section.sectionName,
                        result: null,
                        success: false,
                        error: error instanceof Error ? error.message : '未知错误'
                    };
                }
            });

            // 等待所有 section 生成完成
            console.log('⏳ 等待所有 section 组件生成完成...');
            const sectionGenerationResults = await Promise.all(sectionGenerationPromises);

            // 统计生成结果
            const successCount = sectionGenerationResults.filter(r => r.success).length;
            const failCount = sectionGenerationResults.length - successCount;

            console.log(`✅ Section 组件生成完成: 成功 ${successCount} 个，失败 ${failCount} 个`);

            // 保存生成结果
            result.sectionGenerationResults = sectionGenerationResults;
            result.steps[1].status = successCount > 0 ? 'completed' : 'failed';
            result.steps[1].completedAt = new Date().toISOString();

            if (failCount > 0) {
                console.log(`⚠️ 有 ${failCount} 个 section 生成失败，但继续执行后续步骤`);
            }

            // 步骤 3: 写入组件文件并生成页面
            console.log('💾 步骤 3: 写入组件文件并生成页面...');
            result.steps.push({
                step: 3,
                name: '写入组件文件并生成页面',
                status: 'running',
                startedAt: new Date().toISOString()
            });

            const projectId = result.projectId;
            const successfulSections = sectionGenerationResults.filter(r => r.success && r.result);

            // 3.1 写入组件文件并生成页面文件
            const pageGenerationResult = await this.generateAndWritePages(
                projectId,
                userPrompt,
                requirement,
                successfulSections,
                options
            );

            result.pageGenerationResult = pageGenerationResult;
            result.steps[2].status = pageGenerationResult.success ? 'completed' : 'failed';
            result.steps[2].completedAt = new Date().toISOString();
            console.log('✅ 步骤 3 完成: 组件文件写入和页面生成完成');

            // 步骤 4: 整合项目结构
            console.log('🏗️ 步骤 4: 整合项目结构...');
            result.steps.push({
                step: 4,
                name: '整合项目结构',
                status: 'running',
                startedAt: new Date().toISOString()
            });

            // 4.1 整合项目结构（导航、布局等）
            const structureIntegrationResult = await this.integrateProjectStructure(
                projectId,
                userPrompt,
                requirement,
                pageGenerationResult.writtenPages,
                options
            );

            result.structureIntegrationResult = structureIntegrationResult;
            result.steps[3].status = structureIntegrationResult.success ? 'completed' : 'failed';
            result.steps[3].completedAt = new Date().toISOString();
            console.log('✅ 步骤 4 完成: 项目结构整合完成');

            // TODO: 步骤 5 - 后续可以添加项目启动等功能
            /*
            // 步骤 5: 检查并启动项目（可选）
            if (options.autoStart) {
                console.log('🚀 步骤 5: 启动项目...');
                result.steps.push({ step: 5, name: '启动项目', status: 'running', startedAt: new Date().toISOString() });

                const projectStatus = await this.projectManager.startProject(projectId);
                result.projectStatus = projectStatus;

                result.steps[4].status = projectStatus.status === 'running' ? 'completed' : 'failed';
                result.steps[4].completedAt = new Date().toISOString();
                
                if (projectStatus.status === 'running') {
                    console.log('✅ 项目启动成功');
                } else {
                    console.log('⚠️ 项目启动失败，但文件已生成');
                }
            }
            */

            // 目前完成步骤 1、2、3 和 4，标记为成功
            result.success = true;
            result.metadata.completedAt = new Date().toISOString();
            console.log('🎉 所有步骤执行完成！需求清单、组件生成、页面生成和项目结构整合已完成');

            return result;

        } catch (error) {
            console.error('项目生成工作流失败:', error);
            throw new Error(`项目生成工作流失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    /**
     * 步骤 3: 生成并写入页面文件
     * 负责写入组件文件并为每个页面生成对应的页面文件
     */
    private async generateAndWritePages(
        projectId: string,
        userPrompt: string,
        requirement: any,
        successfulSections: Array<{
            pageName: string;
            sectionName: string;
            result: any;
            success: boolean;
        }>,
        options: ProjectGenerationOptions = {}
    ): Promise<{
        success: boolean;
        componentsWritten: number;
        pagesGenerated: number;
        generatedComponents: Array<{
            pageName: string;
            sectionName: string;
            filePath: string;
            componentName: string;
            fileType: string;
        }>;
        writtenPages: Array<{
            pageName: string;
            routePath: string;
            filePath: string;
            components: string[];
        }>;
        error?: string;
    }> {
        try {
            console.log(`📝 准备写入 ${successfulSections.length} 个成功生成的组件文件`);

            const fileWriteOperations = [];
            const generatedComponents = [];

            // 3.1 写入所有成功生成的组件文件
            for (const sectionResult of successfulSections) {
                if (sectionResult.result && sectionResult.result.files) {
                    for (const file of sectionResult.result.files) {
                        console.log(`📄 写入组件文件: ${file.path}`);

                        fileWriteOperations.push(
                            this.projectManager.saveProjectFiles(projectId, {
                                [file.path]: file.content
                            })
                        );

                        // 收集组件信息用于后续整合
                        generatedComponents.push({
                            pageName: sectionResult.pageName,
                            sectionName: sectionResult.sectionName,
                            filePath: file.path,
                            componentName: this.extractComponentName(file.path, file.content),
                            fileType: file.type || 'component'
                        });
                    }
                }
            }

            // 等待所有组件文件写入完成
            await Promise.all(fileWriteOperations);
            console.log(`✅ ${fileWriteOperations.length} 个组件文件写入完成`);

            // 3.2 为每个页面生成页面文件
            const writtenPages = await this.generatePageFiles(
                projectId,
                userPrompt,
                requirement,
                generatedComponents,
                options
            );

            // 注意：layout.tsx 将在后续的 integrateProjectStructure 步骤中生成

            return {
                success: true,
                componentsWritten: fileWriteOperations.length,
                pagesGenerated: writtenPages.length,
                generatedComponents,
                writtenPages
            };

        } catch (error) {
            console.error('页面生成失败:', error);
            return {
                success: false,
                componentsWritten: 0,
                pagesGenerated: 0,
                generatedComponents: [],
                writtenPages: [],
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }

    /**
     * 生成页面文件
     */
    private async generatePageFiles(
        projectId: string,
        userPrompt: string,
        requirement: any,
        generatedComponents: Array<{
            pageName: string;
            sectionName: string;
            filePath: string;
            componentName: string;
            fileType: string;
        }>,
        options: ProjectGenerationOptions = {}
    ): Promise<Array<{
        pageName: string;
        routePath: string;
        filePath: string;
        components: string[];
    }>> {
        const writtenPages: Array<{
            pageName: string;
            routePath: string;
            filePath: string;
            components: string[];
        }> = [];

        if (!requirement.pages || !Array.isArray(requirement.pages)) {
            console.log('⚠️ 没有页面信息，跳过页面文件生成');
            return writtenPages;
        }

        console.log(`📄 开始生成 ${requirement.pages.length} 个页面文件...`);

        for (const page of requirement.pages) {
            try {
                const pageName = page.page_name || page.name;
                const urlSlug = page.url_slug || page.url || '';
                const routePath = urlSlug || pageName.toLowerCase().replace(/\s+/g, '-');
                const pageFilePath = routePath === '' ? 'app/page.tsx' : `app/${routePath}/page.tsx`;

                // 找到该页面对应的组件
                const pageComponents = generatedComponents.filter(comp => comp.pageName === pageName);

                if (pageComponents.length === 0) {
                    console.log(`⚠️ 页面 "${pageName}" 没有对应的组件，跳过`);
                    continue;
                }

                console.log(`📝 生成页面文件: ${pageFilePath} (${pageComponents.length} 个组件)`);

                // 构建页面生成提示词
                const pagePrompt = this.buildPageGenerationPrompt(
                    userPrompt,
                    page,
                    pageComponents
                );

                // 调用 Dify 生成页面代码
                const pageResult = await this.componentDifyClient!.generateUI(pagePrompt, {
                    projectType: options.projectType || 'nextjs',
                    context: `${pageName}页面文件生成`,
                    component_type: 'page',
                    designRules: requirement.designRules
                });

                // 写入页面文件
                if (pageResult && pageResult.files) {
                    for (const file of pageResult.files) {
                        await this.projectManager.saveProjectFiles(projectId, {
                            [file.path]: file.content
                        });
                        console.log(`✅ 页面文件已写入: ${file.path}`);
                    }
                }

                writtenPages.push({
                    pageName,
                    routePath,
                    filePath: pageFilePath,
                    components: pageComponents.map(comp => comp.componentName)
                });

            } catch (error) {
                console.error(`❌ 生成页面 "${page.page_name || page.name}" 失败:`, error);
            }
        }

        console.log(`✅ 页面文件生成完成，共生成 ${writtenPages.length} 个页面`);
        return writtenPages;
    }



    /**
     * 构建页面生成提示词
     */
    private buildPageGenerationPrompt(
        originalPrompt: string,
        page: any,
        pageComponents: Array<{
            pageName: string;
            sectionName: string;
            filePath: string;
            componentName: string;
            fileType: string;
        }>
    ): string {
        const pageName = page.page_name || page.name;
        const urlSlug = page.url_slug || page.url || '';
        const routePath = urlSlug || pageName.toLowerCase().replace(/\s+/g, '-');
        const sections = page.sections || [];

        return `## 页面文件生成任务

### 原始用户需求
${originalPrompt}

### 页面信息
- **页面名称**: ${pageName}
- **页面描述**: ${page.description || ''}
- **路由路径**: /${routePath}
- **页面文件**: ${routePath === '' ? 'app/page.tsx' : `app/${routePath}/page.tsx`}

### 页面组件
${pageComponents.map(comp =>
            `- **${comp.componentName}** (${comp.sectionName})
  - 文件路径: ${comp.filePath}
  - 导入语句: import ${comp.componentName} from '${comp.filePath.replace('.tsx', '').replace('components/', '@/components/')}'`
        ).join('\n')}

### 页面结构
${sections.map((section: any) =>
            `- **${section.section_name || section.name}**: ${section.description || ''}`
        ).join('\n')}

### 生成要求
请生成一个完整的 Next.js App Router 页面文件，要求：

1. **文件路径**: ${routePath === '' ? 'app/page.tsx' : `app/${routePath}/page.tsx`}
2. **导入所有组件**: 正确导入上述列出的所有组件
3. **组件布局**: 按照页面结构合理组织组件
4. **响应式设计**: 使用 Tailwind CSS 实现响应式布局
5. **页面元数据**: 设置合适的页面标题和描述
6. **TypeScript**: 使用 TypeScript 编写

### 页面模板结构
\`\`\`tsx
import  ComponentName1 from '@/components/ComponentName1';
import  ComponentName2 from '@/components/ComponentName2';

export default function ${pageName.replace(/\s+/g, '')}Page() {
  return (
    <div className="min-h-screen">
      <ComponentName1 />
      <ComponentName2 />
    </div>
  );
}
\`\`\`

请确保：
- 正确的组件导入路径
- 合理的页面布局和组件排列
- 良好的用户体验和视觉效果`;
    }

    /**
     * 步骤 4: 整合项目结构
     * 负责生成导航、布局等项目结构文件
     */
    private async integrateProjectStructure(
        projectId: string,
        userPrompt: string,
        requirement: any,
        writtenPages: Array<{
            pageName: string;
            routePath: string;
            filePath: string;
            components: string[];
        }>,
        options: ProjectGenerationOptions = {}
    ): Promise<{
        success: boolean;
        integrationFilesWritten: number;
        generatedFiles: string[];
        error?: string;
    }> {
        try {
            console.log('🏗️ 开始整合项目结构...');

            // 分析现有项目结构
            const projectStructure = await this.analyzeSandboxProject(options.analysis);

            // 构建项目结构整合提示词
            const integrationPrompt = await this.buildProjectStructurePrompt(
                userPrompt,
                requirement,
                writtenPages,
                projectStructure
            );

            console.log(`📝 项目结构整合提示词: ${integrationPrompt.substring(0, 200)}...`);

            // 调用 Dify 生成项目结构文件
            const structureResult = await this.componentDifyClient!.generateUI(integrationPrompt, {
                projectType: options.projectType || 'nextjs',
                context: '项目结构整合和导航生成',
                component_type: 'structure',
                designRules: requirement.designRules
            });

            const generatedFiles: string[] = [];

            // 写入整合后的项目文件（如布局文件、导航组件等）
            if (structureResult && structureResult.files) {
                const integrationFileOperations = structureResult.files.map(async (file: any) => {
                    console.log(`📝 写入整合文件: ${file.path}`);
                    generatedFiles.push(file.path);
                    return this.projectManager.saveProjectFiles(projectId, {
                        [file.path]: file.content
                    });
                });

                await Promise.all(integrationFileOperations);
                console.log(`✅ ${structureResult.files.length} 个整合文件写入完成`);
            }

            return {
                success: true,
                integrationFilesWritten: structureResult?.files?.length || 0,
                generatedFiles
            };

        } catch (error) {
            console.error('项目结构整合失败:', error);
            return {
                success: false,
                integrationFilesWritten: 0,
                generatedFiles: [],
                error: error instanceof Error ? error.message : '未知错误'
            };
        }
    }

    /**
     * 构建项目结构整合提示词
     */
    private async buildProjectStructurePrompt(
        originalPrompt: string,
        requirement: any,
        writtenPages: Array<{
            pageName: string;
            routePath: string;
            filePath: string;
            components: string[];
        }>,
        projectStructure: string
    ): Promise<string> {
        // 构建页面导航信息
        const navigationInfo = writtenPages.map(page =>
            `- **${page.pageName}**: /${page.routePath} (${page.filePath})`
        ).join('\n');

        // 构建导航结构 - 处理新的数据格式
        const navStructure = requirement.navigation ?
            `- **导航配置**: ${requirement.navigation.description || '根据页面结构生成导航菜单'}` :
            '根据页面结构自动生成导航';

        // 构建页脚结构
        const footerStructure = requirement.footer ?
            `- **页脚配置**: ${requirement.footer.description || '页脚包含联系信息、快速链接等'}` :
            '根据项目需求生成页脚';

        return await this.buildProjectStructurePromptWithCurrentLayout(
            originalPrompt,
            requirement,
            writtenPages,
            projectStructure,
            navStructure,
            footerStructure,
            navigationInfo
        );
    }

    /**
     * 构建项目结构整合提示词（实时读取当前 layout.tsx）
     */
    private async buildProjectStructurePromptWithCurrentLayout(
        originalPrompt: string,
        requirement: any,
        writtenPages: Array<{
            pageName: string;
            routePath: string;
            filePath: string;
            components: string[];
        }>,
        projectStructure: string,
        navStructure: string,
        footerStructure: string,
        navigationInfo: string
    ): Promise<string> {
        // 实时读取当前的 layout.tsx 文件
        const currentLayout = await this.readSandboxFile('app/layout.tsx', '当前 layout.tsx');

        return `## 项目结构整合任务

### 原始用户需求
${originalPrompt}

### 项目信息
- **项目标题**: ${requirement.title}
- **项目描述**: ${requirement.description}

### 现有项目结构
${projectStructure}

### 已生成的页面
${navigationInfo}

### 导航结构要求
${navStructure}

### 页脚结构要求
${footerStructure}

### 当前 Layout 文件内容
${currentLayout}

### 整合任务
请生成以下项目结构文件来完成整合：

#### 1. 全局布局文件 (app/layout.tsx)
- 基于当前 layout.tsx 文件进行更新
- 整合全局导航和页脚组件
- 保持现有的样式和配置
- 添加必要的组件导入

#### 2. 导航组件 (components/Navigation.tsx)
- 包含所有页面的链接
- 支持移动端展示

#### 3. 页脚组件 (components/Footer.tsx)
- 包含联系信息、快速链接、社交媒体链接
- 版权信息和其他必要信息

#### 4. 其他必要文件
- 如果需要，可以创建其他辅助组件
- 更新配置文件（如有需要）

### 技术要求
2. **TypeScript**: 所有文件使用 TypeScript
4. **Tailwind CSS**: 使用 Tailwind 进行样式设置

### 导航链接映射
${writtenPages.map(page =>
            `- ${page.pageName}: href="/${page.routePath}"`
        ).join('\n')}

请确保：
- 基于当前 layout.tsx 内容进行增强
- 正确的页面链接和路由
- 良好的用户体验和导航
- 与现有项目结构的兼容性
`;
    }

    /**
     * 通用文件读取方法
     * @param relativePath 相对于sandbox目录的文件路径
     * @param description 文件描述，用于错误提示
     * @param wrapInCodeBlock 是否包装在代码块中
     */
    private async readSandboxFile(
        relativePath: string,
        description: string = '文件',
        wrapInCodeBlock: boolean = true
    ): Promise<string> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const filePath = path.join(process.cwd(), 'sandbox', relativePath);
            const fileContent = await fs.readFile(filePath, 'utf-8');

            if (wrapInCodeBlock) {
                // 根据文件扩展名确定语言
                const ext = path.extname(relativePath).toLowerCase();
                const language = this.getCodeBlockLanguage(ext);

                return `\`\`\`${language}
${fileContent}
\`\`\``;
            }

            return fileContent;

        } catch (error) {
            console.warn(`无法读取${description} (${relativePath}):`, error);
            return `**${description}**: 文件不存在或无法读取`;
        }
    }

    /**
     * 根据文件扩展名获取代码块语言标识
     */
    private getCodeBlockLanguage(extension: string): string {
        const languageMap: Record<string, string> = {
            '.tsx': 'tsx',
            '.ts': 'typescript',
            '.jsx': 'jsx',
            '.js': 'javascript',
            '.css': 'css',
            '.scss': 'scss',
            '.json': 'json',
            '.md': 'markdown',
            '.html': 'html',
            '.xml': 'xml',
            '.yml': 'yaml',
            '.yaml': 'yaml'
        };

        return languageMap[extension] || 'text';
    }

    /**
     * 收集所有需要生成的 sections
     * 包括页面sections和全局navigation、footer组件
     */
    private collectAllSections(requirement: any): Array<{ pageName: string, sectionName: string, sectionData: any }> {
        const allSections: Array<{ pageName: string, sectionName: string, sectionData: any }> = [];

        // 添加全局 navigation 组件
        if (requirement.navigation) {
            allSections.push({
                pageName: 'Global',
                sectionName: requirement.navigation.section_name || 'Navigation',
                sectionData: {
                    ...requirement.navigation,
                    section_type: requirement.navigation.section_type || 'Navigation',
                    isGlobal: true,
                    globalContext: {
                        projectTitle: requirement.title,
                        projectDescription: requirement.description,
                        pages: requirement.pages || []
                    }
                }
            });
        }

        // 添加全局 footer 组件
        if (requirement.footer) {
            allSections.push({
                pageName: 'Global',
                sectionName: requirement.footer.section_name || 'Footer',
                sectionData: {
                    ...requirement.footer,
                    section_type: requirement.footer.section_type || 'Footer',
                    isGlobal: true,
                    globalContext: {
                        projectTitle: requirement.title,
                        projectDescription: requirement.description,
                        pages: requirement.pages || []
                    }
                }
            });
        }

        // 添加页面级别的 sections
        if (requirement.pages && Array.isArray(requirement.pages)) {
            requirement.pages.forEach((page: any) => {
                const pageName = page.page_name || page.name || '未知页面';

                if (page.sections && Array.isArray(page.sections)) {
                    page.sections.forEach((section: any) => {
                        const sectionName = section.section_name || section.name || '未知组件';

                        allSections.push({
                            pageName,
                            sectionName,
                            sectionData: {
                                ...section,
                                isGlobal: false,
                                pageContext: {
                                    pageName,
                                    pageUrl: page.url_slug || page.url || '',
                                    pageDescription: page.description || '',
                                    metaDescription: page.meta_description || ''
                                }
                            }
                        });
                    });
                }
            });
        }

        return allSections;
    }

    /**
     * 为单个 section 构建生成提示词
     * 直接使用 section 的描述作为提示词，因为 Dify 中已经内置了生成风格和要求
     */
    private buildSectionPrompt(originalPrompt: string, requirement: any, section: { pageName: string, sectionName: string, sectionData: any }): string {
        const { sectionData } = section;

        // 直接返回 section 的描述作为提示词
        return sectionData.description || '';
    }

    /**
     * 从文件路径和内容中提取组件名称
     */
    private extractComponentName(filePath: string, fileContent: string): string {
        // 从文件路径提取组件名
        const fileName = filePath.split('/').pop() || '';
        const componentName = fileName.replace(/\.(tsx?|jsx?)$/, '');

        // 也可以尝试从文件内容中提取 export default 的组件名
        const exportMatch = fileContent.match(/export\s+default\s+(?:function\s+)?(\w+)/);
        if (exportMatch && exportMatch[1]) {
            return exportMatch[1];
        }

        return componentName;
    }



    /**
 * 分析sandbox项目的现有结构
 * @param options 分析选项
 */
    private async analyzeSandboxProject(options: {
        ignoreDirs?: string[];
        ignoreFiles?: string[];
    } = {}): Promise<string> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const sandboxPath = path.join(process.cwd(), 'sandbox');

            // 默认忽略的目录：ui (shadcn/ui组件), node_modules, .next 等
            const defaultIgnoreDirs = ['ui', 'node_modules', '.next', '.git', 'dist', 'build'];
            const ignoreDirs = [...defaultIgnoreDirs, ...(options.ignoreDirs || [])];

            // 分析主要文件和目录
            const structure = {
                pages: await this.analyzeDirectory(path.join(sandboxPath, 'app'), ignoreDirs),
                components: await this.analyzeDirectory(path.join(sandboxPath, 'components'), ignoreDirs),
                lib: await this.analyzeDirectory(path.join(sandboxPath, 'lib'), ignoreDirs),
            };

            // 分析关键文件内容
            const keyFileContents = await this.analyzeKeyFiles(sandboxPath);

            return `**当前sandbox项目结构:**

**页面文件 (app/):**
${structure.pages}

**组件文件 (components/):**
${structure.components}

**工具文件 (lib/):**
${structure.lib}

**关键文件内容分析:**
${keyFileContents}

**注意**: 已忽略目录: ${ignoreDirs.join(', ')}`;

        } catch (error) {
            console.warn('分析sandbox项目结构失败:', error);
            return '**当前项目结构:** 无法分析现有结构，将创建新的项目文件';
        }
    }

    /**
     * 分析关键文件的内容
     */
    private async analyzeKeyFiles(sandboxPath: string): Promise<string> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const analyses: string[] = [];

            // 分析 app/page.tsx
            const mainPagePath = path.join(sandboxPath, 'app', 'page.tsx');
            try {
                const content = await fs.readFile(mainPagePath, 'utf-8');
                const summary = this.analyzeFileContent(content, 'app/page.tsx');
                analyses.push(summary);
            } catch (error) {
                analyses.push('- app/page.tsx: 文件不存在');
            }

            // 分析 app/layout.tsx
            const layoutPath = path.join(sandboxPath, 'app', 'layout.tsx');
            try {
                const content = await fs.readFile(layoutPath, 'utf-8');
                const summary = this.analyzeFileContent(content, 'app/layout.tsx');
                analyses.push(summary);
            } catch (error) {
                analyses.push('- app/layout.tsx: 文件不存在');
            }

            // 分析已存在的自定义组件
            const componentsPath = path.join(sandboxPath, 'components');
            try {
                const files = await fs.readdir(componentsPath);
                const customComponents = files.filter(f => f.endsWith('.tsx') && !f.startsWith('.'));

                if (customComponents.length > 0) {
                    analyses.push(`- 现有自定义组件 (${customComponents.length}个): ${customComponents.slice(0, 5).join(', ')}${customComponents.length > 5 ? '...' : ''}`);
                }
            } catch (error) {
                // components目录不存在
            }

            return analyses.join('\n');

        } catch (error) {
            return '无法分析关键文件内容';
        }
    }

    /**
     * 分析文件内容并生成摘要
     */
    private analyzeFileContent(content: string, filePath: string): string {
        const lines = content.split('\n');

        // 提取imports
        const imports = lines.filter(line => line.trim().startsWith('import'))
            .map(line => line.trim())
            .slice(0, 3); // 只显示前3个import

        // 提取组件名或函数名
        const componentMatch = content.match(/export\s+default\s+(?:function\s+)?(\w+)/);
        const componentName = componentMatch ? componentMatch[1] : '未知';

        // 分析内容特征
        const features = [];
        if (content.includes('shadcn/ui')) features.push('使用shadcn/ui');
        if (content.includes('useState')) features.push('有状态管理');
        if (content.includes('className')) features.push('有样式');
        if (content.includes('<Tabs')) features.push('包含标签页');
        if (content.includes('<Card')) features.push('包含卡片');

        return `- ${filePath}: ${componentName}组件，${features.join('，')}${imports.length > 0 ? `，导入: ${imports.slice(0, 2).join('; ')}` : ''}`;
    }

    /**
     * 分析指定目录的文件结构
     * @param dirPath 目录路径
     * @param ignoreDirs 要忽略的目录名称数组
     */
    private async analyzeDirectory(dirPath: string, ignoreDirs: string[] = ['ui']): Promise<string> {
        try {
            const fs = await import('fs/promises');
            const path = await import('path');

            const files = await fs.readdir(dirPath, { withFileTypes: true });
            const result: string[] = [];

            for (const file of files) {
                if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
                    result.push(`- ${file.name}`);
                } else if (file.isDirectory() && !file.name.startsWith('.') && !ignoreDirs.includes(file.name)) {
                    const subFiles = await this.analyzeDirectory(path.join(dirPath, file.name), ignoreDirs);
                    if (subFiles.trim()) {
                        result.push(`- ${file.name}/\n${subFiles.split('\n').map(line => '  ' + line).join('\n')}`);
                    }
                }
            }

            return result.join('\n');
        } catch (error) {
            return '目录不存在或无法访问';
        }
    }

    /**
     * 基于需求清单构建组件生成提示词
     */
    private buildComponentPrompt(originalPrompt: string, requirement: any): string {
        const promptParts = [
            `原始需求: ${originalPrompt}`,
            '',
            '基于以下详细需求清单生成完整的项目代码:',
            '',
            '## 项目信息',
            `标题: ${requirement.title}`,
            `描述: ${requirement.description}`,
            '',
            '## 页面结构',
            ...(requirement.pages || []).map((page: any) =>
                `- ${page.page_name || page.name}: ${page.url_slug || page.path}`
            ),
            '',
            '## 导航结构',
            ...(requirement.navigation || []).map((nav: any) =>
                `- ${nav.label}: ${nav.target_page}`
            ),
            '',
            '请生成完整可运行的项目代码，包括所有必要的文件和配置。'
        ];

        return promptParts.join('\n');
    }

    /**
     * 获取工作流配置状态
     */
    getConfigurationStatus(): WorkflowConfigStatus {
        return {
            requirementGeneratorConfigured: !!this.requirementGenerator,
            componentGeneratorConfigured: !!this.componentDifyClient,
            projectManagerConfigured: !!this.projectManager
        };
    }
}

// 类型定义
export interface WorkflowConfig {
    apiEndpoint?: string;
    componentApiKey?: string;
    requirementApiKey?: string;
}

export interface ProjectGenerationOptions {
    projectId?: string;
    projectType?: 'nextjs' | 'react' | 'vue';
    context?: string;
    autoStart?: boolean;
    analysis?: {
        ignoreDirs?: string[];
        ignoreFiles?: string[];
    };
}

export interface ProjectGenerationResult {
    success: boolean;
    projectId: string;
    steps: WorkflowStep[];
    requirement?: any; // 简化为 any 类型，使用单数形式
    sectionGenerationResults?: Array<{
        pageName: string;
        sectionName: string;
        result: any;
        success: boolean;
        error?: string;
    }>;
    pageGenerationResult?: {
        success: boolean;
        componentsWritten: number;
        pagesGenerated: number;
        generatedComponents: Array<{
            pageName: string;
            sectionName: string;
            filePath: string;
            componentName: string;
            fileType: string;
        }>;
        writtenPages: Array<{
            pageName: string;
            routePath: string;
            filePath: string;
            components: string[];
        }>;
        error?: string;
    };
    structureIntegrationResult?: {
        success: boolean;
        integrationFilesWritten: number;
        generatedFiles: string[];
        error?: string;
    };
    // 保留旧接口以向后兼容
    projectIntegrationResult?: {
        componentsWritten: number;
        integrationFilesWritten: number;
        generatedComponents: Array<{
            pageName: string;
            sectionName: string;
            filePath: string;
            componentName: string;
            fileType: string;
        }>;
        integrationResult: any;
    };
    generationResult?: GenerateResult;
    projectStatus?: any;
    metadata: {
        startedAt: string;
        completedAt?: string;
        userPrompt: string;
    };
}

export interface WorkflowStep {
    step: number;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: string;
    completedAt?: string;
    error?: string;
}

export interface WorkflowConfigStatus {
    requirementGeneratorConfigured: boolean;
    componentGeneratorConfigured: boolean;
    projectManagerConfigured: boolean;
}

export default ProjectGenerationWorkflow;
