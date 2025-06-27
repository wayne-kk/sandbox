'use client';

import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-6xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            🚀 V0 Sandbox
          </h1>
          <p className={`text-xl mb-8 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            使用 Tailwind CSS v4 构建的现代化开发环境111222
          </p>
          
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            } transform hover:scale-105`}
          >
            {theme === 'light' ? '🌙 切换到深色模式' : '☀️ 切换到浅色模式'}
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Counter Card */}
          <div className={`p-8 rounded-2xl backdrop-blur-sm border ${
            theme === 'dark'
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-white/70 border-gray-200 text-gray-900'
          } shadow-xl`}>
            <h2 className="text-2xl font-bold mb-6 text-center">
              🎯 计数器演示
            </h2>
            
            <div className="text-center mb-6">
              <div className={`text-5xl font-bold mb-4 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {count}
              </div>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                当前计数值
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setCount(count - 1)}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                -1
              </button>
              <button
                onClick={() => setCount(0)}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                重置
              </button>
              <button
                onClick={() => setCount(count + 1)}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                +1
              </button>
            </div>
          </div>

          {/* Features Card */}
          <div className={`p-8 rounded-2xl backdrop-blur-sm border ${
            theme === 'dark'
              ? 'bg-white/10 border-white/20 text-white'
              : 'bg-white/70 border-gray-200 text-gray-900'
          } shadow-xl`}>
            <h2 className="text-2xl font-bold mb-6 text-center">
              ✨ 功能特性
            </h2>
            
            <div className="space-y-4">
              {[
                { icon: '🎨', title: 'Tailwind CSS v4', desc: '最新版本的原子化CSS框架' },
                { icon: '⚡', title: '实时热重载', desc: '代码修改即时预览效果' },
                { icon: '🌙', title: '主题切换', desc: '支持亮色和暗色主题' },
                { icon: '📱', title: '响应式设计', desc: '完美适配各种设备尺寸' },
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { label: '版本', value: 'v4.0' },
              { label: '主题', value: theme },
              { label: '计数', value: count.toString() },
              { label: '状态', value: '运行中' },
            ].map((stat, index) => (
              <div key={index} className={`p-4 rounded-xl ${
                theme === 'dark'
                  ? 'bg-white/5 text-white'
                  : 'bg-white/50 text-gray-900'
              }`}>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            💡 在IDE中编辑此文件，实时查看变化效果
          </p>
        </div>
      </div>
    </div>
  );
}
