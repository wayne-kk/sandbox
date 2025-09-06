import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

// 模拟组件文件内容生成
const generateComponentFiles = (scene: string) => {
  const files: Record<string, string> = {};

  // 根据场景生成不同的组件文件
  switch (scene) {
    case '电商平台':
      files['ProductCard.tsx'] = `
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  rating: number;
  onAddToCart: () => void;
}

export default function ProductCard({ name, price, image, rating, onAddToCart }: ProductCardProps) {
  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img src={image} alt={name} className="w-full h-48 object-cover" />
        <Badge className="absolute top-2 right-2">热销</Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{name}</h3>
        <div className="flex items-center mb-2">
          <span className="text-2xl font-bold text-red-600">¥{price}</span>
          <div className="ml-auto flex items-center">
            <span className="text-sm text-gray-500">评分: {rating}</span>
          </div>
        </div>
        <Button onClick={onAddToCart} className="w-full">
          加入购物车
        </Button>
      </CardContent>
    </Card>
  );
}`;

      files['ShoppingCart.tsx'] = `
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export default function ShoppingCart({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }: ShoppingCartProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            购物车 <Badge>{items.length}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
              <div className="flex-1">
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-red-600 font-bold">¥{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}>
                  -
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button size="sm" variant="outline" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                  +
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onRemoveItem(item.id)}>
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">总计:</span>
            <span className="text-2xl font-bold text-red-600">¥{total.toFixed(2)}</span>
          </div>
          <Button className="w-full" size="lg">
            立即结算
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}`;
      break;

    case '后台管理系统':
      files['DataTable.tsx'] = `
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  title: string;
  sortable?: boolean;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onFilter?: (value: string) => void;
}

export default function DataTable({ data, columns, onSort, onFilter }: DataTableProps) {
  const [sortKey, setSortKey] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort?.(key, newDirection);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索..."
          onChange={(e) => onFilter?.(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column.key} className="font-semibold">
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 p-0 h-auto font-semibold"
                    >
                      {column.title}
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : null}
                    </Button>
                  ) : (
                    column.title
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map(column => (
                  <TableCell key={column.key}>
                    {row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}`;
      break;

    case '数据分析平台':
      files['ChartPanel.tsx'] = `
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';

interface ChartPanelProps {
  title: string;
  data: any[];
  chartType?: 'line' | 'bar' | 'pie';
  onExport?: () => void;
  onFilter?: () => void;
}

export default function ChartPanel({ title, data, chartType = 'line', onExport, onFilter }: ChartPanelProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onFilter}>
              <Filter className="w-4 h-4 mr-1" />
              筛选
            </Button>
            <Button size="sm" variant="outline" onClick={onExport}>
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-gray-500">
              {chartType} 图表区域 - 集成您的图表库
            </p>
            <p className="text-sm text-gray-400 mt-1">
              数据点: {data.length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}`;
      break;

    default:
      // 默认通用组件
      files['CustomComponent.tsx'] = `
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CustomComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export default function CustomComponent({ title, description, onAction }: CustomComponentProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-gray-600">{description}</p>
        )}
        <div className="flex gap-2">
          <Button onClick={onAction}>
            操作
          </Button>
          <Button variant="outline">
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}`;
  }

  // 添加通用文件
  files['index.ts'] = `
// 组件导出文件
${Object.keys(files).map(filename => {
  const componentName = filename.replace('.tsx', '');
  return `export { default as ${componentName} } from './${componentName}';`;
}).join('\n')}
`;

  files['README.md'] = `
# ${scene} 组件模板

这个模板包包含了适用于 ${scene} 的常用组件。

## 包含组件

${Object.keys(files).filter(f => f.endsWith('.tsx')).map(filename => {
  const componentName = filename.replace('.tsx', '');
  return `- **${componentName}**: 针对 ${scene} 场景优化的组件`;
}).join('\n')}

## 使用方法

1. 将组件文件复制到你的项目中
2. 根据需要调整组件样式和功能
3. 在你的页面中导入和使用组件

## 依赖

这些组件基于以下库构建：
- React
- TypeScript
- Tailwind CSS
- Radix UI / shadcn/ui

请确保你的项目中已安装这些依赖。
`;

  return files;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scene = searchParams.get('scene');

    if (!scene) {
      return NextResponse.json(
        { error: "场景参数不能为空" },
        { status: 400 }
      );
    }

    // 生成组件文件
    const files = generateComponentFiles(scene);

    // 创建 ZIP 压缩包
    const zip = new JSZip();
    
    // 创建场景文件夹
    const sceneFolder = zip.folder(scene);
    
    // 添加文件到压缩包
    Object.entries(files).forEach(([filename, content]) => {
      sceneFolder?.file(filename, content);
    });

    // 生成 ZIP 文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // 返回文件下载响应
    const response = new NextResponse(zipBuffer);
    response.headers.set('Content-Type', 'application/zip');
    response.headers.set('Content-Disposition', `attachment; filename="${scene}_templates.zip"`);
    
    return response;

  } catch (error) {
    console.error('下载模板错误:', error);
    return NextResponse.json(
      { error: "生成模板文件失败" },
      { status: 500 }
    );
  }
}
