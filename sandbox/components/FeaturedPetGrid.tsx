// 使用 shadcn/ui 组件库创建一个特色宠物展示网格
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid, GridItem } from '@/components/ui/grid';
import Image from 'next/image';
import { FC } from 'react';

// 定义宠物数据的类型
interface Pet {
  id: string;
  name: string;
  species: string;
  imageUrl: string;
}

// 定义组件的 Props 类型
interface FeaturedPetGridProps {
  pets: Pet[]; // 宠物数据数组
}

// 特色宠物展示网格组件
const FeaturedPetGrid: FC<FeaturedPetGridProps> = ({ pets }) => {
  return (
    <Grid className="gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {pets.map((pet) => (
        <GridItem key={pet.id}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Image
                src={pet.imageUrl}
                alt={pet.name}
                width={300}
                height={200}
                className="rounded-md object-cover w-full h-48"
              />
            </CardHeader>
            <CardContent>
              <CardTitle>{pet.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{pet.species}</p>
            </CardContent>
          </Card>
        </GridItem>
      ))}
    </Grid>
  );
};

export default FeaturedPetGrid;
