"use client";

import DifyUIGenerator from '@/components/AI/DifyUIGenerator';
import ProjectGenerationWorkflow from '@/components/AI/ProjectGenerationWorkflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AIGeneratorPage() {
  // 处理文件生成后的回调
  const handleFilesGenerated = (files: any[]) => {
    console.log('生成的文件:', files);
    // 可以添加成功提示或其他处理逻辑
  };

  // 处理预览按钮点击
  const handlePreview = () => {
    // 打开 sandbox 预览页面
    window.open('/editor/sandbox-project', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">🚀 V0 Sandbox</h1>
            <span className="text-gray-400">|</span>
            <h2 className="text-lg text-gray-700">AI 代码生成器</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← 返回主页
            </a>
            <a 
              href="/editor/sandbox-project"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              打开编辑器
            </a>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto py-8 px-6">
        <Tabs defaultValue="component" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="component">🎨 组件生成</TabsTrigger>
            <TabsTrigger value="project">🚀 完整项目生成</TabsTrigger>
          </TabsList>
          
          <TabsContent value="component">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">AI UI 组件生成</h3>
                <p className="text-gray-600">
                  描述您需要的 UI 组件，AI 将生成对应的 React 组件代码
                </p>
              </div>
              <DifyUIGenerator
                projectId="sandbox-project"
                onFilesGenerated={handleFilesGenerated}
                onPreview={handlePreview}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="project">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">完整项目生成工作流</h3>
                <p className="text-gray-600">
                  描述您的项目需求，AI 将生成需求清单并自动构建完整项目
                </p>
              </div>
              <ProjectGenerationWorkflow
                projectId="sandbox-project"
                onProjectGenerated={handleFilesGenerated}
                onPreview={handlePreview}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
