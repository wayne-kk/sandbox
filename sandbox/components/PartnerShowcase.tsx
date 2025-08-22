// 使用 shadcn/ui 组件库创建合作伙伴展示组件
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Grid } from '@/components/ui/grid';
import { cn } from '@/lib/utils';
import { FC } from 'react';

// 定义合作伙伴数据的类型
interface Partner {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
}

// 定义组件的 Props 类型
interface PartnerShowcaseProps {
  partners: Partner[];
}

// 合作伙伴展示组件
const PartnerShowcase: FC<PartnerShowcaseProps> = ({ partners }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">我们的合作伙伴</h2>
      <Grid className="gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <Card key={partner.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex items-center space-x-4">
              <Avatar src={partner.logoUrl} alt={partner.name} className="w-16 h-16" />
              <CardTitle>{partner.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{partner.description}</p>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </div>
  );
};

export default PartnerShowcase;

// 示例用法：
// <PartnerShowcase
//   partners={[
//     { id: '1', name: '宠物医院A', description: '提供专业的宠物医疗服务。', logoUrl: '/images/hospital-a.png' },
//     { id: '2', name: '宠物商店B', description: '优质的宠物用品和食品。', logoUrl: '/images/store-b.png' },
//     { id: '3', name: '宠物培训中心C', description: '专业的宠物行为训练。', logoUrl: '/images/training-c.png' },
//   ]}
// />