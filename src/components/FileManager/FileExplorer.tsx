'use client';

import React, { useState, useEffect } from 'react';
import { Folder, File, Save, Download, Upload } from 'lucide-react';

interface FileData {
    path: string;
    lastModified: Date;
    size: number;
    hash: string;
}

interface FileExplorerProps {
    projectId: string;
    onFileSelect: (filePath: string, content: string) => void;
    currentFiles: { [path: string]: string };
    onFilesChange: (files: { [path: string]: string }) => void;
}

export default function FileExplorer({
    projectId,
    onFileSelect,
    currentFiles,
    onFilesChange
}: FileExplorerProps) {
    const [files, setFiles] = useState<FileData[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // 加载文件列表
    const loadFiles = async () => {
        try {
            const response = await fetch(`/api/files/save?projectId=${projectId}&action=list`);
            const data = await response.json();
            if (data.files) {
                setFiles(data.files);
            }
        } catch (error) {
            console.error('加载文件列表失败:', error);
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
                    projectId,
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

    // 批量保存文件
    const saveAllFiles = async () => {
        setSaveStatus('saving');
        try {
            const response = await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
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
            const response = await fetch(`/api/files/save?projectId=${projectId}&filePath=${encodeURIComponent(filePath)}&action=read`);
            const data = await response.json();
            if (data.content !== undefined) {
                onFileSelect(filePath, data.content);
                setSelectedFile(filePath);
            }
        } catch (error) {
            console.error('读取文件失败:', error);
        }
    };

    // 导出项目
    const exportProject = async () => {
        try {
            const response = await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    action: 'export'
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${projectId}-project.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('导出项目失败:', error);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [projectId]);

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleString('zh-CN');
    };

    const getFileIcon = (filePath: string) => {
        const ext = filePath.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
                return '📄';
            case 'css':
            case 'scss':
            case 'sass':
                return '🎨';
            case 'html':
            case 'htm':
                return '🌐';
            case 'json':
                return '📋';
            case 'md':
                return '📝';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'svg':
                return '🖼️';
            default:
                return '📄';
        }
    };

    return (
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
            {/* 头部工具栏 */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">文件管理器</h3>
                    <div className="flex space-x-1">
                        <button
                            onClick={saveAllFiles}
                            disabled={saveStatus === 'saving'}
                            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                            title="保存所有文件"
                        >
                            <Save size={16} />
                        </button>
                        <button
                            onClick={exportProject}
                            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded"
                            title="导出项目"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                {/* 保存状态指示器 */}
                <div className="text-xs text-gray-500">
                    {saveStatus === 'saving' && '💾 保存中...'}
                    {saveStatus === 'saved' && '✅ 保存成功'}
                    {saveStatus === 'error' && '❌ 保存失败'}
                </div>
            </div>

            {/* 文件列表 */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        加载中...
                    </div>
                ) : files.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        <File size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>暂无文件</p>
                    </div>
                ) : (
                    <div className="p-2">
                        {files.map((file) => (
                            <div
                                key={file.path}
                                onClick={() => readFile(file.path)}
                                className={`p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors ${selectedFile === file.path ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm">{getFileIcon(file.path)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {file.path.split('/').pop()}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {file.path}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                                    <span>{formatFileSize(file.size)}</span>
                                    <span>{formatDate(file.lastModified)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 底部状态栏 */}
            <div className="p-2 border-t bg-gray-100 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                    <span>项目: {projectId}</span>
                    <span>
                        {files.length} 个文件
                    </span>
                </div>
            </div>
        </div>
    );
}