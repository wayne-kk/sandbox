"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit3, 
  Upload, 
  Save,
  X,
  Play,
  RefreshCw,
  ExternalLink,
  Monitor,
  Smartphone,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ComponentDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从URL参数获取组件数据
  const [component, setComponent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    scene_tag: '',
    scene_en: '',
    component_name: '',
    stype_tag: '',
    function_tag: '',
    component_desc: '',
    applied_components: '',
    applicable_pages: ''
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // 预览相关状态
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [componentFiles, setComponentFiles] = useState<any[]>([]);
  const [previewLogs, setPreviewLogs] = useState<string[]>([]);

  // 从URL参数解析组件数据
  useEffect(() => {
    const componentData = searchParams.get('data');
    if (componentData) {
      try {
        const parsedComponent = JSON.parse(decodeURIComponent(componentData));
        setComponent(parsedComponent);
        
        // 初始化编辑表单
        setEditForm({
          scene_tag: parsedComponent.scene_tag || '',
          scene_en: parsedComponent.scene_en || '',
          component_name: parsedComponent.component_name || '',
          stype_tag: parsedComponent.stype_tag || '',
          function_tag: parsedComponent.function_tag || '',
          component_desc: parsedComponent.component_desc || '',
          applied_components: parsedComponent.applied_components || '',
          applicable_pages: parsedComponent.applicable_pages || ''
        });
      } catch (error) {
        // 解析组件数据失败时的静默处理
      }
    }
  }, [searchParams]);

  // 切换编辑模式
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setUploadFile(null);
  };

  // 保存修改
  const saveChanges = async () => {
    if (!component || !editForm.component_name.trim()) {
      alert('请填写组件名称');
      return;
    }

    if (!uploadFile) {
      alert('请选择要上传的模板文件');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('scene', editForm.scene_tag);
      formData.append('scene_en', editForm.scene_en);
      formData.append('component_name', editForm.component_name);
      formData.append('stype_tag', editForm.stype_tag);
      formData.append('function_tag', editForm.function_tag);
      formData.append('file', uploadFile);

      const response = await fetch('http://127.0.0.1:7902/frontend_component/update_by_name', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('组件修改成功！');
        
        // 更新本地组件数据
        const updatedComponent = { ...component, ...editForm };
        setComponent(updatedComponent);
        
        // 退出编辑模式
        setIsEditing(false);
        setUploadFile(null);
      } else {
        const data = await response.json();
        throw new Error(data.error || '修改组件失败');
      }
    } catch (error) {
      alert('❌ 保存修改失败: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setPreviewLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 获取组件代码并启动预览
  const startComponentPreview = async () => {
    if (!component?.component_name) return;
    
    setPreviewStatus('loading');
    setPreviewLogs([]);
    addLog('🚀 开始启动组件预览...');
    
    try {
      // 1. 获取组件代码
      addLog('📥 正在获取组件代码...');
      const codeResponse = await fetch(`/api/mock/frontend_component/download/${component.component_name}`, {
        method: 'GET'
      });
      
      if (!codeResponse.ok) {
        throw new Error(`获取组件代码失败: ${codeResponse.statusText}`);
      }
      
      // 检查响应类型
      const contentType = codeResponse.headers.get('content-type');
      let codeData;
      
      if (contentType?.includes('application/json')) {
        codeData = await codeResponse.json();
        if (!codeData.success) {
          throw new Error(codeData.error || '获取组件代码失败');
        }
      } else {
        // 如果返回的是文件流，需要处理为文件格式
        const fileContent = await codeResponse.text();
        codeData = {
          success: true,
          data: {
            files: [
              {
                path: `components/${component.component_name}.tsx`,
                content: fileContent,
                type: 'component'
              }
            ]
          }
        };
      }
      
      addLog(`✅ 获取到 ${codeData.data?.files?.length || 1} 个文件`);
      setComponentFiles(codeData.data?.files || []);
      
      // 2. 调用现有的 AI 生成接口部署组件
      addLog('🏗️ 正在部署组件到 Sandbox...');
      
      // 构造部署用的文件结构 - sandbox API会自动加上sandbox/前缀
      const deployFiles: { [path: string]: string } = {};
      const files = codeData.data?.files || [];
      
      // 添加组件文件（路径相对于sandbox目录）
      files.forEach((file: any) => {
        deployFiles[file.path] = file.content;
      });
      
      // 创建页面文件用于预览
      const componentName = component.component_name;
      const pageContent = `'use client';

import React from 'react';
import ${componentName} from '@/components/${componentName}';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">${componentName} 组件预览</h1>
          <p className="text-gray-600">实时预览组件效果</p>
        </div>
        <${componentName} />
      </div>
    </div>
  );
}`;
      
      // 页面文件路径（相对于sandbox目录）
      deployFiles[`app/${componentName}/page.tsx`] = pageContent;
      
      // 使用sandbox API保存文件到sandbox目录
      const saveResponse = await fetch('/api/sandbox/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: deployFiles
        })
      });
      
      if (!saveResponse.ok) {
        throw new Error(`部署组件失败: ${saveResponse.statusText}`);
      }
      
      const saveData = await saveResponse.json();
      addLog(`✅ 组件部署成功: ${saveData.message || '文件已保存'}`);
      
      // 调试：显示写入的文件路径
      Object.keys(deployFiles).forEach(filePath => {
        addLog(`📄 已写入: ${filePath}`);
      });
      
      // 3. 启动预览服务
      addLog('🚀 正在启动预览服务...');
      const previewResponse = await fetch('/api/sandbox/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!previewResponse.ok) {
        throw new Error(`启动预览失败: ${previewResponse.statusText}`);
      }
      
      const previewData = await previewResponse.json();
      
      if (previewData.success) {
        // 构建预览URL - 确保路径正确
        const baseUrl = previewData.url || 'http://localhost:3100';
        // 移除baseUrl末尾的斜杠，确保路径拼接正确
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        const finalPreviewUrl = `${cleanBaseUrl}/${componentName}`;
        
        addLog(`🔍 预览URL: ${finalPreviewUrl}`);
        
        // 等待Next.js热重载完成
        addLog('⏳ 等待 Next.js 热重载完成...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 验证预览URL是否可访问
        try {
          addLog('🔍 验证预览服务是否可访问...');
          const testResponse = await fetch(finalPreviewUrl.replace(/^http:\/\/[^/]+/, 'http://localhost:3100'), {
            method: 'GET',
            mode: 'no-cors' // 避免CORS问题
          });
          addLog('✅ 预览服务响应正常');
        } catch (error) {
          addLog('⚠️ 预览服务可能仍在启动中，如果遇到404请稍后刷新');
        }
        
        setPreviewUrl(finalPreviewUrl);
        setPreviewStatus('ready');
        addLog(`✅ 预览启动成功: ${finalPreviewUrl}`);
        addLog('🎉 组件预览已就绪！如果显示404，请等待几秒钟后刷新预览');
      } else {
        throw new Error(previewData.error || '启动预览失败');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      addLog(`❌ 预览启动失败: ${errorMessage}`);
      setPreviewStatus('error');
    }
  };

  // 刷新预览
  const refreshPreview = async () => {
    if (previewStatus !== 'ready' || !component?.component_name) return;
    
    setPreviewStatus('loading');
    addLog('🔄 正在刷新预览...');
    
    try {
      // 重新获取组件代码并部署
      await startComponentPreview();
    } catch (error) {
      addLog(`❌ 刷新失败: ${error}`);
      setPreviewStatus('error');
    }
  };

  // 在新窗口打开预览
  const openPreviewInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  if (!component) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">加载组件详情...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                返回
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {component.component_name}
                </h1>
                <p className="text-sm text-gray-500">组件详情</p>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-6xl mx-auto py-8 px-6">
        <Tabs defaultValue="basic-info" className="w-full">
          <TabsList className="w-fit">
            <TabsTrigger value="basic-info">基础信息</TabsTrigger>
            <TabsTrigger value="preview">预览组件</TabsTrigger>
          </TabsList>
          <TabsContent value="basic-info" className="space-y-6">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      基本信息
                      {isEditing && <Badge variant="secondary" className="text-xs">编辑模式</Badge>}
                    </CardTitle>
                    <CardDescription>
                      组件的基本属性和描述信息
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={toggleEdit}
                          disabled={isSaving}
                        >
                          <X size={16} className="mr-2" />
                          取消
                        </Button>
                        <Button
                          onClick={saveChanges}
                          disabled={isSaving || !editForm.component_name.trim() || !uploadFile}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              保存中...
                            </>
                          ) : (
                            <>
                              <Save size={16} className="mr-2" />
                              保存修改
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={toggleEdit}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit3 size={16} className="mr-2" />
                        编辑组件
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    组件名称 {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.component_name}
                      onChange={(e) => setEditForm(prev => ({...prev, component_name: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      placeholder="输入组件名称"
                      readOnly
                      disabled
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold bg-gray-50 p-3 rounded-lg">
                      {component.component_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">场景标签</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.scene_tag}
                      onChange={(e) => setEditForm(prev => ({...prev, scene_tag: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      placeholder="场景标签"
                      readOnly
                      disabled
                    />
                  ) : (
                    <div>
                      <Badge variant="outline" className="text-sm">
                        {component.scene_tag || 'N/A'}
                      </Badge>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">场景英文标识</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.scene_en}
                      onChange={(e) => setEditForm(prev => ({...prev, scene_en: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      placeholder="场景英文标识"
                      readOnly
                      disabled
                    />
                  ) : (
                    <div>
                      <Badge variant="secondary" className="text-sm">
                        {component.scene_en || 'N/A'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">组件描述</label>
                {isEditing ? (
                  <textarea
                    value={editForm.component_desc}
                    onChange={(e) => setEditForm(prev => ({...prev, component_desc: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="输入组件描述"
                  />
                ) : (
                  <p className="text-gray-900 leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {component.component_desc || '暂无描述'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 标签信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">标签信息</CardTitle>
              <CardDescription>
                组件的风格和功能标签
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">风格标签</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.stype_tag}
                      onChange={(e) => setEditForm(prev => ({...prev, stype_tag: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="现代简约, 商务风格..."
                    />
                  ) : (
                    <div>
                      {component.stype_tag ? (
                        <Badge variant="secondary" className="text-sm">
                          {component.stype_tag}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">未设置</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">功能标签</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.function_tag}
                      onChange={(e) => setEditForm(prev => ({...prev, function_tag: e.target.value}))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="交互性, 数据展示..."
                    />
                  ) : (
                    <div>
                      {component.function_tag ? (
                        <Badge variant="secondary" className="text-sm">
                          {component.function_tag}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">未设置</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 应用范围 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">应用范围</CardTitle>
              <CardDescription>
                组件的适用场景和页面范围
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">适用组件</label>
                {isEditing ? (
                  <textarea
                    value={editForm.applied_components}
                    onChange={(e) => setEditForm(prev => ({...prev, applied_components: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="输入适用组件"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {component.applied_components || '未指定'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">适用页面</label>
                {isEditing ? (
                  <textarea
                    value={editForm.applicable_pages}
                    onChange={(e) => setEditForm(prev => ({...prev, applicable_pages: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="输入适用页面"
                  />
                ) : (
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {component.applicable_pages || '未指定'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 文件上传（仅编辑模式显示） */}
          {isEditing && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-xl text-green-700">模板文件上传</CardTitle>
                <CardDescription>
                  上传新的模板文件来更新组件
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    模板文件 <span className="text-red-500">*</span>
                    <span className="text-green-600 ml-2">(支持 .zip, .tsx, .ts, .jsx, .js 文件)</span>
                  </label>
                  <input
                    type="file"
                    accept=".zip,.tsx,.ts,.jsx,.js"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {uploadFile && (
                    <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                      <Upload size={16} className="text-green-600" />
                      已选择文件: <span className="font-medium">{uploadFile.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  组件预览
                  {previewStatus === 'ready' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      运行中
                    </Badge>
                  )}
                  {previewStatus === 'loading' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      启动中
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  实时预览组件效果，支持多设备适配
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewStatus === 'idle' && (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🚀</div>
                      <p className="text-lg font-medium mb-2">准备预览组件</p>
                      <p className="text-sm text-gray-500 mb-4">点击下方按钮启动预览服务</p>
                      <Button 
                        onClick={startComponentPreview} 
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        启动预览
                      </Button>
                    </div>
                  </div>
                )}

                {previewStatus === 'loading' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center h-64 bg-blue-50 rounded-lg border">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-lg font-medium">启动预览中...</p>
                        <p className="text-sm text-gray-500">正在部署组件到预览环境</p>
                      </div>
                    </div>
                    
                    {/* 预览日志 */}
                    {previewLogs.length > 0 && (
                      <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">启动日志</CardTitle>
              </CardHeader>
              <CardContent>
                          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-32 overflow-y-auto space-y-1">
                            {previewLogs.map((log, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className="text-blue-400 text-xs mt-1">→</span>
                                <span className="text-xs">{log}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {previewStatus === 'ready' && previewUrl && (
                  <div className="space-y-4">
                    {/* 操作栏 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">预览设备:</span>
                        <div className="flex items-center gap-1 bg-white rounded border">
                          <button
                            onClick={() => setPreviewDevice('desktop')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              previewDevice === 'desktop' 
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
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              previewDevice === 'tablet'
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
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              previewDevice === 'mobile'
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
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshPreview}
                          className="hover:bg-orange-50 hover:border-orange-200"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          刷新预览
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openPreviewInNewWindow}
                          className="hover:bg-purple-50 hover:border-purple-200"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          新窗口打开
                        </Button>
                      </div>
                    </div>
                    
                    {/* 预览iframe */}
                    <div className="relative h-[600px]">
                      <div
                        className="mx-auto bg-gray-100 h-full rounded-lg overflow-hidden shadow-sm border"
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
                    
                    {/* 组件信息 */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="p-1 bg-blue-100 rounded">
                          <Monitor className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-blue-900 mb-2">预览说明</h5>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• 预览显示组件的实时效果，支持响应式设计</li>
                            <li>• 可以切换不同设备尺寸查看适配效果</li>
                            <li>• 预览地址可以在新窗口中打开，方便分享</li>
                            <li>• 组件文件: {componentFiles.length} 个</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {previewStatus === 'error' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-red-800 mb-2">预览启动失败</p>
                        <p className="text-sm text-red-600 mb-4">请检查组件代码或网络连接</p>
                        <Button
                          variant="outline"
                          onClick={startComponentPreview}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          重试
                        </Button>
                      </div>
                    </div>
                    
                    {/* 错误日志 */}
                    {previewLogs.length > 0 && (
                      <Card className="border-red-200 bg-red-50/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-red-800">错误日志</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-900 text-red-400 p-4 rounded-lg font-mono text-sm max-h-32 overflow-y-auto space-y-1">
                            {previewLogs.map((log, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className="text-yellow-400 text-xs mt-1">→</span>
                                <span className="text-xs">{log}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
