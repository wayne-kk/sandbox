// 使用 shadcn/ui 组件库创建服务列表组件
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid } from '@/components/ui/grid';
import { Icon } from '@/components/ui/icon';
import React from 'react';

// 定义服务项的类型
interface ServiceItem {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// 服务列表数据
const services: ServiceItem[] = [
  {
    id: 1,
    title: '宠物领养',
    description: '帮助您找到理想的宠物伴侣。',
    icon: <Icon name="paw" />,
  },
  {
    id: 2,
    title: '宠物护理',
    description: '提供专业的宠物护理服务。',
    icon: <Icon name="heart" />,
  },
  {
    id: 3,
    title: '宠物训练课程',
    description: '帮助您的宠物学习基本技能。',
    icon: <Icon name="school" />,
  },
];

// 服务列表组件
const ServiceList: React.FC = () => {
  return (
    <Grid className="gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <Card key={service.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {service.icon}
              {service.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{service.description}</p>
          </CardContent>
        </Card>
      ))}
    </Grid>
  );
};

export default ServiceList;
