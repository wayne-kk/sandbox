// 使用 shadcn/ui 和 TypeScript 创建一个交互式地图组件
'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface InteractiveMapProps {
  /**
   * 地图的嵌入 URL，通常来自 Google Maps 或其他地图服务
   */
  embedUrl: string;
  /**
   * 地图标题，用于无障碍支持
   */
  title: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ embedUrl, title }) => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <h2 className="text-lg font-semibold">{title}</h2>
      </CardHeader>
      <CardContent>
        {/* 使用 AspectRatio 组件确保地图在不同屏幕尺寸下保持比例 */}
        <AspectRatio ratio={16 / 9}>
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </AspectRatio>
      </CardContent>
    </Card>
  );
};

export default InteractiveMap;
