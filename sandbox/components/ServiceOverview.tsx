// 使用 shadcn/ui 组件库创建服务概览组件
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid, GridItem } from '@/components/ui/grid';
import { Typography } from '@/components/ui/typography';

// 定义服务类型
interface Service {
  id: number;
  title: string;
  description: string;
}

// 服务概览组件
const ServiceOverview: React.FC = () => {
  // 模拟服务数据
  const services: Service[] = [
    {
      id: 1,
      title: '宠物领养',
      description: '为您提供安全可靠的宠物领养服务，帮助您找到理想的宠物伴侣。'
    },
    {
      id: 2,
      title: '宠物护理',
      description: '专业的宠物护理建议和服务，确保您的宠物健康快乐。'
    },
    {
      id: 3,
      title: '宠物用品推荐',
      description: '精选优质宠物用品，满足您宠物的日常需求。'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Typography variant="h2" className="text-center mb-6">
        我们的服务
      </Typography>
      <Grid className="gap-6 md:grid-cols-3 sm:grid-cols-1">
        {services.map((service) => (
          <GridItem key={service.id}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Typography variant="body1">{service.description}</Typography>
              </CardContent>
            </Card>
          </GridItem>
        ))}
      </Grid>
    </div>
  );
};

export default ServiceOverview;