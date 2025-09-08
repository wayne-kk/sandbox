'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface PreviewData {
  files: { [path: string]: string };
  status: string;
}

// 组件预览组件
function ComponentPreview({ files, projectId, sandboxUrl, componentPath }: { files: { [path: string]: string }; projectId: string; sandboxUrl: string; componentPath: string }) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // 获取所有TSX组件文件
  const componentFiles = Object.entries(files).filter(([path, content]) =>
    path.endsWith('.tsx') &&
    !path.includes('layout') &&
    !path.includes('page') &&
    content.includes('export')
  );

  // 提取组件名称
  const extractComponentName = (content: string): string => {
    // 查找 export default 或 export const 的组件
    const defaultMatch = content.match(/export\s+default\s+(\w+)/);
    if (defaultMatch) return defaultMatch[1];

    const constMatch = content.match(/export\s+const\s+(\w+)/);
    if (constMatch) return constMatch[1];

    const functionMatch = content.match(/export\s+function\s+(\w+)/);
    if (functionMatch) return functionMatch[1];

    // 如果找不到，返回第一个大写的标识符
    const componentMatch = content.match(/(\w+):\s*React\.FC|function\s+(\w+)|const\s+(\w+)\s*=/);
    if (componentMatch) return componentMatch[1] || componentMatch[2] || componentMatch[3];

    return 'UnknownComponent';
  };

  useEffect(() => {
    if (componentFiles.length > 0 && !selectedComponent) {
      setSelectedComponent(componentFiles[0][0]);
    }
  }, [componentFiles]);

  if (componentFiles.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到组件文件</h3>
        <p className="text-gray-600">生成的文件中没有找到可预览的React组件</p>
      </div>
    );
  }

  const currentComponent = selectedComponent ? files[selectedComponent] : '';
  const componentName = selectedComponent ? extractComponentName(currentComponent) : '';

  return (
    <div className="space-y-4">
      {/* 组件选择器 */}
      <div className="flex flex-wrap gap-2">
        {componentFiles.map(([filePath]) => (
          <button
            key={filePath}
            onClick={() => setSelectedComponent(filePath)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedComponent === filePath
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {filePath.split('/').pop()?.replace('.tsx', '')}
          </button>
        ))}
      </div>

      {/* Sandbox 预览 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Sandbox 实时预览</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">
                {sandboxUrl.replace('http://', '')}
                {componentPath && <span className="text-blue-600 ml-1">({componentPath})</span>}
              </span>
            </div>
          </div>
        </div>
        <div className="relative">
          <iframe
            src={sandboxUrl}
            className="w-full h-96"
            title="Sandbox 组件预览"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            style={{ border: 'none' }}
            onError={() => {
              console.log('iframe加载失败，可能是服务器还未完全启动');
            }}
          />
          {/* 加载提示 */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">正在加载 Sandbox 预览...</p>
              <p className="text-xs text-gray-500 mt-1">如果长时间无法加载，请检查服务器是否启动</p>
            </div>
          </div>
        </div>
      </div>

      {/* 组件信息 */}
      {selectedComponent && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">组件信息</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">文件路径:</span>
              <span className="ml-2 font-mono text-gray-800">{selectedComponent}</span>
            </div>
            <div>
              <span className="text-gray-600">组件名称:</span>
              <span className="ml-2 text-gray-800">{componentName}</span>
            </div>
            <div>
              <span className="text-gray-600">文件大小:</span>
              <span className="ml-2 text-gray-800">{currentComponent.length} 字符</span>
            </div>
            <div>
              <span className="text-gray-600">状态:</span>
              <span className="ml-2 text-green-600">已渲染</span>
            </div>
          </div>
        </div>
      )}

      {/* 快速操作 */}
      <div className="flex gap-3">
        <button
          onClick={() => window.open(sandboxUrl, '_blank')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          🚀 在新窗口打开
        </button>
        <button
          onClick={() => {
            if (selectedComponent) {
              const code = files[selectedComponent];
              navigator.clipboard.writeText(code);
              alert('代码已复制到剪贴板');
            }
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          📋 复制代码
        </button>
      </div>

      {/* 预览说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-xl">💡</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">预览说明</h4>
            <p className="text-sm text-blue-800">
              生成的组件已自动写入 sandbox/app/page.tsx，这里显示的是 sandbox 项目的实时预览。
              组件支持完整的交互、动画和状态管理功能。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sandboxUrl, setSandboxUrl] = useState<string>('');
  const [componentPath, setComponentPath] = useState<string>('');

  useEffect(() => {
    const loadPreviewData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 直接获取sandbox文件
        const filesResponse = await fetch(`/api/preview/${projectId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const filesData = await filesResponse.json();
        if (filesData.success) {
          setPreviewData({
            files: filesData.data.files || {},
            status: 'running'
          });

          // 提取组件路径信息（仅单个组件生成时）
          if (filesData.data.componentInfo?.previewUrl) {
            setComponentPath(filesData.data.componentInfo.previewUrl);
            console.log('单个组件生成，组件路径:', filesData.data.componentInfo.previewUrl);
          } else {
            console.log('项目生成，使用根路径');
          }
        } else {
          throw new Error(filesData.error || '无法获取预览文件');
        }
      } catch (err) {
        console.error('预览加载失败:', err);
        setError(err instanceof Error ? err.message : '预览加载失败');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadPreviewData();
    }
  }, [projectId]);

  // 检测sandbox服务器端口并构建完整URL
  useEffect(() => {
    const checkSandboxStatus = async () => {
      try {
        const response = await fetch('/api/sandbox/start');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 构建完整的组件URL
            const fullUrl = componentPath ? `${data.url}${componentPath}` : data.url;
            setSandboxUrl(fullUrl);
            console.log('✅ Sandbox URL已设置:', fullUrl);
          } else {
            console.error('❌ Sandbox状态检查失败:', data.error);
          }
        } else {
          console.error('❌ Sandbox API调用失败:', response.status);
        }
      } catch (error) {
        console.error('❌ 无法检测sandbox状态:', error);
        // 如果API调用失败，使用Nginx代理地址作为fallback
        const fallbackUrl = componentPath ? `/sandbox${componentPath}` : '/sandbox';
        setSandboxUrl(fallbackUrl);
        console.log('🔄 使用Nginx代理fallback URL:', fallbackUrl);
      }
    };

    checkSandboxStatus();
  }, [componentPath]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">加载预览中...</h2>
          <p className="text-gray-500">正在准备组件预览</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">预览加载失败</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">无预览数据</h2>
          <p className="text-gray-500">项目ID: {projectId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 预览头部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">组件预览</h1>
            <p className="text-sm text-gray-500">项目ID: {projectId}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${previewData.status === 'running' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            <span className="text-sm text-gray-600">
              {previewData.status === 'running' ? '运行中' : '准备中'}
            </span>
          </div>
        </div>
      </div>

      {/* 预览内容 */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* 组件预览 */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">组件预览</h2>
              <p className="text-sm text-gray-500">生成的React组件实际渲染效果</p>
            </div>
            <div className="p-6">
              <ComponentPreview files={previewData.files} projectId={projectId} sandboxUrl={sandboxUrl} componentPath={componentPath} />
            </div>
          </div>

          {/* 文件列表 */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">生成的文件</h2>
              <p className="text-sm text-gray-500">共 {Object.keys(previewData.files).length} 个文件</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(previewData.files).map(([filePath, content]) => (
                  <div key={filePath} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm truncate">{filePath}</h3>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {content.length} 字符
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      {filePath.split('.').pop()?.toUpperCase()} 文件
                    </div>
                    <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {content.substring(0, 200)}
                        {content.length > 200 && '...'}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 预览说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">预览说明</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 这里显示的是生成的组件文件内容</li>
                  <li>• 文件已成功写入到 sandbox 目录</li>
                  <li>• 可以在 sandbox 项目中查看完整的组件效果</li>
                  <li>• 支持实时预览和热重载</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
