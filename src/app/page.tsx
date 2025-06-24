"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import FileExplorer from '@/components/Editor/FileExplorer';
import Terminal from '@/components/Editor/Terminal';

// 动态导入编辑器组件，避免服务器端渲染问题
const Editor = dynamic(() => import('@/components/Editor/Editor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-white">加载编辑器中...</div>
    </div>
  )
});

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (filePath: string) => {
    if (!filePath) return;
    
    setIsLoading(true);
    setSelectedFile(filePath);
    
    try {
      const response = await fetch('/api/sandbox/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'read', 
          filePath, 
          useContainer: true 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFileContent(data.content);
      } else {
        console.error('读取文件失败:', data.error);
        setFileContent(`// 读取文件失败: ${data.error}`);
      }
    } catch (error) {
      console.error('文件读取错误:', error);
      setFileContent(`// 文件读取错误: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSave = async (content: string) => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch('/api/sandbox/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'write', 
          filePath: selectedFile, 
          content,
          useContainer: true 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('文件保存成功');
      } else {
        console.error('文件保存失败:', data.error);
      }
    } catch (error) {
      console.error('文件保存错误:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* 顶部导航栏 */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">
              🚀 V0 Sandbox
            </h1>
            <div className="text-sm text-gray-400">
              在线代码编辑器 & 沙箱运行环境
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {selectedFile && (
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>📄</span>
                <span>{selectedFile}</span>
              </div>
            )}
            
            <a 
              href="http://localhost:3001" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🌐 预览项目
            </a>
          </div>
        </div>
      </header>

      {/* 主要工作区 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧文件浏览器 */}
        <div className="w-80 border-r border-gray-700 flex flex-col">
          <FileExplorer 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
          />
        </div>

        {/* 中间编辑器区域 */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* 文件标签栏 */}
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">当前编辑:</span>
                  <span className="text-sm text-white font-medium">{selectedFile}</span>
                  {isLoading && (
                    <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  )}
                </div>
              </div>
              
              {/* 编辑器 */}
              <div className="flex-1">
                <Editor
                  language={getLanguageFromFile(selectedFile)}
                  value={fileContent}
                  onChange={(value) => {
                    setFileContent(value || '');
                    handleFileSave(value || '');
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on'
                  }}
                />
              </div>
            </>
          ) : (
            /* 欢迎页面 */
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-center max-w-2xl mx-auto px-4">
                <div className="text-6xl mb-6">🎯</div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  欢迎使用 V0 Sandbox
                </h2>
                <p className="text-lg text-gray-400 mb-8">
                  强大的在线代码编辑器与 Docker 沙箱运行环境
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">🐳 Docker 沙箱</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 text-left text-sm">
                      <li>隔离的运行环境</li>
                      <li>完整的 Node.js 生态</li>
                      <li>实时命令执行</li>
                      <li>自动文件同步</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-semibold mb-3 text-green-400">⚡ 强大功能</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 text-left text-sm">
                      <li>Monaco 代码编辑器</li>
                      <li>TypeScript 智能提示</li>
                      <li>实时预览</li>
                      <li>项目模板支持</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <p className="text-yellow-300 text-sm">
                    💡 快速开始：在右侧终端中创建容器并初始化项目，然后从文件浏览器中选择文件开始编辑
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧终端 */}
        <div className="w-96 border-l border-gray-700">
          <Terminal />
        </div>
      </main>
    </div>
  );
}

// 根据文件扩展名获取编程语言
function getLanguageFromFile(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return 'typescript';
    case 'ts':
      return 'typescript';
    case 'js':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'md':
      return 'markdown';
    case 'html':
      return 'html';
    default:
      return 'plaintext';
  }
}
