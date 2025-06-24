'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
    id: string;
    type: 'user' | 'ai' | 'system';
    content: string;
    timestamp: Date;
    files?: Array<{ path: string; size: number }>;
}

interface ChatInterfaceProps {
    onCodeGenerated?: (files: Array<{ path: string; size: number }>) => void;
}

export default function ChatInterface({ onCodeGenerated }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            content: '👋 你好！我是你的AI编程助手。告诉我你想要创建什么，我会帮你生成代码并在沙箱中运行。\n\n例如：\n• "创建一个现代化的落地页"\n• "制作一个Todo应用"\n• "设计一个数据仪表板"',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isGenerating) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsGenerating(true);

        try {
            // 添加生成中的消息
            const loadingMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'system',
                content: '🤖 AI正在生成代码，请稍候...',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, loadingMessage]);

            // 调用AI生成API
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: input,
                    projectType: 'nextjs'
                })
            });

            const data = await response.json();

            // 移除加载消息
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

            if (data.success) {
                const successMessage: Message = {
                    id: (Date.now() + 2).toString(),
                    type: 'ai',
                    content: `${data.message}\n\n📁 生成了 ${data.filesGenerated} 个文件：\n${data.files.map((f: any) => `• ${f.path} (${f.size} 字符)`).join('\n')}\n\n💡 代码已写入Docker容器，Next.js会自动重载。你可以在右侧预览区域查看结果！`,
                    timestamp: new Date(),
                    files: data.files
                };

                setMessages(prev => [...prev, successMessage]);
                onCodeGenerated?.(data.files);
            } else {
                const errorMessage: Message = {
                    id: (Date.now() + 2).toString(),
                    type: 'ai',
                    content: `❌ 代码生成失败: ${data.error}\n\n请检查：\n• Docker容器是否正在运行\n• 网络连接是否正常\n• 输入的需求是否清晰`,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            setMessages(prev => prev.filter(msg => msg.type !== 'system'));
            
            const errorMessage: Message = {
                id: (Date.now() + 3).toString(),
                type: 'ai',
                content: `❌ 请求失败: ${error instanceof Error ? error.message : '未知错误'}`,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const quickPrompts = [
        '创建一个现代化的落地页',
        '制作一个Todo应用',
        '设计一个数据仪表板',
        '构建一个博客页面',
        '创建一个登录页面'
    ];

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">AI编程助手</h3>
                        <p className="text-xs text-gray-500">描述你的需求，我来生成代码</p>
                    </div>
                </div>
                <div className="text-xs text-gray-400">
                    {isGenerating ? '🤖 生成中...' : '✨ 准备就绪'}
                </div>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                                message.type === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : message.type === 'ai'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                            <div className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 快捷提示 */}
            {messages.length <= 1 && (
                <div className="px-4 pb-2">
                    <div className="text-xs text-gray-500 mb-2">💡 快速开始：</div>
                    <div className="flex flex-wrap gap-2">
                        {quickPrompts.map((prompt, index) => (
                            <button
                                key={index}
                                onClick={() => setInput(prompt)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 输入区域 */}
            <div className="p-4 border-t bg-gray-50">
                <div className="flex space-x-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="描述你想要创建的功能或页面..."
                        className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        disabled={isGenerating}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isGenerating}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        {isGenerating ? '⏳' : '🚀'}
                    </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    按 Enter 发送，Shift + Enter 换行
                </div>
            </div>
        </div>
    );
} 