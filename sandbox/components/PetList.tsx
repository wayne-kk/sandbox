// 使用 shadcn/ui 组件库创建一个动态加载的宠物列表
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Grid } from '@/components/ui/grid';

// 定义宠物数据的类型
interface Pet {
  id: string;
  name: string;
  age: string;
  image: string;
}

// 宠物列表组件
export default function PetList() {
  const [pets, setPets] = useState<Pet[] | null>(null);
  const [loading, setLoading] = useState(true);

  // 模拟从 API 获取宠物数据
  useEffect(() => {
    setTimeout(() => {
      setPets([
        { id: '1', name: 'Buddy', age: '2 years', image: '/images/buddy.jpg' },
        { id: '2', name: 'Mittens', age: '1 year', image: '/images/mittens.jpg' },
        { id: '3', name: 'Charlie', age: '3 years', image: '/images/charlie.jpg' },
      ]);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Available Pets for Adoption</h1>
      <Grid className="gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full" />
            ))
          : pets?.map((pet) => (
              <Card key={pet.id} className="w-full">
                <CardHeader>
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="w-full h-32 object-cover rounded-t-md"
                  />
                </CardHeader>
                <CardContent>
                  <h2 className="text-lg font-semibold">{pet.name}</h2>
                  <p className="text-sm text-gray-600">Age: {pet.age}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="primary" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
      </Grid>
    </div>
  );
}
