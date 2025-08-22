// 使用 shadcn/ui 组件库构建头部横幅组件
'use client';

import { FC } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Carousel } from '@/components/ui/carousel';
import { Navbar } from '@/components/ui/navbar';

interface HeaderWithCarouselProps {
  title: string;
  navItems: { label: string; href: string }[];
  carouselImages: { src: string; alt: string }[];
}

const HeaderWithCarousel: FC<HeaderWithCarouselProps> = ({
  title,
  navItems,
  carouselImages,
}) => {
  return (
    <header className="w-full">
      {/* 网站标题和导航菜单 */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <Navbar>
            {navItems.map((item, index) => (
              <Button key={index} variant="link" asChild>
                <a href={item.href} className="text-gray-600 hover:text-gray-800">
                  {item.label}
                </a>
              </Button>
            ))}
          </Navbar>
        </div>
      </div>

      {/* 全屏轮播图 */}
      <div className="relative w-full h-[60vh]">
        <Carousel className="h-full">
          {carouselImages.map((image, index) => (
            <div key={index} className="relative w-full h-full">
              <img
                src={image.src}
                alt={image.alt}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <h2 className="text-4xl font-bold text-white drop-shadow-md">
                  欢迎来到我们的宠物世界
                </h2>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </header>
  );
};

export default HeaderWithCarousel;
