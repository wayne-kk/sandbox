'use client';

import React, { useState } from 'react';
import { EnhancedTerminal, Terminal } from '@/components/Terminal';
import TerminalStatusBar from '@/components/Terminal/TerminalStatusBar';

export default function TerminalTestPage() {
    const [selectedTerminal, setSelectedTerminal] = useState<'enhanced' | 'classic'>('enhanced');

    return (
        <div className="min-h-screen bg-gray-100">
            {/* 顶部导航 */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">🖥️ 终端功能测试</h1>
                    
                    {/* 状态栏 */}
                    <TerminalStatusBar className="mb-4" />
                    
                    {/* 终端选择器 */}
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setSelectedTerminal('enhanced')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedTerminal === 'enhanced'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            🚀 增强版终端
                        </button>
                        <button
                            onClick={() => setSelectedTerminal('classic')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedTerminal === 'classic'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            📟 经典终端
                        </button>
                    </div>
                </div>
            </div>

            {/* 终端区域 */}
            <div className="max-w-7xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                    {/* 特性介绍 */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        {selectedTerminal === 'enhanced' ? (
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold text-gray-800">✨ 增强版终端特性</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        <span>实时状态监控</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        <span>SSE实时输出</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                        <span>智能命令补全</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                        <span>可视化进度条</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        <span>一键命令取消</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                                        <span>进程管理面板</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                                        <span>命令历史搜索</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                        <span>快捷键支持</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                        <span>命令复制分享</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h2 className="text-lg font-semibold text-gray-800">📟 经典终端特性</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                        <span>基础命令执行</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                        <span>简单输出显示</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                        <span>轮询状态检查</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                                        <span>容器管理</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 终端组件 */}
                    <div style={{ height: '600px' }}>
                        {selectedTerminal === 'enhanced' ? (
                            <EnhancedTerminal />
                        ) : (
                            <Terminal />
                        )}
                    </div>
                </div>

                {/* 使用说明 */}
                <div className="mt-6 bg-white rounded-lg shadow border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 使用说明</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">🚀 开始使用</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                                <li>确保 Docker Desktop 已安装并运行</li>
                                <li>点击"🚀 创建容器"按钮</li>
                                <li>等待容器创建完成</li>
                                <li>执行命令或使用预设按钮</li>
                            </ol>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">⌨️ 键盘快捷键</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑↓</kbd> 浏览命令历史</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Tab</kbd> 自动补全命令</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+R</kbd> 搜索历史命令</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+L</kbd> 清空终端输出</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+C</kbd> 取消运行中命令</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+P</kbd> 打开进程管理器</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> 清除输入内容</li>
                                <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F1</kbd> 打开命令历史</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">💡 智能功能</h4>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li>🔍 输入命令时自动显示建议</li>
                                <li>📜 命令历史快速搜索和复用</li>
                                <li>📋 一键复制命令到剪贴板</li>
                                <li>⚡ 实时显示命令执行进度</li>
                                <li>🎯 智能识别常用命令模式</li>
                                <li>🛠️ 可视化进程管理界面</li>
                                <li>🔄 自动重连和错误恢复</li>
                                <li>🎨 语法高亮和颜色分类</li>
                            </ul>
                        </div>
                    </div>
                    
                    {/* 功能演示区域 */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-3">🎯 功能演示</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                                <h5 className="font-medium text-gray-600">建议测试的命令:</h5>
                                <div className="bg-white p-2 rounded border font-mono text-xs space-y-1">
                                    <div><span className="text-green-600">$</span> ls -la</div>
                                    <div><span className="text-green-600">$</span> npm init -y</div>
                                    <div><span className="text-green-600">$</span> yarn add react</div>
                                    <div><span className="text-green-600">$</span> git status</div>
                                    <div><span className="text-green-600">$</span> docker ps</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-medium text-gray-600">交互技巧:</h5>
                                <ul className="list-disc list-inside text-gray-600 space-y-1">
                                    <li>输入 "ls" 后按 Tab 查看补全</li>
                                    <li>输入部分命令后按 ↑ 查看历史</li>
                                    <li>鼠标悬停按钮查看复制选项</li>
                                    <li>使用 Ctrl+R 快速搜索历史</li>
                                    <li>长时间命令会显示进度条</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 测试建议 */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4">🧪 建议测试命令</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <h4 className="font-medium text-blue-700 mb-2">基础命令</h4>
                            <ul className="space-y-1 text-sm text-blue-600">
                                <li><code>ls -la</code> - 查看文件</li>
                                <li><code>pwd</code> - 当前目录</li>
                                <li><code>whoami</code> - 当前用户</li>
                                <li><code>date</code> - 系统时间</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-700 mb-2">Node.js 命令</h4>
                            <ul className="space-y-1 text-sm text-blue-600">
                                <li><code>npm --version</code> - npm版本</li>
                                <li><code>node --version</code> - Node版本</li>
                                <li><code>npm init -y</code> - 初始化项目</li>
                                <li><code>npm install express</code> - 安装包</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-blue-700 mb-2">系统信息</h4>
                            <ul className="space-y-1 text-sm text-blue-600">
                                <li><code>df -h</code> - 磁盘使用</li>
                                <li><code>free -h</code> - 内存使用</li>
                                <li><code>ps aux</code> - 进程列表</li>
                                <li><code>netstat -tulpn</code> - 端口占用</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 