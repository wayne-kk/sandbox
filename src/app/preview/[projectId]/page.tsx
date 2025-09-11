'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface PreviewData {
  files: { [path: string]: string };
  status: string;
}

interface RouteInfo {
  path: string;
  name: string;
  component: string;
  isPage: boolean;
  hasLayout: boolean;
  filePath: string;
}

interface RoutesData {
  routes: RouteInfo[];
  total: number;
  baseUrl: string;
}

// 组件预览组件
function ComponentPreview({ 
  files, 
  projectId, 
  sandboxUrl, 
  componentPath, 
  routes, 
  selectedRoute, 
  onRouteChange,
  onDeleteRoute
}: { 
  files: { [path: string]: string }; 
  projectId: string; 
  sandboxUrl: string; 
  componentPath: string;
  routes: RouteInfo[];
  selectedRoute: RouteInfo | null;
  onRouteChange: (route: RouteInfo) => void;
  onDeleteRoute: (route: RouteInfo) => void;
}) {
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
    <div className="flex-1 flex flex-col">
      {/* 路由选择器 */}
      {routes.length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">📄</span>
              </div>
              <span className="text-sm font-medium text-gray-700">选择页面</span>
            </div>
            <select
              value={selectedRoute?.path || ''}
              onChange={(e) => {
                const route = routes.find(r => r.path === e.target.value);
                if (route) onRouteChange(route);
              }}
              className="flex-1 max-w-xs px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-300 transition-colors"
            >
              {routes.map((route) => (
                <option key={route.path} value={route.path}>
                  {route.name === 'home' ? '首页' : route.name} ({route.path})
                </option>
              ))}
            </select>
            
            {/* 删除按钮 */}
            {selectedRoute && selectedRoute.path !== '/' && (
              <button
                onClick={() => onDeleteRoute(selectedRoute)}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-red-200 hover:border-red-300"
                title={`删除路由: ${selectedRoute.name}`}
              >
                <span className="text-xs">🗑️</span>
                <span>删除</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sandbox 预览 - 全屏 */}
      <div className="flex-1 relative bg-white rounded-t-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-gray-100 to-gray-200 flex items-center px-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-gray-500 font-medium">
              {selectedRoute ? `${selectedRoute.name === 'home' ? '首页' : selectedRoute.name} 预览` : '实时预览'}
            </span>
          </div>
        </div>
        <iframe
          src={selectedRoute ? `${sandboxUrl}${selectedRoute.path}` : sandboxUrl}
          className="w-full h-full border-0 pt-8"
          title={`Sandbox 预览 - ${selectedRoute?.name || '首页'}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          key={`${sandboxUrl}-${selectedRoute?.path || 'home'}`}
          onError={() => {
            console.log('iframe加载失败，可能是服务器还未完全启动');
          }}
        />
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
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);

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
            // 构建完整的组件URL，避免双斜杠
            let fullUrl = data.url;
            if (componentPath) {
              const cleanComponentPath = componentPath.startsWith('/') 
                ? componentPath.substring(1) 
                : componentPath;
              const cleanBaseUrl = data.url.endsWith('/') ? data.url.slice(0, -1) : data.url;
              fullUrl = `${cleanBaseUrl}/${cleanComponentPath}`;
            }
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

  // 获取路由信息
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        setRoutesLoading(true);
        const response = await fetch('/api/sandbox/routes');
        const data = await response.json();
        
        if (data.success) {
          setRoutes(data.data.routes);
          // 默认选择第一个路由（通常是首页）
          if (data.data.routes.length > 0) {
            setSelectedRoute(data.data.routes[0]);
          }
          console.log('✅ 路由信息加载成功:', data.data.routes);
        } else {
          console.error('❌ 路由信息加载失败:', data.error);
        }
      } catch (error) {
        console.error('❌ 无法获取路由信息:', error);
      } finally {
        setRoutesLoading(false);
      }
    };

    loadRoutes();
  }, []);

  // 处理路由切换
  const handleRouteChange = (route: RouteInfo) => {
    setSelectedRoute(route);
    console.log('🔄 切换到路由:', route.path);
  };

  // 处理删除路由
  const handleDeleteRoute = async (route: RouteInfo) => {
    if (!route || route.path === '/') {
      alert('不能删除首页路由');
      return;
    }

    const confirmMessage = `确定要删除路由 "${route.name}" (${route.path}) 吗？\n\n这将删除整个路由文件夹及其所有文件。`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      // 从 filePath 中提取目录路径
      // 支持嵌套路由：
      // "TechHero/page.tsx" -> "app/TechHero"
      // "xxx/yyy/page.tsx" -> "app/xxx/yyy"
      const pathParts = route.filePath.split('/');
      const directoryName = pathParts.slice(0, -1).join('/'); // 移除最后的 "page.tsx"
      const directoryPath = `app/${directoryName}`;
      
      const response = await fetch(`/api/sandbox/files?path=${encodeURIComponent(directoryPath)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // 删除成功，重新加载路由列表
        const routesResponse = await fetch('/api/sandbox/routes');
        const routesData = await routesResponse.json();
        
        if (routesData.success) {
          setRoutes(routesData.data.routes);
          
          // 如果删除的是当前选中的路由，切换到首页
          if (selectedRoute?.path === route.path) {
            const homeRoute = routesData.data.routes.find((r: RouteInfo) => r.path === '/');
            if (homeRoute) {
              setSelectedRoute(homeRoute);
            }
          }
        }
        
        alert(`路由 "${route.name}" 删除成功！`);
        console.log('✅ 路由删除成功:', route.path);
      } else {
        throw new Error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('❌ 删除路由失败:', error);
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">加载预览中...</h2>
          <p className="text-gray-600">正在准备组件预览</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">预览加载失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 预览头部 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">👁️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">组件预览</h1>
                <p className="text-sm text-gray-500">实时预览 sandbox 项目</p>
              </div>
            </div>
            {selectedRoute && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">
                  {selectedRoute.name === 'home' ? '首页' : selectedRoute.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <span className="text-sm text-gray-600">
                {routesLoading ? '加载中...' : `${routes.length} 个页面`}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
              <div className={`w-2 h-2 rounded-full ${previewData.status === 'running' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm font-medium text-green-700">
                {previewData.status === 'running' ? '运行中' : '准备中'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 预览内容 - 全屏布局 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ComponentPreview 
          files={previewData.files} 
          projectId={projectId} 
          sandboxUrl={sandboxUrl} 
          componentPath={componentPath}
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteChange={handleRouteChange}
          onDeleteRoute={handleDeleteRoute}
        />
      </div>
    </div>
  );
}
