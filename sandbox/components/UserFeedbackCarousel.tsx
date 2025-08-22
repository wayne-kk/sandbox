// 使用 shadcn/ui 组件库创建用户评价轮播组件
'use client';

import React from 'react';
import { Carousel, CarouselItem } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 定义用户评价的类型
interface UserFeedback {
  id: number;
  name: string;
  feedback: string;
  avatarUrl?: string; // 可选的头像 URL
}

// 定义组件的 Props 类型
interface UserFeedbackCarouselProps {
  feedbacks: UserFeedback[]; // 用户评价列表
}

const UserFeedbackCarousel: React.FC<UserFeedbackCarouselProps> = ({ feedbacks }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Carousel>
        {feedbacks.map((feedback) => (
          <CarouselItem key={feedback.id} className="p-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-4">
                  {feedback.avatarUrl && (
                    <img
                      src={feedback.avatarUrl}
                      alt={`${feedback.name}'s avatar`}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <span>{feedback.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{feedback.feedback}</p>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </Carousel>
    </div>
  );
};

export default UserFeedbackCarousel;

// 示例用法：
// <UserFeedbackCarousel
//   feedbacks={[
//     { id: 1, name: 'Alice', feedback: 'Great service!', avatarUrl: '/avatars/alice.jpg' },
//     { id: 2, name: 'Bob', feedback: 'Very satisfied with the experience.', avatarUrl: '/avatars/bob.jpg' },
//     { id: 3, name: 'Charlie', feedback: 'Highly recommend this website!' },
//   ]}
// />