'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorFixService } from '@/lib/vector/error-fix-service';

interface ProjectErrorFixIntegrationProps {
    projectId: string;
    projectPath: string;
    onErrorFixComplete?: (result: any) => void;
    autoStart?: boolean;
}

export default function ProjectErrorFixIntegration({
    projectId,
    projectPath,
    onErrorFixComplete,
    autoStart = true
}: ProjectErrorFixIntegrationProps) {
    const [currentStep, setCurrentStep] = useState<'idle' | 'detecting' | 'analyzing' | 'fixing' | 'completed' | 'failed'>('idle');
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState<any[]>([]);
    const [fixResults, setFixResults] = useState<any[]>([]);
    const [summary, setSummary] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);

    // 自动启动错误修复流程
    useEffect(() => {
        if (autoStart && currentStep === 'idle') {
            startErrorFixWorkflow();
        }
    }, [autoStart, currentStep]);

    // 启动错误修复工作流
    const startErrorFixWorkflow = async () => {
        try {
            setCurrentStep('detecting');
            setProgress(0);
            setLogs([]);
            addLog('🚀 启动项目错误修复工作流...');

            const errorFixService = new ErrorFixService();

            // 步骤1: 检测错误
            addLog('🔍 检测项目错误...');
            setProgress(20);
            
            const detectedErrors = await errorFixService.detectProjectErrors(projectId, projectPath);
            setErrors(detectedErrors);
            
            if (detectedErrors.length === 0) {
                addLog('🎉 没有发现错误！项目运行正常。');
                setCurrentStep('completed');
                setProgress(100);
                setSummary('项目运行正常，无需修复');
                onErrorFixComplete?.({ success: true, errors: [], summary: '项目运行正常' });
                return;
            }

            addLog(`📊 发现 ${detectedErrors.length} 个错误，开始智能修复...`);
            setProgress(40);

            // 步骤2: 启动智能修复工作流
            setCurrentStep('fixing');
            addLog('🔧 启动智能修复工作流...');
            setProgress(60);

            const workflowResult = await errorFixService.intelligentErrorFixWorkflow(
                projectId,
                projectPath
            );

            setFixResults(workflowResult.fixResults);
            setSummary(workflowResult.summary);
            setProgress(100);

            addLog(`🏁 错误修复工作流完成: ${workflowResult.summary}`);
            setCurrentStep('completed');

            // 回调通知完成
            onErrorFixComplete?.({
                success: true,
                totalErrors: workflowResult.totalErrors,
                resolvedErrors: workflowResult.resolvedErrors,
                failedErrors: workflowResult.failedErrors,
                summary: workflowResult.summary,
                fixResults: workflowResult.fixResults
            });

        } catch (error) {
            console.error('错误修复工作流失败:', error);
            addLog(`❌ 错误修复失败: ${error instanceof Error ? error.message : '未知错误'}`);
            setCurrentStep('failed');
            setProgress(0);
            
            onErrorFixComplete?.({
                success: false,
                error: error instanceof Error ? error.message : '未知错误'
            });
        }
    };

    // 手动重新启动
    const restartWorkflow = () => {
        setCurrentStep('idle');
        setProgress(0);
        setErrors([]);
        setFixResults([]);
        setSummary('');
        setLogs([]);
        startErrorFixWorkflow();
    };

    // 添加日志
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    // 获取步骤描述
    const getStepDescription = () => {
        switch (currentStep) {
            case 'detecting': return '正在检测项目错误...';
            case 'analyzing': return '正在分析错误原因...';
            case 'fixing': return '正在自动修复错误...';
            case 'completed': return '错误修复完成！';
            case 'failed': return '错误修复失败';
            default: return '等待启动...';
        }
    };

    // 获取步骤图标
    const getStepIcon = () => {
        switch (currentStep) {
            case 'detecting': return '🔍';
            case 'analyzing': return '🧠';
            case 'fixing': return '🔧';
            case 'completed': return '✅';
            case 'failed': return '❌';
            default: return '⏳';
        }
    };

    return (
        <div className="space-y-6">
            {/* 头部信息 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {getStepIcon()} 项目错误修复
                    </CardTitle>
                    <CardDescription>
                        自动检测和修复项目生成后的运行错误
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">项目: {projectId}</p>
                            <p className="text-sm text-muted-foreground">路径: {projectPath}</p>
                        </div>
                        <div className="flex gap-2">
                            {currentStep === 'failed' && (
                                <Button onClick={restartWorkflow} variant="outline">
                                    🔄 重新开始
                                </Button>
                            )}
                            {currentStep === 'idle' && (
                                <Button onClick={startErrorFixWorkflow}>
                                    🚀 开始修复
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 进度和状态 */}
            {currentStep !== 'idle' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">{getStepDescription()}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>进度</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="w-full" />
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                            <Badge variant={currentStep === 'completed' ? 'default' : 'secondary'}>
                                状态: {currentStep}
                            </Badge>
                            {errors.length > 0 && (
                                <Badge variant="outline">
                                    发现错误: {errors.length}
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 错误列表 */}
            {errors.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>📋 发现的错误 ({errors.length})</CardTitle>
                        <CardDescription>项目运行中发现的问题</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {errors.map((error, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Badge className={
                                            error.severity === 'critical' ? 'bg-red-600' :
                                            error.severity === 'high' ? 'bg-orange-500' :
                                            error.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }>
                                            {error.severity}
                                        </Badge>
                                        <div>
                                            <p className="font-medium">{error.errorMessage}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {error.errorType} | {error.filePath || '未知文件'}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">
                                        {error.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 修复结果 */}
            {fixResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>🔧 修复结果 ({fixResults.length})</CardTitle>
                        <CardDescription>自动修复的执行结果</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {fixResults.map((result, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={result.success ? 'bg-green-500' : 'bg-red-500'}>
                                            {result.success ? '✅ 成功' : '❌ 失败'}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            执行时间: {result.executionTime}ms
                                        </span>
                                    </div>
                                    {result.logs && result.logs.length > 0 && (
                                        <div className="text-sm">
                                            <p className="font-medium mb-1">执行日志:</p>
                                            <div className="max-h-20 overflow-y-auto space-y-1">
                                                {result.logs.slice(-3).map((log, logIndex) => (
                                                    <div key={logIndex} className="text-xs font-mono bg-gray-100 p-1 rounded">
                                                        {log}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 完成摘要 */}
            {currentStep === 'completed' && summary && (
                <Alert>
                    <AlertDescription>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-lg">🏁 修复完成</h4>
                            <p>{summary}</p>
                            {fixResults.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                    共处理 {fixResults.length} 个修复任务
                                </div>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* 失败信息 */}
            {currentStep === 'failed' && (
                <Alert>
                    <AlertDescription>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-lg text-red-600">❌ 修复失败</h4>
                            <p>错误修复过程中遇到了问题，请检查项目配置或手动处理错误。</p>
                            <Button onClick={restartWorkflow} variant="outline" size="sm">
                                🔄 重新尝试
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* 执行日志 */}
            {logs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>📝 执行日志</CardTitle>
                        <CardDescription>详细的执行过程记录</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {logs.map((log, index) => (
                                <div key={index} className="text-xs font-mono bg-gray-100 p-2 rounded">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
