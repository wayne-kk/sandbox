"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { MonacoConfig } from '@/lib/monaco-config';
import EnhancedTerminal from '@/components/Terminal/EnhancedTerminal';
import { useProjectWebSocket } from '@/hooks/useProjectWebSocket';
import { 
  Play, 
  Code, 
  Eye, 
  RefreshCw, 
  ExternalLink, 
  Settings,
  FileText,
  FolderTree,
  Save,
  Loader2,
  Server,
  AlertCircle,
  CheckCircle,
  Circle,
  Terminal,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Info
} from 'lucide-react';

interface FileTab {
  path: string;
  content: string;
  isDirty: boolean;
  language: string;
}

interface IDEProps {
  projectId?: string;
  initialFiles?: { [path: string]: string };
  framework?: 'react' | 'vue' | 'vanilla' | 'next';
  onSave?: (files: { [path: string]: string }) => Promise<void>;
  onSaveFiles?: (files: { [path: string]: string }) => Promise<void>;
  isUserProject?: boolean;
  className?: string;
}

type TabType = 'editor' | 'preview' | 'terminal';
type ProjectStatus = 'stopped' | 'starting' | 'running' | 'error';

export default function IntegratedIDE({
  projectId = 'default-project',
  initialFiles = {},
  framework = 'react',
  onSave,
  onSaveFiles,
  isUserProject = false,
  className = ''
}: IDEProps) {
  // 主要状态
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [files, setFiles] = useState<{ [path: string]: string }>(initialFiles);
  const [openTabs, setOpenTabs] = useState<FileTab[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // 文件树状态
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'public']));
  
  // WebSocket状态管理
  const wsState = useProjectWebSocket(projectId);
  
  // 预览相关状态
  const [previewKey, setPreviewKey] = useState(0);
  const [showBuildLog, setShowBuildLog] = useState(false);
  const [lastUrl, setLastUrl] = useState('');
  
  // 从WebSocket状态中获取项目状态
  const projectStatus = wsState.status;
  const previewUrl = wsState.url;
  const buildLog = wsState.logs;
  
  // UI状态
  const [showStatusInfo, setShowStatusInfo] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const buildLogRef = useRef<HTMLDivElement>(null);

  // 获取默认文件结构 - 从sandbox目录加载实际文件
  const getDefaultFiles = async (): Promise<{ [path: string]: string }> => {
    try {
      // 可以通过API获取sandbox目录的文件
      const response = await fetch('/api/sandbox/files');
      if (response.ok) {
        const data = await response.json();
        return data.files || {};
      }
    } catch (error) {
      console.error('Failed to load sandbox files:', error);
    }
    
    // 如果API失败，返回基本的示例文件
    return {
      'src/app/page.tsx': `import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">🚀 Sandbox项目</h1>
        <p className="mb-6">这是您的工作区，可以自由编辑和预览</p>
        
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h2 className="text-2xl mb-4">计数器演示</h2>
          <div className="text-3xl font-bold mb-4">计数: {count}</div>
          <div className="space-x-4">
            <button 
              onClick={() => setCount(count - 1)}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors"
            >
              -1
            </button>
            <button 
              onClick={() => setCount(0)}
              className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              重置
            </button>
            <button 
              onClick={() => setCount(count + 1)}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded transition-colors"
            >
              +1
            </button>
          </div>
        </div>
        
        <div className="text-sm opacity-75">
          <p>💡 在左侧文件树中编辑文件，实时查看预览效果</p>
        </div>
      </div>
    </div>
  );
}`,
      'README.md': `# Sandbox 工作区

这是您的个人沙盒环境，可以在这里：

## 🎯 功能
- 编辑React/Next.js代码
- 实时预览效果
- 保存您的工作成果
- 实验新想法

## 📝 使用方式
1. 在文件树中选择文件编辑
2. 代码会自动保存
3. 点击预览查看效果
4. 在终端中运行命令

开始您的创作吧！ 🚀`
    };
  };

  // 初始化默认文件 - 异步加载
  useEffect(() => {
    if (Object.keys(files).length === 0) {
      getDefaultFiles().then(defaultFiles => {
        setFiles(defaultFiles);
      });
    }
  }, []);

  // 初始化文件标签
  useEffect(() => {
    if (Object.keys(files).length > 0 && openTabs.length === 0) {
      const entryFile = getEntryFile(Object.keys(files));
      if (entryFile) {
        openFile(entryFile);
      }
    }
  }, [files]);

  // 监听预览URL变化，自动刷新iframe
  useEffect(() => {
    if (previewUrl && previewUrl !== lastUrl) {
      console.log(`🔄 预览URL变化: ${lastUrl} → ${previewUrl}`);
      setLastUrl(previewUrl);
      
      // 强制刷新iframe
      setPreviewKey(prev => prev + 1);
      
      // 如果项目正在运行且有新URL，自动切换到预览标签
      if (projectStatus === 'running' && activeTab !== 'preview') {
        setTimeout(() => {
          setActiveTab('preview');
        }, 1000);
      }
    }
  }, [previewUrl, lastUrl, projectStatus, activeTab]);

  // WebSocket会自动处理状态同步，不需要额外的初始化检查

  // 获取入口文件
  const getEntryFile = (filePaths: string[]): string => {
    const priorities = ['src/App.jsx', 'src/App.tsx', 'pages/index.js', 'index.html', 'src/index.js'];
    for (const priority of priorities) {
      if (filePaths.includes(priority)) return priority;
    }
    return filePaths[0] || '';
  };

  // 获取文件语言类型
  const getFileLanguage = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };
    return langMap[ext || ''] || 'plaintext';
  };

  // 获取文件图标
  const getFileIcon = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'js': '🟨', 'jsx': '⚛️', 'ts': '🔷', 'tsx': '⚛️',
      'html': '🌐', 'css': '🎨', 'json': '📋', 'md': '📝'
    };
    return iconMap[ext || ''] || '📄';
  };

  // 打开文件
  const openFile = (filePath: string) => {
    if (!files[filePath]) return;

    const existingTab = openTabs.find(tab => tab.path === filePath);
    if (existingTab) {
      setActiveFile(filePath);
      return;
    }

    const newTab: FileTab = {
      path: filePath,
      content: files[filePath],
      isDirty: false,
      language: getFileLanguage(filePath)
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveFile(filePath);
  };

  // 关闭文件标签
  const closeTab = (filePath: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.path !== filePath);
      if (activeFile === filePath && newTabs.length > 0) {
        setActiveFile(newTabs[newTabs.length - 1].path);
      } else if (newTabs.length === 0) {
        setActiveFile('');
      }
      return newTabs;
    });
  };

  // 更新文件内容
  const updateFileContent = (filePath: string, content: string) => {
    setFiles(prev => ({ ...prev, [filePath]: content }));
    setOpenTabs(prev => prev.map(tab => 
      tab.path === filePath ? { ...tab, content, isDirty: tab.content !== content } : tab
    ));
  };

  // 保存文件
  const saveFiles = useCallback(async () => {
    if (!isUserProject) return;
    
    setIsSaving(true);
    try {
      // 如果是用户项目，保存到数据库
      const response = await fetch(`/api/user-projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files }),
        credentials: 'include' // 包含Cookie
      });

      const data = await response.json();
      
      if (data.success) {
        setOpenTabs(prev => prev.map(tab => ({ ...tab, isDirty: false })));
        addBuildLog('✅ 文件保存成功');
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      addBuildLog('❌ 文件保存失败: ' + error);
    } finally {
      setIsSaving(false);
    }
  }, [files, isUserProject, projectId]);

  // 添加构建日志 - 现在通过WebSocket接收
  const addBuildLog = (message: string) => {
    wsState.addLog(`[${new Date().toLocaleTimeString()}] ${message}`);
    setTimeout(() => {
      buildLogRef.current?.scrollTo(0, buildLogRef.current.scrollHeight);
    }, 100);
  };

  // 启动项目
  const startProject = async () => {
    if (projectStatus === 'starting' || projectStatus === 'running') return;

    addBuildLog('🚀 正在启动项目...');
    setShowBuildLog(true);

    try {
      // 保存文件
      await saveFiles();
      addBuildLog('📝 文件已保存');

      // 调用API启动项目
      const response = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          projectId,
          files,
          framework
        })
      });

      const data = await response.json();

      if (data.success) {
        addBuildLog('✅ 项目启动成功！');
        addBuildLog('🔗 等待预览服务器响应...');
        
        // 不再手动设置previewKey，让WebSocket状态更新来触发
        // setPreviewKey(prev => prev + 1);
        
        // 延迟自动切换到预览标签，给WebSocket更多时间同步状态
        setTimeout(() => {
          if (wsState.status === 'running' && wsState.url) {
            addBuildLog('🌐 预览已就绪，自动切换到预览标签');
            setActiveTab('preview');
          }
        }, 2000);
      } else {
        throw new Error(data.error || '启动失败');
      }

    } catch (error) {
      addBuildLog('❌ 项目启动失败: ' + error);
      console.error('启动项目错误:', error);
    }
  };

  // 停止项目
  const stopProject = async () => {
    try {
      const response = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          projectId
        })
      });

      const data = await response.json();

      if (data.success) {
        addBuildLog('⏹️ 项目已停止');
      } else {
        throw new Error(data.error || '停止失败');
      }
    } catch (error) {
      addBuildLog('❌ 停止项目失败: ' + error);
      console.error('停止项目错误:', error);
    }
  };

  // WebSocket处理状态更新，不再需要轮询

  // 刷新预览
  const refreshPreview = () => {
    if (previewUrl) {
      console.log('🔄 手动刷新预览:', previewUrl);
      setPreviewKey(prev => prev + 1);
      addBuildLog(`🔄 正在刷新预览: ${previewUrl}`);
      
      // 强制iframe重新加载
      setTimeout(() => {
        if (iframeRef.current) {
          addBuildLog('✅ 预览已刷新完成');
        }
      }, 500);
    } else {
      addBuildLog('❌ 无法刷新预览: 预览URL不可用');
    }
  };

  // 文件自动保存 - 只在用户编辑时触发，避免无限循环
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  
  useEffect(() => {
    // 检查是否有未保存的文件
    const dirtyTabs = openTabs.filter(tab => tab.isDirty);
    
    if (dirtyTabs.length > 0 && projectStatus === 'running') {
      const now = Date.now();
      
      // 防抖：只在距离上次保存超过2秒时才保存
      if (now - lastSaveTime > 2000) {
        const timer = setTimeout(async () => {
          try {
            // 构建当前文件状态
            const currentFiles: { [path: string]: string } = {};
            openTabs.forEach(tab => {
              currentFiles[tab.path] = tab.content;
            });
            
            const response = await fetch('/api/project', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update',
                projectId,
                files: currentFiles
              })
            });

            const data = await response.json();
            if (data.success) {
              addBuildLog('📝 文件已自动保存');
              setLastSaveTime(Date.now());
              
              // 标记文件为已保存
              setOpenTabs(prev => prev.map(tab => ({ ...tab, isDirty: false })));
            }
          } catch (error) {
            console.error('自动保存文件错误:', error);
          }
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [openTabs, projectStatus, lastSaveTime]);

  const currentFile = openTabs.find(tab => tab.path === activeFile);

  // 构建文件树结构
  const buildFileTree = (filePaths: string[]) => {
    const tree: any = {};
    
    filePaths.forEach(path => {
      const parts = path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? { _isFile: true, _path: path } : {};
        }
        current = current[part];
      });
    });
    
    return tree;
  };

  // 切换文件夹展开/收起
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // 渲染文件树
  const renderFileTree = (tree: any, basePath: string = '', level: number = 0) => {
    return Object.keys(tree).map(key => {
      const item = tree[key];
      const currentPath = basePath ? `${basePath}/${key}` : key;
      
      if (item._isFile) {
        return (
          <button
            key={currentPath}
            onClick={() => openFile(item._path)}
            className={`w-full flex items-center gap-2 px-2 py-1 text-sm rounded transition-colors ${
              activeFile === item._path
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
          >
            <span>{getFileIcon(item._path)}</span>
            <span className="truncate">{key}</span>
            {openTabs.find(tab => tab.path === item._path)?.isDirty && (
              <div className="w-2 h-2 bg-orange-400 rounded-full ml-auto" />
            )}
          </button>
        );
      } else {
        const isExpanded = expandedFolders.has(currentPath);
        return (
          <div key={currentPath}>
            <button
              onClick={() => toggleFolder(currentPath)}
              className="w-full flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {isExpanded ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-gray-500" />}
              <span>{key}</span>
            </button>
            {isExpanded && (
              <div>
                {renderFileTree(item, currentPath, level + 1)}
              </div>
            )}
          </div>
        );
      }
    });
  };

  // 点击预览时自动启动项目
  const handlePreviewClick = async () => {
    setActiveTab('preview');
    
    // 如果项目未运行，自动启动
    if (projectStatus === 'stopped') {
      await startProject();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Tab 头部 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code size={16} />
            代码编辑器
          </button>
          <button
            onClick={handlePreviewClick}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye size={16} />
            实时预览
            {projectStatus === 'running' && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'terminal'
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Terminal size={16} />
            终端
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-2 px-4">
          {/* 项目状态 */}
          <div className="flex items-center gap-2 text-xs">
            {projectStatus === 'stopped' && <Circle size={12} className="text-gray-400" />}
            {projectStatus === 'starting' && <Loader2 size={12} className="text-yellow-500 animate-spin" />}
            {projectStatus === 'running' && <CheckCircle size={12} className="text-green-500" />}
            {projectStatus === 'error' && <AlertCircle size={12} className="text-red-500" />}
            <span className="text-gray-600 capitalize">{projectStatus}</span>
          </div>

          {activeTab === 'editor' && (
            <>
              <button
                onClick={saveFiles}
                disabled={isSaving}
                className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              >
                <Save size={14} className={isSaving ? 'animate-pulse' : ''} />
                {isSaving ? '保存中...' : '保存'}
              </button>
              
              <button
                onClick={startProject}
                disabled={projectStatus === 'starting'}
                className="flex items-center gap-1 px-3 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
              >
                {projectStatus === 'starting' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                {projectStatus === 'starting' ? '启动中...' : '运行项目'}
              </button>
            </>
          )}

          {activeTab === 'preview' && (
            <>
              <button
                onClick={refreshPreview}
                disabled={projectStatus !== 'running'}
                className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} />
                刷新
              </button>
              
              <button
                onClick={() => previewUrl && window.open(previewUrl, '_blank')}
                disabled={!previewUrl}
                className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              >
                <ExternalLink size={14} />
                新窗口
              </button>
              
              <button
                onClick={stopProject}
                disabled={projectStatus === 'stopped'}
                className="flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
              >
                <Server size={14} />
                停止
              </button>
            </>
          )}
          
          <button
            onClick={() => setShowBuildLog(!showBuildLog)}
            className="flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <Settings size={14} />
            日志
          </button>
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'editor' ? (
          <>
            {/* 文件浏览器 - Cursor风格 */}
            <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
              <div className="p-3 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FolderTree size={16} />
                  资源管理器
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-1">
                <div className="space-y-1">
                  {renderFileTree(buildFileTree(Object.keys(files)))}
                </div>
              </div>
            </div>

            {/* 编辑器区域 */}
            <div className="flex-1 flex flex-col">
              {/* 文件标签栏 */}
              {openTabs.length > 0 && (
                <div className="flex bg-gray-100 border-b border-gray-200 overflow-x-auto">
                  {openTabs.map((tab) => (
                    <div
                      key={tab.path}
                      className={`flex items-center gap-2 px-4 py-2 border-r border-gray-200 cursor-pointer transition-colors ${
                        activeFile === tab.path
                          ? 'bg-white text-gray-800'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveFile(tab.path)}
                    >
                      <span>{getFileIcon(tab.path)}</span>
                      <span className="text-sm whitespace-nowrap">{tab.path.split('/').pop()}</span>
                      {tab.isDirty && <div className="w-2 h-2 bg-orange-400 rounded-full" />}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.path);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 编辑器 */}
              <div className="flex-1">
                {currentFile ? (
                  <Editor
                    height="100%"
                    language={currentFile.language}
                    value={currentFile.content}
                    onChange={(value) => updateFileContent(currentFile.path, value || '')}
                    theme="vs-dark"
                    options={MonacoConfig.getEditorOptions()}
                    onMount={(editor, monaco) => MonacoConfig.configureTypeScript(monaco)}
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
          </>
        ) : activeTab === 'preview' ? (
          /* 预览区域 */
          <div className="flex-1 flex flex-col">
            {projectStatus === 'running' && previewUrl ? (
              <iframe
                key={previewKey}
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full border-0"
                title="项目预览"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                onLoad={() => {
                  console.log('✅ iframe加载完成:', previewUrl);
                  addBuildLog('🌐 预览页面加载完成');
                }}
                onError={() => {
                  console.error('❌ iframe加载错误:', previewUrl);
                  addBuildLog('❌ 预览页面加载失败');
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  {projectStatus === 'stopped' && (
                    <>
                      <Play size={64} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-xl font-medium text-gray-700 mb-2">项目未启动</h3>
                      <p className="text-gray-500 mb-4">点击"运行项目"按钮启动开发服务器</p>
                      <button
                        onClick={startProject}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Play size={20} />
                        运行项目
                      </button>
                    </>
                  )}
                  
                  {projectStatus === 'starting' && (
                    <>
                      <Loader2 size={64} className="mx-auto mb-4 text-blue-500 animate-spin" />
                      <h3 className="text-xl font-medium text-gray-700 mb-2">正在启动项目</h3>
                      <p className="text-gray-500">请稍候，正在构建和启动开发服务器...</p>
                    </>
                  )}
                  
                  {projectStatus === 'error' && (
                    <>
                      <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
                      <h3 className="text-xl font-medium text-red-700 mb-2">启动失败</h3>
                      <p className="text-gray-500 mb-4">项目启动时发生错误，请检查代码和配置</p>
                      <button
                        onClick={startProject}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw size={20} />
                        重新启动
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 终端区域 */
          <div className="flex-1 flex flex-col">
            <EnhancedTerminal />
          </div>
        )}

        {/* 构建日志侧边栏 */}
        {showBuildLog && activeTab !== 'terminal' && (
          <div className="w-80 border-l border-gray-200 bg-gray-900 text-green-400 flex flex-col">
            <div className="p-3 border-b border-gray-700 bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">构建日志</h3>
                <button
                  onClick={() => {
                    // 通过重连WebSocket来清空日志
                    wsState.reconnect();
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  重新连接
                </button>
              </div>
            </div>
            
            <div 
              ref={buildLogRef}
              className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1"
            >
              {buildLog.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              {buildLog.length === 0 && (
                <div className="text-gray-500">暂无日志</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏和信息面板 */}
      <div className="border-t border-gray-200 bg-gray-50">
        {/* 状态栏 */}
        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>项目: {projectId}</span>
            <span>框架: {framework}</span>
            <span>文件数: {Object.keys(files).length}</span>
            {activeTab === 'editor' && currentFile && (
              <span>当前: {currentFile.path}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {previewUrl && (
              <span className="text-blue-600">
                预览: <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{previewUrl}</a>
              </span>
            )}
            <span className={`font-medium ${
              projectStatus === 'running' ? 'text-green-600' :
              projectStatus === 'starting' ? 'text-yellow-600' :
              projectStatus === 'error' ? 'text-red-600' : 'text-gray-600'
            }`}>
              状态: {projectStatus}
            </span>
            
            {/* 信息面板切换按钮 */}
            <button
              onClick={() => setShowStatusInfo(!showStatusInfo)}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title={showStatusInfo ? '收起信息' : '展开信息'}
            >
              <Info size={14} />
              <ChevronDown size={12} className={`transition-transform ${showStatusInfo ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* 可收起的状态信息面板 */}
        {showStatusInfo && (
          <div className="border-t border-gray-200 bg-gray-100">
            <div className="px-4 py-3 flex gap-6">
              {/* 项目状态 */}
              <div className="bg-white rounded px-3 py-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">📊 项目状态</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">状态:</span>
                    <span className={`font-medium ${
                      projectStatus === 'running' ? 'text-green-600' :
                      projectStatus === 'starting' ? 'text-yellow-600' :
                      projectStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {projectStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">框架:</span>
                    <span className="text-blue-600 font-medium">{framework}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">文件数:</span>
                    <span className="text-purple-600 font-medium">{Object.keys(files).length}</span>
                  </div>
                  {previewUrl && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">预览:</span>
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline font-medium truncate max-w-32"
                        title={previewUrl}
                      >
                        {previewUrl.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 沙盒说明 */}
              <div className="bg-white rounded px-3 py-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700">🏖️ 沙盒环境</span>
                </div>
                <div className="text-xs space-y-1 text-gray-600">
                  <div>• 运行在 ./sandbox 目录</div>
                  <div>• 端口: 8000-8999 (隔离)</div>
                  <div>• 主应用: {typeof window !== 'undefined' ? window.location.port || '3000' : '3002'} 端口</div>
                  <div>• 支持8000端口复用</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 