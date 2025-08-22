// 使用 shadcn/ui 组件库构建的公司简介组件
'use client';

import { FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface CompanyOverviewProps {
  mission: string;
  vision: string;
  teamBackground: string;
  media: {
    type: 'image' | 'video';
    src: string;
    alt?: string;
  };
}

const CompanyOverview: FC<CompanyOverviewProps> = ({ mission, vision, teamBackground, media }) => {
  return (
    <Card className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header Section */}
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">关于我们</CardTitle>
      </CardHeader>

      {/* Media Section */}
      <CardContent>
        <AspectRatio ratio={16 / 9} className="relative">
          {media.type === 'image' ? (
            <Image
              src={media.src}
              alt={media.alt || '公司相关图片'}
              fill
              className="object-cover rounded-md"
            />
          ) : (
            <video
              src={media.src}
              controls
              className="w-full h-full object-cover rounded-md"
            />
          )}
        </AspectRatio>
      </CardContent>

      {/* Mission, Vision, and Team Background */}
      <CardContent className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">使命</h2>
          <p className="text-gray-700">{mission}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">愿景</h2>
          <p className="text-gray-700">{vision}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold">团队背景</h2>
          <p className="text-gray-700">{teamBackground}</p>
        </div>
      </CardContent>

      {/* Footer Section */}
      <CardFooter className="flex justify-center">
        <Button variant="primary">了解更多</Button>
      </CardFooter>
    </Card>
  );
};

export default CompanyOverview;
