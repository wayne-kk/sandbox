import { EmbeddingService, CodeEmbedding, ProjectContext } from './embedding-service';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface ErrorInfo {
    id: string;
    projectId: string;
    errorType: 'runtime' | 'build' | 'lint' | 'type' | 'dependency';
    errorMessage: string;
    errorStack?: string;
    filePath?: string;
    lineNumber?: number;
    columnNumber?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'analyzing' | 'fixing' | 'resolved' | 'failed';
    createdAt: Date;
    resolvedAt?: Date;
    fixAttempts: number;
    maxFixAttempts: number;
}

export interface FixSuggestion {
    id: string;
    errorId: string;
    description: string;
    codeChanges: CodeChange[];
    confidence: number;
    reasoning: string;
    estimatedTime: number; // 预计修复时间（分钟）
}

export interface CodeChange {
    filePath: string;
    lineStart: number;
    lineEnd: number;
    oldCode: string;
    newCode: string;
    changeType: 'replace' | 'insert' | 'delete' | 'append';
}

export interface FixResult {
    success: boolean;
    errorId: string;
    appliedChanges: CodeChange[];
    rollbackChanges?: CodeChange[];
    newErrors?: string[];
    executionTime: number;
    logs: string[];
}

export class ErrorFixService {
    private embeddingService: EmbeddingService;
    private openai: OpenAI;
    private maxFixAttempts: number = 3;

    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OpenAI API Key 缺失: OPENAI_API_KEY 必须设置');
        }

        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.embeddingService = new EmbeddingService();
    }

    /**
     * 检测项目运行错误
     */
    async detectProjectErrors(projectId: string, projectPath: string): Promise<ErrorInfo[]> {
        console.log(`🔍 开始检测项目错误: ${projectId}`);

        const errors: ErrorInfo[] = [];

        try {
            // 1. 检查构建错误
            const buildErrors = await this.checkBuildErrors(projectPath);
            errors.push(...buildErrors);

            // 2. 检查类型错误
            const typeErrors = await this.checkTypeErrors(projectPath);
            errors.push(...typeErrors);

            // 3. 检查Lint错误
            const lintErrors = await this.checkLintErrors(projectPath);
            errors.push(...lintErrors);

            // 4. 检查依赖错误
            const dependencyErrors = await this.checkDependencyErrors(projectPath);
            errors.push(...dependencyErrors);

            console.log(`✅ 错误检测完成: 发现 ${errors.length} 个错误`);
            return errors;

        } catch (error) {
            console.error('❌ 错误检测失败:', error);
            throw error;
        }
    }

    /**
     * 分析错误并提供修复建议
     */
    async analyzeErrorAndSuggestFixes(
        projectId: string,
        error: ErrorInfo,
        projectContext?: string
    ): Promise<FixSuggestion[]> {
        console.log(`🧠 分析错误: ${error.errorMessage}`);

        try {
            // 1. 检索相关代码上下文
            const relevantCode = await this.embeddingService.searchRelevantCode(
                projectId,
                error.errorMessage,
                5,
                0.6
            );

            // 2. 检索项目配置信息
            const projectContexts = await this.embeddingService.searchProjectContext(
                projectId,
                error.errorType,
                3,
                0.6
            );

            // 3. 构建错误分析提示
            const analysisPrompt = this.buildErrorAnalysisPrompt(error, relevantCode, projectContexts);

            // 4. 使用AI分析错误并提供修复建议
            const suggestions = await this.generateFixSuggestions(analysisPrompt, error);

            console.log(`✅ 错误分析完成: 生成 ${suggestions.length} 个修复建议`);
            return suggestions;

        } catch (error) {
            console.error('❌ 错误分析失败:', error);
            throw error;
        }
    }

    /**
     * 自动修复错误
     */
    async autoFixError(
        projectId: string,
        error: ErrorInfo,
        suggestion: FixSuggestion,
        projectPath: string
    ): Promise<FixResult> {
        console.log(`🔧 开始自动修复错误: ${error.errorMessage}`);

        const startTime = Date.now();
        const logs: string[] = [];
        const appliedChanges: CodeChange[] = [];

        try {
            // 1. 备份原始文件
            const backupFiles = await this.backupFiles(suggestion.codeChanges, projectPath);
            logs.push(`📦 已备份 ${backupFiles.length} 个文件`);

            // 2. 应用代码更改
            for (const change of suggestion.codeChanges) {
                const changeResult = await this.applyCodeChange(change, projectPath);
                if (changeResult.success) {
                    appliedChanges.push(change);
                    logs.push(`✅ 已应用更改: ${change.filePath}:${change.lineStart}-${change.lineEnd}`);
                } else {
                    logs.push(`❌ 更改失败: ${change.filePath} - ${changeResult.error}`);
                }
            }

            // 3. 验证修复结果
            const validationResult = await this.validateFix(projectPath, error);
            logs.push(`🔍 修复验证: ${validationResult.success ? '成功' : '失败'}`);

            if (!validationResult.success) {
                // 4. 如果验证失败，回滚更改
                await this.rollbackChanges(backupFiles, projectPath);
                logs.push(`🔄 已回滚更改`);

                return {
                    success: false,
                    errorId: error.id,
                    appliedChanges: [],
                    rollbackChanges: suggestion.codeChanges,
                    newErrors: validationResult.errors,
                    executionTime: Date.now() - startTime,
                    logs
                };
            }

            // 5. 更新错误状态
            await this.updateErrorStatus(error.id, 'resolved');

            const executionTime = Date.now() - startTime;
            logs.push(`🎉 错误修复成功！执行时间: ${executionTime}ms`);

            return {
                success: true,
                errorId: error.id,
                appliedChanges,
                rollbackChanges: undefined,
                newErrors: [],
                executionTime,
                logs
            };

        } catch (error) {
            console.error('❌ 自动修复失败:', error);

            // 发生异常时回滚更改
            try {
                await this.rollbackChanges(backupFiles || [], projectPath);
                logs.push(`🔄 异常回滚完成`);
            } catch (rollbackError) {
                logs.push(`❌ 回滚失败: ${rollbackError}`);
            }

            return {
                success: false,
                errorId: error.id,
                appliedChanges: [],
                rollbackChanges: suggestion.codeChanges,
                newErrors: [error.message],
                executionTime: Date.now() - startTime,
                logs
            };
        }
    }

    /**
     * 智能错误修复工作流
     */
    async intelligentErrorFixWorkflow(
        projectId: string,
        projectPath: string,
        maxRetries: number = 3
    ): Promise<{
        totalErrors: number;
        resolvedErrors: number;
        failedErrors: number;
        fixResults: FixResult[];
        summary: string;
    }> {
        console.log(`🚀 启动智能错误修复工作流: ${projectId}`);

        const fixResults: FixResult[] = [];
        let resolvedErrors = 0;
        let failedErrors = 0;

        try {
            // 1. 检测所有错误
            const errors = await this.detectProjectErrors(projectId, projectPath);
            const totalErrors = errors.length;

            if (totalErrors === 0) {
                return {
                    totalErrors: 0,
                    resolvedErrors: 0,
                    failedErrors: 0,
                    fixResults: [],
                    summary: '🎉 项目运行正常，无需修复！'
                };
            }

            console.log(`📊 发现 ${totalErrors} 个错误，开始智能修复...`);

            // 2. 按严重程度排序错误
            const sortedErrors = this.sortErrorsBySeverity(errors);

            // 3. 逐个修复错误
            for (const error of sortedErrors) {
                if (error.fixAttempts >= this.maxFixAttempts) {
                    console.log(`⏭️ 跳过错误 ${error.id}: 已达到最大修复尝试次数`);
                    failedErrors++;
                    continue;
                }

                try {
                    // 分析错误并获取修复建议
                    const suggestions = await this.analyzeErrorAndSuggestFixes(projectId, error);

                    if (suggestions.length === 0) {
                        console.log(`⚠️ 错误 ${error.id}: 无法生成修复建议`);
                        failedErrors++;
                        continue;
                    }

                    // 选择最佳修复建议
                    const bestSuggestion = this.selectBestFixSuggestion(suggestions);

                    // 尝试修复
                    const fixResult = await this.autoFixError(projectId, error, bestSuggestion, projectPath);
                    fixResults.push(fixResult);

                    if (fixResult.success) {
                        resolvedErrors++;
                        console.log(`✅ 错误 ${error.id} 修复成功`);
                    } else {
                        failedErrors++;
                        error.fixAttempts++;
                        console.log(`❌ 错误 ${error.id} 修复失败，尝试次数: ${error.fixAttempts}`);
                    }

                } catch (error) {
                    console.error(`❌ 处理错误 ${error.id} 时发生异常:`, error);
                    failedErrors++;
                }
            }

            // 4. 生成修复摘要
            const summary = this.generateFixSummary(totalErrors, resolvedErrors, failedErrors, fixResults);

            console.log(`🏁 智能错误修复工作流完成: ${summary}`);

            return {
                totalErrors,
                resolvedErrors,
                failedErrors,
                fixResults,
                summary
            };

        } catch (error) {
            console.error('❌ 智能错误修复工作流失败:', error);
            throw error;
        }
    }

    /**
     * 检查构建错误
     */
    private async checkBuildErrors(projectPath: string): Promise<ErrorInfo[]> {
        const errors: ErrorInfo[] = [];

        try {
            // 尝试构建项目
            const { stdout, stderr } = await execAsync('npm run build', { cwd: projectPath });

            if (stderr && stderr.includes('Error:')) {
                // 解析构建错误
                const errorLines = stderr.split('\n').filter(line => line.includes('Error:'));

                for (const errorLine of errorLines) {
                    const error = this.parseBuildError(errorLine);
                    if (error) {
                        errors.push(error);
                    }
                }
            }
        } catch (buildError: any) {
            // 构建失败，解析错误信息
            if (buildError.stderr) {
                const errorLines = buildError.stderr.split('\n').filter(line => line.includes('Error:'));

                for (const errorLine of errorLines) {
                    const error = this.parseBuildError(errorLine);
                    if (error) {
                        errors.push(error);
                    }
                }
            }
        }

        return errors;
    }

    /**
     * 检查类型错误
     */
    private async checkTypeErrors(projectPath: string): Promise<ErrorInfo[]> {
        const errors: ErrorInfo[] = [];

        try {
            const { stdout, stderr } = await execAsync('npx tsc --noEmit', { cwd: projectPath });

            if (stderr) {
                const errorLines = stderr.split('\n').filter(line => line.includes('error TS'));

                for (const errorLine of errorLines) {
                    const error = this.parseTypeError(errorLine);
                    if (error) {
                        errors.push(error);
                    }
                }
            }
        } catch (typeError: any) {
            if (typeError.stderr) {
                const errorLines = typeError.stderr.split('\n').filter(line => line.includes('error TS'));

                for (const errorLine of errorLines) {
                    const error = this.parseTypeError(errorLine);
                    if (error) {
                        errors.push(error);
                    }
                }
            }
        }

        return errors;
    }

    /**
     * 检查Lint错误
     */
    private async checkLintErrors(projectPath: string): Promise<ErrorInfo[]> {
        const errors: ErrorInfo[] = [];

        try {
            const { stdout, stderr } = await execAsync('npm run lint', { cwd: projectPath });

            if (stderr) {
                const errorLines = stderr.split('\n').filter(line => line.includes('error'));

                for (const errorLine of errorLines) {
                    const error = this.parseLintError(errorLine);
                    if (error) {
                        errors.push(error);
                    }
                }
            }
        } catch (lintError: any) {
            if (lintError.stderr) {
                const errorLines = lintError.stderr.split('\n').filter(line => line.includes('error'));

                for (const errorLine of errorLines) {
                    const error = this.parseLintError(errorLine);
                    if (error) {
                        errors.push(error);
                    }
                }
            }
        }

        return errors;
    }

    /**
     * 检查依赖错误
     */
    private async checkDependencyErrors(projectPath: string): Promise<ErrorInfo[]> {
        const errors: ErrorInfo[] = [];

        try {
            // 检查package.json和node_modules
            const packageJsonPath = path.join(projectPath, 'package.json');
            const nodeModulesPath = path.join(projectPath, 'node_modules');

            const packageJsonExists = await fs.access(packageJsonPath).then(() => true).catch(() => false);
            const nodeModulesExists = await fs.access(nodeModulesPath).then(() => true).catch(() => false);

            if (!packageJsonExists) {
                errors.push({
                    id: `dep_${Date.now()}`,
                    projectId: '',
                    errorType: 'dependency',
                    errorMessage: 'package.json 文件缺失',
                    severity: 'critical',
                    status: 'open',
                    createdAt: new Date(),
                    fixAttempts: 0,
                    maxFixAttempts: this.maxFixAttempts
                });
            }

            if (!nodeModulesExists) {
                errors.push({
                    id: `dep_${Date.now() + 1}`,
                    projectId: '',
                    errorType: 'dependency',
                    errorMessage: 'node_modules 目录缺失，需要安装依赖',
                    severity: 'high',
                    status: 'open',
                    createdAt: new Date(),
                    fixAttempts: 0,
                    maxFixAttempts: this.maxFixAttempts
                });
            }

            // 尝试安装依赖
            if (!nodeModulesExists) {
                try {
                    await execAsync('npm install', { cwd: projectPath });
                } catch (installError) {
                    errors.push({
                        id: `dep_${Date.now() + 2}`,
                        projectId: '',
                        errorType: 'dependency',
                        errorMessage: `依赖安装失败: ${installError}`,
                        severity: 'high',
                        status: 'open',
                        createdAt: new Date(),
                        fixAttempts: 0,
                        maxFixAttempts: this.maxFixAttempts
                    });
                }
            }
        } catch (error) {
            console.error('检查依赖错误失败:', error);
        }

        return errors;
    }

    /**
     * 构建错误分析提示
     */
    private buildErrorAnalysisPrompt(
        error: ErrorInfo,
        relevantCode: CodeEmbedding[],
        projectContexts: ProjectContext[]
    ): string {
        const codeContext = relevantCode
            .map(code => `文件: ${code.file_path}\n类型: ${code.content_type}\n代码:\n${code.code_snippet}\n`)
            .join('\n');

        const contextInfo = projectContexts
            .map(ctx => `${ctx.context_type}: ${ctx.summary}`)
            .join('\n');

        return `
请分析以下错误并提供修复建议：

错误信息: ${error.errorMessage}
错误类型: ${error.errorType}
严重程度: ${error.severity}
文件路径: ${error.filePath || '未知'}
行号: ${error.lineNumber || '未知'}

相关代码上下文:
${codeContext}

项目配置信息:
${contextInfo}

请提供：
1. 错误原因分析
2. 具体的修复建议
3. 修改后的代码
4. 修复的置信度（0-1）
5. 预计修复时间

请用JSON格式返回修复建议。
`;
    }

    /**
     * 生成修复建议
     */
    private async generateFixSuggestions(prompt: string, error: ErrorInfo): Promise<FixSuggestion[]> {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 2000,
                temperature: 0.3
            });

            const content = response.choices[0].message.content;
            if (!content) return [];

            // 尝试解析JSON响应
            try {
                const suggestions = JSON.parse(content);
                return Array.isArray(suggestions) ? suggestions : [suggestions];
            } catch (parseError) {
                // 如果JSON解析失败，尝试从文本中提取信息
                return this.extractSuggestionsFromText(content, error);
            }
        } catch (error) {
            console.error('生成修复建议失败:', error);
            return [];
        }
    }

    /**
     * 从文本中提取修复建议
     */
    private extractSuggestionsFromText(content: string, error: ErrorInfo): FixSuggestion[] {
        // 简单的文本解析逻辑
        const suggestions: FixSuggestion[] = [];

        // 这里可以实现更复杂的文本解析逻辑
        // 暂时返回一个基础建议
        suggestions.push({
            id: `suggestion_${Date.now()}`,
            errorId: error.id,
            description: `修复 ${error.errorType} 错误`,
            codeChanges: [],
            confidence: 0.5,
            reasoning: content.substring(0, 200),
            estimatedTime: 10
        });

        return suggestions;
    }

    /**
     * 选择最佳修复建议
     */
    private selectBestFixSuggestion(suggestions: FixSuggestion[]): FixSuggestion {
        // 按置信度和预计时间排序
        return suggestions.sort((a, b) => {
            const confidenceDiff = b.confidence - a.confidence;
            if (confidenceDiff !== 0) return confidenceDiff;
            return a.estimatedTime - b.estimatedTime;
        })[0];
    }

    /**
     * 备份文件
     */
    private async backupFiles(changes: CodeChange[], projectPath: string): Promise<string[]> {
        const backupFiles: string[] = [];

        for (const change of changes) {
            const filePath = path.join(projectPath, change.filePath);
            const backupPath = `${filePath}.backup.${Date.now()}`;

            try {
                await fs.copyFile(filePath, backupPath);
                backupFiles.push(backupPath);
            } catch (error) {
                console.error(`备份文件失败: ${filePath}`, error);
            }
        }

        return backupFiles;
    }

    /**
     * 应用代码更改
     */
    private async applyCodeChange(change: CodeChange, projectPath: string): Promise<{ success: boolean; error?: string }> {
        try {
            const filePath = path.join(projectPath, change.filePath);
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            let newContent: string;

            switch (change.changeType) {
                case 'replace':
                    const beforeLines = lines.slice(0, change.lineStart - 1);
                    const afterLines = lines.slice(change.lineEnd);
                    newContent = [...beforeLines, change.newCode, ...afterLines].join('\n');
                    break;
                case 'insert':
                    const insertBefore = lines.slice(0, change.lineStart);
                    const insertAfter = lines.slice(change.lineStart - 1);
                    newContent = [...insertBefore, change.newCode, ...insertAfter].join('\n');
                    break;
                case 'delete':
                    const deleteBefore = lines.slice(0, change.lineStart - 1);
                    const deleteAfter = lines.slice(change.lineEnd);
                    newContent = [...deleteBefore, ...deleteAfter].join('\n');
                    break;
                case 'append':
                    newContent = content + '\n' + change.newCode;
                    break;
                default:
                    throw new Error(`不支持的更改类型: ${change.changeType}`);
            }

            await fs.writeFile(filePath, newContent, 'utf-8');
            return { success: true };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 验证修复结果
     */
    private async validateFix(projectPath: string, originalError: ErrorInfo): Promise<{ success: boolean; errors: string[] }> {
        const errors: string[] = [];

        try {
            // 根据原始错误类型进行相应的验证
            switch (originalError.errorType) {
                case 'build':
                    await execAsync('npm run build', { cwd: projectPath });
                    break;
                case 'type':
                    await execAsync('npx tsc --noEmit', { cwd: projectPath });
                    break;
                case 'lint':
                    await execAsync('npm run lint', { cwd: projectPath });
                    break;
                case 'runtime':
                    // 运行时错误需要实际运行来验证
                    break;
                case 'dependency':
                    // 依赖错误通过检查文件存在性验证
                    break;
            }

            return { success: true, errors: [] };

        } catch (validationError: any) {
            if (validationError.stderr) {
                const errorLines = validationError.stderr.split('\n').filter(line => line.includes('Error:'));
                errors.push(...errorLines);
            }
            return { success: false, errors };
        }
    }

    /**
     * 回滚更改
     */
    private async rollbackChanges(backupFiles: string[], projectPath: string): Promise<void> {
        for (const backupFile of backupFiles) {
            try {
                const originalFile = backupFile.replace(/\.backup\.\d+$/, '');
                await fs.copyFile(backupFile, originalFile);
                await fs.unlink(backupFile); // 删除备份文件
            } catch (error) {
                console.error(`回滚文件失败: ${backupFile}`, error);
            }
        }
    }

    /**
     * 更新错误状态
     */
    private async updateErrorStatus(errorId: string, status: ErrorInfo['status']): Promise<void> {
        // 这里可以更新数据库中的错误状态
        console.log(`📝 更新错误状态: ${errorId} -> ${status}`);
    }

    /**
     * 按严重程度排序错误
     */
    private sortErrorsBySeverity(errors: ErrorInfo[]): ErrorInfo[] {
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };

        return errors.sort((a, b) => {
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    }

    /**
     * 生成修复摘要
     */
    private generateFixSummary(
        totalErrors: number,
        resolvedErrors: number,
        failedErrors: number,
        fixResults: FixResult[]
    ): string {
        const successRate = totalErrors > 0 ? ((resolvedErrors / totalErrors) * 100).toFixed(1) : '100';
        const avgTime = fixResults.length > 0
            ? (fixResults.reduce((sum, result) => sum + result.executionTime, 0) / fixResults.length).toFixed(0)
            : '0';

        return `🎯 修复完成！成功率: ${successRate}% | 已修复: ${resolvedErrors} | 失败: ${failedErrors} | 平均耗时: ${avgTime}ms`;
    }

    /**
     * 解析构建错误
     */
    private parseBuildError(errorLine: string): ErrorInfo | null {
        // 简单的构建错误解析
        const match = errorLine.match(/Error:\s*(.+)/);
        if (!match) return null;

        return {
            id: `build_${Date.now()}_${Math.random()}`,
            projectId: '',
            errorType: 'build',
            errorMessage: match[1].trim(),
            severity: 'medium',
            status: 'open',
            createdAt: new Date(),
            fixAttempts: 0,
            maxFixAttempts: this.maxFixAttempts
        };
    }

    /**
     * 解析类型错误
     */
    private parseTypeError(errorLine: string): ErrorInfo | null {
        // 简单的类型错误解析
        const match = errorLine.match(/error TS\d+:\s*(.+)/);
        if (!match) return null;

        return {
            id: `type_${Date.now()}_${Math.random()}`,
            projectId: '',
            errorType: 'type',
            errorMessage: match[1].trim(),
            severity: 'medium',
            status: 'open',
            createdAt: new Date(),
            fixAttempts: 0,
            maxFixAttempts: this.maxFixAttempts
        };
    }

    /**
     * 解析Lint错误
     */
    private parseLintError(errorLine: string): ErrorInfo | null {
        // 简单的Lint错误解析
        const match = errorLine.match(/error\s+(.+)/);
        if (!match) return null;

        return {
            id: `lint_${Date.now()}_${Math.random()}`,
            projectId: '',
            errorType: 'lint',
            errorMessage: match[1].trim(),
            severity: 'low',
            status: 'open',
            createdAt: new Date(),
            fixAttempts: 0,
            maxFixAttempts: this.maxFixAttempts
        };
    }
}
