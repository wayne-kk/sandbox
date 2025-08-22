'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

interface ProjectGenerationWorkflowProps {
  projectId?: string;
  onProjectGenerated?: (result: any) => void;
  onPreview?: (url: string) => void;
}

interface WorkflowStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface GenerationResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    projectId: string;
    steps: WorkflowStep[];
    requirement?: any; // 改为单数
    sectionGeneration?: {
      totalSections: number;
      successCount: number;
      failCount: number;
      sections: Array<{
        pageName: string;
        sectionName: string;
        success: boolean;
        error?: string;
        filesGenerated: number;
      }>;
    };
    projectIntegration?: {
      componentsWritten: number;
      integrationFilesWritten: number;
      totalFilesWritten: number;
      generatedComponents: Array<{
        pageName: string;
        sectionName: string;
        componentName: string;
        filePath: string;
        fileType: string;
      }>;
    };
    generation?: any;
    projectStatus?: any;
    metadata?: any;
  };
}

export default function ProjectGenerationWorkflow({ 
  projectId = 'default-project',
  onProjectGenerated,
  onPreview 
}: ProjectGenerationWorkflowProps) {
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 添加日志
  const addLog = (message: string) => {
    setGenerationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // 检查配置状态
  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/ai/generate-project', {
        method: 'GET'
      });
      const data = await response.json();
      setConfigStatus(data.data);
    } catch (error) {
      console.error('检查配置失败:', error);
    }
  };

  React.useEffect(() => {
    checkConfiguration();
  }, []);

  // 执行完整项目生成
  const handleGenerateProject = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setResult(null);
    setGenerationLog([]);

    try {
      addLog('🚀 开始完整项目生成工作流...');
      setProgress(10);

      const response = await fetch('/api/ai/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          projectType: 'nextjs',
          projectId,
          autoStart: true,
          context: '完整项目生成'
        })
      });

      const data: GenerationResult = await response.json();
      

      console.log('data111111111', data);

      if (data.success && data.data) {
        // 根据步骤更新进度
        data.data.steps.forEach((step, index) => {
          if (step.status === 'completed') {
            const newProgress = 20 + (index + 1) * 20;
            setProgress(newProgress);
            addLog(`✅ ${step.name} 完成`);
          } else if (step.status === 'failed') {
            addLog(`❌ ${step.name} 失败: ${step.error}`);
          }
        });

        // 显示需求清单信息 
        if (data.data.requirement) {
          addLog(`📋 需求分析完成: ${data.data.requirement.title}`);
          addLog(`📄 页面规划: ${data.data.requirement.pagesCount} 个页面`);
          addLog(`🏗️ 导航设计: ${data.data.requirement.navigationCount} 个导航项`);
        }

        // 显示 section 生成信息
        if (data.data.sectionGeneration) {
          addLog(`💻 Section 组件生成完成: 成功 ${data.data.sectionGeneration.successCount} 个，失败 ${data.data.sectionGeneration.failCount} 个`);
          data.data.sectionGeneration.sections.forEach((section: any) => {
            if (section.success) {
              addLog(`✅ ${section.pageName} - ${section.sectionName}: ${section.filesGenerated} 个文件`);
            } else {
              addLog(`❌ ${section.pageName} - ${section.sectionName}: ${section.error}`);
            }
          });
        }

        // 显示项目整合信息
        if (data.data.projectIntegration) {
          addLog(`🏗️ 项目整合完成: ${data.data.projectIntegration.totalFilesWritten} 个文件写入`);
          addLog(`📄 组件文件: ${data.data.projectIntegration.componentsWritten} 个`);
          addLog(`🔧 整合文件: ${data.data.projectIntegration.integrationFilesWritten} 个`);
          data.data.projectIntegration.generatedComponents.forEach((comp: any) => {
            addLog(`📦 ${comp.componentName}: ${comp.filePath}`);
          });
        }

        // 显示代码生成信息（如果有）
        if (data.data.generation) {
          addLog(`💻 代码生成完成: ${data.data.generation.filesGenerated} 个文件`);
          data.data.generation.files.forEach((file: any) => {
            addLog(`📄 ${file.path} (${file.size} 字符)`);
          });
        }

        // 显示项目状态
        if (data.data.projectStatus) {
          if (data.data.projectStatus.status === 'running') {
            addLog(`🌐 项目已启动: ${data.data.projectStatus.url}`);
            setProgress(100);
          } else {
            addLog(`⚠️ 项目状态: ${data.data.projectStatus.status}`);
          }
        }

        // 触发回调
        if (onProjectGenerated) {
          onProjectGenerated(data.data);
        }

        // 如果项目正在运行，提供预览选项
        if (data.data.projectStatus?.url && onPreview) {
          onPreview(data.data.projectStatus.url);
        }

        addLog('🎉 完整项目生成工作流执行完成！');
      } else {
        addLog(`❌ 项目生成失败: ${data.error}`);
      }

      setResult(data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addLog(`❌ 执行失败: ${errorMessage}`);
      setResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStepStatus = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <Badge className="bg-green-500">✅ 完成</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">🔄 进行中</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">❌ 失败</Badge>;
      default:
        return <Badge className="bg-gray-500">⏳ 等待</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 配置状态检查 */}
      {configStatus && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">🔧 工作流配置状态</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">需求清单生成器: </span>
              {configStatus.configStatus?.requirementGeneratorConfigured ? (
                <Badge className="bg-green-500">✅ 已配置</Badge>
              ) : (
                <Badge className="bg-red-500">❌ 未配置</Badge>
              )}
            </div>
            <div>
              <span className="font-medium">组件生成器: </span>
              {configStatus.configStatus?.componentGeneratorConfigured ? (
                <Badge className="bg-green-500">✅ 已配置</Badge>
              ) : (
                <Badge className="bg-red-500">❌ 未配置</Badge>
              )}
            </div>
          </div>
          
          {(!configStatus.environment?.apiEndpoint || !configStatus.environment?.requirementApiKey || !configStatus.environment?.componentApiKey) && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                ⚠️ 请确保环境变量已配置：
                <br />• <strong>DIFY_API_ENDPOINT</strong> - Dify API 接口地址
                <br />• <strong>REQUIRMENT_DIFY_API_KEY</strong> - 需求清单生成的 API 密钥
                <br />• <strong>COMPONENT_DIFY_API_KEY</strong> - 组件生成的 API 密钥
              </p>
            </div>
          )}
        </Card>
      )}

      {/* 项目描述输入 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">🚀 完整项目生成</h2>
        <p className="text-gray-600 mb-4">
          描述您想要创建的项目，AI 将生成需求清单并自动构建完整的项目代码。
        </p>
        
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例如：创建一个电商网站，包含商品展示、购物车、用户登录注册、订单管理等功能..."
          className="min-h-32 mb-4"
          disabled={isGenerating}
        />

        <div className="flex gap-3">
          <Button 
            onClick={handleGenerateProject}
            disabled={!prompt.trim() || isGenerating || 
              !configStatus?.configStatus?.requirementGeneratorConfigured ||
              !configStatus?.configStatus?.componentGeneratorConfigured}
            className="flex-1"
          >
            {isGenerating ? '🔄 生成中...' : '🚀 开始生成项目'}
          </Button>
        </div>
      </Card>

      {/* 进度显示 */}
      {isGenerating && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">生成进度</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <Progress value={progress} className="mb-4" />
        </Card>
      )}

      {/* 步骤状态显示 */}
      {result?.data?.steps && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">📊 执行步骤</h3>
          <div className="space-y-2">
            {result.data.steps.map((step) => (
              <div key={step.step} className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium">步骤 {step.step}: {step.name}</span>
                {getStepStatus(step)}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 生成结果摘要 */}
      {result?.success && result.data && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">📊 生成结果摘要</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {result.data.requirement && (
              <div>
                <h4 className="font-medium mb-2">📋 需求分析</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 项目: {result.data.requirement.title}</li>
                  <li>• {result.data.requirement.pagesCount} 个页面</li>
                  <li>• {result.data.requirement.navigationCount} 个导航项</li>
                  <li>• 页脚: {result.data.requirement.hasFooter ? '已配置' : '未配置'}</li>
                </ul>
              </div>
            )}
            
            {result.data.sectionGeneration && (
              <div>
                <h4 className="font-medium mb-2">💻 Section 组件生成</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 总计: {result.data.sectionGeneration.totalSections} 个 section</li>
                  <li>• 成功: {result.data.sectionGeneration.successCount} 个</li>
                  <li>• 失败: {result.data.sectionGeneration.failCount} 个</li>
                  <li>• 成功率: {Math.round((result.data.sectionGeneration.successCount / result.data.sectionGeneration.totalSections) * 100)}%</li>
                </ul>
              </div>
            )}

            {result.data.projectIntegration && (
              <div>
                <h4 className="font-medium mb-2">🏗️ 项目整合</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 组件文件: {result.data.projectIntegration.componentsWritten} 个</li>
                  <li>• 整合文件: {result.data.projectIntegration.integrationFilesWritten} 个</li>
                  <li>• 总文件数: {result.data.projectIntegration.totalFilesWritten} 个</li>
                  <li>• 生成组件: {result.data.projectIntegration.generatedComponents.length} 个</li>
                </ul>
              </div>
            )}

            {result.data.generation && (
              <div>
                <h4 className="font-medium mb-2">💻 整体代码生成</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• {result.data.generation.filesGenerated} 个文件</li>
                  <li>• {result.data.generation.features?.length || 0} 个特性</li>
                  <li>• {result.data.generation.dependencies?.length || 0} 个依赖</li>
                </ul>
              </div>
            )}
          </div>
          
          {result.data.projectStatus?.url && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">
                🌐 项目已启动: 
                <a 
                  href={result.data.projectStatus.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 underline hover:no-underline"
                >
                  {result.data.projectStatus.url}
                </a>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* 日志显示 */}
      {generationLog.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">📝 执行日志</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
            {generationLog.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </Card>
      )}

      {/* 错误显示 */}
      {result && !result.success && (
        <Card className="p-4 border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">❌ 生成失败</h3>
          <p className="text-red-700">{result.error}</p>
        </Card>
      )}
    </div>
  );
}
