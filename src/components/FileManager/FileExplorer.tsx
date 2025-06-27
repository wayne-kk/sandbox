'use client';

import React, { useState, useEffect } from 'react';
import { Folder, File, Save, History, Download, Upload, RotateCcw } from 'lucide-react';

interface FileData {
    path: string;
    lastModified: Date;
    size: number;
    hash: string;
}

interface VersionInfo {
    version: number;
    description: string;
    createdAt: string;
    changesCount: number;
    parentVersion?: number;
}

interface FileExplorerProps {
    userId: string;
    onFileSelect: (filePath: string, content: string) => void;
    currentFiles: { [path: string]: string };
    onFilesChange: (files: { [path: string]: string }) => void;
}

export default function FileExplorer({ 
    userId, 
    onFileSelect, 
    currentFiles, 
    onFilesChange 
}: FileExplorerProps) {
    const [files, setFiles] = useState<FileData[]>([]);
    const [versions, setVersions] = useState<VersionInfo[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [showVersions, setShowVersions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // 加载文件列表
    const loadFiles = async () => {
        try {
            const response = await fetch(`/api/files/save?userId=${userId}&action=list`);
            const data = await response.json();
            if (data.files) {
                setFiles(data.files);
            }
        } catch (error) {
            console.error('加载文件列表失败:', error);
        }
    };

    // 加载版本历史
    const loadVersions = async () => {
        try {
            const response = await fetch(`/api/files/versions?userId=${userId}`);
            const data = await response.json();
            if (data.versions) {
                setVersions(data.versions);
            }
        } catch (error) {
            console.error('加载版本历史失败:', error);
        }
    };

    // 保存单个文件
    const saveFile = async (filePath: string, content: string) => {
        setSaveStatus('saving');
        try {
            const response = await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action: 'save',
                    filePath,
                    content
                })
            });
            
            if (response.ok) {
                setSaveStatus('saved');
                await loadFiles(); // 刷新文件列表
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('保存文件失败:', error);
            setSaveStatus('error');
        }
    };

    // 批量保存所有文件
    const saveAllFiles = async () => {
        setSaveStatus('saving');
        try {
            const response = await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action: 'save',
                    files: currentFiles
                })
            });
            
            if (response.ok) {
                setSaveStatus('saved');
                await loadFiles();
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('批量保存失败:', error);
            setSaveStatus('error');
        }
    };

    // 读取文件内容
    const readFile = async (filePath: string) => {
        try {
            const response = await fetch(`/api/files/save?userId=${userId}&filePath=${encodeURIComponent(filePath)}&action=read`);
            const data = await response.json();
            if (data.content !== undefined) {
                onFileSelect(filePath, data.content);
                setSelectedFile(filePath);
            }
        } catch (error) {
            console.error('读取文件失败:', error);
        }
    };

    // 创建版本快照
    const createVersion = async () => {
        const description = prompt('请输入版本描述:');
        if (!description) return;

        setLoading(true);
        try {
            // 先保存当前状态
            await saveAllFiles();
            
            // 创建版本
            const response = await fetch('/api/files/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action: 'create',
                    description
                })
            });
            
            if (response.ok) {
                await loadVersions();
                alert('版本快照创建成功！');
            }
        } catch (error) {
            console.error('创建版本失败:', error);
            alert('创建版本失败');
        } finally {
            setLoading(false);
        }
    };

    // 恢复到指定版本
    const restoreVersion = async (version: number) => {
        if (!confirm(`确定要恢复到版本 ${version} 吗？当前未保存的更改将丢失。`)) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/files/versions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action: 'restore',
                    version
                })
            });
            
            if (response.ok) {
                // 重新加载文件
                const filesResponse = await fetch(`/api/files/save?userId=${userId}`);
                const filesData = await filesResponse.json();
                
                if (filesData.files) {
                    const fileContents: { [path: string]: string } = {};
                    for (const [path, fileData] of Object.entries(filesData.files)) {
                        fileContents[path] = (fileData as any).content;
                    }
                    onFilesChange(fileContents);
                }
                
                await loadFiles();
                alert(`已恢复到版本 ${version}`);
            }
        } catch (error) {
            console.error('恢复版本失败:', error);
            alert('恢复版本失败');
        } finally {
            setLoading(false);
        }
    };

    // 导出项目
    const exportProject = async () => {
        try {
            const response = await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action: 'export'
                })
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${userId}-project.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('导出项目失败:', error);
            alert('导出项目失败');
        }
    };

    // 实时保存功能
    useEffect(() => {
        if (Object.keys(currentFiles).length > 0) {
            const timer = setTimeout(() => {
                saveAllFiles();
            }, 3000); // 3秒后自动保存
            
            return () => clearTimeout(timer);
        }
    }, [currentFiles]);

    useEffect(() => {
        loadFiles();
        loadVersions();
    }, [userId]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('zh-CN');
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 border-r">
            {/* 工具栏 */}
            <div className="p-3 border-b bg-white">
                <div className="flex items-center gap-2 mb-2">
                    <button
                        onClick={saveAllFiles}
                        disabled={saveStatus === 'saving'}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                            saveStatus === 'saving' 
                                ? 'bg-yellow-100 text-yellow-700'
                                : saveStatus === 'saved'
                                ? 'bg-green-100 text-green-700'
                                : saveStatus === 'error'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                    >
                        <Save className="w-4 h-4" />
                        {saveStatus === 'saving' ? '保存中...' : 
                         saveStatus === 'saved' ? '已保存' :
                         saveStatus === 'error' ? '保存失败' : '保存全部'}
                    </button>
                    
                    <button
                        onClick={() => setShowVersions(!showVersions)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                    >
                        <History className="w-4 h-4" />
                        版本
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={createVersion}
                        disabled={loading}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        📸 快照
                    </button>
                    
                    <button
                        onClick={exportProject}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        导出
                    </button>
                </div>
            </div>

            {/* 版本历史面板 */}
            {showVersions && (
                <div className="p-3 border-b bg-blue-50 max-h-48 overflow-y-auto">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">版本历史</h4>
                    {versions.length === 0 ? (
                        <p className="text-xs text-gray-500">暂无版本记录</p>
                    ) : (
                        <div className="space-y-2">
                            {versions.map((version) => (
                                <div key={version.version} className="flex items-center justify-between p-2 bg-white rounded text-xs">
                                    <div>
                                        <div className="font-medium">v{version.version}</div>
                                        <div className="text-gray-500">{version.description}</div>
                                        <div className="text-gray-400">{formatDate(version.createdAt)}</div>
                                    </div>
                                    <button
                                        onClick={() => restoreVersion(version.version)}
                                        disabled={loading}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        恢复
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 文件列表 */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">文件 ({files.length})</h3>
                    
                    {files.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">暂无文件</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {files.map((file) => (
                                <div
                                    key={file.path}
                                    onClick={() => readFile(file.path)}
                                    className={`p-2 rounded cursor-pointer transition-colors ${
                                        selectedFile === file.path
                                            ? 'bg-blue-100 border border-blue-200'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <File className="w-4 h-4 text-gray-500" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {file.path.split('/').pop()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {file.path.includes('/') && (
                                                    <div className="truncate">{file.path.substring(0, file.path.lastIndexOf('/'))}/</div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span>{formatFileSize(file.size)}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(file.lastModified.toString())}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 状态栏 */}
            <div className="p-2 border-t bg-gray-100 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                    <span>项目: {userId}</span>
                    <span>
                        {saveStatus === 'saving' && '💾 保存中...'}
                        {saveStatus === 'saved' && '✅ 已保存'}
                        {saveStatus === 'error' && '❌ 保存失败'}
                    </span>
                </div>
            </div>
        </div>
    );
} 