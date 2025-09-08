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
  Globe,
  ExternalLink,
  Play
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
    componentInfo?: {
      name: string;
      path: string;
      previewUrl: string;
    };
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

const FEATURE_TAGS = [
  "响应式设计", "TypeScript", "Tailwind CSS", "无障碍访问", "动画效果",
  "状态管理", "表单验证", "错误处理", "加载状态", "国际化"
];

const COMPONENT_TYPES = [
  { value: 'component', label: 'UI组件', description: '可复用的界面组件' }
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
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [componentType, setComponentType] = useState<string>('component');

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
    // 重置预览状态，确保新生成的组件有新的预览URL
    setPreviewStatus('idle');
    setPreviewUrl('');

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
          features: selectedFeatures,
          component_type: componentType,
          useVectorContext: false
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

        // 触发回调
        if (onFilesGenerated && data.data?.files) {
          onFilesGenerated(data.data.files);
        }

        addLog('🎉 代码已成功写入 sandbox 目录！');

        // 自动启动预览
        addLog('🚀 正在自动启动预览...');
        setTimeout(() => {
          handleStartPreview(data);
        }, 1000);
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
      // 重置预览相关状态
      setPreviewStatus('idle');
      setPreviewUrl('');
      handleGenerate();
    }
  };

  // 清空
  const handleClear = () => {
    setPrompt('');
    setResult(null);
    setGenerationLog([]);
    setSelectedFeatures([]);
    setComponentType('component');
    setPreviewStatus('idle');
    setPreviewUrl('');
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

  // 启动预览
  const handleStartPreview = async (resultData?: GenerationResult) => {
    const currentResult = resultData || result;
    if (!currentResult?.data?.files || !projectId) return;

    setPreviewStatus('loading');
    addLog('🚀 正在启动 Sandbox 预览...');

    try {
      const response = await fetch('/api/sandbox/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Sandbox 启动失败: ${response.statusText}`);
      }

      const sandboxData = await response.json();

      if (sandboxData.success) {
        // 使用API返回的URL，如果没有则使用Nginx代理地址
        const baseUrl = sandboxData.url || '/sandbox';

        let finalPreviewUrl = baseUrl;
        if (currentResult?.data?.componentInfo?.previewUrl) {
          // 确保URL拼接正确，避免双斜杠
          const componentPath = currentResult.data.componentInfo.previewUrl.startsWith('/') 
            ? currentResult.data.componentInfo.previewUrl.substring(1) 
            : currentResult.data.componentInfo.previewUrl;
          const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          finalPreviewUrl = `${baseUrlClean}/${componentPath}`;
          addLog(`🎯 组件预览地址: ${finalPreviewUrl}`);
        } else {
          addLog(`🌐 项目预览地址: ${finalPreviewUrl}`);
        }

        setPreviewUrl(finalPreviewUrl);
        setPreviewStatus('ready');
        addLog('✅ Sandbox 服务器启动中...');
        addLog('⏳ 请稍等几秒钟让服务器完全启动');
      } else {
        throw new Error(sandboxData.error || 'Sandbox 启动失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sandbox 启动失败';
      setPreviewStatus('error');
      addLog(`❌ Sandbox 启动失败: ${errorMessage}`);
    }
  };

  // 刷新预览
  const handleRefreshPreview = async () => {
    if (!result?.data?.files || !projectId) return;

    setPreviewStatus('loading');
    addLog('🔄 正在刷新预览...');

    try {
      const files: { [path: string]: string } = {};
      result.data.files.forEach((file: GeneratedFile) => {
        files[file.path] = file.content;
      });

      const response = await fetch(`/api/preview/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files })
      });

      const data = await response.json();

      if (data.success) {
        setPreviewStatus('ready');
        addLog('✅ 预览已刷新');
      } else {
        throw new Error(data.error || '刷新预览失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '预览刷新失败';
      setPreviewStatus('error');
      addLog(`❌ 预览刷新失败: ${errorMessage}`);
    }
  };

  // 在新窗口打开预览
  const handleOpenPreviewInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* 生成器区域 */}
      <div className="flex-shrink-0">
        {renderComponentGenerator()}
      </div>

      {/* 预览区域 - 占据剩余空间 */}
      <div className="flex-1 min-h-0">
        {renderInlinePreview()}
      </div>
    </div>
  );

  function renderComponentGenerator() {
    return (
      <div className="space-y-4">
        {/* 输入区域 */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              UI 组件生成器
            </CardTitle>
            <p className="text-gray-600 text-sm">
              描述您想要的 UI 界面，AI 将生成符合设计规范的 React 组件
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                placeholder="例如：创建一个用户个人资料页面，包含头像、基本信息编辑表单、技能标签和社交媒体链接。要求响应式设计，支持明暗主题切换，包含加载状态和错误处理..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none text-base leading-relaxed"
                disabled={isGenerating}
              />

              {/* 组件类型选择 */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  组件类型 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COMPONENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setComponentType(type.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${componentType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="font-medium text-sm mb-1">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                      className={`cursor-pointer transition-all duration-200 ${selectedFeatures.includes(feature)
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
              <div className="flex items-center gap-3 flex-wrap">
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
                <Badge variant="default" className="text-sm bg-blue-100 text-blue-700 border-blue-200">
                  <Layers className="w-3 h-3 mr-1" />
                  类型: {COMPONENT_TYPES.find(t => t.value === componentType)?.label || 'UI组件'}
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
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      onClick={handleDownloadFiles}
                      variant="outline"
                      className="hover:bg-green-50 hover:border-green-200"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载文件
                    </Button>

                    {/* 预览相关按钮 */}
                    {previewStatus === 'idle' && (
                      <Button
                        onClick={() => handleStartPreview()}
                        variant="outline"
                        className="hover:bg-blue-50 hover:border-blue-200"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        启动预览
                      </Button>
                    )}

                    {previewStatus === 'loading' && (
                      <Button
                        disabled
                        variant="outline"
                        className="opacity-50"
                      >
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        预览启动中...
                      </Button>
                    )}

                    {previewStatus === 'ready' && (
                      <>
                        <Button
                          onClick={handleRefreshPreview}
                          variant="outline"
                          className="hover:bg-orange-50 hover:border-orange-200"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          刷新预览
                        </Button>
                        <Button
                          onClick={handleOpenPreviewInNewWindow}
                          variant="outline"
                          className="hover:bg-purple-50 hover:border-purple-200"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          新窗口预览
                        </Button>
                      </>
                    )}

                    {previewStatus === 'error' && (
                      <Button
                        onClick={() => handleStartPreview()}
                        variant="outline"
                        className="hover:bg-red-50 hover:border-red-200 text-red-600"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重试预览
                      </Button>
                    )}
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
      </div>
    );
  }

  function renderInlinePreview() {
    return (
      <div className="h-full flex flex-col">
        {/* 设备选择工具栏 */}
        {previewStatus === 'ready' && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">设备预览:</span>
              <div className="flex items-center gap-1 bg-white rounded border">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${previewDevice === 'desktop'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  title="桌面端 (1200px+)"
                >
                  <Monitor className="w-4 h-4 mr-1 inline" />
                  桌面端
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${previewDevice === 'tablet'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  title="平板端 (768px - 1024px)"
                >
                  <Smartphone className="w-4 h-4 mr-1 inline" />
                  平板端
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${previewDevice === 'mobile'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  title="移动端 (< 768px)"
                >
                  <Smartphone className="w-4 h-4 mr-1 inline" />
                  移动端
                </button>
              </div>
            </div>

            {previewUrl && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <button
                  onClick={handleOpenPreviewInNewWindow}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="在新窗口打开"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 预览内容区域 */}
        <div className="relative h-[800px]">
          {previewStatus === 'idle' && (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center p-8">
                <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">准备预览您的组件</h4>
                <p className="text-gray-600 mb-4 text-sm">
                  点击"启动预览"按钮来查看生成的组件效果
                </p>
                <Button
                  onClick={() => handleStartPreview()}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  启动预览
                </Button>
              </div>
            </div>
          )}

          {previewStatus === 'loading' && (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
              <div className="text-center p-8">
                <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">预览启动中...</h4>
                <p className="text-gray-600 mb-4 text-sm">正在构建和启动预览环境</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          {previewStatus === 'ready' && previewUrl && (
            <div className="h-full border rounded-lg overflow-hidden bg-white shadow-sm">
              {/* 预览iframe容器 */}
              <div
                className="relative bg-gray-100 h-full"
                style={{
                  maxWidth: previewDevice === 'desktop' ? '100%' :
                    previewDevice === 'tablet' ? '768px' : '375px',
                  margin: previewDevice === 'desktop' ? '0' : '0 auto'
                }}
              >
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="组件预览"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                  style={{ backgroundColor: 'white' }}
                />

                {/* 设备边框装饰 */}
                {previewDevice !== 'desktop' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-8 border-gray-800 rounded-3xl" />
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-800 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          )}

          {previewStatus === 'error' && (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
              <div className="text-center p-8">
                <div className="p-4 bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-lg font-semibold text-red-800 mb-2">预览启动失败</h4>
                <p className="text-red-600 mb-4 text-sm max-w-md mx-auto">
                  预览环境启动时遇到问题，可能是网络连接或服务配置问题
                </p>
                <Button
                  onClick={() => handleStartPreview()}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试预览
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 预览提示信息 */}
        {previewStatus === 'ready' && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded">
                <Lightbulb className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h5 className="font-medium text-blue-900 mb-2">预览功能说明</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 预览会实时显示生成的组件效果，支持响应式设计</li>
                  <li>• 可以切换不同设备尺寸查看适配效果</li>
                  <li>• 基于预览效果调整提示词，点击"重新生成"进行优化</li>
                  <li>• 预览地址可以在新窗口中打开，方便分享给他人</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}