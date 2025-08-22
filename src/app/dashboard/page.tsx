"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const navigateToEditor = () => {
    // 生成一个随机的项目ID用于演示
    const projectId = 'demo-' + Math.random().toString(36).substr(2, 9);
    router.push(`/editor/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">代码沙盒</h1>
          <p className="text-xl text-gray-600 mb-8">
            在线代码编辑器，支持多种框架和模板
          </p>
          <div className="space-y-4">
            <button
              onClick={navigateToEditor}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              开始编码
            </button>
            <p className="text-gray-500">
              点击上方按钮开始一个新的编码会话
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 