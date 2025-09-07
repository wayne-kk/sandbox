'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Editor from './Editor';
import TabbedPreview from '@/components/Preview/TabbedPreview';
import { MonacoConfig } from '@/lib/monaco-config';
import {
  Split,
  FileText,
  Save,
  Play,
  Settings,
  FolderTree,
  Download,
  Upload,
  GitBranch
} from 'lucide-react';

interface FileTab {
  path: string;
  content: string;
  isDirty: boolean;
  language: string;
}

interface MainEditorProps {
  projectId: string;
  initialFiles?: { [path: string]: string };
  framework?: 'react' | 'vue' | 'vanilla';
  onSave?: (files: { [path: string]: string }) => void;
  className?: string;
}

export default function MainEditor({
  projectId,
  initialFiles = {},
  framework = 'react',
  onSave,
  className = ''
}: MainEditorProps) {
  const [files, setFiles] = useState<{ [path: string]: string }>(initialFiles);
  const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // 初始化文件和Tab
  useEffect(() => {
    if (Object.keys(files).length > 0 && openTabs.length === 0) {
      // 优先打开入口文件
      const entryFiles = Object.keys(files).filter(path =>
        path.includes('App.') || path.includes('main.') || path.includes('index.')
      );

      const firstFile = entryFiles[0] || Object.keys(files)[0];
      if (firstFile) {
        openFile(firstFile);
      }
    }
  }, [files]);

  // 配置Monaco编辑器
  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    // 使用统一的Monaco配置
    MonacoConfig.configure(monaco);
  }, []);

  // 获取文件语言类型
  const getFileLanguage = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'vue': 'vue',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'json': 'json',
      'md': 'markdown'
    };
    return langMap[ext || ''] || 'plaintext';
  };

  // 获取文件图标
  const getFileIcon = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'js': '🟨',
      'jsx': '⚛️',
      'ts': '🔷',
      'tsx': '⚛️',
      'vue': '💚',
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'json': '📋',
      'md': '📝'
    };
    return iconMap[ext || ''] || '📄';
  };

  // 打开文件
  const openFile = (filePath: string) => {
    if (!files[filePath]) return;

    // 检查是否已经打开
    const existingTab = openTabs.find(tab => tab.path === filePath);
    if (existingTab) {
      setActiveTab(filePath);
      return;
    }

    // 创建新Tab
    const newTab: FileTab = {
      path: filePath,
      content: files[filePath],
      isDirty: false,
      language: getFileLanguage(filePath)
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveTab(filePath);
  };

  // 关闭文件Tab
  const closeTab = (filePath: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.path !== filePath);

      // 如果关闭的是当前活跃Tab，切换到其他Tab
      if (activeTab === filePath && newTabs.length > 0) {
        setActiveTab(newTabs[newTabs.length - 1].path);
      } else if (newTabs.length === 0) {
        setActiveTab('');
      }

      return newTabs;
    });
  };

  // 更新文件内容
  const updateFileContent = (filePath: string, content: string) => {
    // 更新文件状态
    setFiles(prev => ({
      ...prev,
      [filePath]: content
    }));

    // 更新Tab状态
    setOpenTabs(prev => prev.map(tab =>
      tab.path === filePath
        ? { ...tab, content, isDirty: tab.content !== content }
        : tab
    ));
  };

  // 保存文件
  const saveFiles = useCallback(async () => {
    setIsSaving(true);
    try {
      // 调用保存回调
      await onSave?.(files);

      // 更新Tab状态（清除dirty标记）
      setOpenTabs(prev => prev.map(tab => ({ ...tab, isDirty: false })));

      console.log('✅ 文件保存成功');
    } catch (error) {
      console.error('❌ 文件保存失败:', error);
    } finally {
      setIsSaving(false);
    }
  }, [files, onSave]);

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasDirtyFiles = openTabs.some(tab => tab.isDirty);
      if (hasDirtyFiles) {
        saveFiles();
      }
    }, 3000); // 3秒后自动保存

    return () => clearTimeout(timer);
  }, [files, openTabs, saveFiles]);

  // 刷新预览
  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  // 当前活跃文件
  const activeFile = openTabs.find(tab => tab.path === activeTab);

  return (
    <div className={`flex h-full bg-gray-100 ${className}`}>
      {/* 左侧：文件树 + 编辑器 */}
      <div className={`flex flex-col ${isPreviewVisible ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800">代码编辑器</h2>
            <span className="text-sm text-gray-500">({framework})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveFiles}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="保存文件 (Ctrl+S)"
            >
              <Save size={16} className={isSaving ? 'animate-pulse' : ''} />
              {isSaving ? '保存中...' : '保存'}
            </button>

            <button
              onClick={() => setIsPreviewVisible(!isPreviewVisible)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="切换预览"
            >
              <Split size={16} />
              {isPreviewVisible ? '隐藏预览' : '显示预览'}
            </button>

            <button
              onClick={refreshPreview}
              className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
              title="刷新预览"
            >
              <Play size={16} />
              运行
            </button>
          </div>
        </div>

        {/* 文件树（侧边栏） */}
        <div className="flex h-full">
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FolderTree size={16} />
                项目文件
              </h3>
            </div>

            <div className="p-2">
              {Object.keys(files).map((filePath) => (
                <button
                  key={filePath}
                  onClick={() => openFile(filePath)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${activeTab === filePath
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <span>{getFileIcon(filePath)}</span>
                  <span className="truncate">{filePath}</span>
                  {openTabs.find(tab => tab.path === filePath)?.isDirty && (
                    <div className="w-2 h-2 bg-orange-400 rounded-full ml-auto" title="未保存" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 编辑器区域 */}
          <div className="flex-1 flex flex-col">
            {/* Tab栏 */}
            {openTabs.length > 0 && (
              <div className="flex bg-gray-100 border-b border-gray-200 overflow-x-auto">
                {openTabs.map((tab) => (
                  <div
                    key={tab.path}
                    className={`flex items-center gap-2 px-4 py-2 border-r border-gray-200 cursor-pointer transition-colors ${activeTab === tab.path
                      ? 'bg-white text-gray-800'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    onClick={() => setActiveTab(tab.path)}
                  >
                    <span>{getFileIcon(tab.path)}</span>
                    <span className="text-sm whitespace-nowrap">{tab.path.split('/').pop()}</span>
                    {tab.isDirty && (
                      <div className="w-2 h-2 bg-orange-400 rounded-full" title="未保存" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.path);
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 编辑器 */}
            <div className="flex-1">
              {activeFile ? (
                <Editor
                  language={activeFile.language}
                  value={activeFile.content}
                  fileName={activeFile.path}
                  onChange={(value) => updateFileContent(activeFile.path, value || '')}
                  options={MonacoConfig.getEditorOptions({
                    fontSize: 14,
                    lineHeight: 20,
                    renderLineHighlight: 'all',
                    renderWhitespace: 'selection'
                  })}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>选择一个文件开始编辑</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：预览区域 */}
      {isPreviewVisible && (
        <div className="w-1/2 border-l border-gray-200">
          <TabbedPreview
            key={previewKey}
            projectId={projectId}
            files={files}
            framework={framework}
            onRefresh={refreshPreview}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
} 