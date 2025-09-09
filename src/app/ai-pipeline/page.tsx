"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResetConfirmationDialog } from '@/components/ui/reset-confirmation-dialog';
import { 
  RotateCcw, Home, Code, Settings, BarChart3, Zap, Sparkles, Github,
  Workflow, GitBranch, CheckCircle, Clock, AlertCircle, Download,
  Upload, FileText, Plus, Edit3, Package, Layers, History, Eye
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function AIPipelinePage() {
  // 重置功能状态
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // 页面状态
  const [activeTab, setActiveTab] = useState('templates');
  const [stats, setStats] = useState({
    totalPipelines: 0,
    activePipelines: 0,
    successfulBuilds: 0,
    lastExecution: null as string | null,
    popularTemplates: [] as string[]
  });

  // 模板管理状态
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedScene, setSelectedScene] = useState('');
  const [selectedSceneEn, setSelectedSceneEn] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [templateForm, setTemplateForm] = useState({
    scene: '',
    component_name: '',
    stype_tag: '',
    function_tag: ''
  });

  // 历史场景管理状态
  const [historyScenes, setHistoryScenes] = useState<any[]>([]);
  const [selectedHistoryScene, setSelectedHistoryScene] = useState<any>(null);
  const [historyComponents, setHistoryComponents] = useState<any[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [isDownloadingHistory, setIsDownloadingHistory] = useState(false);
  
  // Mock模式开关 (开发时可以设置为true)
  const [useMockData, setUseMockData] = useState(true);

  // Pipeline 状态
  const [pipelineStatus, setPipelineStatus] = useState({
    stage: 'idle', // idle, analyzing, generating, building, testing, deploying, completed, failed
    progress: 0,
    currentStep: '',
    logs: []
  });

  // 处理 Pipeline 执行
  const handleExecutePipeline = async (config: any) => {
    console.log('执行 Pipeline:', config);
    
    // 模拟 Pipeline 执行流程
    const stages = [
      { name: '分析需求', duration: 2000 },
      { name: '生成组件', duration: 3000 },
      { name: '构建项目', duration: 2500 },
      { name: '运行测试', duration: 2000 },
      { name: '部署预览', duration: 1500 }
    ];

    setPipelineStatus({ stage: 'analyzing', progress: 0, currentStep: '准备执行...', logs: [] });
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setPipelineStatus(prev => ({
        ...prev,
        stage: stage.name.toLowerCase().replace(' ', ''),
        currentStep: stage.name,
        progress: Math.round((i / stages.length) * 100)
      }));
      
      await new Promise(resolve => setTimeout(resolve, stage.duration));
    }
    
    setPipelineStatus(prev => ({
      ...prev,
      stage: 'completed',
      progress: 100,
      currentStep: 'Pipeline 执行完成'
    }));
    
    updateStats();
    showSuccessNotification('Pipeline 执行成功！', '前端组件已生成并部署');
  };

  // 更新统计信息
  const updateStats = async () => {
    try {
      setStats(prev => ({
        ...prev,
        totalPipelines: prev.totalPipelines + 1,
        successfulBuilds: prev.successfulBuilds + 1,
        lastExecution: new Date().toISOString()
      }));
    } catch (error) {
      console.error('更新统计信息失败:', error);
    }
  };

  // 显示成功通知
  const showSuccessNotification = (title: string, message: string) => {
    console.log(`${title}: ${message}`);
  };

  // API 接口调用函数
  
  // 按场景创建模板
  const createTemplateByScene = async (scene: string, scene_en?: string) => {
    setIsCreatingTemplate(true);
    try {
      // Mock 数据模式
      if (useMockData) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 根据场景生成mock模板数据
        const generateMockTemplates = (sceneName: string, sceneEn?: string) => {
          const baseTemplates = [
            {
              id: `template_1_${Date.now()}`,
              component_name: `${sceneName}MainLayout`,
              component_desc: `${sceneName}的主要布局组件，提供整体页面结构`,
              scene_tag: sceneName,
              stype_tag: '布局框架',
              function_tag: '结构化',
              applied_components: 'Header, Sidebar, Content, Footer',
              applicable_pages: '主页面、详情页面'
            },
            {
              id: `template_2_${Date.now()}`,
              component_name: `${sceneName}DataDisplay`,
              component_desc: `${sceneName}的数据展示组件，支持各种数据格式展示`,
              scene_tag: sceneName,
              stype_tag: '信息展示',
              function_tag: '数据驱动',
              applied_components: 'Table, Card, List, Badge',
              applicable_pages: '列表页、详情页'
            },
            {
              id: `template_3_${Date.now()}`,
              component_name: `${sceneName}ActionPanel`,
              component_desc: `${sceneName}的操作面板组件，集成常用操作功能`,
              scene_tag: sceneName,
              stype_tag: '交互操作',
              function_tag: '功能集成',
              applied_components: 'Button, Form, Modal, Dropdown',
              applicable_pages: '操作页面、设置页面'
            },
            {
              id: `template_4_${Date.now()}`,
              component_name: `${sceneName}StatusIndicator`,
              component_desc: `${sceneName}的状态指示器组件，显示实时状态信息`,
              scene_tag: sceneName,
              stype_tag: '状态展示',
              function_tag: '实时更新',
              applied_components: 'Badge, Progress, Alert, Icon',
              applicable_pages: '监控页面、状态页面'
            }
          ];
          
          return baseTemplates;
        };
        
        const templateData = generateMockTemplates(scene, scene_en);
        setTemplates(templateData);
        showSuccessNotification('模板创建成功！', `${templateData.length} 个组件模板已生成 (Mock数据)`);
        return templateData;
      }
      
      // 真实 API 调用
      const requestBody: { scene: string; scene_en?: string } = { scene };
      if (scene_en && scene_en.trim()) {
        requestBody.scene_en = scene_en;
      }
      
      const response = await fetch('/api/frontend_component/create_by_scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.status === "0") {
        // 解析返回的模板数据
        const templateData = data.data.data.map((item: any[], index: number) => {
          const keys = data.data.keys;
          const template: any = {};
          keys.forEach((key: string, keyIndex: number) => {
            template[key] = item[keyIndex];
          });
          template.id = `template_${index}_${Date.now()}`;
          return template;
        });
        
        setTemplates(templateData);
        showSuccessNotification('模板创建成功！', `${templateData.length} 个组件模板已生成`);
        return templateData;
      } else {
        throw new Error('创建模板失败');
      }
    } catch (error) {
      console.error('创建模板错误:', error);
      
      // 如果真实API失败，fallback到mock数据
      if (!useMockData) {
        console.log('创建模板API调用失败，切换到Mock数据');
        setUseMockData(true);
        return await createTemplateByScene(scene, scene_en); // 重新调用使用mock
      }
      
      alert('❌ 创建模板失败: ' + error);
      return null;
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  // 下载模板
  const downloadTemplate = async (scene: string, scene_en?: string) => {
    setIsDownloading(true);
    try {
      // Mock 数据模式 - 模拟下载
      if (useMockData) {
        // 模拟下载延迟
        await new Promise(resolve => setTimeout(resolve, 1800));
        
        const filename = `${scene_en || scene}_new_templates.zip`;
        
        // 创建模拟的新模板文件内容
        const mockFileContent = `
# ${scene} 新生成模板包

这是一个模拟的新生成模板包，包含以下组件：

## 新生成组件
- ${scene}MainLayout.tsx - 主布局组件
- ${scene}DataDisplay.tsx - 数据展示组件  
- ${scene}ActionPanel.tsx - 操作面板组件
- ${scene}StatusIndicator.tsx - 状态指示器组件

## 组件特性
- 响应式设计
- TypeScript支持
- 现代化UI风格
- 完整的交互逻辑

## 安装使用
\`\`\`bash
# 安装依赖
npm install

# 导入组件
import { ${scene}MainLayout } from './${scene}MainLayout'
\`\`\`

## 注意事项
这是基于 "${scene}" 场景自动生成的Mock模板，实际使用时请连接真实后端服务。
生成时间：${new Date().toLocaleString()}
        `;
        
        // 创建并下载模拟文件
        const blob = new Blob([mockFileContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccessNotification('下载完成！', `${filename} 已保存到本地 (Mock数据)`);
        return;
      }
      
      // 真实 API 调用
      const params = new URLSearchParams();
      params.append('scene', scene);
      if (scene_en && scene_en.trim()) {
        params.append('scene_en', scene_en);
      }
      
      const response = await fetch(`/api/frontend_component/download?${params.toString()}`, {
        method: 'GET'
      });

      if (response.ok) {
        // 获取文件名
        const disposition = response.headers.get('Content-Disposition');
        const filename = disposition 
          ? disposition.split('filename=')[1]?.replace(/"/g, '') 
          : `${scene}_templates.zip`;
        
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccessNotification('下载完成！', `${filename} 已保存到本地`);
      } else {
        throw new Error('下载失败');
      }
    } catch (error) {
      console.error('下载模板错误:', error);
      
      // 如果真实API失败，提供mock下载
      if (!useMockData) {
        console.log('下载API调用失败，使用Mock下载');
        setUseMockData(true);
        return await downloadTemplate(scene, scene_en); // 重新调用使用mock
      }
      
      alert('❌ 下载模板失败: ' + error);
    } finally {
      setIsDownloading(false);
    }
  };

  // 处理模板选中
  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    // 自动填充表单信息
    setTemplateForm({
      scene: template.scene_tag || selectedScene,
      component_name: template.component_name || '',
      stype_tag: template.stype_tag || '',
      function_tag: template.function_tag || ''
    });
  };

  // 清除选中的模板
  const clearSelectedTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({ scene: '', component_name: '', stype_tag: '', function_tag: '' });
    setUploadFile(null);
    // 注意：这里不清空selectedScene和selectedSceneEn，因为用户可能还想继续使用这些值
  };

  // 修改模板
  const modifyTemplate = async () => {
    if (!uploadFile) {
      alert('请选择要上传的模板文件');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('scene', templateForm.scene);
      formData.append('component_name', templateForm.component_name);
      formData.append('stype_tag', templateForm.stype_tag);
      formData.append('function_tag', templateForm.function_tag);
      formData.append('file', uploadFile);

      const response = await fetch('/api/frontend_component/modify', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccessNotification('模板修改成功！', '组件模板已更新');
        // 重新获取模板列表
        if (templateForm.scene) {
          await createTemplateByScene(templateForm.scene, selectedSceneEn);
        }
        // 重置表单和选中状态
        clearSelectedTemplate();
      } else {
        throw new Error(data.error || '修改模板失败');
      }
    } catch (error) {
      console.error('修改模板错误:', error);
      alert('❌ 修改模板失败: ' + error);
    }
  };

  // 重置sandbox功能
  const resetSandbox = async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/sandbox/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmReset: true })
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccessMessage(true);
        setShowResetDialog(false);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        throw new Error(data.error || '重置失败');
      }
    } catch (error) {
      console.error('重置错误:', error);
      alert('❌ 重置失败: ' + error);
    } finally {
      setIsResetting(false);
    }
  };

  // 获取历史场景列表
  const getSceneList = async () => {
    setIsLoadingScenes(true);
    try {
      // Mock 数据模式
      if (useMockData) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockScenes = [
          {
            id: 'scene_1',
            scene: '电商平台',
            scene_cn: '电商平台',
            scene_en: 'e-commerce',
            description: '包含商品展示、购物车、订单管理等完整的电商功能组件'
          },
          {
            id: 'scene_2',  
            scene: '后台管理系统',
            scene_cn: '后台管理系统',
            scene_en: 'admin-dashboard',
            description: '数据统计、用户管理、内容管理等后台管理功能组件'
          },
          {
            id: 'scene_3',
            scene: '数据分析平台',
            scene_cn: '数据分析平台', 
            scene_en: 'data-analytics',
            description: '图表展示、数据可视化、报表生成等分析功能组件'
          },
          {
            id: 'scene_4',
            scene: '社交媒体应用',
            scene_cn: '社交媒体应用',
            scene_en: 'social-media',
            description: '用户动态、消息聊天、内容分享等社交功能组件'
          },
          {
            id: 'scene_5',
            scene: '企业官网',
            scene_cn: '企业官网',
            scene_en: 'corporate-website', 
            description: '公司介绍、产品展示、联系我们等企业门户组件'
          }
        ];
        
        setHistoryScenes(mockScenes);
        showSuccessNotification('场景列表加载成功！', `找到 ${mockScenes.length} 个历史场景`);
        return mockScenes;
      }
      
      // 真实 API 调用
      const response = await fetch('/api/frontend_component/get_scene_list', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.status === "0") {
        setHistoryScenes(data.data || []);
        return data.data;
      } else {
        throw new Error('获取场景列表失败');
      }
    } catch (error) {
      console.error('获取场景列表错误:', error);
      
      // 如果真实API失败，fallback到mock数据
      if (!useMockData) {
        console.log('API调用失败，切换到Mock数据模式');
        setUseMockData(true);
        return await getSceneList(); // 重新调用使用mock数据
      }
      
      alert('❌ 获取场景列表失败: ' + error);
      return null;
    } finally {
      setIsLoadingScenes(false);
    }
  };

  // 根据场景查询组件列表
  const queryComponentsByScene = async (scene_en: string) => {
    setIsLoadingComponents(true);
    try {
      // Mock 数据模式
      if (useMockData) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 根据不同场景返回不同的mock组件数据
        const getMockComponents = (sceneEn: string) => {
          const baseComponents = {
            'e-commerce': [
              {
                id: 'comp_ecom_1',
                component_name: 'ProductCard',
                component_desc: '商品卡片组件，展示商品图片、价格、名称等基本信息',
                scene_tag: '电商',
                stype_tag: '现代简约',
                function_tag: '展示',
                applied_components: 'Card, Image, Button',
                applicable_pages: '商品列表页、首页推荐'
              },
              {
                id: 'comp_ecom_2',
                component_name: 'ShoppingCart',
                component_desc: '购物车组件，支持商品数量修改、删除、价格计算',
                scene_tag: '电商',
                stype_tag: '交互式',
                function_tag: '功能',
                applied_components: 'List, Counter, Button',
                applicable_pages: '购物车页面、结算页面'
              },
              {
                id: 'comp_ecom_3',
                component_name: 'OrderSummary',
                component_desc: '订单摘要组件，显示订单详情和总金额',
                scene_tag: '电商',
                stype_tag: '清晰明了',
                function_tag: '信息展示',
                applied_components: 'Card, List, Typography',
                applicable_pages: '订单确认页、订单详情页'
              }
            ],
            'admin-dashboard': [
              {
                id: 'comp_admin_1',
                component_name: 'DataChart',
                component_desc: '数据图表组件，支持柱状图、折线图、饼图等多种类型',
                scene_tag: '管理后台',
                stype_tag: '专业商务',
                function_tag: '数据可视化',
                applied_components: 'Chart, Legend, Tooltip',
                applicable_pages: '仪表板、数据分析页'
              },
              {
                id: 'comp_admin_2',
                component_name: 'UserTable',
                component_desc: '用户管理表格，支持搜索、排序、分页和批量操作',
                scene_tag: '管理后台',
                stype_tag: '功能完整',
                function_tag: '数据管理',
                applied_components: 'Table, SearchBox, Pagination',
                applicable_pages: '用户管理页、权限管理页'
              }
            ],
            'data-analytics': [
              {
                id: 'comp_data_1',
                component_name: 'KPICard',
                component_desc: 'KPI指标卡片，展示关键业务指标和变化趋势',
                scene_tag: '数据分析',
                stype_tag: '直观简洁',
                function_tag: '指标展示',
                applied_components: 'Card, Number, Trend',
                applicable_pages: '数据大屏、分析报告'
              },
              {
                id: 'comp_data_2',
                component_name: 'FilterPanel',
                component_desc: '数据筛选面板，支持多维度条件筛选和时间范围选择',
                scene_tag: '数据分析',
                stype_tag: '交互友好',
                function_tag: '数据筛选',
                applied_components: 'Select, DatePicker, CheckBox',
                applicable_pages: '分析页面、报表页面'
              }
            ]
          };
          
          return baseComponents[sceneEn as keyof typeof baseComponents] || [
            {
              id: 'comp_default_1',
              component_name: 'GenericComponent',
              component_desc: `${sceneEn}场景下的通用组件，提供基础功能`,
              scene_tag: sceneEn,
              stype_tag: '通用',
              function_tag: '基础',
              applied_components: 'div, span, button',
              applicable_pages: '通用页面'
            }
          ];
        };
        
        const componentData = getMockComponents(scene_en);
        setHistoryComponents(componentData);
        showSuccessNotification('组件列表加载成功！', `找到 ${componentData.length} 个组件`);
        return componentData;
      }
      
      // 真实 API 调用
      const response = await fetch(`/api/frontend_component/query_by_scene?scene_en=${encodeURIComponent(scene_en)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.status === "0") {
        // 解析返回的组件数据，格式与模板数据相同
        const componentData = data.data.data?.map((item: any[], index: number) => {
          const keys = data.data.keys;
          const component: any = {};
          keys.forEach((key: string, keyIndex: number) => {
            component[key] = item[keyIndex];
          });
          component.id = `history_component_${index}_${Date.now()}`;
          return component;
        }) || [];
        
        setHistoryComponents(componentData);
        return componentData;
      } else {
        throw new Error('查询组件列表失败');
      }
    } catch (error) {
      console.error('查询组件列表错误:', error);
      
      // 如果真实API失败，fallback到mock数据
      if (!useMockData) {
        console.log('API调用失败，切换到Mock数据模式');
        setUseMockData(true);
        return await queryComponentsByScene(scene_en); // 重新调用使用mock数据
      }
      
      alert('❌ 查询组件列表失败: ' + error);
      return null;
    } finally {
      setIsLoadingComponents(false);
    }
  };

  // 下载历史场景组件
  const downloadHistoryScene = async (scene: string, scene_en?: string) => {
    setIsDownloadingHistory(true);
    try {
      // Mock 数据模式 - 模拟下载
      if (useMockData) {
        // 模拟下载延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const filename = `${scene_en || scene}_templates.zip`;
        
        // 创建一个模拟的zip文件内容
        const mockFileContent = `
# ${scene} 场景组件包

这是一个模拟的组件包，包含以下文件：

## 组件列表
- ${scene_en || scene}-components/
  - ProductCard.tsx
  - ShoppingCart.tsx  
  - OrderSummary.tsx
  - README.md
  - package.json

## 使用说明
1. 解压文件到项目目录
2. 运行 npm install 安装依赖
3. 按需引入组件使用

## 注意事项
这是mock数据，实际使用时请连接真实后端服务。
        `;
        
        // 创建并下载模拟文件
        const blob = new Blob([mockFileContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccessNotification('下载完成！', `${filename} 已保存到本地 (Mock数据)`);
        return;
      }
      
      // 真实 API 调用
      const params = new URLSearchParams();
      params.append('scene', scene);
      if (scene_en && scene_en.trim()) {
        params.append('scene_en', scene_en);
      }
      
      const response = await fetch(`/api/frontend_component/download?${params.toString()}`, {
        method: 'GET'
      });

      if (response.ok) {
        // 获取文件名
        const disposition = response.headers.get('Content-Disposition');
        const filename = disposition 
          ? disposition.split('filename=')[1]?.replace(/"/g, '') 
          : `${scene}_history_templates.zip`;
        
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccessNotification('下载完成！', `${filename} 已保存到本地`);
      } else {
        throw new Error('下载失败');
      }
    } catch (error) {
      console.error('下载历史场景错误:', error);
      
      // 如果真实API失败，提供mock下载
      if (!useMockData) {
        console.log('下载API调用失败，使用Mock下载');
        setUseMockData(true);
        return await downloadHistoryScene(scene, scene_en); // 重新调用使用mock
      }
      
      alert('❌ 下载历史场景失败: ' + error);
    } finally {
      setIsDownloadingHistory(false);
    }
  };

  // 处理历史场景选择
  const handleSelectHistoryScene = async (scene: any) => {
    setSelectedHistoryScene(scene);
    setHistoryComponents([]); // 清空之前的组件列表
    
    // 获取该场景下的组件列表
    if (scene.scene_en) {
      await queryComponentsByScene(scene.scene_en);
    }
  };

  // 页面加载时获取统计信息和历史场景
  useEffect(() => {
    updateStats();
    getSceneList();
  }, []);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'analyzing': return <Clock className="w-4 h-4" />;
      case 'generating': return <Code className="w-4 h-4" />;
      case 'building': return <Settings className="w-4 h-4" />;
      case 'testing': return <CheckCircle className="w-4 h-4" />;
      case 'deploying': return <Zap className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Workflow className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* 成功消息提示 */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <span className="text-2xl">🎉</span>
          <div>
            <div className="font-semibold">Sandbox 重置成功！</div>
            <div className="text-sm opacity-90">Pipeline 环境已重置</div>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                  <Workflow className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    V0 Pipeline
                  </h1>
                  <p className="text-sm text-gray-500">前端组件自动化构建流水线</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Pipeline 就绪</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>构建环境运行中</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Mock模式切换开关 */}
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                <span className="text-xs text-gray-600">Mock数据</span>
                <button
                  onClick={() => setUseMockData(!useMockData)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                    useMockData ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  title={useMockData ? '点击切换到真实API' : '点击切换到Mock数据'}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      useMockData ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className={`text-xs ${useMockData ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {useMockData ? 'ON' : 'OFF'}
                </span>
              </div>
              
              <Button
                onClick={() => setShowResetDialog(true)}
                disabled={isResetting}
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                title="重置 Pipeline 环境"
              >
                <RotateCcw size={16} className={`mr-2 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? '重置中...' : '重置环境'}
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <a href="/">
                  <Home size={16} className="mr-2" />
                  返回主页
                </a>
              </Button>
              
              <Button size="sm" asChild>
                <a href="/editor/sandbox-project">
                  <Code size={16} className="mr-2" />
                  打开编辑器
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-8xl mx-auto py-8 px-6">

        {/* Pipeline 执行状态 */}
        {pipelineStatus.stage !== 'idle' && (
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStageIcon(pipelineStatus.stage)}
                  <CardTitle className="text-xl">Pipeline 执行状态</CardTitle>
                </div>
                <Badge variant={pipelineStatus.stage === 'completed' ? 'default' : 'secondary'}>
                  {pipelineStatus.currentStep}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={pipelineStatus.progress} className="h-2" />
                <div className="text-sm text-gray-600">
                  进度: {pipelineStatus.progress}% - {pipelineStatus.currentStep}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 功能标签页 */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                <Workflow className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  前端组件 Pipeline
                </CardTitle>
                <CardDescription className="text-lg text-gray-600 mt-2">
                  自动化的前端组件构建、测试和部署流水线，支持持续集成和持续交付
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4" />
                <span>自动化流水线</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>质量检测</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>快速部署</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-gray-100/50 p-1 rounded-xl">
                <TabsTrigger 
                  value="templates" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="font-medium">📦 新增场景模板</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <History className="w-4 h-4" />
                    </div>
                    <span className="font-medium">📚 历史场景</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              
              
              <TabsContent value="templates" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">新增组件模板</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    按场景创建、下载和修改前端组件模板。支持批量生成组件、下载压缩包和上传自定义模板文件
                  </p>
                </div>

                {/* 场景模板生成卡片 */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-600" />
                      场景模板生成
                    </CardTitle>
                    <CardDescription>
                      输入场景描述，AI 自动生成对应的组件模板列表
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          场景描述 *
                        </label>
                        <input
                          type="text"
                          value={selectedScene}
                          onChange={(e) => setSelectedScene(e.target.value)}
                          placeholder="例如: 电商平台、后台管理系统、数据分析平台..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          场景英文描述
                        </label>
                        <input
                          type="text"
                          value={selectedSceneEn}
                          onChange={(e) => setSelectedSceneEn(e.target.value)}
                          placeholder="例如: E-commerce Platform, Admin Dashboard, Data Analytics Platform..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => createTemplateByScene(selectedScene, selectedSceneEn)}
                        disabled={!selectedScene.trim() || isCreatingTemplate}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        {isCreatingTemplate ? (
                          <>
                            <Layers className="w-4 h-4 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            生成模板
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={() => downloadTemplate(selectedScene, selectedSceneEn)}
                        disabled={!selectedScene.trim() || isDownloading}
                        variant="outline"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        {isDownloading ? (
                          <>
                            <Download className="w-4 h-4 mr-2 animate-bounce" />
                            下载中...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            下载
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 生成的模板列表 */}
                {templates.length > 0 && (
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        生成的模板列表
                      </CardTitle>
                      <CardDescription>
                        点击模板卡片选中并编辑模板，已选中的模板会显示蓝色边框
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template: any, index) => (
                          <div 
                            key={template.id || index} 
                            onClick={() => handleSelectTemplate(template)}
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                              selectedTemplate?.id === template.id
                                ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{template.component_name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {template.scene_tag}
                                </Badge>
                                {selectedTemplate?.id === template.id && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {template.component_desc}
                            </p>
                            
                            <div className="space-y-2 text-xs text-gray-500">
                              <div>
                                <span className="font-medium">适用组件:</span> {template.applied_components}
                              </div>
                              <div>
                                <span className="font-medium">适用页面:</span> {template.applicable_pages}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">{template.stype_tag}</Badge>
                                <Badge variant="secondary" className="text-xs">{template.function_tag}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 条件显示的模板修改上传卡片 */}
                {selectedTemplate && (
                  <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 animate-in slide-in-from-bottom-2 duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-5 h-5 text-blue-600" />
                          <CardTitle>模板修改上传</CardTitle>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearSelectedTemplate}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </Button>
                      </div>
                      <CardDescription>
                        正在编辑: <span className="font-semibold text-blue-600">{selectedTemplate.component_name}</span> - 上传自定义组件文件，修改模板的样式和功能
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            场景 <span className="text-gray-400">(自动填充)</span>
                          </label>
                          <input
                            type="text"
                            value={templateForm.scene}
                            onChange={(e) => setTemplateForm(prev => ({...prev, scene: e.target.value}))}
                            placeholder="场景名称"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            组件名称 <span className="text-gray-400">(自动填充)</span>
                          </label>
                          <input
                            type="text"
                            value={templateForm.component_name}
                            onChange={(e) => setTemplateForm(prev => ({...prev, component_name: e.target.value}))}
                            placeholder="组件名称"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            风格标签 <span className="text-green-600">(可修改)</span>
                          </label>
                          <input
                            type="text"
                            value={templateForm.stype_tag}
                            onChange={(e) => setTemplateForm(prev => ({...prev, stype_tag: e.target.value}))}
                            placeholder="现代简约, 商务风格..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            功能标签 <span className="text-green-600">(可修改)</span>
                          </label>
                          <input
                            type="text"
                            value={templateForm.function_tag}
                            onChange={(e) => setTemplateForm(prev => ({...prev, function_tag: e.target.value}))}
                            placeholder="交互性, 数据展示..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          模板文件 <span className="text-green-600">(支持 .zip, .tsx, .ts, .jsx, .js 文件)</span>
                        </label>
                        <input
                          type="file"
                          accept=".zip,.tsx,.ts,.jsx,.js"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        {uploadFile && (
                          <div className="mt-2 text-xs text-gray-600">
                            已选择文件: <span className="font-medium">{uploadFile.name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={modifyTemplate}
                          disabled={!templateForm.scene || !templateForm.component_name || !uploadFile}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          上传修改
                        </Button>
                        <Button
                          onClick={clearSelectedTemplate}
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          取消编辑
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">历史场景管理</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    查看已生成的场景列表，选择场景查看其组件详情，并支持下载历史场景的组件包。
                  </p>
                </div>

                {/* 历史场景列表 */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-blue-600" />
                      历史场景列表
                    </CardTitle>
                    <CardDescription>
                      点击场景卡片查看该场景下的组件列表
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingScenes ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">加载场景列表...</p>
                      </div>
                    ) : historyScenes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>暂无历史场景数据</p>
                        <Button 
                          onClick={getSceneList}
                          variant="outline" 
                          className="mt-4"
                        >
                          刷新列表
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {historyScenes.map((scene: any, index) => (
                          <div 
                            key={scene.id || index} 
                            onClick={() => handleSelectHistoryScene(scene)}
                            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                              selectedHistoryScene?.id === scene.id || selectedHistoryScene === scene
                                ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">
                                {scene.scene || scene.scene_cn || '未命名场景'}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {scene.scene_en || 'EN'}
                                </Badge>
                                {(selectedHistoryScene?.id === scene.id || selectedHistoryScene === scene) && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              {scene.description || scene.scene_en || '该场景的组件模板集合'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">场景标识:</span> {scene.scene_en || 'N/A'}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadHistoryScene(scene.scene || scene.scene_cn, scene.scene_en);
                                }}
                                disabled={isDownloadingHistory}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                              >
                                {isDownloadingHistory ? (
                                  <Download className="w-3 h-3 animate-bounce" />
                                ) : (
                                  <>
                                    <Download className="w-3 h-3 mr-1" />
                                    下载
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 选中场景的组件列表 */}
                {selectedHistoryScene && (
                  <Card className="animate-in slide-in-from-bottom-2 duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <CardTitle>
                            {selectedHistoryScene.scene || selectedHistoryScene.scene_cn || '场景'} - 组件列表
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {selectedHistoryScene.scene_en}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => downloadHistoryScene(
                              selectedHistoryScene.scene || selectedHistoryScene.scene_cn, 
                              selectedHistoryScene.scene_en
                            )}
                            disabled={isDownloadingHistory}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            {isDownloadingHistory ? (
                              <>
                                <Download className="w-4 h-4 mr-2 animate-bounce" />
                                下载中...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                下载场景
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        该场景下包含的所有组件模板，点击组件卡片查看详细信息
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingComponents ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-gray-600">加载组件列表...</p>
                        </div>
                      ) : historyComponents.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p>该场景下暂无组件数据</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {historyComponents.map((component: any, index) => (
                            <div 
                              key={component.id || index}
                              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">{component.component_name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {component.scene_tag}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {component.component_desc}
                              </p>
                              
                              <div className="space-y-2 text-xs text-gray-500">
                                <div>
                                  <span className="font-medium">适用组件:</span> {component.applied_components}
                                </div>
                                <div>
                                  <span className="font-medium">适用页面:</span> {component.applicable_pages}
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="secondary" className="text-xs">{component.stype_tag}</Badge>
                                  <Badge variant="secondary" className="text-xs">{component.function_tag}</Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="monitoring" className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Pipeline 监控面板</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    实时监控 Pipeline 执行状态、性能指标和构建历史。
                    提供详细的日志和性能分析报告。
                  </p>
                </div>
                
                {/* 监控面板内容 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        构建性能
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">平均构建时间</span>
                          <span className="font-semibold">2.5 分钟</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">成功率</span>
                          <span className="font-semibold text-green-600">96%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">今日构建</span>
                          <span className="font-semibold">12 次</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        最近执行
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">React 组件库</div>
                            <div className="text-xs text-gray-500">2 分钟前</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Dashboard 项目</div>
                            <div className="text-xs text-gray-500">15 分钟前</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">E-commerce 应用</div>
                            <div className="text-xs text-gray-500">1 小时前</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="mt-12 text-center text-gray-500">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Pipeline 引擎运行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>构建环境就绪</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>部署服务正常</span>
            </div>
          </div>
          <p className="text-sm">
            基于 Docker 和 Kubernetes • 支持多环境部署 • 自动化测试集成
          </p>
        </div>
      </main>

      {/* 重置确认对话框 */}
      <ResetConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={resetSandbox}
        isResetting={isResetting}
      />
    </div>
  );
}
