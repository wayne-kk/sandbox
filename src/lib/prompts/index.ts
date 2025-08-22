/**
 * Dify Prompt 配置
 * 这个文件包含了所有发送给 Dify 的 prompt 模板，方便调试和修改
 */

export interface PromptVariables {
    componentContext: string;
    projectType: string;
    context?: string;
    userPrompt: string;
}

/**
 * 系统角色定义
 */
export const SYSTEM_ROLE = `你是一个专业的 React/Next.js UI 开发助手。你需要根据用户需求生成高质量的 UI 代码。`;

/**
 * 重要约束条件
 */
export const CONSTRAINTS = `## 重要约束条件
1. **必须使用提供的组件库**: 只能使用下面文档中列出的组件，不要自己创建新组件
2. **遵循现有的代码风格**: 参考示例代码的写法和结构
3. **使用正确的导入路径**: 严格按照别名配置使用 @/ 导入
4. **响应式设计**: 确保生成的 UI 在不同屏幕尺寸下都能正常显示
5. **无障碍设计**: 考虑键盘导航和屏幕阅读器支持`;

/**
 * 代码生成要求
 */
export const CODE_REQUIREMENTS = `## 代码生成要求
- 生成完整可运行的 TSX 代码
- 包含必要的类型定义
- 使用 TypeScript 最佳实践
- 添加适当的注释
- 确保代码格式化良好`;

/**
 * 响应格式要求
 */
export const RESPONSE_FORMAT = `## 响应格式
请按照以下 JSON 格式返回结果：
\`\`\`json
{
  "files": [
    {
      "path": "app/page.tsx",
      "content": "// 完整的 TSX 代码"
    }
  ],
  "description": "生成内容的简要描述",
  "features": ["特性1", "特性2"],
  "dependencies": ["需要的额外依赖（如果有）"]
}
\`\`\``;

/**
 * 组件库文档前言
 */
export const COMPONENT_CONTEXT_HEADER = `## 组件库文档`;

/**
 * 项目信息模板
 */
export const PROJECT_INFO_TEMPLATE = (projectType: string) =>
    `## 项目类型: ${projectType}`;

/**
 * 额外上下文模板
 */
export const ADDITIONAL_CONTEXT_TEMPLATE = (context: string) =>
    `## 额外上下文: ${context}`;

/**
 * 用户需求标题
 */
export const USER_PROMPT_HEADER = `## 用户需求`;

/**
 * 结束指令
 */
export const CLOSING_INSTRUCTION = `请根据以上要求生成相应的 UI 代码。`;

/**
 * 基础组件上下文（降级方案）
 */
export const BASIC_COMPONENT_CONTEXT = `# 基础组件库

## 可用组件
- Button: 按钮组件，支持 variant (default, secondary, outline, ghost) 和 size (sm, default, lg)
- Card: 卡片容器，包含 CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- Input: 输入框组件，支持各种 HTML input 类型
- Label: 标签组件，用于表单标签
- Textarea: 多行文本输入框
- Alert: 警告/通知组件，支持不同的 variant (default, destructive)
- Badge: 徽章组件，用于显示状态或标签
- Progress: 进度条组件，显示任务完成进度

## 导入路径
使用 @/components/ui/ 前缀导入所有组件

## 基本使用
- 使用 Tailwind CSS 进行样式设置
- 支持深色模式
- 遵循设计系统规范`;

/**
 * 构建完整的系统 Prompt
 */
export function buildSystemPrompt(variables: PromptVariables): string {
    const sections = [
        SYSTEM_ROLE,
        '',
        CONSTRAINTS,
        '',
        COMPONENT_CONTEXT_HEADER,
        variables.componentContext,
        '',
        CODE_REQUIREMENTS,
        '',
        RESPONSE_FORMAT
    ];

    return sections.join('\n');
}

/**
 * 构建项目信息部分
 */
export function buildProjectInfo(projectType: string): string {
    return PROJECT_INFO_TEMPLATE(projectType);
}

/**
 * 构建额外上下文部分
 */
export function buildAdditionalContext(context?: string): string {
    return context ? ADDITIONAL_CONTEXT_TEMPLATE(context) : '';
}

/**
 * 构建用户需求部分
 */
export function buildUserPromptSection(userPrompt: string): string {
    return `${USER_PROMPT_HEADER}\n${userPrompt}`;
}

/**
 * 构建完整的增强 Prompt
 */
export function buildEnhancedPrompt(variables: PromptVariables): string {
    const sections = [
        buildSystemPrompt(variables),
        buildProjectInfo(variables.projectType),
        buildAdditionalContext(variables.context),
        '',
        buildUserPromptSection(variables.userPrompt),
        '',
        CLOSING_INSTRUCTION
    ];

    return sections.filter(section => section !== '').join('\n');
}






/**
 * 错误处理相关的 Prompt 片段
 */
export const ERROR_HANDLING_PROMPTS = {
    /**
     * 组件上下文获取失败时的提示
     */
    CONTEXT_FETCH_ERROR: '⚠️ 组件上下文获取失败，将使用基础组件库。请确保生成的代码使用标准的 shadcn/ui 组件。',

    /**
     * API 调用失败时的提示
     */
    API_ERROR: '❌ Dify API 调用失败，请检查网络连接和配置。',

    /**
     * 响应解析失败时的提示
     */
    PARSE_ERROR: '❌ 响应解析失败，请确保 Dify 返回了正确的 JSON 格式。',
};

/**
 * 导出所有 Prompt 配置，方便外部使用
 */
export const PROMPTS = {
    SYSTEM_ROLE,
    CONSTRAINTS,
    CODE_REQUIREMENTS,
    RESPONSE_FORMAT,
    COMPONENT_CONTEXT_HEADER,
    PROJECT_INFO_TEMPLATE,
    ADDITIONAL_CONTEXT_TEMPLATE,
    USER_PROMPT_HEADER,
    CLOSING_INSTRUCTION,
    BASIC_COMPONENT_CONTEXT,
    buildSystemPrompt,
    buildProjectInfo,
    buildAdditionalContext,
    buildUserPromptSection,
    buildEnhancedPrompt,
    ERROR_HANDLING_PROMPTS,
};

export default PROMPTS;