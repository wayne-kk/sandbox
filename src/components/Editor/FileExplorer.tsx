"use client";

import React, { useState, useEffect, useCallback } from 'react';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileSelect: (filePath: string) => void;
  selectedFile?: string;
}

export default function FileExplorer({ onFileSelect, selectedFile }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/app']));
  const [useContainer, setUseContainer] = useState(true);
  const [source, setSource] = useState<'container' | 'local'>('container');

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (useContainer) params.set('container', 'true');
      
      const response = await fetch(`/api/sandbox/files?${params}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setSource(data.source);
      } else {
        console.error('获取文件列表失败:', data.error);
        // 如果容器获取失败，回退到本地
        if (useContainer) {
          setUseContainer(false);
        }
      }
    } catch (error) {
      console.error('加载文件失败:', error);
      // 如果容器获取失败，回退到本地
      if (useContainer) {
        setUseContainer(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [useContainer]);

  useEffect(() => {
    loadFiles();
    
    // 监听项目初始化事件
    const handleProjectInit = () => {
      setTimeout(() => loadFiles(), 1000);
    };
    
    window.addEventListener('projectInitialized', handleProjectInit);
    return () => window.removeEventListener('projectInitialized', handleProjectInit);
  }, [loadFiles]);

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: `${depth * 16}px` }}>
        {node.type === 'directory' ? (
          <div
            className="flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm"
            onClick={() => toggleFolder(node.path)}
          >
            <span className="mr-1 text-xs">
              {expandedFolders.has(node.path) ? '📂' : '📁'}
            </span>
            <span className="text-blue-300">{node.name}</span>
          </div>
        ) : (
          <div
            className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm ${
              selectedFile === node.path ? 'bg-blue-600' : ''
            }`}
            onClick={() => onFileSelect(node.path)}
          >
            <span className="mr-1 text-xs">
              {getFileIcon(node.name)}
            </span>
            <span className={selectedFile === node.path ? 'text-white' : 'text-gray-300'}>
              {node.name}
            </span>
          </div>
        )}
        
        {node.type === 'directory' && 
         expandedFolders.has(node.path) && 
         node.children && 
         renderFileTree(node.children, depth + 1)}
      </div>
    ));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return '⚛️';
      case 'ts':
      case 'js':
        return '📜';
      case 'json':
        return '📋';
      case 'css':
      case 'scss':
        return '🎨';
      case 'md':
        return '📝';
      case 'html':
        return '🌐';
      default:
        return '📄';
    }
  };

  const getFileCount = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'file') {
        return count + 1;
      } else if (node.children) {
        return count + getFileCount(node.children);
      }
      return count;
    }, 0);
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 text-white">
      {/* 头部工具栏 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">📁 文件管理器</h3>
          <button
            onClick={loadFiles}
            disabled={isLoading}
            className="p-1 hover:bg-gray-700 rounded"
            title="刷新文件列表"
          >
            <span className={`text-sm ${isLoading ? 'animate-spin' : ''}`}>
              🔄
            </span>
          </button>
        </div>
        
        {/* 数据源切换 */}
        <div className="flex items-center space-x-2 mb-2">
          <label className="flex items-center space-x-1 text-sm">
            <input
              type="radio"
              checked={useContainer}
              onChange={() => setUseContainer(true)}
              className="text-blue-500"
            />
            <span>容器</span>
          </label>
          <label className="flex items-center space-x-1 text-sm">
            <input
              type="radio"
              checked={!useContainer}
              onChange={() => setUseContainer(false)}
              className="text-blue-500"
            />
            <span>本地</span>
          </label>
        </div>
        
        {/* 状态信息 */}
        <div className="text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <span>数据源: {source === 'container' ? '🐳 容器' : '💻 本地'}</span>
            <span>文件数: {getFileCount(files)}</span>
          </div>
        </div>
      </div>

      {/* 文件树 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-gray-400">加载中...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">📂</div>
            <div className="text-sm">
              {useContainer ? (
                <>
                  容器中没有文件
                  <br />
                  <span className="text-xs">请先创建容器并初始化项目</span>
                </>
              ) : (
                <>
                  没有找到项目文件
                  <br />
                  <span className="text-xs">请先初始化项目</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {renderFileTree(files)}
          </div>
        )}
      </div>

      {/* 快捷操作 */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div>💡 提示：</div>
          <div>• 点击文件打开编辑器</div>
          <div>• 点击文件夹展开/收起</div>
          <div>• 容器模式可实时同步</div>
        </div>
      </div>
    </div>
  );
} 