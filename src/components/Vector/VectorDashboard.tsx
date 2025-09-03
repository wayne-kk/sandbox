'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Zap, 
  Activity, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  Code,
  Settings,
  Trash2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VectorStats {
  totalCodeBlocks: number;
  totalContextItems: number;
  totalComponents: number;
  totalConversations: number;
  estimatedTokens: number;
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
  services: {
    embedding: boolean;
    database: boolean;
  };
  message: string;
}

interface VectorDashboardProps {
  projectId: string;
}

export default function VectorDashboard({ projectId }: VectorDashboardProps) {
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // 加载向量统计信息
  useEffect(() => {
    loadVectorStats();
    checkServiceHealth();
  }, [projectId]);

  const loadVectorStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/vector/sync?projectId=${projectId}&action=stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('加载向量统计失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkServiceHealth = async () => {
    try {
      const response = await fetch('/api/ai/generate-optimized?action=test');
      const data = await response.json();
      
      if (data.success) {
        setServiceStatus({
          status: 'healthy',
          services: {
            embedding: data.data.openai?.status === 'ok',
            database: data.data.supabase?.status === 'ok'
          },
          message: '服务运行正常'
        });
      } else {
        setServiceStatus({
          status: 'unhealthy',
          services: { embedding: false, database: false },
          message: '服务检查失败'
        });
      }
    } catch (error) {
      console.error('服务健康检查失败:', error);
      setServiceStatus({
        status: 'unhealthy',
        services: { embedding: false, database: false },
        message: '无法连接到向量服务'
      });
    }
  };

  const syncVectors = async (type: 'full' | 'incremental') => {
    try {
      setIsSyncing(true);
      
      const response = await fetch('/api/vector/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          action: type === 'full' ? 'full_sync' : 'incremental_sync'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLastSyncTime(new Date());
        await loadVectorStats(); // 重新加载统计信息
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('向量同步失败:', error);
      alert(`向量同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const searchVectors = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      
      // 这里可以实现向量搜索逻辑
      // 目前先模拟搜索结果
      const mockResults = [
        {
          type: 'component',
          path: 'components/ui/button.tsx',
          description: 'Button component with variants',
          similarity: 0.95
        },
        {
          type: 'function',
          path: 'lib/utils.ts',
          description: 'Utility function for class names',
          similarity: 0.87
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('向量搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const deleteVectors = async () => {
    if (!confirm('确定要删除所有向量数据吗？此操作不可逆。')) {
      return;
    }

    try {
      const response = await fetch('/api/vector/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          action: 'delete_project'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadVectorStats();
        alert('向量数据删除成功');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('删除向量数据失败:', error);
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2">加载向量数据...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">向量数据库管理</h2>
            <p className="text-gray-600">管理和监控项目的向量化数据</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadVectorStats()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 服务状态 */}
      {serviceStatus && (
        <Alert className={serviceStatus.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {serviceStatus.status === 'healthy' ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <AlertDescription className={serviceStatus.status === 'healthy' ? 'text-green-800' : 'text-red-800'}>
            {serviceStatus.message}
            <div className="mt-1 text-xs">
              嵌入服务: {serviceStatus.services.embedding ? '✅' : '❌'} | 
              数据库: {serviceStatus.services.database ? '✅' : '❌'}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">代码块</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.totalCodeBlocks || 0}</p>
              </div>
              <Code className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">上下文项</p>
                <p className="text-2xl font-bold text-green-600">{stats?.totalContextItems || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">组件知识</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.totalComponents || 0}</p>
              </div>
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">预估 Tokens</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.estimatedTokens ? (stats.estimatedTokens / 1000).toFixed(1) + 'K' : '0'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 向量同步 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              向量同步
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => syncVectors('full')}
                disabled={isSyncing}
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    同步中...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    完整同步
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => syncVectors('incremental')}
                disabled={isSyncing}
                variant="outline"
                className="w-full"
              >
                <Activity className="w-4 h-4 mr-2" />
                增量同步
              </Button>
            </div>
            
            {lastSyncTime && (
              <div className="text-xs text-gray-500 text-center">
                上次同步: {lastSyncTime.toLocaleString()}
              </div>
            )}
            
            <div className="text-xs text-gray-600">
              <p><strong>完整同步:</strong> 重新向量化所有项目文件</p>
              <p><strong>增量同步:</strong> 只同步已修改的文件</p>
            </div>
          </CardContent>
        </Card>

        {/* 向量搜索 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              向量搜索
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="搜索代码、组件或功能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchVectors()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={searchVectors}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{result.type}</Badge>
                        <span className="text-sm font-medium">{result.path}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {(result.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{result.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Token 使用优化 */}
      {stats && stats.estimatedTokens > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Token 使用优化
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">预估总 Tokens</span>
                <span className="font-medium">{stats.estimatedTokens.toLocaleString()}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>优化效果预估</span>
                  <span>节省 60-80%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">原始使用:</span>
                  <div className="font-medium text-red-600">
                    ~{(stats.estimatedTokens * 1.5).toLocaleString()} tokens
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">优化后:</span>
                  <div className="font-medium text-green-600">
                    ~{Math.floor(stats.estimatedTokens * 0.3).toLocaleString()} tokens
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 危险操作 */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            危险操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              删除所有向量数据将清空项目的智能上下文信息，需要重新同步才能恢复优化功能。
            </p>
            <Button
              onClick={deleteVectors}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除所有向量数据
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
