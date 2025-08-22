/**
 * AI 相关模块的统一导出文件
 * 便于其他模块导入和使用
 */

// 核心 AI 客户端
export { DifyClient } from './dify-client';
export type { GenerateOptions, GenerateResult, GeneratedFile } from './dify-client';

// 需求分析和生成
export { RequirementGenerator } from './requirement-generator';
export type {
    RequirementOptions,
    RequirementResult,
    PageRequirement,
    ComponentRequirement
} from './requirement-generator';

// 项目生成工作流
export { ProjectGenerationWorkflow } from './project-generation-workflow';
export type {
    WorkflowConfig,
    ProjectGenerationOptions,
    ProjectGenerationResult,
    WorkflowStep,
    WorkflowConfigStatus
} from './project-generation-workflow';

// 代码分析和上下文
export { ComponentAnalyzer } from './component-analyzer';
export { SmartContextBuilder } from './smart-context-builder';
export { ProjectContextAnalyzer } from './project-context-analyzer';

// AI 代理（如果有的话）
export { default as AIAgent } from './ai-agent';

// 重新导出默认实例
export default ProjectGenerationWorkflow;
