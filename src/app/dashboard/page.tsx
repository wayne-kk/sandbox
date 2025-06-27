"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProjectList from '@/components/ProjectManager/ProjectList';
import CreateProjectModal from '@/components/ProjectManager/CreateProjectModal';
import { useUser } from '@/hooks/useUser';

export default function DashboardPage() {
  const router = useRouter();
  const { user, extractUserFromResponse } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleOpenProject = (projectId: string) => {
    // 跳转到项目编辑页面
    router.push(`/editor/${projectId}`);
  };

  const handleCreateProject = async (projectData: {
    name: string;
    description: string;
    templateName: string;
    framework: string;
  }) => {
    try {
      const response = await fetch('/api/user-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData),
        credentials: 'include' // 包含Cookie
      });

      // 提取用户信息
      extractUserFromResponse(response);

      const data = await response.json();

      if (data.success) {
        // 创建成功，跳转到项目编辑页面
        router.push(`/editor/${data.data.projectId}`);
      } else {
        throw new Error(data.error || '创建项目失败');
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的项目</h1>
            {user && (
              <p className="text-gray-600 mt-2">用户: {user.userId}</p>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            新建项目
          </button>
        </div>

        <ProjectList 
          onOpenProject={handleOpenProject}
          onExtractUser={extractUserFromResponse}
        />

        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreateProject={handleCreateProject}
          />
        )}
      </div>
    </div>
  );
} 