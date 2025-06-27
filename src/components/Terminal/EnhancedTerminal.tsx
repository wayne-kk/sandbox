'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TerminalOutput {
    id: string;
    type: 'input' | 'stdout' | 'stderr' | 'system' | 'error' | 'success';
    content: string;
    timestamp: Date;
    executionId?: string;
}

interface ContainerStatus {
    isRunning: boolean;
    dockerAvailable: boolean;
    daemonRunning: boolean;
    info: any;
}

interface Health {
    docker: boolean;
    daemon: boolean;
    container: boolean;
    network: boolean;
}

interface RunningCommand {
    id: string;
    command: string;
    startTime: Date;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
}

interface CommonCommand {
    name: string;
    command: string;
    description: string;
    category: string;
}

export default function EnhancedTerminal() {
    const [output, setOutput] = useState<TerminalOutput[]>([]);
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [containerStatus, setContainerStatus] = useState<ContainerStatus>({
        isRunning: false,
        dockerAvailable: false,
        daemonRunning: false,
        info: null
    });
    const [health, setHealth] = useState<Health>({
        docker: false,
        daemon: false,
        container: false,
        network: false
    });
    const [commonCommands, setCommonCommands] = useState<CommonCommand[]>([]);
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [runningCommands, setRunningCommands] = useState<RunningCommand[]>([]);
    const [progress, setProgress] = useState<{ phase: string; percentage?: number } | null>(null);
    const [sseConnection, setSseConnection] = useState<EventSource | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showProcessManager, setShowProcessManager] = useState(false);
    const [processes, setProcesses] = useState<any[]>([]);
    const [showCommandHistory, setShowCommandHistory] = useState(false);
    const [commandSuggestions, setCommandSuggestions] = useState<string[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
    const [inputFocused, setInputFocused] = useState(false);

    const terminalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [output]);

    // 初始化连接
    useEffect(() => {
        initializeConnection();
        loadStatus();
        loadCommands();

        return () => {
            if (sseConnection) {
                sseConnection.close();
            }
        };
    }, []);

    const initializeConnection = () => {
        // 建立SSE连接
        const sse = new EventSource('/api/terminal?action=stream');
        
        sse.onopen = () => {
            addOutput('system', '📡 已连接到终端服务');
        };

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleSSEMessage(data);
            } catch (error) {
                console.error('SSE消息解析失败:', error);
            }
        };

        sse.onerror = (error) => {
            console.error('SSE连接错误:', error);
            addOutput('error', '❌ 与服务器连接中断，正在重新连接...');
            
            // 3秒后重连
            setTimeout(() => {
                if (sse.readyState !== EventSource.OPEN) {
                    sse.close();
                    initializeConnection();
                }
            }, 3000);
        };

        setSseConnection(sse);
    };

    const handleSSEMessage = (message: any) => {
        switch (message.type) {
            case 'connected':
                setSessionId(message.sessionId);
                addOutput('success', `🔗 会话已建立 (${message.sessionId})`);
                break;

            case 'command-started':
                addOutput('system', `▶️ 开始执行: ${message.data.command}`);
                setIsLoading(true);
                break;

            case 'command-output':
                if (message.data.type === 'stdout') {
                    addOutput('stdout', message.data.data, message.data.executionId);
                } else if (message.data.type === 'stderr') {
                    addOutput('stderr', message.data.data, message.data.executionId);
                }
                break;

            case 'command-progress':
                setProgress(message.data);
                break;

            case 'command-finished':
                const { exitCode, duration } = message.data;
                addOutput(
                    exitCode === 0 ? 'success' : 'error', 
                    `✅ 命令执行${exitCode === 0 ? '成功' : '失败'} (退出码: ${exitCode}, 耗时: ${duration}ms)`
                );
                setIsLoading(false);
                setProgress(null);
                break;

            case 'command-error':
                addOutput('error', `❌ 执行错误: ${message.data.error}`);
                setIsLoading(false);
                setProgress(null);
                break;

            case 'command-cancelled':
                addOutput('system', `⏹️ 命令已取消 (${message.data.executionId})`);
                setIsLoading(false);
                setProgress(null);
                break;

            case 'pulling-image':
                addOutput('system', `📥 正在拉取镜像: ${message.data}`);
                break;

            case 'image-pulled':
                addOutput('success', `✅ 镜像拉取成功: ${message.data}`);
                break;

            case 'container-created':
                addOutput('success', `🐳 容器创建成功: ${message.data.containerId}`);
                loadStatus();
                break;
        }
    };

    const loadStatus = async () => {
        try {
            const response = await fetch('/api/terminal?action=status');
            const data = await response.json();
            
            if (data.success) {
                setContainerStatus(data.status);
                setHealth(data.health);
                setRunningCommands(data.runningCommands);
            }
        } catch (error) {
            console.error('加载状态失败:', error);
        }
    };

    const loadCommands = async () => {
        try {
            const response = await fetch('/api/terminal?action=commands');
            const data = await response.json();
            
            if (data.success) {
                setCommonCommands(data.commonCommands);
                setCommandHistory(data.commandHistory);
            }
        } catch (error) {
            console.error('加载命令失败:', error);
        }
    };

    const addOutput = useCallback((type: TerminalOutput['type'], content: string, executionId?: string) => {
        const newOutput: TerminalOutput = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: content.trim(),
            timestamp: new Date(),
            executionId
        };
        setOutput(prev => [...prev, newOutput]);
    }, []);

    const executeCommand = async (cmdToRun?: string) => {
        const commandToRun = cmdToRun || command.trim();
        if (!commandToRun) return;

        setCommand('');
        setHistoryIndex(-1);
        addOutput('input', `$ ${commandToRun}`);

        try {
            const response = await fetch('/api/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'execute', 
                    command: commandToRun 
                })
            });

            const data = await response.json();

            if (!data.success) {
                if (data.needsContainer) {
                    addOutput('error', '❌ ' + data.error);
                    addOutput('system', '💡 提示: 请先点击"🚀 创建容器"按钮');
                } else {
                    addOutput('error', '❌ ' + data.error);
                }
            }
        } catch (error) {
            addOutput('error', `❌ 网络错误: ${error}`);
        }

        // 刷新状态
        loadStatus();
        loadCommands();
    };

    const cancelRunningCommands = async () => {
        for (const cmd of runningCommands) {
            try {
                await fetch('/api/terminal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: 'cancel', 
                        executionId: cmd.id 
                    })
                });
            } catch (error) {
                console.error('取消命令失败:', error);
            }
        }
    };

    const createContainer = async () => {
        setIsLoading(true);
        addOutput('system', '🚀 正在创建容器...');

        try {
            const response = await fetch('/api/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create-container' })
            });

            const data = await response.json();

            if (data.success) {
                addOutput('success', '✅ ' + data.message);
            } else {
                addOutput('error', '❌ ' + data.error);
            }
        } catch (error) {
            addOutput('error', `❌ 创建容器失败: ${error}`);
        } finally {
            setIsLoading(false);
            loadStatus();
        }
    };

    const cleanup = async () => {
        setIsLoading(true);
        addOutput('system', '🧹 正在清理资源...');

        try {
            await fetch('/api/terminal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cleanup' })
            });

            addOutput('success', '✅ 清理完成');
            setOutput([]);
        } catch (error) {
            addOutput('error', `❌ 清理失败: ${error}`);
        } finally {
            setIsLoading(false);
            loadStatus();
        }
    };

    const loadProcesses = async () => {
        try {
            const response = await fetch('/api/terminal/process?action=list');
            const data = await response.json();
            
            if (data.success) {
                setProcesses(data.processes);
            }
        } catch (error) {
            console.error('加载进程列表失败:', error);
        }
    };

    const killAllDevProcesses = async () => {
        setIsLoading(true);
        addOutput('system', '🔄 正在清理卡住的开发服务器进程...');

        try {
            const response = await fetch('/api/terminal/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cleanup' })
            });

            const data = await response.json();

            if (data.success) {
                addOutput('success', '✅ ' + data.message);
                addOutput('system', '💡 现在可以重新运行开发命令了');
            } else {
                addOutput('error', '❌ ' + data.error);
            }
        } catch (error) {
            addOutput('error', `❌ 清理失败: ${error}`);
        } finally {
            setIsLoading(false);
            loadStatus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // 如果有建议列表，优先处理建议导航
        if (commandSuggestions.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSuggestion(prev => 
                    prev <= 0 ? commandSuggestions.length - 1 : prev - 1
                );
                return;
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSuggestion(prev => 
                    prev >= commandSuggestions.length - 1 ? 0 : prev + 1
                );
                return;
            } else if (e.key === 'Tab') {
                e.preventDefault();
                if (selectedSuggestion >= 0) {
                    const suggestion = commandSuggestions[selectedSuggestion];
                    setCommand(suggestion);
                    clearSuggestions();
                } else if (commandSuggestions.length > 0) {
                    setCommand(commandSuggestions[0]);
                    clearSuggestions();
                }
                return;
            } else if (e.key === 'Enter') {
                if (selectedSuggestion >= 0) {
                    e.preventDefault();
                    const suggestion = commandSuggestions[selectedSuggestion];
                    executeCommand(suggestion);
                    clearSuggestions();
                    return;
                }
            } else if (e.key === 'Escape') {
                clearSuggestions();
                return;
            }
        }

        // 全局快捷键处理
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'c':
                    if (runningCommands.length > 0) {
                        e.preventDefault();
                        cancelRunningCommands();
                        addOutput('system', '⏹️ 已取消所有运行中的命令');
                    }
                    break;
                case 'l':
                    e.preventDefault();
                    setOutput([]);
                    addOutput('system', '🧹 终端已清空');
                    break;
                case 'r':
                    e.preventDefault();
                    setShowCommandHistory(!showCommandHistory);
                    break;
                case 'k':
                    if (e.shiftKey) {
                        e.preventDefault();
                        cleanup();
                    }
                    break;
                case 'p':
                    e.preventDefault();
                    setShowProcessManager(!showProcessManager);
                    if (!showProcessManager) loadProcesses();
                    break;
                case 'enter':
                case 'return':
                    if (e.shiftKey) {
                        e.preventDefault();
                        executeCommand();
                    }
                    break;
            }
            return;
        }

        // 处理历史命令导航
        if (e.key === 'Enter') {
            executeCommand();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : commandHistory.length - 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[newIndex]);
                // 清除建议避免冲突
                clearSuggestions();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setCommand(commandHistory[newIndex]);
                // 清除建议避免冲突
                clearSuggestions();
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setCommand('');
                clearSuggestions();
            }
        } else if (e.key === 'Escape') {
            setCommand('');
            setHistoryIndex(-1);
            clearSuggestions();
        } else if (e.key === 'F1') {
            e.preventDefault();
            setShowCommandHistory(true);
        }
    };

    // 处理命令输入变化，实现自动补全
    const handleCommandChange = (value: string) => {
        setCommand(value);
        setHistoryIndex(-1);

        // 生成命令建议
        if (value.trim().length > 0) {
            const suggestions = [];
            
            // 从历史命令中匹配
            const historyMatches = commandHistory.filter(cmd => 
                cmd.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 3);
            suggestions.push(...historyMatches);

            // 从常用命令中匹配
            const commonMatches = commonCommands
                .filter(cmd => 
                    cmd.command.toLowerCase().includes(value.toLowerCase()) ||
                    cmd.name.toLowerCase().includes(value.toLowerCase())
                )
                .map(cmd => cmd.command)
                .slice(0, 3);
            suggestions.push(...commonMatches);

            // 基础命令补全
            const basicCommands = ['ls', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find', 'ps', 'kill', 'top', 'df', 'du'];
            const basicMatches = basicCommands.filter(cmd => 
                cmd.startsWith(value.toLowerCase())
            ).slice(0, 2);
            suggestions.push(...basicMatches);

            // 去重并限制数量
            const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);
            setCommandSuggestions(uniqueSuggestions);
            setSelectedSuggestion(uniqueSuggestions.length > 0 ? 0 : -1);
        } else {
            setCommandSuggestions([]);
            setSelectedSuggestion(-1);
        }
    };

    // 快速插入命令
    const insertCommand = (cmd: string) => {
        setCommand(cmd);
        setCommandSuggestions([]);
        setSelectedSuggestion(-1);
        setShowCommandHistory(false);
        inputRef.current?.focus();
    };

    // 复制命令到剪贴板
    const copyCommand = async (cmd: string) => {
        try {
            await navigator.clipboard.writeText(cmd);
            addOutput('system', `📋 已复制命令: ${cmd}`);
        } catch (error) {
            addOutput('error', `❌ 复制失败: ${error}`);
        }
    };

    // 清除所有建议和状态
    const clearSuggestions = () => {
        setCommandSuggestions([]);
        setSelectedSuggestion(-1);
        setShowCommandHistory(false);
    };

    // 处理输入框焦点
    const handleInputFocus = () => {
        setInputFocused(true);
        // 如果有输入内容，重新生成建议
        if (command.trim()) {
            handleCommandChange(command);
        }
    };

    // 处理输入框失焦
    const handleInputBlur = () => {
        // 延迟隐藏建议，允许点击建议项
        setTimeout(() => {
            setInputFocused(false);
            if (!command.trim()) {
                clearSuggestions();
            }
        }, 200);
    };

    const getStatusColor = () => {
        if (!health.docker) return 'bg-red-500';
        if (!health.daemon) return 'bg-orange-500';
        if (!health.container) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStatusText = () => {
        if (!health.docker) return 'Docker 未安装';
        if (!health.daemon) return 'Docker 未启动';
        if (!health.container) return '容器未运行';
        return '运行正常';
    };

    const getOutputClass = (type: TerminalOutput['type']) => {
        switch (type) {
            case 'input':
                return 'text-cyan-400 font-medium';
            case 'stdout':
                return 'text-gray-300';
            case 'stderr':
                return 'text-orange-400';
            case 'error':
                return 'text-red-400';
            case 'success':
                return 'text-green-400';
            case 'system':
                return 'text-blue-400';
            default:
                return 'text-gray-300';
        }
    };

    const filteredCommands = selectedCategory === 'all' 
        ? commonCommands 
        : commonCommands.filter(cmd => cmd.category === selectedCategory);

    const categories = ['all', ...new Set(commonCommands.map(cmd => cmd.category))];

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white">
            {/* 头部状态栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold">🖥️ 增强终端</h3>
                    
                    {/* 状态指示器 */}
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                        <span className="text-sm text-gray-300">{getStatusText()}</span>
                    </div>

                    {/* 会话信息 */}
                    {sessionId && (
                        <span className="text-xs text-gray-500">
                            会话: {sessionId}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {/* 运行中的命令数量 */}
                    {runningCommands.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-yellow-400">
                                运行中: {runningCommands.length}
                            </span>
                            <button
                                onClick={cancelRunningCommands}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                            >
                                全部取消
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setOutput([])}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    >
                        清空
                    </button>
                </div>
            </div>

            {/* 进度条 */}
            {progress && (
                <div className="px-4 py-2 bg-blue-900 border-b border-blue-700">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-300">{progress.phase}</span>
                        {progress.percentage && (
                            <span className="text-blue-300">{progress.percentage}%</span>
                        )}
                    </div>
                    {progress.percentage && (
                        <div className="mt-1 w-full bg-blue-800 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            )}

            {/* 快捷操作区 */}
            <div className="border-b border-gray-700 bg-gray-800 transition-all duration-300">
                {/* 容器操作 */}
                <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {!containerStatus.isRunning ? (
                            <button
                                onClick={createContainer}
                                disabled={!containerStatus.dockerAvailable || isLoading}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg text-sm flex items-center space-x-1 transition-all duration-200 hover:scale-105"
                            >
                                <span>🚀</span>
                                <span>创建容器</span>
                            </button>
                        ) : (
                            <button
                                onClick={cleanup}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm flex items-center space-x-1 transition-all duration-200 hover:scale-105"
                            >
                                <span>🗑️</span>
                                <span>清理容器</span>
                            </button>
                        )}

                        <button
                            onClick={loadStatus}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                            🔄 刷新状态
                        </button>

                        <button
                            onClick={killAllDevProcesses}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                            🚫 清理卡住进程
                        </button>

                        <button
                            onClick={() => {
                                setShowProcessManager(!showProcessManager);
                                if (!showProcessManager) loadProcesses();
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm transition-all duration-200 hover:scale-105"
                        >
                            ⚙️ 进程管理
                        </button>
                    </div>

                    {/* 进程管理面板 */}
                    <div className={`transition-all duration-300 overflow-hidden ${
                        showProcessManager ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                        {showProcessManager && (
                            <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400">运行中的进程:</span>
                                    <button
                                        onClick={loadProcesses}
                                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs transition-colors"
                                    >
                                        刷新
                                    </button>
                                </div>
                                {processes.length > 0 ? (
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {processes.map((proc, index) => (
                                            <div key={index} className="flex items-center justify-between text-xs bg-gray-900 p-2 rounded border border-gray-700">
                                                <div className="flex-1 font-mono">
                                                    <span className="text-cyan-400">PID {proc.pid}</span>
                                                    <span className="text-gray-400 ml-2 truncate">{proc.command}</span>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await fetch('/api/terminal/process', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ action: 'kill', pid: proc.pid })
                                                            });
                                                            loadProcesses();
                                                            addOutput('system', `✅ 进程 ${proc.pid} 已终止`);
                                                        } catch (error) {
                                                            addOutput('error', `❌ 终止进程失败: ${error}`);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                                                >
                                                    终止
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-500 text-center py-2">
                                        没有找到相关进程
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 常用命令 */}
                    {commonCommands.length > 0 && (
                        <div className="transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">常用命令:</span>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                >
                                    <option value="all">全部</option>
                                    {categories.slice(1).map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'setup' ? '设置' : 
                                             cat === 'dev' ? '开发' :
                                             cat === 'build' ? '构建' :
                                             cat === 'info' ? '信息' :
                                             cat === 'maintenance' ? '维护' : cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {filteredCommands.map((cmd, index) => (
                                    <div key={index} className="group relative">
                                        <button
                                            onClick={() => executeCommand(cmd.command)}
                                            disabled={!containerStatus.isRunning || isLoading}
                                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded text-xs transition-all duration-200 hover:scale-105"
                                            title={cmd.description}
                                        >
                                            {cmd.name}
                                        </button>
                                        
                                        {/* 复制按钮 */}
                                        <button
                                            onClick={() => copyCommand(cmd.command)}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 hover:bg-blue-700 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                                            title="复制命令"
                                        >
                                            <span className="text-xs">📋</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 终端输出区 */}
            <div
                ref={terminalRef}
                className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-black"
                style={{ minHeight: '400px' }}
            >
                {output.length === 0 ? (
                    <div className="text-gray-500 space-y-2">
                        <div>🎯 增强终端已启动！</div>
                        <div>💡 支持实时输出、命令历史、进度显示</div>
                        <div>⚡ 使用上下箭头浏览命令历史</div>
                        {!containerStatus.isRunning && (
                            <div className="text-yellow-400">
                                ⚠️ 请先创建容器再执行命令
                            </div>
                        )}
                    </div>
                ) : (
                    output.map((item) => (
                        <div key={item.id} className={`mb-1 ${getOutputClass(item.type)}`}>
                            <span className="text-gray-600 text-xs mr-2">
                                {item.timestamp.toLocaleTimeString()}
                            </span>
                            <span className="whitespace-pre-wrap break-words">
                                {item.content}
                            </span>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex items-center space-x-2 text-yellow-400 mt-2">
                        <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                        <span>执行中...</span>
                    </div>
                )}
            </div>

            {/* 命令输入区 */}
            <div className="border-t border-gray-700 bg-gray-800">
                {/* 命令历史面板 */}
                {showCommandHistory && commandHistory.length > 0 && (
                    <div className="border-b border-gray-700 bg-gray-900 max-h-48 overflow-y-auto">
                        <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700 bg-gray-800">
                            <div className="flex items-center justify-between">
                                <span>📜 命令历史 (Ctrl+R)</span>
                                <button
                                    onClick={() => setShowCommandHistory(false)}
                                    className="text-gray-500 hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="p-2 space-y-1">
                            {commandHistory.slice().reverse().map((cmd, index) => (
                                <button
                                    key={index}
                                    onClick={() => insertCommand(cmd)}
                                    className="w-full text-left px-2 py-1 text-xs font-mono text-gray-300 hover:bg-gray-700 rounded transition-colors"
                                >
                                    {cmd}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 主输入区域 */}
                <div className="p-4">
                    <div className="relative">
                        <div className="flex items-center space-x-2">
                            <span className="text-green-400 font-bold shrink-0">$</span>
                            <div className="relative flex-1">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={command}
                                    onChange={(e) => handleCommandChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                    placeholder={
                                        containerStatus.isRunning 
                                            ? "输入命令 (↑↓历史 Tab补全 Ctrl+R搜索 Esc清除)" 
                                            : "请先创建容器"
                                    }
                                    disabled={!containerStatus.isRunning || isLoading}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 outline-none text-white placeholder-gray-400 font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 hover:border-gray-500"
                                    autoComplete="off"
                                    spellCheck="false"
                                />

                                {/* 命令建议下拉列表 */}
                                <div className={`absolute top-full left-0 right-0 mt-1 transition-all duration-200 ${
                                    commandSuggestions.length > 0 && inputFocused 
                                        ? 'opacity-100 translate-y-0 visible' 
                                        : 'opacity-0 -translate-y-2 invisible'
                                }`}>
                                    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setCommand(suggestion);
                                                    clearSuggestions();
                                                    inputRef.current?.focus();
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm font-mono transition-all duration-150 ${
                                                    index === selectedSuggestion
                                                        ? 'bg-blue-600 text-white scale-[0.98]'
                                                        : 'text-gray-300 hover:bg-gray-700'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="truncate">{suggestion}</span>
                                                    <div className="flex items-center space-x-1 ml-2">
                                                        {index === selectedSuggestion && (
                                                            <kbd className="px-1.5 py-0.5 bg-blue-500 text-blue-100 rounded text-xs">Tab</kbd>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                copyCommand(suggestion);
                                                            }}
                                                            className="text-xs opacity-70 hover:opacity-100 transition-opacity"
                                                            title="复制"
                                                        >
                                                            📋
                                                        </button>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => executeCommand()}
                                disabled={!containerStatus.isRunning || isLoading || !command.trim()}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 rounded-lg text-sm font-medium transition-all duration-200 shrink-0"
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>执行中</span>
                                    </div>
                                ) : (
                                    '执行'
                                )}
                            </button>
                        </div>

                        {/* 底部提示栏 - 固定高度避免跳动 */}
                        <div className="mt-3 h-6 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-4 text-gray-500">
                                {commandHistory.length > 0 && (
                                    <button
                                        onClick={() => setShowCommandHistory(!showCommandHistory)}
                                        className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
                                    >
                                        <span>📜</span>
                                        <span>{commandHistory.length} 条历史</span>
                                    </button>
                                )}
                                
                                {historyIndex >= 0 && (
                                    <div className="flex items-center space-x-1 text-blue-400">
                                        <span>📍</span>
                                        <span>历史 {commandHistory.length - historyIndex}/{commandHistory.length}</span>
                                    </div>
                                )}

                                {command && commandSuggestions.length > 0 && (
                                    <div className="flex items-center space-x-1 text-green-400">
                                        <span>💡</span>
                                        <span>{commandSuggestions.length} 个建议</span>
                                    </div>
                                )}

                                {runningCommands.length > 0 && (
                                    <div className="flex items-center space-x-1 text-yellow-400 animate-pulse">
                                        <span>⚡</span>
                                        <span>{runningCommands.length} 个任务运行中</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-3 text-gray-500">
                                <div className="hidden sm:flex items-center space-x-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">↑↓</kbd>
                                    <span>历史</span>
                                </div>
                                <div className="hidden sm:flex items-center space-x-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Tab</kbd>
                                    <span>补全</span>
                                </div>
                                <div className="hidden md:flex items-center space-x-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Ctrl+R</kbd>
                                    <span>搜索</span>
                                </div>
                                <div className="hidden md:flex items-center space-x-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Ctrl+L</kbd>
                                    <span>清空</span>
                                </div>
                                <div className="hidden lg:flex items-center space-x-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Ctrl+C</kbd>
                                    <span>取消</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 