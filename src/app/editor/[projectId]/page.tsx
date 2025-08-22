"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import IntegratedIDE from '@/components/IDE/IntegratedIDE';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔍 正在加载项目: ${projectId}`);
      
      // 尝试从项目文件API加载项目
      let response = await fetch(`/api/projects/${projectId}/files`);
      let data = await response.json();
      console.log(`📄 API响应数据:`, data);

      if (data.success && data.data) {
        setProject({
          project: {
            name: `项目 ${projectId}`,
            description: '代码沙盒项目',
            framework: 'react'
          },
          files: data.data || {}
        });
        console.log(`✅ 项目加载成功`);
      } else {
        // 如果没有现有项目，创建一个默认项目
        setProject({
          project: {
            name: `新项目 ${projectId}`,
            description: '全新的代码沙盒项目',
            framework: 'react'
          },
          files: {
            'App.tsx': `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>欢迎使用代码沙盒</h1>
      <p>开始编写您的代码吧！</p>
    </div>
  );
}

export default App;`,
            'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码沙盒</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>`
          }
        });
      }
    } catch (error) {
      console.error('❌ 加载项目失败:', error);
      setError(error instanceof Error ? error.message : '加载项目失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载项目中...</p>
          <p className="mt-2 text-sm text-gray-500">项目ID: {projectId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">加载失败</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 mb-2">{error}</p>
            <div className="text-sm text-red-600 space-y-1">
              <p><strong>项目ID:</strong> {projectId}</p>
            </div>
          </div>
          <div className="space-x-4">
            <button
              onClick={loadProject}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              重试加载
            </button>
            <button
              onClick={handleBackToDashboard}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">项目不存在</h1>
          <p className="text-gray-500 mb-4">项目ID: {projectId}</p>
          <button
            onClick={handleBackToDashboard}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {project.project.name}
            </h1>
            <p className="text-sm text-gray-600">
              {project.project.description}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToDashboard}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← 返回首页
            </button>
          </div>
        </div>
      </div>

      <IntegratedIDE
        projectId={projectId}
        initialFiles={project.files}
        framework={project.project.framework}
        isUserProject={false}
        className="h-[calc(100vh-80px)]"
      />
    </div>
  );
}