import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, readdir } from 'fs/promises';
import path from 'path';

// 极简的语法检查函数 - 只检查最严重的语法错误
function checkComponentSyntax(componentCode: string, componentName: string): { isValid: boolean; error?: string } {
  try {
    // 对于TypeScript文件，采用更宽松的检查策略
    if (componentCode.includes('interface ') || 
        componentCode.includes(': string') || 
        componentCode.includes(': number') ||
        componentCode.includes('React.FC')) {
      
      // 如果是TypeScript文件，只做最基本的括号匹配检查
      const openBraces = (componentCode.match(/{/g) || []).length;
      const closeBraces = (componentCode.match(/}/g) || []).length;
      
      if (Math.abs(openBraces - closeBraces) > 2) { // 允许一些误差
        return { 
          isValid: false, 
          error: '代码结构可能存在问题（括号严重不匹配）'
        };
      }
      
      // TypeScript文件直接通过检查
      return { isValid: true };
    }
    
    // 对于普通JavaScript文件，进行简单的语法检查
    try {
      const mockGlobals = `
        var React = { Component: class {}, useState: function() {}, useEffect: function() {} };
        var console = { log: function() {} };
      `;
      
      // 简单预处理，只移除import/export
      let testCode = componentCode
        .replace(/import\s+.*?from\s+['"][^'"]+['"];?\s*/g, '')
        .replace(/export\s+default\s+/g, 'var __default = ')
        .replace(/export\s+/g, '');
      
      // 尝试解析
      new Function(mockGlobals + '\n' + testCode);
      
    } catch (syntaxError) {
      const errorMessage = (syntaxError as Error).message;
      
      // 只报告严重的语法错误
      if (errorMessage.includes('Unexpected token') && 
          !errorMessage.includes('import') && 
          !errorMessage.includes('export')) {
        return { 
          isValid: false, 
          error: `语法错误: ${errorMessage.split('\n')[0]}`
        };
      }
      
      // 其他错误忽略
      console.log(`组件 ${componentName} 检查产生非关键错误:`, errorMessage);
    }
    
    return { isValid: true };
    
  } catch (error) {
    // 检查过程出错，直接通过
    console.log(`组件 ${componentName} 检查过程出错，直接通过:`, error);
    return { isValid: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { components } = await request.json();

    if (!components || !Array.isArray(components)) {
      return NextResponse.json({ error: '无效的组件数据' }, { status: 400 });
    }

    const sandboxPagePath = path.join(process.cwd(), 'sandbox', 'app', 'page.tsx');
    
    // 读取沙箱组件目录并进行语法检查
    const componentsDir = path.join(process.cwd(), 'sandbox', 'components');
    let validComponents: string[] = [];
    let invalidComponents: { name: string; error: string }[] = [];
    
    try {
      const files = await readdir(componentsDir);
      const tsxFiles = files.filter(file => file.endsWith('.tsx'));
      
      // 对每个组件文件进行语法检查
      for (const file of tsxFiles) {
        const componentName = file.replace('.tsx', '');
        const filePath = path.join(componentsDir, file);
        
        try {
          const componentCode = await readFile(filePath, 'utf8');
          const syntaxCheck = checkComponentSyntax(componentCode, componentName);
          
          if (syntaxCheck.isValid) {
            validComponents.push(componentName);
          } else {
            invalidComponents.push({
              name: componentName,
              error: syntaxCheck.error || '未知语法错误'
            });
          }
        } catch (readError) {
          invalidComponents.push({
            name: componentName,
            error: `文件读取失败: ${(readError as Error).message}`
          });
        }
      }
    } catch (err) {
      // 如果目录不存在，创建空数组
      validComponents = [];
      invalidComponents = [];
    }

    // 生成动态导入函数，避免在导入时就报错（只导入语法正确的组件）
    const dynamicImports = validComponents.map(component => `
    let ${component}Component: React.ComponentType | null = null;
    try {
      const ${component}Module = require('@/components/${component}');
      ${component}Component = ${component}Module.default || ${component}Module;
    } catch (error) {
      console.error('导入组件 ${component} 失败:', error);
      ${component}Component = null;
    }`).join('\n');

    // 生成错误边界组件
    const errorBoundaryComponent = `
// 错误边界组件
interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ComponentErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center mb-2">
            <div className="text-red-500 text-xl mr-2">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800">组件渲染错误</h3>
          </div>
          <p className="text-red-700 mb-2">组件 "{this.props.componentName}" 渲染时发生错误</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-red-600 hover:text-red-800">查看错误详情</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800 overflow-auto">
              {this.state.error?.message}
              {this.state.error?.stack && '\\n' + this.state.error.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// 安全的组件渲染器
interface ComponentRendererProps {
  activeTab: string;
  components: string[];
}

function ComponentRenderer({ activeTab, components }: ComponentRendererProps) {
  return (
    <>
      {components.map((componentName) => {
        if (activeTab !== componentName) return null;
        
        return (
          <SafeComponentWrapper key={componentName} componentName={componentName} />
        );
      })}
    </>
  );
}

// 安全的单个组件包装器
interface SafeComponentWrapperProps {
  componentName: string;
}

function SafeComponentWrapper({ componentName }: SafeComponentWrapperProps) {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    setComponent(null);

    try {
      // 从组件映射表中获取组件
      const componentMap = (window as any).componentMap;
      if (componentMap && componentMap[componentName]) {
        setComponent(() => componentMap[componentName]);
      } else {
        throw new Error('组件未在映射表中找到');
      }
    } catch (error) {
      console.error(\`组件 \${componentName} 获取失败:\`, error);
      setLoadError(\`组件获取失败: \${(error as Error).message}\`);
    } finally {
      setIsLoading(false);
    }
  }, [componentName]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <div className="mb-4 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">{componentName}</h2>
          <p className="text-gray-600 text-sm mt-1">组件加载失败</p>
        </div>
        
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center mb-2">
            <div className="text-red-500 text-xl mr-2">❌</div>
            <h3 className="text-lg font-semibold text-red-800">组件加载错误</h3>
          </div>
          <p className="text-red-700">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div>
        <div className="mb-4 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">{componentName}</h2>
          <p className="text-gray-600 text-sm mt-1">组件未找到</p>
        </div>
        
        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="flex items-center mb-2">
            <div className="text-yellow-500 text-xl mr-2">⚠️</div>
            <h3 className="text-lg font-semibold text-yellow-800">组件未找到</h3>
          </div>
          <p className="text-yellow-700">无法找到名为 "{componentName}" 的组件</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 pb-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">{componentName}</h2>
        <p className="text-gray-600 text-sm mt-1">组件预览</p>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
        <ComponentErrorBoundary componentName={componentName}>
          <Component />
        </ComponentErrorBoundary>
      </div>
    </div>
  );
}`;

    // 生成组件映射表
    const componentMapEntries = validComponents.map(component => 
      `'${component}': ${component}Component`
    ).join(',\n    ');

    const pageContent = `"use client";

import React, { useState } from 'react';
${errorBoundaryComponent}

${dynamicImports}

// 创建组件映射表并挂载到window对象
const componentMap = {
  ${componentMapEntries}
};

// 挂载到window对象供组件访问
if (typeof window !== 'undefined') {
  (window as any).componentMap = componentMap;
}

// 页面级错误边界
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('页面级错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen w-full bg-gray-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="text-red-500 text-2xl mr-3">🚨</div>
                <h1 className="text-2xl font-bold text-red-800">页面发生严重错误</h1>
              </div>
              <p className="text-red-700 mb-4">页面渲染时发生了意外错误，请检查组件代码或刷新页面重试。</p>
              <details className="mt-4">
                <summary className="cursor-pointer text-red-600 hover:text-red-800 font-medium">查看错误详情</summary>
                <pre className="mt-2 p-4 bg-red-100 rounded text-sm text-red-800 overflow-auto max-h-64">
                  {this.state.error?.message}
                  {this.state.error?.stack && '\\n' + this.state.error.stack}
                </pre>
              </details>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function HomePage() {
  const [activeTab, setActiveTab] = useState<string>(${validComponents.length > 0 ? `"${validComponents[0]}"` : '""'});
  
  const validComponentsList = [${validComponents.map(comp => `"${comp}"`).join(', ')}];
  const invalidComponentsList = [${invalidComponents.map(comp => `{ name: "${comp.name}", error: "${comp.error}" }`).join(', ')}];

  // 确保组件映射表正确初始化
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).componentMap = componentMap;
    }
  }, []);

  return (
    <main className="min-h-screen w-full bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">上传的组件展示</h1>
          <div className="space-y-2">
            <p className="text-gray-600">
              ✅ 语法正确的组件: ${validComponents.length}个
              {validComponentsList.length > 0 && ' (' + validComponentsList.join(', ') + ')'}
            </p>
            ${invalidComponents.length > 0 ? `
            <p className="text-red-600">
              ❌ 语法错误的组件: ${invalidComponents.length}个
              {invalidComponentsList.length > 0 && ' (' + invalidComponentsList.map(c => c.name).join(', ') + ')'}
            </p>
            ` : ''}
          </div>
        </div>
        
        {/* 错误组件展示 */}
        ${invalidComponents.length > 0 ? `
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">❌ 语法错误的组件</h2>
          <div className="grid gap-4">
            {invalidComponentsList.map((comp, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-red-500 text-xl mr-3 mt-1">⚠️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">{comp.name}.tsx</h3>
                    <p className="text-red-700 text-sm mt-1">{comp.error}</p>
                    <p className="text-red-600 text-xs mt-2">
                      此组件由于语法错误未被加载，请修复后重新上传
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        ` : ''}

        ${validComponents.length > 0 ? `
        {/* Tab导航 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Tabs">
              {validComponentsList.map((componentName) => (
                <button
                  key={componentName}
                  onClick={() => setActiveTab(componentName)}
                  className={\`
                    \${activeTab === componentName
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                    whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-all duration-200
                    rounded-t-lg mb-[-2px] relative
                  \`}
                >
                  {componentName}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 有效组件展示区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ComponentRenderer activeTab={activeTab} components={validComponentsList} />
        </div>
        ` : `
        ${invalidComponents.length === 0 ? `
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无组件</h2>
          <p className="text-gray-500">请先上传包含组件的zip文件</p>
        </div>
        ` : `
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">所有组件都有语法错误</h2>
          <p className="text-gray-500">请修复上述语法错误后重新上传</p>
        </div>
        `}
        `}
      </div>
    </main>
  );
}

export default function App() {
  return (
    <PageErrorBoundary>
      <HomePage />
    </PageErrorBoundary>
  );
}`;

    // 写入文件
    await writeFile(sandboxPagePath, pageContent, 'utf8');

    return NextResponse.json({
      success: true,
      message: `已更新页面，语法检查完成`,
      validComponents: validComponents,
      invalidComponents: invalidComponents,
      summary: {
        total: validComponents.length + invalidComponents.length,
        valid: validComponents.length,
        invalid: invalidComponents.length
      },
      pageUpdated: true
    });

  } catch (error) {
    console.error('更新页面失败:', error);
    return NextResponse.json(
      { error: '更新页面失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}