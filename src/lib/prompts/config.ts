/**
 * Dify Prompt 配置文件
 * 在这个文件中修改 prompt 内容，调试完后统一更新
 */

/**
 * ⚠️ 重要提示：
 * 这个文件包含了发送给 Dify 的所有 prompt 配置
 * 您可以在这里修改 prompt 内容进行调试
 * 调试完成后，记得将最终版本更新到 index.ts
 */

export const PROMPT_CONFIG = {
    /**
     * 系统角色定义
     * 🔧 可调试项：调整角色定位和基本能力描述
     */
    SYSTEM_ROLE: `你是一个专业的 React/Next.js UI 开发助手。你需要根据用户需求生成高质量的 UI 代码。`,

    /**
     * 重要约束条件
     * 🔧 可调试项：调整约束条件的严格程度和具体要求
     */
    CONSTRAINTS: `## 重要约束条件
1. **必须使用提供的组件库**: 只能使用下面文档中列出的组件，不要自己创建新组件
2. **遵循现有的代码风格**: 参考示例代码的写法和结构
3. **使用正确的导入路径**: 严格按照别名配置使用 @/ 导入
4. **响应式设计**: 确保生成的 UI 在不同屏幕尺寸下都能正常显示
5. **无障碍设计**: 考虑键盘导航和屏幕阅读器支持`,

    /**
     * 代码生成要求
     * 🔧 可调试项：调整代码质量和格式要求
     */
    CODE_REQUIREMENTS: `## 代码生成要求
- 生成完整可运行的 TSX 代码
- 包含必要的类型定义
- 使用 TypeScript 最佳实践
- 添加适当的注释
- 确保代码格式化良好`,

    /**
     * 响应格式要求
     * 🔧 可调试项：调整输出格式和结构要求
     */
    RESPONSE_FORMAT: `## 响应格式
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
\`\`\``,

    /**
     * 结束指令
     * 🔧 可调试项：调整最终的行动指令
     */
    CLOSING_INSTRUCTION: `请根据以上要求生成相应的 UI 代码。`,

    /**
     * 基础组件上下文（降级方案）
     * 🔧 可调试项：调整备用组件库信息
     */
    BASIC_COMPONENT_CONTEXT: `# 基础组件库

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
- 遵循设计系统规范`,
};



/**
 * Dify 配置
 */
export const DIFY_CONFIG = {
    /**
     * 模型参数
     */
    MODEL_SETTINGS: {
        temperature: 0.2,
        maxTokens: 4000,
        topP: 0.9,
        frequencyPenalty: 0.1,
    },

    /**
     * 上下文处理配置
     */
    CONTEXT_CONFIG: {
        maxContextLength: 50000,
        truncateStrategy: 'tail',
        includeSystemMessage: true,
    },

    /**
     * 错误处理配置
     */
    ERROR_CONFIG: {
        maxRetries: 3,
        retryDelay: 1000,
        fallbackToBasic: true,
    },
};



export default PROMPT_CONFIG;
