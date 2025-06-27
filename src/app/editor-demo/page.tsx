'use client';

import React, { useState } from 'react';
import Editor from '@/components/Editor/Editor';

export default function EditorDemoPage() {
  const [selectedDemo, setSelectedDemo] = useState<'react' | 'typescript' | 'javascript'>('react');

  const demoCode = {
    react: `import React, { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.log('Count changed:', count);
  }, [count]);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <div className="App">
      <h1>🚀 React 演示</h1>
      <p>计数器: {count}</p>
      <button onClick={handleClick}>
        点击增加
      </button>
      {user && <p>用户: {user.name}</p>}
    </div>
  );
}

export default App;`,
    
    typescript: `interface User {
  id: number;
  name: string;
  email?: string;
}

const users: User[] = [
  { id: 1, name: '张三', email: 'zhang@example.com' },
  { id: 2, name: '李四' },
];

function getUserById(id: number): User | undefined {
  return users.find(user => user.id === id);
}

function createUser(name: string, email?: string): User {
  return {
    id: Date.now(),
    name,
    email
  };
}

// 使用示例
const user = getUserById(1);
const newUser = createUser('王五', 'wang@example.com');

console.log(user?.name);
console.log(newUser);`,

    javascript: `// JavaScript 演示代码
function fetchData(url) {
  return fetch(url)
    .then(response => response.json())
    .catch(error => {
      console.error('Error:', error);
    });
}

const apiUrl = 'https://api.example.com/data';
const data = fetchData(apiUrl);

const processData = (items) => {
  return items.map(item => ({
    ...item,
    processed: true,
    timestamp: new Date().toISOString()
  }));
};

// 模拟异步处理
async function handleData() {
  try {
    const result = await fetchData(apiUrl);
    const processed = processData(result);
    console.log('处理完成:', processed);
  } catch (error) {
    console.error('处理失败:', error);
  }
}`
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📝 代码编辑器优化演示
          </h1>
          <p className="text-gray-600">
            展示Monaco编辑器红线问题的修复效果
          </p>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-6xl mx-auto p-6">
        {/* 功能改进说明 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 修复的问题</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">✅ 已修复</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>减少 TypeScript 严格检查导致的红线</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>添加 React 和 Next.js 类型定义</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>忽略常见的无关错误代码</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>优化 JavaScript 语义验证</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>改进编辑器用户体验设置</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">🎯 技术细节</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><strong>TypeScript:</strong> 禁用严格检查选项</li>
                <li><strong>诊断:</strong> 过滤80+常见错误代码</li>
                <li><strong>类型定义:</strong> 内置React/Next.js类型</li>
                <li><strong>模块解析:</strong> 优化导入路径处理</li>
                <li><strong>JSX:</strong> React JSX模式支持</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 代码演示区 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 演示选择器 */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">🧪 代码演示</h2>
              <div className="flex space-x-2">
                {[
                  { key: 'react', label: '⚛️ React', color: 'blue' },
                  { key: 'typescript', label: '🔷 TypeScript', color: 'indigo' },
                  { key: 'javascript', label: '🟨 JavaScript', color: 'yellow' }
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDemo(key as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDemo === key
                        ? (color === 'blue' ? 'bg-blue-600 text-white' : 
                           color === 'indigo' ? 'bg-indigo-600 text-white' : 
                           'bg-yellow-600 text-white')
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 编辑器 */}
          <div style={{ height: '500px' }}>
            <Editor
              language={selectedDemo === 'javascript' ? 'javascript' : 'typescript'}
              value={demoCode[selectedDemo]}
              onChange={() => {}} // 只读演示
              options={{
                readOnly: false, // 允许编辑以测试功能
                minimap: { enabled: true },
                lineNumbers: 'on',
                renderLineHighlight: 'all'
              }}
            />
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 测试建议</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">编辑测试:</h4>
              <ul className="space-y-1">
                <li>• 尝试修改变量名和类型</li>
                <li>• 添加新的函数和组件</li>
                <li>• 测试自动补全功能</li>
                <li>• 观察错误提示的变化</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">对比体验:</h4>
              <ul className="space-y-1">
                <li>• 现在应该看到很少的红线错误</li>
                <li>• 类型提示更加智能</li>
                <li>• 常见React代码不再报错</li>
                <li>• 编辑体验更加流畅</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 