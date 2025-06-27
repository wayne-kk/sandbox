"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, FolderOpen, Calendar, FileText, 
  MoreVertical, Edit, Trash2, Copy, Play, Eye
} from 'lucide-react';

interface UserProject {
  id: string;
  name: string;
  description: string | null;
  framework: string;
  template: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenAt: string;
  fileCount: number;
}

interface ProjectListProps {
  onOpenProject: (projectId: string) => void;
  onExtractUser: (response: Response) => void;
  className?: string;
}

export default function ProjectList({ onOpenProject, onExtractUser, className = '' }: ProjectListProps) {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async (page: number = 1, searchQuery?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (searchQuery) {
        params.append('query', searchQuery);
      }

      const response = await fetch(`/api/user-projects?${params}`, {
        credentials: 'include' // 包含Cookie
      });

      // 提取用户信息
      onExtractUser(response);

      const data = await response.json();

      if (data.success) {
        setProjects(data.data.projects);
        setHasMore(data.data.hasMore);
        setCurrentPage(page);
      } else {
        throw new Error(data.error || '获取项目列表失败');
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
      setError(error instanceof Error ? error.message : '获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      try {
        const response = await fetch(`/api/user-projects?query=${encodeURIComponent(query)}`, {
          headers: {
            'x-user-id': 'anonymous'
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setProjects(data.data.projects);
        }
      } catch (error) {
        console.error('搜索项目失败:', error);
      }
    } else {
      fetchProjects();
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/user-projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include' // 包含Cookie
      });

      // 提取用户信息
      onExtractUser(response);

      const data = await response.json();

      if (data.success) {
        // 重新获取项目列表
        fetchProjects(currentPage, searchQuery);
        alert('项目删除成功');
      } else {
        throw new Error(data.error || '删除项目失败');
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      alert(error instanceof Error ? error.message : '删除项目失败');
    }
  };

  const handleDuplicateProject = async (project: UserProject) => {
    const newName = prompt('请输入新项目名称:', `${project.name} - 副本`);
    if (!newName) return;

    try {
      const response = await fetch('/api/user-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'anonymous'
        },
        body: JSON.stringify({
          name: newName,
          description: project.description,
          templateName: project.template,
          framework: project.framework
        })
      });
      const data = await response.json();
      
      if (data.success) {
        fetchProjects(); // 重新加载项目列表
      } else {
        alert('复制失败: ' + data.error);
      }
    } catch (error) {
      console.error('复制项目失败:', error);
      alert('复制失败');
    }
  };

  const getFrameworkIcon = (framework: string) => {
    const icons: { [key: string]: string } = {
      'react': '⚛️',
      'vue': '💚',
      'next': '▲',
      'vanilla': '🍦'
    };
    return icons[framework] || '📁';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* 头部 */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">我的项目</h2>
          <button
            onClick={() => onOpenProject('new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            新建项目
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 项目列表 */}
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? '未找到匹配的项目' : '还没有项目'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? '试试其他关键词' : '创建你的第一个项目开始编程吧'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => onOpenProject('new')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建项目
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => onOpenProject(project.id)}
              >
                {/* 项目头部 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getFrameworkIcon(project.framework)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{project.framework}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(selectedProject === project.id ? null : project.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {selectedProject === project.id && (
                      <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-32">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProject(project.id);
                            setSelectedProject(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye size={14} />
                          打开
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: 实现编辑功能
                            setSelectedProject(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit size={14} />
                          编辑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateProject(project);
                            setSelectedProject(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy size={14} />
                          复制
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                            setSelectedProject(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 项目描述 */}
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* 项目信息 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FileText size={12} />
                    <span>{project.fileCount} 个文件</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(project.lastOpenAt)}</span>
                  </div>
                </div>

                {/* 公开标识 */}
                {project.isPublic && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      公开
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 点击外部关闭菜单 */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
} 