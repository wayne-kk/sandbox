// 使用 shadcn/ui 组件库创建一个时间轴组件，展示网站的创立和发展历程
'use client';

import { FC } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// 定义时间轴事件的类型
interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

// 定义组件的 Props 类型
interface OurStoryTimelineProps {
  events: TimelineEvent[];
}

// 响应式时间轴组件
const OurStoryTimeline: FC<OurStoryTimelineProps> = ({ events }) => {
  return (
    <div className="flex flex-col space-y-6 md:space-y-8">
      {events.map((event, index) => (
        <div key={index} className="flex flex-col md:flex-row md:items-start">
          {/* 时间轴年份 */}
          <div className="flex-shrink-0 w-24 text-lg font-semibold text-gray-700 dark:text-gray-300 md:text-right">
            {event.year}
          </div>

          {/* 时间轴内容 */}
          <div className="flex-1 md:ml-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">{event.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}

      {/* 分隔线 */}
      {events.length > 1 && <Separator className="my-4 md:my-6" />}
    </div>
  );
};

export default OurStoryTimeline;

// 示例用法：
// <OurStoryTimeline
//   events={[
//     { year: '2010', title: '网站创立', description: '我们的网站在2010年正式上线，致力于提供优质服务。' },
//     { year: '2015', title: '重大升级', description: '引入了全新的功能模块，用户体验大幅提升。' },
//     { year: '2020', title: '全球扩展', description: '我们的服务覆盖全球，用户数量突破百万。' },
//   ]}
// />