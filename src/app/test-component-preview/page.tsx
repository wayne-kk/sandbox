"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TestComponentPreviewPage() {
  const router = useRouter();

  // Mock组件数据
  const mockComponents = [
    {
      component_name: 'UserProfile',
      scene_tag: '用户中心',
      scene_en: 'user-center',
      stype_tag: '现代简约',
      function_tag: '信息展示, 编辑功能',
      component_desc: '用户个人资料管理组件，支持信息查看和编辑，包含头像、联系方式、工作信息等完整的用户资料管理功能。',
      applied_components: 'Card, Button, Badge, Avatar, Form',
      applicable_pages: '用户中心, 个人设置, 账户管理'
    },
    {
      component_name: 'ProductCard',
      scene_tag: '电商购物',
      scene_en: 'e-commerce',
      stype_tag: '商务专业',
      function_tag: '商品展示, 购物车',
      component_desc: '电商商品卡片组件，支持商品图片、价格、评价展示，包含收藏、加购物车等交互功能。',
      applied_components: 'Card, Button, Badge, Rating',
      applicable_pages: '商品列表, 首页推荐, 分类页面'
    },
    {
      component_name: 'CustomComponent',
      scene_tag: '通用组件',
      scene_en: 'generic',
      stype_tag: '自定义风格',
      function_tag: '通用功能',
      component_desc: '这是一个自定义组件，用于测试预览功能。会自动生成通用的Mock组件代码。',
      applied_components: 'Card, Button, Badge',
      applicable_pages: '任意页面'
    }
  ];

  const navigateToComponent = (component: any) => {
    const componentData = encodeURIComponent(JSON.stringify(component));
    router.push(`/component-detail/test?data=${componentData}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            组件预览功能测试
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            点击下方任意组件卡片，进入详情页面测试实时预览功能
          </p>
          <div className="flex justify-center gap-2 mb-8">
            <Badge variant="outline" className="text-sm">
              Mock API 已启用
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              预览功能可用
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockComponents.map((component, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                  {component.component_name}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {component.scene_tag}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {component.stype_tag}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {component.component_desc}
                </p>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">功能标签: </span>
                    <span className="text-gray-600">{component.function_tag}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">适用页面: </span>
                    <span className="text-gray-600">{component.applicable_pages}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => navigateToComponent(component)}
                    className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700 transition-colors"
                  >
                    查看详情并预览
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">功能说明</h2>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>UserProfile</strong>: 包含完整的用户资料管理功能，支持编辑模式</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>ProductCard</strong>: 电商商品卡片，包含收藏、购物车等交互</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>CustomComponent</strong>: 通用Mock组件，会根据组件名称自动生成</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>所有组件都支持多设备预览（桌面端/平板/移动端）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>支持实时日志查看、新窗口预览、刷新预览等功能</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-gray-500">
            Mock API 路径: <code className="bg-gray-100 px-2 py-1 rounded text-xs">/api/mock/frontend_component/download/[component_name]</code>
          </p>
          
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/debug-sandbox')}
            >
              🔧 Sandbox 调试工具
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('http://192.168.31.161:3100', '_blank')}
            >
              🌐 直接访问 Sandbox
            </Button>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-center">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 重要提醒</h3>
              <p className="text-sm text-yellow-700 mb-3">
                如果iframe预览显示CSP错误，请重启Sandbox服务：
              </p>
              <code className="text-xs bg-yellow-100 px-2 py-1 rounded">./restart-sandbox.sh</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
