import { useEffect, useState, useRef, useCallback } from 'react';

export interface ProjectStatusUpdate {
    type: 'status-change' | 'logs-update' | 'url-change' | 'error' | 'ping';
    projectId: string;
    data: {
        status?: 'stopped' | 'starting' | 'running' | 'error';
        logs?: string[];
        url?: string;
        error?: string;
        message?: string;
    };
    timestamp: number;
}

export interface ProjectWebSocketState {
    status: 'stopped' | 'starting' | 'running' | 'error';
    logs: string[];
    url: string;
    error?: string;
    isConnected: boolean;
    isConnecting: boolean;
}

/**
 * 使用EventSource(SSE)实现的WebSocket功能
 * 由于Next.js在Edge Runtime中不直接支持WebSocket，所以使用SSE作为替代方案
 */
export function useProjectWebSocket(projectId: string) {
    const [state, setState] = useState<ProjectWebSocketState>({
        status: 'stopped',
        logs: [],
        url: '',
        isConnected: false,
        isConnecting: false
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectCountRef = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3秒

    const addLog = useCallback((message: string) => {
        setState(prev => ({
            ...prev,
            logs: [...prev.logs.slice(-49), message] // 保持最近50条日志
        }));
    }, []);

    const connect = useCallback(() => {
        if (eventSourceRef.current || state.isConnecting) {
            return;
        }

        setState(prev => ({ ...prev, isConnecting: true }));
        console.log(`🔌 连接SSE: ${projectId}`);

        try {
            const eventSource = new EventSource(`/api/ws/project/${projectId}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log(`✅ SSE连接成功: ${projectId}`);
                setState(prev => ({
                    ...prev,
                    isConnected: true,
                    isConnecting: false,
                    error: undefined
                }));
                reconnectCountRef.current = 0;
                addLog('🔗 已连接到实时状态更新');
            };

            eventSource.onmessage = (event) => {
                try {
                    const update: ProjectStatusUpdate = JSON.parse(event.data);

                    // 忽略心跳消息
                    if (update.type === 'ping') {
                        return;
                    }

                    console.log(`📨 收到SSE消息:`, update);

                    setState(prev => {
                        const newState = { ...prev };

                        switch (update.type) {
                            case 'status-change':
                                if (update.data.status) {
                                    newState.status = update.data.status;
                                    addLog(`📡 状态更新: ${update.data.status}`);
                                }
                                if (update.data.url) {
                                    newState.url = update.data.url;
                                }
                                break;

                            case 'logs-update':
                                if (update.data.logs) {
                                    newState.logs = update.data.logs;
                                }
                                break;

                            case 'url-change':
                                if (update.data.url) {
                                    newState.url = update.data.url;
                                    addLog(`🌐 预览地址更新: ${update.data.url}`);
                                }
                                break;

                            case 'error':
                                if (update.data.error) {
                                    newState.error = update.data.error;
                                    newState.status = 'error';
                                    addLog(`❌ 错误: ${update.data.error}`);
                                }
                                break;
                        }

                        return newState;
                    });
                } catch (error) {
                    console.error('解析SSE消息失败:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error(`❌ SSE连接错误: ${projectId}`, error);

                setState(prev => ({
                    ...prev,
                    isConnected: false,
                    isConnecting: false,
                    error: 'SSE连接失败'
                }));

                eventSource.close();
                eventSourceRef.current = null;

                // 自动重连
                if (reconnectCountRef.current < maxReconnectAttempts) {
                    reconnectCountRef.current++;
                    console.log(`🔄 准备重连 (${reconnectCountRef.current}/${maxReconnectAttempts})...`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        addLog(`🔄 正在重连... (${reconnectCountRef.current}/${maxReconnectAttempts})`);
                        connect();
                    }, reconnectDelay * reconnectCountRef.current);
                } else {
                    addLog('❌ SSE连接失败，已达到最大重试次数');
                }
            };

        } catch (error) {
            console.error('创建SSE连接失败:', error);
            setState(prev => ({
                ...prev,
                isConnected: false,
                isConnecting: false,
                error: '创建SSE连接失败'
            }));
        }
    }, [projectId, state.isConnecting, addLog]);

    const disconnect = useCallback(() => {
        console.log(`🔌 断开SSE: ${projectId}`);

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        setState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false
        }));
    }, [projectId]);

    const reconnect = useCallback(() => {
        disconnect();
        reconnectCountRef.current = 0;
        setTimeout(() => connect(), 1000);
    }, [disconnect, connect]);

    // 自动连接
    useEffect(() => {
        connect();
        return disconnect;
    }, [projectId]); // 只在projectId变化时重连

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return {
        ...state,
        reconnect,
        disconnect,
        addLog
    };
} 