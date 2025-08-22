// 使用 shadcn/ui 组件库创建的底部 CTA 组件
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';

interface BottomCTAProps {
  onAdoptNowClick?: () => void; // 点击“立即领养”按钮的回调
  onContactUsClick?: () => void; // 点击“联系我们”按钮的回调
}

const BottomCTA: React.FC<BottomCTAProps> = ({ onAdoptNowClick, onContactUsClick }) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-6 bg-gray-100 border-t border-gray-200',
        'md:flex-row md:justify-between'
      )}
    >
      <div className="text-center md:text-left">
        <h2 className="text-xl font-semibold text-gray-800">准备好领养一只宠物了吗？</h2>
        <p className="text-gray-600">点击下方按钮开始您的领养之旅，或联系我们了解更多信息。</p>
      </div>
      <div className="flex flex-col gap-4 md:flex-row">
        <Button variant="primary" onClick={onAdoptNowClick} className="w-full md:w-auto">
          立即领养
        </Button>
        <Button variant="outline" onClick={onContactUsClick} className="w-full md:w-auto">
          联系我们
        </Button>
      </div>
    </div>
  );
};

export default BottomCTA;
