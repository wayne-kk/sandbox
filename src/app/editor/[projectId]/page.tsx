"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import IntegratedIDE from '@/components/IDE/IntegratedIDE';
import { useUser } from '@/hooks/useUser';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { user, extractUserFromResponse } = useUser();
  
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
      
      // 首先尝试通过用户项目API加载
      let response = await fetch(`/api/user-projects/${projectId}`, {
        credentials: 'include' // 包含Cookie
      });

      console.log(`📡 API响应状态: ${response.status}`);

      // 提取用户信息
      extractUserFromResponse(response);

      let data = await response.json();
      console.log(`📄 API响应数据:`, data);

      // 如果用户项目API失败，尝试直接访问项目
      if (!data.success) {
        console.log(`⚠️ 用户项目API失败，尝试直接访问项目`);
        
        response = await fetch(`/api/test-project-access`);
        data = await response.json();
        console.log(`📄 直接访问API响应数据:`, data);
      }

      if (data.success) {
        setProject(data.data || data);
        console.log(`✅ 项目加载成功:`, data.data?.project?.name || data.project?.name);
      } else {
        throw new Error(data.error || '加载项目失败');
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
          {user && (
            <p className="mt-1 text-sm text-gray-500">用户: {user.userId}</p>
          )}
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
              {user && <p><strong>用户ID:</strong> {user.userId}</p>}
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
              返回Dashboard
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
            返回Dashboard
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
            {user && (
              <div className="text-sm text-gray-500">
                用户: {user.userId}
              </div>
            )}
            <button
              onClick={handleBackToDashboard}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← 返回Dashboard
            </button>
          </div>
        </div>
      </div>

      <IntegratedIDE
        projectId={projectId}
        initialFiles={project.files}
        framework={project.project.framework}
        isUserProject={true}
        className="h-[calc(100vh-80px)]"
      />
    </div>
  );
} 