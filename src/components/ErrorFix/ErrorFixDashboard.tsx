'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorInfo {
    id: string;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: string;
    createdAt: string;
}

interface FixSuggestion {
    id: string;
    description: string;
    confidence: number;
    reasoning: string;
    estimatedTime: number;
}

interface FixResult {
    success: boolean;
    appliedChanges: any[];
    executionTime: number;
    logs: string[];
}

interface WorkflowResult {
    totalErrors: number;
    resolvedErrors: number;
    failedErrors: number;
    summary: string;
}

export default function ErrorFixDashboard({ 
    projectId, 
    projectPath 
}: { 
    projectId: string; 
    projectPath: string; 
}) {
    const [errors, setErrors] = useState<ErrorInfo[]>([]);
    const [suggestions, setSuggestions] = useState<FixSuggestion[]>([]);
    const [fixResults, setFixResults] = useState<FixResult[]>([]);
    const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentAction, setCurrentAction] = useState<string>('');
    const [progress, setProgress] = useState(0);

    // 获取错误状态
    const fetchErrorStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/ai/error-fix?projectId=${projectId}&projectPath=${projectPath}`);
            const data = await response.json();
            
            if (data.success) {
                setErrors(data.errors);
            }
        } catch (error) {
            console.error('获取错误状态失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 检测项目错误
    const detectErrors = async () => {
        try {
            setLoading(true);
            setCurrentAction('detect');
            setProgress(0);

            const response = await fetch('/api/ai/error-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    projectPath,
                    action: 'detect'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setErrors(data.errors);
                setProgress(100);
            }
        } catch (error) {
            console.error('检测错误失败:', error);
        } finally {
            setLoading(false);
            setCurrentAction('');
        }
    };

    // 分析错误
    const analyzeError = async (errorId: string) => {
        try {
            setLoading(true);
            setCurrentAction('analyze');
            setProgress(0);

            const response = await fetch('/api/ai/error-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    projectPath,
                    action: 'analyze',
                    errorId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setSuggestions(data.suggestions);
                setProgress(100);
            }
        } catch (error) {
            console.error('分析错误失败:', error);
        } finally {
            setLoading(false);
            setCurrentAction('');
        }
    };

    // 自动修复错误
    const fixError = async (errorId: string, suggestionId: string) => {
        try {
            setLoading(true);
            setCurrentAction('fix');
            setProgress(0);

            const response = await fetch('/api/ai/error-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    projectPath,
                    action: 'fix',
                    errorId,
                    suggestionId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setFixResults(prev => [...prev, data.fixResult]);
                setProgress(100);
                
                // 刷新错误状态
                setTimeout(fetchErrorStatus, 1000);
            }
        } catch (error) {
            console.error('修复错误失败:', error);
        } finally {
            setLoading(false);
            setCurrentAction('');
        }
    };

    // 启动智能修复工作流
    const startWorkflow = async () => {
        try {
            setLoading(true);
            setCurrentAction('workflow');
            setProgress(0);

            const response = await fetch('/api/ai/error-fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    projectPath,
                    action: 'workflow'
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setWorkflowResult(data.workflowResult);
                setProgress(100);
                
                // 刷新错误状态
                setTimeout(fetchErrorStatus, 1000);
            }
        } catch (error) {
            console.error('启动工作流失败:', error);
        } finally {
            setLoading(false);
            setCurrentAction('');
        }
    };

    // 获取严重程度颜色
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-600';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    // 获取状态颜色
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'bg-green-500';
            case 'fixing': return 'bg-blue-500';
            case 'failed': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    useEffect(() => {
        fetchErrorStatus();
    }, [projectId, projectPath]);

    return (
        <div className="space-y-6">
            {/* 头部信息 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">错误修复仪表板</h1>
                    <p className="text-muted-foreground">
                        项目: {projectId} | 路径: {projectPath}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={detectErrors} disabled={loading}>
                        🔍 检测错误
                    </Button>
                    <Button onClick={startWorkflow} disabled={loading} variant="default">
                        🚀 智能修复
                    </Button>
                </div>
            </div>

            {/* 进度条 */}
            {loading && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span>{currentAction === 'detect' ? '检测错误中...' : 
                               currentAction === 'analyze' ? '分析错误中...' :
                               currentAction === 'fix' ? '修复错误中...' :
                               currentAction === 'workflow' ? '执行工作流中...' : '处理中...'}</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                </div>
            )}

            {/* 工作流结果 */}
            {workflowResult && (
                <Alert>
                    <AlertDescription>
                        <div className="flex items-center gap-4">
                            <span className="text-lg font-semibold">🏁 工作流执行完成</span>
                            <div className="flex gap-4 text-sm">
                                <span>总错误: {workflowResult.totalErrors}</span>
                                <span>已修复: {workflowResult.resolvedErrors}</span>
                                <span>失败: {workflowResult.failedErrors}</span>
                            </div>
                        </div>
                        <p className="mt-2">{workflowResult.summary}</p>
                    </AlertDescription>
                </Alert>
            )}

            {/* 主要内容 */}
            <Tabs defaultValue="errors" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="errors">错误列表 ({errors.length})</TabsTrigger>
                    <TabsTrigger value="suggestions">修复建议 ({suggestions.length})</TabsTrigger>
                    <TabsTrigger value="results">修复结果 ({fixResults.length})</TabsTrigger>
                </TabsList>

                {/* 错误列表 */}
                <TabsContent value="errors" className="space-y-4">
                    {errors.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center text-muted-foreground">
                                    🎉 没有发现错误！项目运行正常。
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {errors.map((error) => (
                                <Card key={error.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge className={getSeverityColor(error.severity)}>
                                                    {error.severity}
                                                </Badge>
                                                <Badge className={getStatusColor(error.status)}>
                                                    {error.status}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {error.type}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => analyzeError(error.id)}
                                                    disabled={loading}
                                                >
                                                    🔍 分析
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{error.message}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            创建时间: {new Date(error.createdAt).toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* 修复建议 */}
                <TabsContent value="suggestions" className="space-y-4">
                    {suggestions.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center text-muted-foreground">
                                    📝 还没有修复建议，请先分析错误。
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {suggestions.map((suggestion) => (
                                <Card key={suggestion.id}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{suggestion.description}</CardTitle>
                                        <CardDescription>
                                            置信度: {(suggestion.confidence * 100).toFixed(1)}% | 
                                            预计时间: {suggestion.estimatedTime} 分钟
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">修复理由:</h4>
                                            <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => {
                                                    // 这里需要从suggestions中找到对应的errorId
                                                    const errorId = 'temp'; // 临时值
                                                    fixError(errorId, suggestion.id);
                                                }}
                                                disabled={loading}
                                            >
                                                🔧 应用修复
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* 修复结果 */}
                <TabsContent value="results" className="space-y-4">
                    {fixResults.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center text-muted-foreground">
                                    📊 还没有修复结果。
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {fixResults.map((result, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <Badge className={result.success ? 'bg-green-500' : 'bg-red-500'}>
                                                {result.success ? '✅ 成功' : '❌ 失败'}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                执行时间: {result.executionTime}ms
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">执行日志:</h4>
                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                {result.logs.map((log, logIndex) => (
                                                    <div key={logIndex} className="text-xs font-mono bg-gray-100 p-2 rounded">
                                                        {log}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
