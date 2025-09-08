'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Code, Eye, RefreshCw, ExternalLink, Settings } from 'lucide-react';

interface TabbedPreviewProps {
  projectId: string;
  files: { [path: string]: string };
  framework: 'react' | 'vue' | 'vanilla';
  onRefresh?: () => void;
  className?: string;
}

type TabType = 'preview' | 'code';

export default function TabbedPreview({
  projectId,
  files,
  framework,
  onRefresh,
  className = ''
}: TabbedPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 获取文件列表
  const fileList = Object.keys(files).filter(path => 
    path.endsWith('.html') || 
    path.endsWith('.js') || 
    path.endsWith('.jsx') || 
    path.endsWith('.ts') || 
    path.endsWith('.tsx') || 
    path.endsWith('.vue') || 
    path.endsWith('.css')
  );

  // 初始化选中文件
  useEffect(() => {
    if (fileList.length > 0 && !selectedFile) {
      const entryFile = fileList.find(f => 
        f.includes('App.') || f.includes('main.') || f.includes('index.')
      ) || fileList[0];
      setSelectedFile(entryFile);
    }
  }, [fileList, selectedFile]);

  // 构建预览URL
  useEffect(() => {
    if (projectId) {
      // 添加时间戳避免缓存
      setPreviewUrl(`/preview/${projectId}/?t=${Date.now()}`);
    }
  }, [projectId]);

  // 刷新预览
  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    onRefresh?.();
    setTimeout(() => setIsLoading(false), 1000);
  };

  // 在新窗口打开
  const openInNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // 获取文件类型图标
  const getFileIcon = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'js': '🟨',
      'jsx': '⚛️',
      'ts': '🔷',
      'tsx': '⚛️',
      'vue': '💚',
      'html': '🌐',
      'css': '🎨',
      'json': '📋'
    };
    return iconMap[ext || ''] || '📄';
  };

  // 获取语言类型
  const getLanguage = (filePath: string) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'vue': 'vue',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };
    return langMap[ext || ''] || 'text';
  };

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Tab 头部 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye size={16} />
            页面展示
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code size={16} />
            代码
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-2 px-4">
          {activeTab === 'preview' && (
            <>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="刷新预览"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                刷新
              </button>
              <button
                onClick={openInNewWindow}
                className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="在新窗口打开"
              >
                <ExternalLink size={14} />
                新窗口
              </button>
            </>
          )}
          
          {activeTab === 'code' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">框架:</span>
              <span className="text-xs font-medium text-gray-700 capitalize">{framework}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="h-full relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-gray-600">
                  <RefreshCw size={20} className="animate-spin" />
                  <span>加载中...</span>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              onLoad={() => setIsLoading(false)}
              title={`项目预览 - ${projectId}`}
            />
          </div>
        ) : (
          <div className="h-full flex">
            {/* 文件列表 */}
            <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">项目文件</h3>
              </div>
              <div className="p-2">
                {fileList.map((filePath) => (
                  <button
                    key={filePath}
                    onClick={() => setSelectedFile(filePath)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                      selectedFile === filePath
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{getFileIcon(filePath)}</span>
                    <span className="truncate">{filePath}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 代码展示 */}
            <div className="flex-1 overflow-hidden">
              {selectedFile && files[selectedFile] ? (
                <div className="h-full flex flex-col">
                  {/* 文件头 */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span>{getFileIcon(selectedFile)}</span>
                      <span className="text-sm font-medium text-gray-700">{selectedFile}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {files[selectedFile].length} 字符
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {getLanguage(selectedFile)}
                      </span>
                    </div>
                  </div>

                  {/* 代码内容 */}
                  <div className="flex-1 overflow-auto">
                    <pre className="p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">
                      <code className={`language-${getLanguage(selectedFile)}`}>
                        {files[selectedFile]}
                      </code>
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Code size={48} className="mx-auto mb-3 opacity-50" />
                    <p>选择一个文件查看代码</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span>项目ID: {projectId}</span>
          <span>文件数: {Object.keys(files).length}</span>
          {activeTab === 'preview' && (
            <span className={`flex items-center gap-1 ${isLoading ? 'text-orange-600' : 'text-green-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-orange-400' : 'bg-green-400'}`} />
              {isLoading ? '加载中' : '已就绪'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'preview' && (
            <span>预览地址: {previewUrl || '未知'}</span>
          )}
          {activeTab === 'code' && selectedFile && (
            <span>当前文件: {selectedFile}</span>
          )}
        </div>
      </div>
    </div>
  );
} 