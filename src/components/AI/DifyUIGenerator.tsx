"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  FileText, 
  Code2, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  RefreshCw,
  Lightbulb,
  Zap,
  Layers,
  Copy,
  Download,
  Share2,
  Star,
  Clock,
  TrendingUp,
  Palette,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DifyUIGeneratorProps {
  projectId?: string;
  onFilesGenerated?: (files: GeneratedFile[]) => void;
  onPreview?: () => void;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: string;
  size: number;
}

interface GenerationResult {
  success: boolean;
  message: string;
  data?: {
    filesGenerated: number;
    files: GeneratedFile[];
    description: string;
    features: string[];
    dependencies: string[];
    hasConfigChanges: boolean;
    conversationId?: string;
    evolution?: {
      suggestions: {
        nextSteps: Array<{
          id: string;
          title: string;
          description: string;
          priority: 'high' | 'medium' | 'low';
          autoExecutable: boolean;
        }>;
      };
      recommendedPrompts: Array<{
        id: string;
        purpose: string;
        prompt: string;
        description: string;
      }>;
      stats: {
        totalSuggestions: number;
        autoExecutableCount: number;
        userPromptsCount: number;
      };
    };
  };
  error?: string;
}

const EXAMPLE_PROMPTS = [
  {
    icon: Lightbulb,
    title: "登录页面",
    prompt: "创建一个现代化的用户登录页面，包含邮箱密码输入框、记住我选项、忘记密码链接和社交登录按钮",
    category: "认证",
    difficulty: "简单",
    estimatedTime: "2-3分钟"
  },
  {
    icon: Zap,
    title: "数据仪表板",
    prompt: "设计一个数据分析仪表板，包含图表卡片、统计数字、进度条和数据表格",
    category: "数据展示",
    difficulty: "中等",
    estimatedTime: "5-7分钟"
  },
  {
    icon: FileText,
    title: "博客文章卡片",
    prompt: "创建一个博客文章列表页面，每个文章卡片包含标题、摘要、作者、发布时间和标签",
    category: "内容展示",
    difficulty: "简单",
    estimatedTime: "3-4分钟"
  },
  {
    icon: Code2,
    title: "设置页面",
    prompt: "设计一个用户设置页面，包含个人信息编辑、通知设置、隐私设置和账户管理",
    category: "用户管理",
    difficulty: "中等",
    estimatedTime: "4-6分钟"
  },
  {
    icon: Palette,
    title: "主题切换器",
    prompt: "创建一个支持明暗主题切换的组件，包含切换按钮、主题预览和自动检测系统主题",
    category: "主题系统",
    difficulty: "中等",
    estimatedTime: "4-5分钟"
  },
  {
    icon: Smartphone,
    title: "移动端导航",
    prompt: "设计一个响应式的移动端导航菜单，包含汉堡菜单、滑动抽屉和触摸友好的交互",
    category: "导航",
    difficulty: "中等",
    estimatedTime: "5-6分钟"
  }
];

const FEATURE_TAGS = [
  "响应式设计", "TypeScript", "Tailwind CSS", "无障碍访问", "动画效果", 
  "状态管理", "表单验证", "错误处理", "加载状态", "国际化"
];

export default function DifyUIGenerator({ 
  projectId = 'default-project',
  onFilesGenerated,
  onPreview 
}: DifyUIGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(true);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationResult[]>([]);
  const [activeTab, setActiveTab] = useState('generator');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // 自动滚动日志
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [generationLog]);

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setGenerationLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 处理提示词选择
  const handleExampleSelect = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setShowExamples(false);
    textareaRef.current?.focus();
  };

  // 处理特性标签选择
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  // 生成 UI
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setResult(null);
    setGenerationLog([]);
    setShowExamples(false);

    try {
      addLog('🤖 开始 AI 代码生成...');
      setProgress(10);

      addLog('📚 正在分析组件库和设计规范...');
      setProgress(20);

      addLog('🎨 正在应用选定的特性要求...');
      setProgress(25);

      addLog('🔄 连接 Dify 服务...');
      setProgress(30);

      // 构建增强的提示词
      const enhancedPrompt = selectedFeatures.length > 0 
        ? `${prompt.trim()}\n\n要求包含以下特性：${selectedFeatures.join(', ')}`
        : prompt.trim();

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          projectType: 'nextjs',
          projectId,
          features: selectedFeatures
        })
      });

      setProgress(60);
      addLog('📝 正在解析生成结果...');

      const data: GenerationResult = await response.json();

      setProgress(80);
      addLog('💾 正在写入文件到 sandbox...');

      if (data.success) {
        setProgress(100);
        addLog(`✅ 生成完成！共生成 ${data.data?.filesGenerated || 0} 个文件`);
        
        if (data.data?.files) {
          data.data.files.forEach((file: GeneratedFile) => {
            addLog(`📄 ${file.path} (${file.size} 字符)`);
          });
        }

        if (data.data?.hasConfigChanges) {
          addLog('⚠️ 检测到配置文件变化，项目可能需要重启');
        }

        // 添加到历史记录
        setGenerationHistory(prev => [data, ...prev.slice(0, 9)]);

        // 触发回调
        if (onFilesGenerated && data.data?.files) {
          onFilesGenerated(data.data.files);
        }

        addLog('🎉 代码已成功写入 sandbox 目录！');
      } else {
        addLog(`❌ 生成失败: ${data.error}`);
      }

      setResult(data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addLog(`❌ 请求失败: ${errorMessage}`);
      setResult({
        success: false,
        message: '生成失败',
        error: errorMessage
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    if (prompt.trim()) {
      handleGenerate();
    }
  };

  // 清空
  const handleClear = () => {
    setPrompt('');
    setResult(null);
    setGenerationLog([]);
    setShowExamples(true);
    setSelectedFeatures([]);
    textareaRef.current?.focus();
  };

  // 复制提示词
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    addLog('📋 提示词已复制到剪贴板');
  };

  // 下载生成的文件
  const handleDownloadFiles = () => {
    if (!result?.data?.files) return;
    
    // 简单的文件下载实现，不使用JSZip
    result.data.files.forEach((file: GeneratedFile) => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.path.split('/').pop() || 'component.tsx';
      a.click();
      URL.revokeObjectURL(url);
    });
    
    addLog('📥 文件下载完成');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="generator">🎨 组件生成器</TabsTrigger>
          <TabsTrigger value="examples">💡 示例模板</TabsTrigger>
          <TabsTrigger value="history">📚 生成历史</TabsTrigger>
        </TabsList>

        {/* 组件生成器 */}
        <TabsContent value="generator" className="space-y-6">
          {renderComponentGenerator()}
        </TabsContent>

        {/* 示例模板 */}
        <TabsContent value="examples" className="space-y-6">
          {renderExamples()}
        </TabsContent>

        {/* 生成历史 */}
        <TabsContent value="history" className="space-y-6">
          {renderHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderComponentGenerator() {
    return (
      <>
        {/* 输入区域 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              描述您想要的 UI 界面
            </CardTitle>
            <p className="text-gray-600">
              详细描述您的需求，AI 将生成符合设计规范的 React 组件
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                placeholder="例如：创建一个用户个人资料页面，包含头像、基本信息编辑表单、技能标签和社交媒体链接。要求响应式设计，支持明暗主题切换，包含加载状态和错误处理..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[140px] resize-none text-base leading-relaxed"
                disabled={isGenerating}
              />

              {/* 特性选择 */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  选择需要的特性 (可选)
                </label>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_TAGS.map((feature) => (
                    <Badge
                      key={feature}
                      variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedFeatures.includes(feature)
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'hover:bg-gray-100 hover:border-gray-300'
                      }`}
                      onClick={() => handleFeatureToggle(feature)}
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
                  <Monitor className="w-3 h-3 mr-1" />
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
                {result && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="hover:bg-blue-50 hover:border-blue-200"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新生成
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPrompt}
                      className="hover:bg-green-50 hover:border-green-200"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      复制提示词
                    </Button>
                    
                    {onPreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onPreview}
                        className="hover:bg-purple-50 hover:border-purple-200"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        预览
                      </Button>
                    )}
                  </>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isGenerating}
                  className="hover:bg-gray-50"
                >
                  清空
                </Button>

                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      生成 UI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 进度条 */}
        {isGenerating && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">AI 生成进度</span>
                  <span className="font-bold text-blue-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-blue-100" />
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>预计剩余时间: {Math.max(1, Math.ceil((100 - progress) / 20))} 分钟</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 生成日志 */}
        {generationLog.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                生成日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={logRef}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-green-400 p-6 rounded-xl font-mono text-sm max-h-64 overflow-y-auto space-y-2 border border-gray-700"
              >
                {generationLog.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap flex items-start gap-2">
                    <span className="text-blue-400 text-xs mt-1">→</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 结果展示 */}
        {result && !isGenerating && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
                生成结果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.success ? (
                <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <AlertDescription className="text-green-800 font-medium">
                    {result.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium">
                    {result.error || result.message}
                  </AlertDescription>
                </Alert>
              )}

              {result.data && (
                <div className="space-y-6">
                  {/* 统计信息 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {result.data.filesGenerated}
                      </div>
                      <div className="text-sm text-blue-700 font-medium">文件数量</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {result.data.features.length}
                      </div>
                      <div className="text-sm text-green-700 font-medium">功能特性</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {result.data.dependencies.length}
                      </div>
                      <div className="text-sm text-purple-700 font-medium">依赖包</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                      <div className={`text-3xl font-bold ${result.data.hasConfigChanges ? 'text-orange-600' : 'text-gray-400'}`}>
                        {result.data.hasConfigChanges ? '⚠️' : '✅'}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">配置变更</div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleDownloadFiles}
                      variant="outline"
                      className="hover:bg-green-50 hover:border-green-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载文件
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:bg-blue-50 hover:border-blue-200"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      分享结果
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:bg-purple-50 hover:border-purple-200"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      收藏模板
                    </Button>
                  </div>

                  {/* 详细信息 */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">概览</TabsTrigger>
                      <TabsTrigger value="files">文件详情</TabsTrigger>
                      <TabsTrigger value="features">功能特性</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      {result.data.description && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">生成描述</h4>
                          <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border">
                            {result.data.description}
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="files" className="space-y-4">
                      {result.data.files.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">生成的文件</h4>
                          <div className="space-y-3">
                            {result.data.files.map((file: GeneratedFile, index: number) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-gray-500" />
                                  <span className="font-mono text-sm font-medium">{file.path}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {file.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500">
                                    {file.size} 字符
                                  </span>
                                  <Button size="sm" variant="ghost">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="features" className="space-y-4">
                      {result.data.features.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">功能特性</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.data.features.map((feature: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-sm">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.data.dependencies.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">新增依赖</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.data.dependencies.map((dep: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-sm">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  function renderExamples() {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">💡 快速开始模板</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            选择预定义的模板快速开始，或基于这些示例进行自定义修改
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
              onClick={() => handleExampleSelect(example.prompt)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                    <example.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {example.category}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        example.difficulty === '简单' ? 'text-green-600 border-green-200' :
                        example.difficulty === '中等' ? 'text-yellow-600 border-yellow-200' :
                        'text-red-600 border-red-200'
                      }`}
                    >
                      {example.difficulty}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                  {example.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {example.prompt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {example.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    成功率: 95%
                  </span>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
          <h3 className="text-2xl font-bold text-gray-900 mb-3">📚 生成历史</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            查看之前的生成记录，快速重新生成或基于历史结果进行改进
          </p>
        </div>

        {generationHistory.length === 0 ? (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-blue-50">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-gray-200 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">暂无生成记录</h4>
              <p className="text-gray-500">开始生成您的第一个组件，这里将显示生成历史</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {generationHistory.map((item, index) => (
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
                          {item.success ? '生成成功' : '生成失败'}
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
                          setPrompt(item.data?.description || '');
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
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                          {item.data.filesGenerated}
                        </div>
                        <div className="text-gray-600">文件数量</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {item.data.features.length}
                        </div>
                        <div className="text-gray-600">功能特性</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          {item.data.dependencies.length}
                        </div>
                        <div className="text-gray-600">依赖包</div>
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