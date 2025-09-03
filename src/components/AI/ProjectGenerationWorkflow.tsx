'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Code2, 
  Settings, 
  Globe, 
  Zap, 
  TrendingUp, 
  Users, 
  Layers,
  Play,
  Pause,
  RefreshCw,
  Download,
  Share2,
  Star,
  Eye,
  BarChart3,
  Lightbulb,
  Target,
  Calendar,
  GitBranch,
  ShoppingCart
} from 'lucide-react';

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
  progress?: number;
  estimatedTime?: string;
}

interface GenerationResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    projectId: string;
    steps: WorkflowStep[];
    requirement?: any;
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

const WORKFLOW_TEMPLATES = [
  {
    icon: Globe,
    title: "企业官网",
    description: "现代化的企业官网，包含首页、关于我们、产品服务、新闻动态、联系我们等页面",
    category: "企业网站",
    difficulty: "中等",
    estimatedTime: "15-20分钟",
    features: ["响应式设计", "SEO优化", "内容管理", "表单处理"]
  },
  {
    icon: Users,
    title: "社交平台",
    description: "用户社交平台，包含用户注册、个人资料、动态发布、好友系统、消息通知等功能",
    category: "社交应用",
    difficulty: "复杂",
    estimatedTime: "25-35分钟",
    features: ["用户认证", "实时通信", "数据持久化", "权限管理"]
  },
  {
    icon: ShoppingCart,
    title: "电商网站",
    description: "完整的电商平台，包含商品展示、购物车、订单管理、支付集成、用户中心等",
    category: "电商平台",
    difficulty: "复杂",
    estimatedTime: "30-40分钟",
    features: ["商品管理", "购物车", "支付系统", "订单跟踪"]
  },
  {
    icon: BarChart3,
    title: "数据仪表板",
    description: "数据分析和可视化平台，包含多种图表类型、数据筛选、实时更新、导出功能",
    category: "数据分析",
    difficulty: "中等",
    estimatedTime: "20-25分钟",
    features: ["数据可视化", "实时更新", "交互式图表", "数据导出"]
  }
];

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
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('generator');
  const [workflowHistory, setWorkflowHistory] = useState<GenerationResult[]>([]);
  
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

  useEffect(() => {
    checkConfiguration();
  }, []);

  // 处理模板选择
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setPrompt(template.description);
    setActiveTab('generator');
    textareaRef.current?.focus();
  };

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
          context: '完整项目生成',
          template: selectedTemplate?.title
        })
      });

      const data: GenerationResult = await response.json();

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

        // 添加到历史记录
        setWorkflowHistory(prev => [data, ...prev.slice(0, 9)]);

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
        return <Badge className="bg-green-500 text-white">✅ 完成</Badge>;
      case 'running':
        return <Badge className="bg-blue-500 text-white">🔄 进行中</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 text-white">❌ 失败</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">⏳ 等待</Badge>;
    }
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="generator">🚀 项目生成器</TabsTrigger>
          <TabsTrigger value="templates">📋 项目模板</TabsTrigger>
          <TabsTrigger value="history">📚 生成历史</TabsTrigger>
        </TabsList>

        {/* 项目生成器 */}
        <TabsContent value="generator" className="space-y-6">
          {renderProjectGenerator()}
        </TabsContent>

        {/* 项目模板 */}
        <TabsContent value="templates" className="space-y-6">
          {renderTemplates()}
        </TabsContent>

        {/* 生成历史 */}
        <TabsContent value="history" className="space-y-6">
          {renderHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderProjectGenerator() {
    return (
      <>
        {/* 配置状态检查 */}
        {configStatus && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                工作流配置状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                  <div className="text-lg font-bold text-blue-600 mb-1">
                    {configStatus.configStatus?.requirementGeneratorConfigured ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-blue-700">需求生成器</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-lg font-bold text-green-600 mb-1">
                    {configStatus.configStatus?.componentGeneratorConfigured ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-green-700">组件生成器</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-lg font-bold text-purple-600 mb-1">
                    {configStatus.configStatus?.projectIntegrationConfigured ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-purple-700">项目整合</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-orange-200">
                  <div className="text-lg font-bold text-orange-600 mb-1">
                    {configStatus.configStatus?.deploymentConfigured ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-orange-700">部署配置</div>
                </div>
              </div>
              
              {(!configStatus.environment?.apiEndpoint || !configStatus.environment?.requirementApiKey || !configStatus.environment?.componentApiKey) && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">⚠️ 环境配置不完整</h4>
                      <p className="text-yellow-700 text-sm">
                        请确保以下环境变量已配置：
                      </p>
                      <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                        <li>• <strong>DIFY_API_ENDPOINT</strong> - Dify API 接口地址</li>
                        <li>• <strong>REQUIRMENT_DIFY_API_KEY</strong> - 需求清单生成的 API 密钥</li>
                        <li>• <strong>COMPONENT_DIFY_API_KEY</strong> - 组件生成的 API 密钥</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 项目描述输入 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              完整项目生成
            </CardTitle>
            <CardDescription className="text-lg">
              描述您想要创建的项目，AI 将生成需求清单并自动构建完整的项目代码
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：创建一个电商网站，包含商品展示、购物车、用户登录注册、订单管理、支付集成、后台管理等功能。要求响应式设计，支持多语言，包含SEO优化..."
                className="min-h-36 resize-none text-base leading-relaxed"
                disabled={isGenerating}
              />

              {/* 项目特性选择 */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  项目特性 (可选)
                </label>
                <div className="flex flex-wrap gap-2">
                  {["响应式设计", "TypeScript", "Tailwind CSS", "SEO优化", "多语言支持", "PWA", "单元测试", "CI/CD", "Docker部署", "性能监控"].map((feature) => (
                    <Badge
                      key={feature}
                      variant="outline"
                      className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  <GitBranch className="w-3 h-3 mr-1" />
                  项目: {projectId}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Code2 className="w-3 h-3 mr-1" />
                  框架: Next.js
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Globe className="w-3 h-3 mr-1" />
                  TypeScript
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPrompt('');
                    setSelectedTemplate(null);
                  }}
                  disabled={isGenerating}
                  className="hover:bg-gray-50"
                >
                  清空
                </Button>

                <Button 
                  onClick={handleGenerateProject}
                  disabled={!prompt.trim() || isGenerating || 
                    !configStatus?.configStatus?.requirementGeneratorConfigured ||
                    !configStatus?.configStatus?.componentGeneratorConfigured}
                  className="min-w-[140px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      开始生成项目
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 进度显示 */}
        {isGenerating && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">项目生成进度</span>
                  <span className="font-bold text-purple-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-purple-100" />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>预计剩余时间: {Math.max(1, Math.ceil((100 - progress) / 15))} 分钟</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步骤状态显示 */}
        {result?.data?.steps && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                执行步骤
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.data.steps.map((step) => (
                  <div key={step.step} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getStepIcon(step)}
                      <div>
                        <div className="font-medium text-gray-900">步骤 {step.step}: {step.name}</div>
                        {step.estimatedTime && (
                          <div className="text-sm text-gray-500">预计时间: {step.estimatedTime}</div>
                        )}
                      </div>
                    </div>
                    {getStepStatus(step)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 生成结果摘要 */}
        {result?.success && result.data && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                生成结果摘要
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.data.requirement && (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      需求分析
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        项目: {result.data.requirement.title}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {result.data.requirement.pagesCount} 个页面
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {result.data.requirement.navigationCount} 个导航项
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        页脚: {result.data.requirement.hasFooter ? '已配置' : '未配置'}
                      </li>
                    </ul>
                  </div>
                )}
                
                {result.data.sectionGeneration && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                    <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      Section 组件生成
                    </h4>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        总计: {result.data.sectionGeneration.totalSections} 个 section
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        成功: {result.data.sectionGeneration.successCount} 个
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        失败: {result.data.sectionGeneration.failCount} 个
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        成功率: {Math.round((result.data.sectionGeneration.successCount / result.data.sectionGeneration.totalSections) * 100)}%
                      </li>
                    </ul>
                  </div>
                )}

                {result.data.projectIntegration && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      项目整合
                    </h4>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        组件文件: {result.data.projectIntegration.componentsWritten} 个
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        整合文件: {result.data.projectIntegration.integrationFilesWritten} 个
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        总文件数: {result.data.projectIntegration.totalFilesWritten} 个
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        生成组件: {result.data.projectIntegration.generatedComponents.length} 个
                      </li>
                    </ul>
                  </div>
                )}

                {result.data.generation && (
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      整体代码生成
                    </h4>
                    <ul className="space-y-2 text-sm text-orange-800">
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        {result.data.generation.filesGenerated} 个文件
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        {result.data.generation.features?.length || 0} 个特性
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        {result.data.generation.dependencies?.length || 0} 个依赖
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              
              {result.data.projectStatus?.url && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-green-800 font-medium">🌐 项目已启动</p>
                      <a 
                        href={result.data.projectStatus.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-700 underline hover:no-underline text-sm"
                      >
                        {result.data.projectStatus.url}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  className="hover:bg-blue-50 hover:border-blue-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载项目
                </Button>
                <Button
                  variant="outline"
                  className="hover:bg-green-50 hover:border-green-200"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  分享项目
                </Button>
                <Button
                  variant="outline"
                  className="hover:bg-purple-50 hover:border-purple-200"
                >
                  <Star className="w-4 h-4 mr-2" />
                  收藏模板
                </Button>
                {result.data?.projectStatus?.url && (
                  <Button
                    variant="outline"
                    className="hover:bg-orange-50 hover:border-orange-200"
                    onClick={() => onPreview?.(result.data!.projectStatus!.url)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    预览项目
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 日志显示 */}
        {generationLog.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                执行日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-green-400 p-6 rounded-xl font-mono text-sm max-h-64 overflow-y-auto border border-gray-700">
                {generationLog.map((log, index) => (
                  <div key={index} className="mb-2 flex items-start gap-2">
                    <span className="text-blue-400 text-xs mt-1">→</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 错误显示 */}
        {result && !result.success && (
          <Card className="border-0 shadow-lg border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-6 h-6" />
                生成失败
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700">{result.error}</p>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  function renderTemplates() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">📋 项目模板库</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            选择预定义的项目模板快速开始，或基于这些模板进行自定义修改
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {WORKFLOW_TEMPLATES.map((template, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl group-hover:from-purple-200 group-hover:to-pink-200 transition-colors">
                    <template.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {template.category}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        template.difficulty === '简单' ? 'text-green-600 border-green-200' :
                        template.difficulty === '中等' ? 'text-yellow-600 border-yellow-200' :
                        'text-red-600 border-red-200'
                      }`}
                    >
                      {template.difficulty}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                  {template.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {template.description}
                </p>
                
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">主要特性:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {template.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    成功率: 95%
                  </span>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="sm"
                >
                  使用此模板
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function renderHistory() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">📚 项目生成历史</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            查看之前的项目生成记录，快速重新生成或基于历史结果进行改进
          </p>
        </div>

        {workflowHistory.length === 0 ? (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-purple-50">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">暂无生成记录</h4>
              <p className="text-gray-500">开始生成您的第一个项目，这里将显示生成历史</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workflowHistory.map((item, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {item.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.success ? '项目生成成功' : '项目生成失败'}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPrompt(item.data?.requirement?.description || '');
                          setActiveTab('generator');
                        }}
                      >
                        重新生成
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResult(item);
                          setActiveTab('generator');
                        }}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>
                  
                  {item.data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {item.data.requirement && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {item.data.requirement.pagesCount || 0}
                          </div>
                          <div className="text-gray-600">页面数量</div>
                        </div>
                      )}
                      
                      {item.data.sectionGeneration && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {item.data.sectionGeneration.totalSections}
                          </div>
                          <div className="text-gray-600">组件数量</div>
                        </div>
                      )}

                      {item.data.projectIntegration && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {item.data.projectIntegration.totalFilesWritten}
                          </div>
                          <div className="text-gray-600">文件数量</div>
                        </div>
                      )}

                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">
                          {item.data.generation?.filesGenerated || 0}
                        </div>
                        <div className="text-gray-600">生成文件</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }
}
