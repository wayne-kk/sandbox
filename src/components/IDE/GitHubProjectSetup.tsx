"use client";

import React, { useState } from 'react';
import { Github, Download, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';

interface GitHubProjectSetupProps {
  onProjectSetup: (success: boolean, data?: any) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function GitHubProjectSetup({ onProjectSetup, isVisible, onClose }: GitHubProjectSetupProps) {
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'downloading' | 'installing' | 'success'>('input');
  const [projectInfo, setProjectInfo] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    setIsLoading(true);
    setError('');
    setStep('downloading');

    try {
      // 先验证URL格式
      const response = await fetch(`/api/github/download?url=${encodeURIComponent(githubUrl)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'GitHub URL格式错误');
      }

      // 开始下载和设置项目
      setStep('installing');
      const setupResponse = await fetch('/api/sandbox/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ githubUrl: githubUrl.trim() }),
      });

      const setupData = await setupResponse.json();

      if (!setupData.success) {
        throw new Error(setupData.error || '项目设置失败');
      }

      setProjectInfo(setupData.projectInfo);
      setStep('success');
      
      // 等待一下让用户看到成功信息
      setTimeout(() => {
        onProjectSetup(true, setupData);
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('GitHub项目设置失败:', error);
      setError(error instanceof Error ? error.message : '设置失败');
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setGithubUrl('');
    setError('');
    setStep('input');
    setProjectInfo(null);
    onClose();
  };

  const getExampleUrls = () => [
    'https://github.com/vercel/next.js/tree/canary/examples/hello-world',
    'https://github.com/facebook/create-react-app',
    'https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts',
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Github className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">从GitHub导入项目</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {step === 'input' && (
            <>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  输入GitHub仓库链接，我们将自动下载、安装依赖并为您设置项目环境。
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">支持的URL格式：</p>
                      <ul className="space-y-1 text-xs">
                        <li>• https://github.com/owner/repo</li>
                        <li>• https://github.com/owner/repo/tree/branch</li>
                        <li>• https://github.com/owner/repo/tree/branch/subfolder</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="github-url" className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub 仓库链接
                  </label>
                  <input
                    id="github-url"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-800">{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !githubUrl.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{isLoading ? '设置中...' : '开始导入'}</span>
                  </button>
                </div>
              </form>

              {/* 示例项目 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">或尝试这些示例项目：</h3>
                <div className="space-y-2">
                  {getExampleUrls().map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setGithubUrl(url)}
                      className="w-full text-left p-3 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                        <span className="text-blue-600 hover:text-blue-700">{url}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 'downloading' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">正在下载项目...</h3>
              <p className="text-gray-600">从GitHub下载代码文件</p>
            </div>
          )}

          {step === 'installing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">正在安装依赖...</h3>
              <p className="text-gray-600">安装项目依赖包，请稍候</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">设置完成！</h3>
              <p className="text-gray-600 mb-4">项目已成功导入并准备就绪</p>
              
              {projectInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="text-sm text-green-800">
                    <p><strong>项目名称:</strong> {projectInfo.name}</p>
                    <p><strong>框架:</strong> {projectInfo.framework}</p>
                    {projectInfo.description && (
                      <p><strong>描述:</strong> {projectInfo.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
