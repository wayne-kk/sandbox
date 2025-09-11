"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Folder } from 'lucide-react';

export default function DebugSandboxPage() {
  const [files, setFiles] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadSandboxFiles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/sandbox/files');
      const data = await response.json();
      
      if (data.success) {
        setFiles(data);
      } else {
        setError(data.error || 'Failed to load files');
      }
    } catch (err) {
      setError('Network error: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const checkSandboxStatus = async () => {
    try {
      const response = await fetch('/api/sandbox/start');
      const data = await response.json();
      console.log('Sandbox status:', data);
      alert('Sandbox状态: ' + JSON.stringify(data, null, 2));
    } catch (err) {
      alert('检查状态失败: ' + err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sandbox 调试面板
          </h1>
          <p className="text-gray-600">
            用于调试组件预览功能的工具页面
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={loadSandboxFiles}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    加载中...
                  </>
                ) : (
                  '查看 Sandbox 文件结构'
                )}
              </Button>
              
              <Button 
                onClick={checkSandboxStatus}
                variant="outline"
                className="w-full"
              >
                检查 Sandbox 状态
              </Button>

              <Button 
                onClick={() => window.open('http://192.168.31.161:3100', '_blank')}
                variant="outline"
                className="w-full"
              >
                直接访问 Sandbox (3100)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>测试预览URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-2">
                <div>
                  <Badge variant="outline">主页</Badge>
                  <a 
                    href="http://192.168.31.161:3100" 
                    target="_blank"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    http://192.168.31.161:3100
                  </a>
                </div>
                <div>
                  <Badge variant="outline">Header组件</Badge>
                  <a 
                    href="http://192.168.31.161:3100/Header" 
                    target="_blank"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    http://192.168.31.161:3100/Header
                  </a>
                </div>
                <div>
                  <Badge variant="outline">UserProfile组件</Badge>
                  <a 
                    href="http://192.168.31.161:3100/UserProfile" 
                    target="_blank"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    http://192.168.31.161:3100/UserProfile
                  </a>
                </div>
                <div>
                  <Badge variant="outline">ProductCard组件</Badge>
                  <a 
                    href="http://192.168.31.161:3100/ProductCard" 
                    target="_blank"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    http://192.168.31.161:3100/ProductCard
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-800">
                <strong>错误:</strong> {error}
              </div>
            </CardContent>
          </Card>
        )}

        {files && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Sandbox 文件结构
                <Badge variant="secondary">
                  共 {files.count} 个文件
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                {Object.keys(files.files).sort().map((filePath) => (
                  <div key={filePath} className="flex items-center gap-2 py-1">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span className="text-yellow-300">{filePath}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>调试说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <div><strong>1. 文件检查：</strong>点击"查看 Sandbox 文件结构"确认组件文件是否正确写入</div>
              <div><strong>2. 服务状态：</strong>点击"检查 Sandbox 状态"确认服务器是否运行</div>
              <div><strong>3. 直接访问：</strong>点击测试链接直接访问预览页面</div>
              <div><strong>4. 路径验证：</strong>确认文件路径为 app/[ComponentName]/page.tsx</div>
              <div><strong>5. 等待时间：</strong>新文件写入后，Next.js需要3-5秒进行热重载</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
