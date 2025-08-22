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
  Layers
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

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
    category: "认证"
  },
  {
    icon: Zap,
    title: "数据仪表板",
    prompt: "设计一个数据分析仪表板，包含图表卡片、统计数字、进度条和数据表格",
    category: "数据展示"
  },
  {
    icon: FileText,
    title: "博客文章卡片",
    prompt: "创建一个博客文章列表页面，每个文章卡片包含标题、摘要、作者、发布时间和标签",
    category: "内容展示"
  },
  {
    icon: Code2,
    title: "设置页面",
    prompt: "设计一个用户设置页面，包含个人信息编辑、通知设置、隐私设置和账户管理",
    category: "用户管理"
  }
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

      addLog('📚 正在分析组件库...');
      setProgress(20);

      addLog('🔄 连接 Dify 服务...');
      setProgress(30);
      console.log('🔄 连接 Dify 服务...',prompt);

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          projectType: 'nextjs',
          projectId
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
          data.data.files.forEach(file => {
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
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI 组件生成器</h2>
          <p className="text-gray-600">使用 AI 生成符合您组件库规范的 React UI 组件</p>
        </div>
      </div>

      {/* 组件生成器 */}
      <div className="w-full space-y-6">
        {renderComponentGenerator()}
      </div>
    </div>
  );

  function renderComponentGenerator() {
    return (
      <>

      {/* 输入区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            描述您想要的 UI 界面
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            ref={textareaRef}
            placeholder="例如：创建一个用户个人资料页面，包含头像、基本信息编辑表单、技能标签和社交媒体链接..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isGenerating}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                项目: {projectId}
              </Badge>
              <Badge variant="outline" className="text-xs">
                框架: Next.js
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
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    重新生成
                  </Button>
                  
                  {onPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onPreview}
                    >
                      <Eye className="w-4 h-4 mr-1" />
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
              >
                清空
              </Button>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="min-w-[100px]"
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
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">生成进度</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 示例提示词 */}
      {showExamples && !isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              快速开始
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleSelect(example.prompt)}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <example.icon className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-900">
                          {example.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {example.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {example.prompt}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 生成日志 */}
      {generationLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              生成日志
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={logRef}
              className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-48 overflow-y-auto space-y-1"
            >
              {generationLog.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 结果展示 */}
      {result && !isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              生成结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {result.message}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {result.error || result.message}
                </AlertDescription>
              </Alert>
            )}

            {result.data && (
              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.data.filesGenerated}
                    </div>
                    <div className="text-sm text-gray-600">文件数量</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {result.data.features.length}
                    </div>
                    <div className="text-sm text-gray-600">功能特性</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {result.data.dependencies.length}
                    </div>
                    <div className="text-sm text-gray-600">依赖包</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${result.data.hasConfigChanges ? 'text-orange-600' : 'text-gray-400'}`}>
                      {result.data.hasConfigChanges ? '⚠️' : '✅'}
                    </div>
                    <div className="text-sm text-gray-600">配置变更</div>
                  </div>
                </div>

                {/* 描述 */}
                {result.data.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">生成描述</h4>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {result.data.description}
                    </p>
                  </div>
                )}

                {/* 功能特性 */}
                {result.data.features.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">功能特性</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.data.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 生成的文件 */}
                {result.data.files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">生成的文件</h4>
                    <div className="space-y-2">
                      {result.data.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="font-mono text-sm">{file.path}</span>
                            <Badge variant="outline" className="text-xs">
                              {file.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {file.size} 字符
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 依赖包 */}
                {result.data.dependencies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">新增依赖</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.data.dependencies.map((dep, index) => (
                        <Badge key={index} variant="outline">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </>
    );
  }
}