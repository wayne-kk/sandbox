"use client";

import DifyUIGenerator from '@/components/AI/DifyUIGenerator';
import ProjectGenerationWorkflow from '@/components/AI/ProjectGenerationWorkflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResetConfirmationDialog } from '@/components/ui/reset-confirmation-dialog';
import { RotateCcw, Home, Code, Settings, BarChart3, Zap, Sparkles, Github } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function AIGeneratorPage() {
  // 重置功能状态
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // 页面状态
  const [activeTab, setActiveTab] = useState('component');
  const [stats, setStats] = useState({
    totalGenerations: 0,
    successRate: 0,
    lastGenerated: null,
    popularComponents: []
  });

  // 处理文件生成后的回调
  const handleFilesGenerated = (files: any[]) => {
    console.log('生成的文件:', files);
    // 更新统计信息
    updateStats();
    // 显示成功提示
    showSuccessNotification('组件生成成功！', `${files.length} 个文件已创建`);
  };

  // 处理项目生成后的回调
  const handleProjectGenerated = (result: any) => {
    console.log('项目生成结果:', result);
    updateStats();
    showSuccessNotification('项目生成成功！', '完整项目已创建并启动');
  };

  // 处理预览按钮点击
  const handlePreview = () => {
    // 打开 sandbox 预览页面
    window.open('/editor/sandbox-project', '_blank');
  };

  // 更新统计信息
  const updateStats = async () => {
    try {
      // 这里可以从API获取真实的统计信息
      setStats(prev => ({
        ...prev,
        totalGenerations: prev.totalGenerations + 1,
        lastGenerated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('更新统计信息失败:', error);
    }
  };

  // 显示成功通知
  const showSuccessNotification = (title: string, message: string) => {
    // 这里可以实现更优雅的通知系统
    console.log(`${title}: ${message}`);
  };

  // 重置sandbox功能
  const resetSandbox = async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/sandbox/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmReset: true })
      });

      const data = await response.json();

      if (data.success) {
        // 显示成功消息
        setShowSuccessMessage(true);
        // 关闭对话框
        setShowResetDialog(false);
        // 3秒后隐藏成功消息
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        throw new Error(data.error || '重置失败');
      }
    } catch (error) {
      console.error('重置错误:', error);
      alert('❌ 重置失败: ' + error);
    } finally {
      setIsResetting(false);
    }
  };

  // 页面加载时获取统计信息
  useEffect(() => {
    updateStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 成功消息提示 */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-semibold">Sandbox 重置成功！</div>
            <div className="text-sm opacity-90">已清理自定义组件和页面文件</div>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    V0 Sandbox
                  </h1>
                  <p className="text-sm text-gray-500">AI 驱动的代码生成平台</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>AI 服务正常</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Sandbox 运行中</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowResetDialog(true)}
                disabled={isResetting}
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                title="重置 Sandbox 到初始状态"
              >
                <RotateCcw size={16} className={`mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? '重置中...' : '重置 Sandbox'}
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <a href="/">
                  <Home size={16} className="mr-2" />
                  返回主页
                </a>
              </Button>
              
              <Button size="sm" asChild>
                <a href="/editor/sandbox-project">
                  <Code size={16} className="mr-2" />
                  打开编辑器
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-8xl mx-auto py-8 px-6">
        {/* 统计信息卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">总生成次数</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalGenerations}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">成功率</p>
                  <p className="text-2xl font-bold text-green-900">{stats.successRate}%</p>
                </div>
                <div className="p-3 bg-green-500 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">活跃组件</p>
                  <p className="text-2xl font-bold text-purple-900">24</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Code className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">系统状态</p>
                  <p className="text-2xl font-bold text-orange-900">正常</p>
                </div>
                <div className="p-3 bg-orange-500 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 功能标签页 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  AI 代码生成器
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  使用先进的 AI 技术，快速生成高质量的 React 组件和完整项目
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                <span>GitHub 集成</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>TypeScript 支持</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>实时预览</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-gray-100/50 p-1 rounded-xl">
                <TabsTrigger 
                  value="component" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Code className="w-4 h-4" />
                    </div>
                    <span className="font-medium">🎨 组件生成</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="project" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="font-medium">🚀 完整项目生成</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="component" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">AI UI 组件生成</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    描述您需要的 UI 组件，AI 将基于您的设计规范和组件库，生成对应的 React 组件代码。
                    支持响应式设计、无障碍访问和最佳实践。
                  </p>
                </div>
                <DifyUIGenerator
                  projectId="sandbox-project"
                  onFilesGenerated={handleFilesGenerated}
                  onPreview={handlePreview}
                />
              </TabsContent>
              
              <TabsContent value="project" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">完整项目生成工作流</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    描述您的项目需求，AI 将分析需求、生成项目结构、创建组件库，并自动构建完整的项目代码。
                    支持从零开始到部署的完整流程。
                  </p>
                </div>
                <ProjectGenerationWorkflow
                  projectId="sandbox-project"
                  onProjectGenerated={handleProjectGenerated}
                  onPreview={handlePreview}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-12 text-center text-gray-500">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI 服务稳定运行</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Sandbox 环境就绪</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>代码生成优化</span>
            </div>
          </div>
          <p className="text-sm">
            基于 V0 和 Dify 技术构建 • 支持 Next.js 13+ • TypeScript 优先
          </p>
        </div>
      </main>

      {/* 重置确认对话框 */}
      <ResetConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={resetSandbox}
        isResetting={isResetting}
      />
    </div>
  );
}
