'use client';

import React, { useState, useEffect } from 'react';

interface TerminalStatus {
    dockerAvailable: boolean;
    daemonRunning: boolean;
    containerRunning: boolean;
    networkHealth: boolean;
    runningCommands: number;
    lastUpdate: Date;
}

interface Props {
    className?: string;
}

export default function TerminalStatusBar({ className = '' }: Props) {
    const [status, setStatus] = useState<TerminalStatus>({
        dockerAvailable: false,
        daemonRunning: false,
        containerRunning: false,
        networkHealth: false,
        runningCommands: 0,
        lastUpdate: new Date()
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStatus();
        
        // 每5秒更新状态
        const interval = setInterval(loadStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadStatus = async () => {
        try {
            const response = await fetch('/api/terminal?action=status');
            const data = await response.json();
            
            if (data.success) {
                setStatus({
                    dockerAvailable: data.health.docker,
                    daemonRunning: data.health.daemon,
                    containerRunning: data.health.container,
                    networkHealth: data.health.network,
                    runningCommands: data.runningCommands.length,
                    lastUpdate: new Date()
                });
            }
        } catch (error) {
            console.error('加载终端状态失败:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getOverallStatus = () => {
        if (!status.dockerAvailable) return { level: 'error', text: 'Docker 未安装' };
        if (!status.daemonRunning) return { level: 'warning', text: 'Docker 未启动' };
        if (!status.containerRunning) return { level: 'info', text: '容器未运行' };
        if (!status.networkHealth) return { level: 'warning', text: '网络异常' };
        return { level: 'success', text: '运行正常' };
    };

    const overallStatus = getOverallStatus();

    const getStatusColor = (level: string) => {
        switch (level) {
            case 'success': return 'text-green-400 bg-green-900';
            case 'warning': return 'text-yellow-400 bg-yellow-900';
            case 'info': return 'text-blue-400 bg-blue-900';
            case 'error': return 'text-red-400 bg-red-900';
            default: return 'text-gray-400 bg-gray-900';
        }
    };

    const getIndicatorColor = (isOk: boolean) => {
        return isOk ? 'bg-green-500' : 'bg-red-500';
    };

    if (isLoading) {
        return (
            <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span className="text-sm">检查状态中...</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center space-x-4 ${className}`}>
            {/* 总体状态 */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded ${getStatusColor(overallStatus.level)}`}>
                <div className={`w-2 h-2 rounded-full ${getIndicatorColor(overallStatus.level === 'success')}`}></div>
                <span className="text-sm font-medium">{overallStatus.text}</span>
            </div>

            {/* 详细状态指示器 */}
            <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1" title="Docker 可用性">
                    <div className={`w-2 h-2 rounded-full ${getIndicatorColor(status.dockerAvailable)}`}></div>
                    <span className="text-gray-400">Docker</span>
                </div>

                <div className="flex items-center space-x-1" title="Docker 守护进程">
                    <div className={`w-2 h-2 rounded-full ${getIndicatorColor(status.daemonRunning)}`}></div>
                    <span className="text-gray-400">守护进程</span>
                </div>

                <div className="flex items-center space-x-1" title="容器运行状态">
                    <div className={`w-2 h-2 rounded-full ${getIndicatorColor(status.containerRunning)}`}></div>
                    <span className="text-gray-400">容器</span>
                </div>

                <div className="flex items-center space-x-1" title="网络连接">
                    <div className={`w-2 h-2 rounded-full ${getIndicatorColor(status.networkHealth)}`}></div>
                    <span className="text-gray-400">网络</span>
                </div>
            </div>

            {/* 运行中的命令数量 */}
            {status.runningCommands > 0 && (
                <div className="flex items-center space-x-1 text-yellow-400">
                    <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm">运行中: {status.runningCommands}</span>
                </div>
            )}

            {/* 最后更新时间 */}
            <div className="text-xs text-gray-500">
                更新: {status.lastUpdate.toLocaleTimeString()}
            </div>

            {/* 刷新按钮 */}
            <button
                onClick={loadStatus}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="手动刷新状态"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>
    );
} 