"use client";

import React, { useState, useEffect, useRef } from 'react';

interface TerminalOutput {
  id: string;
  type: 'command' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

interface ContainerStatus {
  isRunning: boolean;
  container: any;
  dockerAvailable: boolean;
}

interface CommonCommand {
  name: string;
  command: string;
  description: string;
}

export default function Terminal() {
  const [output, setOutput] = useState<TerminalOutput[]>([]);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [containerStatus, setContainerStatus] = useState<ContainerStatus>({
    isRunning: false,
    container: null,
    dockerAvailable: false
  });
  const [commonCommands, setCommonCommands] = useState<CommonCommand[]>([]);
  const [projectType, setProjectType] = useState<'nextjs' | 'react'>('nextjs');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkContainerStatus();
    loadCommonCommands();
  }, []);

  useEffect(() => {
    // 自动滚动到底部
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = (type: TerminalOutput['type'], content: string) => {
    const newOutput: TerminalOutput = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: new Date()
    };
    setOutput(prev => [...prev, newOutput]);
  };

  const checkContainerStatus = async () => {
    try {
      const response = await fetch('/api/sandbox/container');
      const data = await response.json();
      
      if (data.success) {
        setContainerStatus({
          isRunning: data.isRunning,
          container: data.container,
          dockerAvailable: data.dockerAvailable
        });
      }
    } catch (error) {
      console.error('检查容器状态失败:', error);
    }
  };

  const loadCommonCommands = async () => {
    try {
      const response = await fetch('/api/sandbox/exec');
      const data = await response.json();
      
      if (data.success) {
        setCommonCommands(data.commands);
      }
    } catch (error) {
      console.error('加载常用命令失败:', error);
    }
  };

  const createContainer = async () => {
    setIsLoading(true);
    addOutput('system', '正在创建容器...');
    
    try {
      const response = await fetch('/api/sandbox/container', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addOutput('system', `容器创建成功: ${data.containerId}`);
        await checkContainerStatus();
      } else {
        addOutput('error', `容器创建失败: ${data.error}`);
      }
    } catch (error) {
      addOutput('error', `容器创建失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopContainer = async () => {
    setIsLoading(true);
    addOutput('system', '正在停止容器...');
    
    try {
      const response = await fetch('/api/sandbox/container', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addOutput('system', '容器已停止');
        await checkContainerStatus();
      } else {
        addOutput('error', `停止容器失败: ${data.error}`);
      }
    } catch (error) {
      addOutput('error', `停止容器失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeProject = async () => {
    setIsLoading(true);
    addOutput('system', `正在初始化 ${projectType === 'nextjs' ? 'Next.js' : 'React'} 项目...`);
    
    try {
      const response = await fetch('/api/sandbox/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: projectType })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addOutput('system', data.message);
      } else {
        addOutput('error', `项目初始化失败: ${data.error}`);
      }
    } catch (error) {
      addOutput('error', `项目初始化失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async (cmd?: string) => {
    const commandToRun = cmd || command;
    if (!commandToRun.trim()) return;

    addOutput('command', `$ ${commandToRun}`);
    setCommand('');
    setIsLoading(true);

    try {
      // 对于长时间运行的命令使用流式输出
      const isLongRunning = ['npm install', 'npm run dev', 'npm run build'].some(c => 
        commandToRun.includes(c)
      );

      if (isLongRunning) {
        // 流式输出
        const response = await fetch('/api/sandbox/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: commandToRun, stream: true })
        });

        if (!response.body) {
          throw new Error('无法获取响应流');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'stdout' || data.type === 'stderr') {
                  addOutput(data.type === 'stderr' ? 'error' : 'output', data.data);
                } else if (data.type === 'exit') {
                  addOutput('system', `命令执行完成，退出码: ${data.code}`);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } else {
        // 一次性执行
        const response = await fetch('/api/sandbox/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: commandToRun, stream: false })
        });

        const data = await response.json();

        if (data.success) {
          if (data.stdout) addOutput('output', data.stdout);
          if (data.stderr) addOutput('error', data.stderr);
        } else {
          addOutput('error', data.error);
        }
      }
    } catch (error) {
      addOutput('error', `命令执行失败: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTerminal = () => {
    setOutput([]);
  };

  const getOutputClass = (type: TerminalOutput['type']) => {
    switch (type) {
      case 'command':
        return 'text-blue-400 font-medium';
      case 'error':
        return 'text-red-400';
      case 'system':
        return 'text-green-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">🐚 终端</h3>
          
          {/* 容器状态指示器 */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              containerStatus.dockerAvailable
                ? containerStatus.isRunning ? 'bg-green-500' : 'bg-yellow-500'
                : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-400">
              {containerStatus.dockerAvailable
                ? containerStatus.isRunning ? '容器运行中' : '容器未运行'
                : 'Docker 不可用'
              }
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* 项目类型选择 */}
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as 'nextjs' | 'react')}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
            disabled={isLoading}
          >
            <option value="nextjs">Next.js</option>
            <option value="react">React</option>
          </select>
          
          <button
            onClick={clearTerminal}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            清空
          </button>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap gap-2 mb-4">
          {!containerStatus.isRunning ? (
            <button
              onClick={createContainer}
              disabled={!containerStatus.dockerAvailable || isLoading}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
            >
              🚀 创建容器
            </button>
          ) : (
            <button
              onClick={stopContainer}
              disabled={isLoading}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded text-sm"
            >
              ⏹️ 停止容器
            </button>
          )}
          
          <button
            onClick={initializeProject}
            disabled={isLoading}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm"
          >
            📝 初始化项目
          </button>
        </div>

        {/* 常用命令 */}
        {commonCommands.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">常用命令:</div>
            <div className="flex flex-wrap gap-2">
              {commonCommands.map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => executeCommand(cmd.command)}
                  disabled={!containerStatus.isRunning || isLoading}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded text-xs"
                  title={cmd.description}
                >
                  {cmd.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 终端输出 */}
      <div
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm"
        style={{ minHeight: '300px' }}
      >
        {output.length === 0 ? (
          <div className="text-gray-500">
            🎯 欢迎使用沙箱终端！
            <br />
            💡 提示：先创建容器，然后初始化项目
          </div>
        ) : (
          output.map((item) => (
            <div key={item.id} className={`mb-1 ${getOutputClass(item.type)}`}>
              <span className="text-gray-500 text-xs mr-2">
                {item.timestamp.toLocaleTimeString()}
              </span>
              <span className="whitespace-pre-wrap">{item.content}</span>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-yellow-400">
            <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
            <span>执行中...</span>
          </div>
        )}
      </div>

      {/* 命令输入 */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
            placeholder={
              containerStatus.isRunning 
                ? "输入命令..." 
                : "请先创建并启动容器"
            }
            disabled={!containerStatus.isRunning || isLoading}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
          />
          <button
            onClick={() => executeCommand()}
            disabled={!containerStatus.isRunning || isLoading || !command.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
          >
            执行
          </button>
        </div>
      </div>
    </div>
  );
} 