"use client";

import { useState, useEffect } from 'react';
import IntegratedIDE from '@/components/IDE/IntegratedIDE';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟初始化加载
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 文件保存处理
  const handleFileSave = async (files: { [path: string]: string }) => {
    try {
      // 保存到sandbox目录
      const response = await fetch('/api/sandbox/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ 文件保存成功:', data.message);
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('❌ 文件保存失败:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">🚀 V0 Sandbox</h1>
          <p className="text-gray-400">正在初始化集成开发环境...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">
              🚀 V0 Sandbox
            </h1>
            <div className="text-sm text-gray-400">
              集成开发环境 - 代码编辑器 & 实时预览
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-500">
              支持 React / Vue / Vanilla JS
            </div>
            
            <a 
              href="https://github.com/your-repo/v0-sandbox" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              📚 文档
            </a>
          </div>
        </div>
      </header>

      {/* 主要工作区 - 集成IDE */}
      <main className="flex-1 overflow-hidden">
        <IntegratedIDE
          projectId="sandbox-project"
          framework="next"
          onSave={handleFileSave}
          className="h-full"
        />
      </main>

      {/* 底部快捷操作栏 */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-6">
            <span>🔥 实时热重载</span>
            <span>💾 自动保存</span>
            <span>🎨 语法高亮</span>
            <span>🔍 智能提示</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>快捷键: Ctrl+S 保存 | Ctrl+R 运行</span>
            <span>版本: v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
