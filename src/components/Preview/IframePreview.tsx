'use client';

import React, { useState, useEffect, useRef } from 'react';

interface IframePreviewProps {
    projectId: string;
    className?: string;
    onLoad?: () => void;
    onError?: (error: string) => void;
}

export default function IframePreview({
    projectId,
    className = '',
    onLoad,
    onError
}: IframePreviewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // 获取用户的预览URL
    useEffect(() => {
        const fetchPreviewUrl = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // 确保用户容器存在并运行
                const response = await fetch('/api/iframe/container', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'create',
                        projectId
                    })
                });

                const data = await response.json();

                if (data.success) {
                    setPreviewUrl(data.iframeUrl);
                } else {
                    throw new Error(data.error || '获取预览URL失败');
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : '未知错误';
                setError(errorMessage);
                onError?.(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        if (projectId) {
            fetchPreviewUrl();
        }
    }, [projectId, onError]);

    // iframe 加载完成处理
    const handleIframeLoad = () => {
        setIsLoading(false);
        onLoad?.();

        // 尝试与iframe通信
        try {
            const iframe = iframeRef.current;
            if (iframe?.contentWindow) {
                // 发送消息到iframe（如果需要）
                iframe.contentWindow.postMessage({
                    type: 'PARENT_READY',
                    projectId
                }, '*');
            }
        } catch (error) {
            console.warn('iframe通信失败:', error);
        }
    };

    // iframe 错误处理
    const handleIframeError = () => {
        const errorMessage = '预览加载失败';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
    };

    // 刷新预览
    const refreshPreview = () => {
        if (iframeRef.current && previewUrl) {
            setIsLoading(true);
            setError(null);
            iframeRef.current.src = previewUrl + '?t=' + Date.now();
        }
    };

    // 监听来自iframe的消息
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // 只接受来自同源的消息
            if (event.origin !== window.location.origin) {
                return;
            }

            const { type, data } = event.data;

            switch (type) {
                case 'IFRAME_READY':
                    console.log('iframe已准备就绪');
                    setIsLoading(false);
                    break;

                case 'IFRAME_ERROR':
                    console.error('iframe错误:', data);
                    setError(data.message || '预览发生错误');
                    break;

                case 'IFRAME_NAVIGATION':
                    console.log('iframe导航:', data.url);
                    break;

                default:
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <div className={`relative w-full h-full bg-gray-50 ${className}`}>
            {/* 加载状态 */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">正在加载预览...</p>
                    </div>
                </div>
            )}

            {/* 错误状态 */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center max-w-md p-6">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">预览加载失败</h3>
                        <p className="text-sm text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={refreshPreview}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            重新加载
                        </button>
                    </div>
                </div>
            )}

            {/* iframe预览 */}
            {previewUrl && !error && (
                <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="预览"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                    style={{
                        minHeight: '400px',
                        backgroundColor: 'white'
                    }}
                />
            )}

            {/* 刷新按钮 */}
            {previewUrl && !isLoading && (
                <button
                    onClick={refreshPreview}
                    className="absolute top-2 right-2 p-2 bg-white shadow-md rounded-md hover:bg-gray-50 transition-colors z-20"
                    title="刷新预览"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            )}
        </div>
    );
}

// 预览状态指示器组件
export function PreviewStatus({
    status
}: {
    status: 'loading' | 'ready' | 'error' | 'building'
}) {
    const statusConfig = {
        loading: { color: 'text-blue-500', icon: '⏳', text: '加载中' },
        ready: { color: 'text-green-500', icon: '✅', text: '就绪' },
        error: { color: 'text-red-500', icon: '❌', text: '错误' },
        building: { color: 'text-yellow-500', icon: '🔨', text: '构建中' }
    };

    const config = statusConfig[status];

    return (
        <div className={`flex items-center space-x-1 text-xs ${config.color}`}>
            <span>{config.icon}</span>
            <span>{config.text}</span>
        </div>
    );
}

// 使用示例组件
export function PreviewPanel({ projectId }: { projectId: string }) {
    const [previewStatus, setPreviewStatus] = useState<'loading' | 'ready' | 'error' | 'building'>('loading');

    return (
        <div className="h-full flex flex-col">
            {/* 预览头部 */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">实时预览</span>
                    <PreviewStatus status={previewStatus} />
                </div>
                <div className="text-xs text-gray-500">
                    项目: {projectId}
                </div>
            </div>

            {/* 预览内容 */}
            <div className="flex-1">
                <IframePreview
                    projectId={projectId}
                    className="h-full"
                    onLoad={() => setPreviewStatus('ready')}
                    onError={() => setPreviewStatus('error')}
                />
            </div>
        </div>
    );
} 