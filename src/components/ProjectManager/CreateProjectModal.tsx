"use client";

import React, { useState, useEffect } from 'react';
import { X, Folder, CheckCircle } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  displayName: string;
  description: string;
  framework: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    description: string;
    templateName: string;
    framework: string;
  }) => Promise<void>;
}

export default function CreateProjectModal({ isOpen, onClose, onCreateProject }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateName: 'default',
    framework: 'react'
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const response = await fetch('/api/templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
        // 设置默认模板
        if (data.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            templateName: data.data[0].name,
            framework: data.data[0].framework
          }));
        }
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('请输入项目名称');
      return;
    }

    try {
      setLoading(true);
      await onCreateProject(formData);
      
      // 重置表单
      setFormData({
        name: '',
        description: '',
        templateName: 'default',
        framework: 'react'
      });
      
      onClose();
    } catch (error) {
      console.error('创建项目失败:', error);
      alert('创建项目失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setFormData(prev => ({
      ...prev,
      templateName: template.name,
      framework: template.framework
    }));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">创建新项目</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* 基本信息 */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                项目名称 *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入项目名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                项目描述
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述你的项目..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 模板选择 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选择模板</h3>
            
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">加载模板中...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.templateName === template.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* 选中标识 */}
                    {formData.templateName === template.name && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle size={20} className="text-blue-600" />
                      </div>
                    )}

                    {/* 模板信息 */}
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getFrameworkIcon(template.framework)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.displayName}</h4>
                        <p className="text-sm text-gray-600 capitalize mb-1">
                          {template.framework}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {templates.length === 0 && !templatesLoading && (
              <div className="text-center py-8">
                <Folder size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">暂无可用模板</p>
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {loading ? '创建中...' : '创建项目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 