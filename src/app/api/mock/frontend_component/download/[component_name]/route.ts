import { NextRequest, NextResponse } from 'next/server';

// Mock 组件代码数据
const mockComponents: { [key: string]: any } = {
  'UserProfile': {
    success: true,
    data: {
      files: [
        {
          path: 'components/UserProfile.tsx',
          content: `'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  Save, 
  X,
  Calendar,
  Briefcase,
  Globe
} from 'lucide-react';

interface UserProfileProps {
  className?: string;
}

export default function UserProfile({ className }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '张三',
    email: 'zhangsan@example.com',
    phone: '+86 138 0013 8000',
    location: '北京市朝阳区',
    bio: '热爱技术的全栈开发工程师，专注于 React 和 Node.js 开发。',
    company: 'TechCorp',
    joinDate: '2023-01-15',
    website: 'https://zhangsan.dev'
  });

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const saveProfile = () => {
    setIsEditing(false);
    // 这里可以添加保存逻辑
  };

  return (
    <div className={\`w-full max-w-4xl mx-auto p-6 space-y-6 \${className}\`}>
      {/* 个人资料卡片 */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardHeader className="relative -mt-16 pb-4">
          <div className="flex items-end space-x-4">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage src="/api/placeholder/96/96" alt="用户头像" />
              <AvatarFallback className="text-2xl font-bold bg-blue-500 text-white">
                {userInfo.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {userInfo.name}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {userInfo.company} • {userInfo.location}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    在线
                  </Badge>
                  {!isEditing ? (
                    <Button onClick={toggleEdit} variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      编辑资料
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={saveProfile} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                      <Button onClick={toggleEdit} variant="outline" size="sm">
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 个人简介 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">个人简介</h3>
            {isEditing ? (
              <textarea
                value={userInfo.bio}
                onChange={(e) => setUserInfo(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            ) : (
              <p className="text-gray-600 leading-relaxed">{userInfo.bio}</p>
            )}
          </div>

          {/* 联系信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">联系方式</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <span className="text-gray-600">{userInfo.email}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <span className="text-gray-600">{userInfo.phone}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={userInfo.location}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, location: e.target.value }))}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <span className="text-gray-600">{userInfo.location}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="url"
                      value={userInfo.website}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, website: e.target.value }))}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://"
                    />
                  ) : (
                    <a href={userInfo.website} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-600 hover:underline">
                      {userInfo.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">工作信息</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={userInfo.company}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, company: e.target.value }))}
                      className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <span className="text-gray-600">{userInfo.company}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">入职时间: {userInfo.joinDate}</span>
                </div>
              </div>

              {/* 技能标签 */}
              <div>
                <h4 className="font-medium mb-2">技能标签</h4>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Node.js', 'Python', 'Docker', 'AWS'].map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">127</div>
              <div className="text-sm text-gray-500">项目数量</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">1,234</div>
              <div className="text-sm text-gray-500">代码提交</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">89</div>
              <div className="text-sm text-gray-500">团队协作</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 最近活动 */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
          <CardDescription>最近的项目和代码活动记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: '提交代码', project: 'React Dashboard', time: '2小时前', status: 'success' },
              { action: '创建项目', project: 'Vue E-commerce', time: '1天前', status: 'info' },
              { action: '合并分支', project: 'Node API', time: '3天前', status: 'warning' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={\`w-3 h-3 rounded-full \${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                  }\`}></div>
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-gray-500">{activity.project}</div>
                  </div>
                </div>
                <span className="text-sm text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`,
          type: 'component'
        }
      ],
      dependencies: ['react', '@types/react', 'tailwindcss', 'lucide-react'], // 可选，仅用于显示
      metadata: { // 可选，仅用于信息展示
        lastModified: new Date().toISOString(),
        fileCount: 1,
        totalSize: 8950
      }
    }
  },
  'ProductCard': {
    success: true,
    data: {
      files: [
        {
          path: 'components/ProductCard.tsx',
          content: `'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Eye,
  Share2,
  TrendingUp
} from 'lucide-react';

interface ProductCardProps {
  className?: string;
}

export default function ProductCard({ className }: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  const product = {
    id: 1,
    name: 'Premium Wireless Headphones',
    price: 199.99,
    originalPrice: 299.99,
    discount: 33,
    rating: 4.8,
    reviews: 1247,
    image: '/api/placeholder/300/300',
    badge: 'Best Seller',
    category: 'Electronics',
    inStock: true,
    freeShipping: true
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const addToCart = () => {
    setIsInCart(!isInCart);
  };

  return (
    <div className={\`w-full max-w-sm mx-auto \${className}\`}>
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
        {/* 商品图片区域 */}
        <div className="relative overflow-hidden bg-gray-100">
          <div className="aspect-square relative">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* 折扣标签 */}
            {product.discount > 0 && (
              <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                -{product.discount}%
              </Badge>
            )}
            
            {/* 销售标签 */}
            {product.badge && (
              <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                {product.badge}
              </Badge>
            )}

            {/* 快速操作按钮 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white"
                  onClick={toggleFavorite}
                >
                  <Heart className={\`w-4 h-4 \${isFavorite ? 'fill-red-500 text-red-500' : ''}\`} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 库存状态 */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-6 py-2">
                  缺货
                </Badge>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* 商品分类 */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
            {product.freeShipping && (
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                免费配送
              </Badge>
            )}
          </div>

          {/* 商品名称 */}
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* 评价信息 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={\`w-4 h-4 \${
                    i < Math.floor(product.rating) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }\`} 
                />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-gray-500">({product.reviews})</span>
          </div>

          {/* 价格信息 */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ¥{product.price}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-lg text-gray-500 line-through">
                  ¥{product.originalPrice}
                </span>
              )}
            </div>
            {product.originalPrice > product.price && (
              <div className="text-sm text-red-600 font-medium">
                节省 ¥{(product.originalPrice - product.price).toFixed(2)}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={addToCart}
              disabled={!product.inStock}
              className={\`flex-1 \${
                isInCart 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }\`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {isInCart ? '已加入购物车' : '加入购物车'}
            </Button>
            <Button
              variant="outline"
              onClick={toggleFavorite}
              className={\`\${isFavorite ? 'text-red-500 border-red-200' : ''}\`}
            >
              <Heart className={\`w-4 h-4 \${isFavorite ? 'fill-current' : ''}\`} />
            </Button>
          </div>

          {/* 额外信息 */}
          <div className="text-xs text-gray-500 space-y-1">
            {product.freeShipping && (
              <div>✓ 免费配送，预计2-3天送达</div>
            )}
            <div>✓ 30天无理由退货</div>
            <div>✓ 12个月质保服务</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`,
          type: 'component'
        }
      ],
      dependencies: ['react', '@types/react', 'tailwindcss', 'lucide-react'],
      metadata: {
        lastModified: new Date().toISOString(),
        fileCount: 1,
        totalSize: 6420
      }
    }
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { component_name: string } }
) {
  try {
    const componentName = params.component_name;
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // 检查是否有对应的mock数据
    if (mockComponents[componentName]) {
      return NextResponse.json(mockComponents[componentName]);
    }
    
    // 如果没有预定义的组件，生成一个通用的mock组件
    const genericComponent = {
      success: true,
      data: {
        files: [
          {
            path: `components/${componentName}.tsx`,
            content: `'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className }: ${componentName}Props) {
  return (
    <div className={\`w-full max-w-2xl mx-auto p-6 \${className}\`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            ${componentName} 组件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-gray-600">
            这是一个 Mock 的 ${componentName} 组件，用于预览测试。
          </div>
          
          <div className="flex justify-center space-x-2">
            <Badge variant="outline">Mock组件</Badge>
            <Badge variant="secondary">React</Badge>
            <Badge variant="secondary">TypeScript</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">特性 1</h3>
              <p className="text-sm text-blue-700">
                响应式设计，适配各种屏幕尺寸
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">特性 2</h3>
              <p className="text-sm text-green-700">
                TypeScript 支持，提供完整的类型安全
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">特性 3</h3>
              <p className="text-sm text-purple-700">
                Tailwind CSS 样式，现代化的视觉效果
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">特性 4</h3>
              <p className="text-sm text-orange-700">
                易于定制和扩展的组件架构
              </p>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 mt-6">
            <Button className="bg-blue-600 hover:bg-blue-700">
              主要操作
            </Button>
            <Button variant="outline">
              次要操作
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">组件信息：</div>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 组件名称: ${componentName}</li>
              <li>• 创建时间: ${new Date().toLocaleString()}</li>
              <li>• 状态: Mock 数据</li>
              <li>• 框架: React + TypeScript</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}`,
            type: 'component'
          }
        ],
        dependencies: ['react', '@types/react', 'tailwindcss', 'lucide-react'],
        metadata: {
          lastModified: new Date().toISOString(),
          fileCount: 1,
          totalSize: 2840
        }
      }
    };
    
    return NextResponse.json(genericComponent);
    
  } catch (error) {
    console.error('Mock API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch component data'
      },
      { status: 500 }
    );
  }
}
