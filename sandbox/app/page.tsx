import HeroPromoBanner from '@/components/HeroPromoBanner';
import ProductFeatureGrid from '@/components/ProductFeatureGrid';
import CoreValueProposition from '@/components/CoreValueProposition';
import CustomerReviewFeature from '@/components/CustomerReviewFeature';
import LatestPromoHero from '@/components/LatestPromoHero';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '首页 - 购物平台',
  description: '发现热门商品、限时优惠、客户评价与最新动态，尽在我们的购物平台首页。',
};

export default function 首页Page() {
  return (
    <main className="min-h-screen flex flex-col gap-12 bg-background">
      {/* 横幅：全屏轮播促销 */}
      <section className="w-full">
        <HeroPromoBanner />
      </section>

      {/* 核心产品展示：热门商品网格 */}
      <section className="container mx-auto px-4">
        <ProductFeatureGrid />
      </section>

      {/* 价值主张：三列优势 */}
      <section className="container mx-auto px-4">
        <CoreValueProposition />
      </section>

      {/* 客户评价：轮播 */}
      <section className="container mx-auto px-4">
        <CustomerReviewFeature />
      </section>

      {/* 最新动态：促销/公告 */}
      <section className="container mx-auto px-4 pb-12">
        <LatestPromoHero />
      </section>
    </main>
  );
}
