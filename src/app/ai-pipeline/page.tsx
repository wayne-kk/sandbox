"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResetConfirmationDialog } from '@/components/ui/reset-confirmation-dialog';
import { 
  RotateCcw, Home, Code, Settings, BarChart3, Zap, Sparkles, Github,
  Workflow, GitBranch, CheckCircle, Clock, AlertCircle, Download,
  Upload, FileText, Plus, Edit3, Package, Layers
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function AIPipelinePage() {
  // 重置功能状态
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // 页面状态
  const [activeTab, setActiveTab] = useState('pipeline');
  const [stats, setStats] = useState({
    totalPipelines: 0,
    activePipelines: 0,
    successfulBuilds: 0,
    lastExecution: null as string | null,
    popularTemplates: [] as string[]
  });

  // 模板管理状态
  const [templates, setTemplates] = useState([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedScene, setSelectedScene] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [templateForm, setTemplateForm] = useState({
    scene: '',
    component_name: '',
    stype_tag: '',
    function_tag: ''
  });

  // Pipeline 状态
  const [pipelineStatus, setPipelineStatus] = useState({
    stage: 'idle', // idle, analyzing, generating, building, testing, deploying, completed, failed
    progress: 0,
    currentStep: '',
    logs: []
  });

  // 处理 Pipeline 执行
  const handleExecutePipeline = async (config: any) => {
    console.log('执行 Pipeline:', config);
    
    // 模拟 Pipeline 执行流程
    const stages = [
      { name: '分析需求', duration: 2000 },
      { name: '生成组件', duration: 3000 },
      { name: '构建项目', duration: 2500 },
      { name: '运行测试', duration: 2000 },
      { name: '部署预览', duration: 1500 }
    ];

    setPipelineStatus({ stage: 'analyzing', progress: 0, currentStep: '准备执行...', logs: [] });
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setPipelineStatus(prev => ({
        ...prev,
        stage: stage.name.toLowerCase().replace(' ', ''),
        currentStep: stage.name,
        progress: Math.round((i / stages.length) * 100)
      }));
      
      await new Promise(resolve => setTimeout(resolve, stage.duration));
    }
    
    setPipelineStatus(prev => ({
      ...prev,
      stage: 'completed',
      progress: 100,
      currentStep: 'Pipeline 执行完成'
    }));
    
    updateStats();
    showSuccessNotification('Pipeline 执行成功！', '前端组件已生成并部署');
  };

  // 更新统计信息
  const updateStats = async () => {
    try {
      setStats(prev => ({
        ...prev,
        totalPipelines: prev.totalPipelines + 1,
        successfulBuilds: prev.successfulBuilds + 1,
        lastExecution: new Date().toISOString()
      }));
    } catch (error) {
      console.error('更新统计信息失败:', error);
    }
  };

  // 显示成功通知
  const showSuccessNotification = (title: string, message: string) => {
    console.log(`${title}: ${message}`);
  };

  // API 接口调用函数
  
  // 按场景创建模板
  const createTemplateByScene = async (scene: string) => {
    setIsCreatingTemplate(true);
    try {
      const response = await fetch('/api/frontend_component/create_by_scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene })
      });

      const data = await response.json();
      
      if (data.status === "0") {
        // 解析返回的模板数据
        const templateData = data.data.data.map((item: any[], index: number) => {
          const keys = data.data.keys;
          const template: any = {};
          keys.forEach((key: string, keyIndex: number) => {
            template[key] = item[keyIndex];
          });
          template.id = `template_${index}_${Date.now()}`;
          return template;
        });
        
        setTemplates(templateData);
        showSuccessNotification('模板创建成功！', `${templateData.length} 个组件模板已生成`);
        return templateData;
      } else {
        throw new Error('创建模板失败');
      }
    } catch (error) {
      console.error('创建模板错误:', error);
      alert('❌ 创建模板失败: ' + error);
      return null;
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  // 下载模板
  const downloadTemplate = async (scene: string) => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/frontend_component/download?scene=${encodeURIComponent(scene)}`, {
        method: 'GET'
      });

      if (response.ok) {
        // 获取文件名
        const disposition = response.headers.get('Content-Disposition');
        const filename = disposition 
          ? disposition.split('filename=')[1]?.replace(/"/g, '') 
          : `${scene}_templates.zip`;
        
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccessNotification('下载完成！', `${filename} 已保存到本地`);
      } else {
        throw new Error('下载失败');
      }
    } catch (error) {
      console.error('下载模板错误:', error);
      alert('❌ 下载模板失败: ' + error);
    } finally {
      setIsDownloading(false);
    }
  };

  // 修改模板
  const modifyTemplate = async () => {
    if (!uploadFile) {
      alert('请选择要上传的模板文件');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('scene', templateForm.scene);
      formData.append('component_name', templateForm.component_name);
      formData.append('stype_tag', templateForm.stype_tag);
      formData.append('function_tag', templateForm.function_tag);
      formData.append('file', uploadFile);

      const response = await fetch('/api/frontend_component/modify', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccessNotification('模板修改成功！', '组件模板已更新');
        // 重新获取模板列表
        if (templateForm.scene) {
          await createTemplateByScene(templateForm.scene);
        }
        // 重置表单
        setTemplateForm({ scene: '', component_name: '', stype_tag: '', function_tag: '' });
        setUploadFile(null);
      } else {
        throw new Error(data.error || '修改模板失败');
      }
    } catch (error) {
      console.error('修改模板错误:', error);
      alert('❌ 修改模板失败: ' + error);
    }
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
        setShowSuccessMessage(true);
        setShowResetDialog(false);
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

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'analyzing': return <Clock className="w-4 h-4" />;
      case 'generating': return <Code className="w-4 h-4" />;
      case 'building': return <Settings className="w-4 h-4" />;
      case 'testing': return <CheckCircle className="w-4 h-4" />;
      case 'deploying': return <Zap className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Workflow className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* 成功消息提示 */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-semibold">Sandbox 重置成功！</div>
            <div className="text-sm opacity-90">Pipeline 环境已重置</div>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                  <Workflow className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    V0 Pipeline
                  </h1>
                  <p className="text-sm text-gray-500">前端组件自动化构建流水线</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Pipeline 就绪</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>构建环境运行中</span>
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
                title="重置 Pipeline 环境"
              >
                <RotateCcw size={16} className={`mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? '重置中...' : '重置环境'}
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
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">总 Pipeline</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalPipelines}</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-lg">
                  <Workflow className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">成功构建</p>
                  <p className="text-2xl font-bold text-green-900">{stats.successfulBuilds}</p>
                </div>
                <div className="p-3 bg-green-500 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">活跃流水线</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.activePipelines}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-lg">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">系统状态</p>
                  <p className="text-2xl font-bold text-orange-900">就绪</p>
                </div>
                <div className="p-3 bg-orange-500 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline 执行状态 */}
        {pipelineStatus.stage !== 'idle' && (
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStageIcon(pipelineStatus.stage)}
                  <CardTitle className="text-xl">Pipeline 执行状态</CardTitle>
                </div>
                <Badge variant={pipelineStatus.stage === 'completed' ? 'default' : 'secondary'}>
                  {pipelineStatus.currentStep}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={pipelineStatus.progress} className="h-2" />
                <div className="text-sm text-gray-600">
                  进度: {pipelineStatus.progress}% - {pipelineStatus.currentStep}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 功能标签页 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                <Workflow className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  前端组件 Pipeline
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  自动化的前端组件构建、测试和部署流水线，支持持续集成和持续交付
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4" />
                <span>自动化流水线</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>质量检测</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>快速部署</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-gray-100/50 p-1 rounded-xl">
                <TabsTrigger 
                  value="pipeline" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Workflow className="w-4 h-4" />
                    </div>
                    <span className="font-medium">🔄 Pipeline 配置</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="templates" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="font-medium">📦 模板管理</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="monitoring" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="font-medium">📊 监控面板</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pipeline" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Pipeline 配置与执行</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    配置自动化构建流水线，包括代码分析、组件生成、测试执行和部署流程。
                    支持自定义构建步骤和部署策略。
                  </p>
                </div>
                
                {/* Pipeline 配置表单 */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">快速启动 Pipeline</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">项目模板</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>React + TypeScript</option>
                        <option>Vue 3 + TypeScript</option>
                        <option>Next.js 项目</option>
                        <option>组件库模板</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">构建环境</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>Node.js 18</option>
                        <option>Node.js 20</option>
                        <option>Bun 1.0</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => handleExecutePipeline({ template: 'react-ts', env: 'node18' })}
                      disabled={pipelineStatus.stage !== 'idle' && pipelineStatus.stage !== 'completed'}
                    >
                      <Workflow className="w-4 h-4 mr-2" />
                      执行 Pipeline
                    </Button>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      高级配置
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="templates" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">组件模板管理</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    按场景创建、下载和修改前端组件模板。支持批量生成组件、下载压缩包和上传自定义模板文件。
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 创建和下载模板 */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5 text-green-600" />
                        场景模板生成
                      </CardTitle>
                      <CardDescription>
                        输入场景描述，AI 自动生成对应的组件模板列表
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          场景描述 *
                        </label>
                        <input
                          type="text"
                          value={selectedScene}
                          onChange={(e) => setSelectedScene(e.target.value)}
                          placeholder="例如: 电商平台、后台管理系统、数据分析平台..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => createTemplateByScene(selectedScene)}
                          disabled={!selectedScene.trim() || isCreatingTemplate}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          {isCreatingTemplate ? (
                            <>
                              <Layers className="w-4 h-4 mr-2 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              生成模板
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => downloadTemplate(selectedScene)}
                          disabled={!selectedScene.trim() || isDownloading}
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                          {isDownloading ? (
                            <>
                              <Download className="w-4 h-4 mr-2 animate-bounce" />
                              下载中...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              下载
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 修改模板 */}
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-blue-600" />
                        模板修改上传
                      </CardTitle>
                      <CardDescription>
                        上传自定义组件文件，修改现有模板的样式和功能
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            场景
                          </label>
                          <input
                            type="text"
                            value={templateForm.scene}
                            onChange={(e) => setTemplateForm(prev => ({...prev, scene: e.target.value}))}
                            placeholder="场景名称"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            组件名称
                          </label>
                          <input
                            type="text"
                            value={templateForm.component_name}
                            onChange={(e) => setTemplateForm(prev => ({...prev, component_name: e.target.value}))}
                            placeholder="组件名称"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            风格标签
                          </label>
                          <input
                            type="text"
                            value={templateForm.stype_tag}
                            onChange={(e) => setTemplateForm(prev => ({...prev, stype_tag: e.target.value}))}
                            placeholder="现代简约, 商务风格..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            功能标签
                          </label>
                          <input
                            type="text"
                            value={templateForm.function_tag}
                            onChange={(e) => setTemplateForm(prev => ({...prev, function_tag: e.target.value}))}
                            placeholder="交互性, 数据展示..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          模板文件
                        </label>
                        <input
                          type="file"
                          accept=".zip,.tsx,.ts,.jsx,.js"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      
                      <Button
                        onClick={modifyTemplate}
                        disabled={!templateForm.scene || !templateForm.component_name || !uploadFile}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        上传修改
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* 生成的模板列表 */}
                {templates.length > 0 && (
                  <Card className="mt-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        生成的模板列表
                      </CardTitle>
                      <CardDescription>
                        当前场景生成的组件模板，点击可查看详细信息
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template: any, index) => (
                          <div key={template.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{template.component_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {template.scene_tag}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {template.component_desc}
                            </p>
                            
                            <div className="space-y-2 text-xs text-gray-500">
                              <div>
                                <span className="font-medium">适用组件:</span> {template.applied_components}
                              </div>
                              <div>
                                <span className="font-medium">适用页面:</span> {template.applicable_pages}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">{template.stype_tag}</Badge>
                                <Badge variant="secondary" className="text-xs">{template.function_tag}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="monitoring" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Pipeline 监控面板</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    实时监控 Pipeline 执行状态、性能指标和构建历史。
                    提供详细的日志和性能分析报告。
                  </p>
                </div>
                
                {/* 监控面板内容 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        构建性能
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">平均构建时间</span>
                          <span className="font-semibold">2.5 分钟</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">成功率</span>
                          <span className="font-semibold text-green-600">96%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">今日构建</span>
                          <span className="font-semibold">12 次</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        最近执行
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">React 组件库</div>
                            <div className="text-xs text-gray-500">2 分钟前</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Dashboard 项目</div>
                            <div className="text-xs text-gray-500">15 分钟前</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">E-commerce 应用</div>
                            <div className="text-xs text-gray-500">1 小时前</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-12 text-center text-gray-500">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Pipeline 引擎运行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>构建环境就绪</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>部署服务正常</span>
            </div>
          </div>
          <p className="text-sm">
            基于 Docker 和 Kubernetes • 支持多环境部署 • 自动化测试集成
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
