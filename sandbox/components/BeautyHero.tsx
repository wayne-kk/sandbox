// components/BeautyHero.tsx
"use client";
import React, { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Color system (example)
// brand.primary: #8f5fe8 (purple)
// neutral.1: #f8f5fc (light bg)
// neutral.2: #2d2238 (main text)
// neutral.3: #b8a9c9 (border/soft text)
// accent.1: #f9b3df (pink)
// accent.2: #5fe8d7 (mint)

export interface BeautyHeroProps {
  headline?: string;
  subheadline?: string;
  badges?: string[];
  ctas?: { label: string; onClick: () => void }[];
  searchPlaceholder?: string;
  heroImages?: { src: string; alt: string }[];
}

const MOCK_BADGES = ["新品上市", "热销爆款", "限时折扣"];
const MOCK_CTA = [
  {
    label: "立即选购",
    onClick: () => {
      if (typeof window !== "undefined") {
        import("sonner").then(({ toast }) => toast("美妆新品已上架！"));
      }
    },
  },
  {
    label: "探索更多",
    onClick: () => {
      if (typeof window !== "undefined") {
        import("sonner").then(({ toast }) => toast("探索美丽新世界！"));
      }
    },
  },
];
const MOCK_HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    alt: "女性模特展示美妆产品",
  },
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    alt: "彩妆产品平铺图",
  },
  {
    src: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
    alt: "艺术美妆装置",
  },
];

const BeautyHero: FC<Partial<BeautyHeroProps>> = ({
  headline = "焕发自信之美，探索你的专属美妆世界",
  subheadline = "甄选全球高端美妆品牌，发现属于你的独特光彩。新品热卖，限时特惠，立刻体验美丽新风尚。",
  badges = MOCK_BADGES,
  ctas = MOCK_CTA,
  searchPlaceholder = "搜索你喜欢的美妆单品/品牌",
  heroImages = MOCK_HERO_IMAGES,
}) => {
  return (
    <motion.section
      className="w-full bg-[linear-gradient(110deg,#f8f5fc_65%,#f9b3df_100%)] dark:bg-[linear-gradient(110deg,#2d2238_65%,#8f5fe8_100%)] px-8 py-16 md:py-20 lg:py-24"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
        {/* Left: Text Content */}
        <div className="flex-1 flex flex-col items-start gap-6">
          <div className="flex flex-row flex-wrap gap-2">
            {badges.map((badge, i) => (
              <Badge
                key={badge}
                className="bg-f9b3df text-2d2238 dark:bg-8f5fe8 dark:text-f8f5fc font-semibold px-3 py-1 rounded-full text-sm tracking-wide shadow"
              >
                {badge}
              </Badge>
            ))}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-2d2238 dark:text-f8f5fc leading-tight">
            {headline}
          </h1>
          <p className="text-lg md:text-xl text-b8a9c9 dark:text-b8a9c9 leading-relaxed max-w-xl">
            {subheadline}
          </p>
          <motion.form
            className="w-full flex items-center gap-2 mt-2"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            onSubmit={e => e.preventDefault()}
          >
            <Input
              className="flex-1 bg-white/90 dark:bg-2d2238/80 border-b8a9c9 focus:border-8f5fe8 h-12 rounded-l-lg px-4 text-base"
              placeholder={searchPlaceholder}
            />
            <Button
              type="submit"
              className="rounded-r-lg h-12 px-5 bg-8f5fe8 text-f8f5fc shadow-lg hover:bg-f9b3df hover:text-2d2238 transition-colors"
              aria-label="搜索美妆"
            >
              <Search className="w-5 h-5 mr-2" /> 搜索
            </Button>
          </motion.form>
          <div className="flex flex-row gap-4 mt-4">
            {ctas.map((cta, i) => (
              <Button
                key={cta.label}
                size="lg"
                className={`font-semibold shadow-lg px-8 py-2 rounded-full bg-8f5fe8 text-f8f5fc hover:bg-f9b3df hover:text-2d2238 transition-colors`}
                onClick={cta.onClick}
              >
                {cta.label}
              </Button>
            ))}
          </div>
        </div>
        {/* Right: Hero Images */}
        <div className="flex-1 flex flex-row gap-4 items-center justify-center">
          <AnimatePresence>
            {heroImages.slice(0, 3).map((img, i) => (
              <motion.div
                key={img.src}
                className={`relative z-10 w-40 md:w-48 lg:w-56 aspect-[4/5] rounded-3xl shadow-2xl overflow-hidden border-4 border-f8f5fc dark:border-2d2238 ${
                  i === 1
                    ? "scale-110 translate-y-0"
                    : i === 0
                    ? "-rotate-6 -translate-y-4"
                    : "rotate-6 translate-y-4"
                } bg-white/80 dark:bg-2d2238/90`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.26 + 0.03 * i }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover object-center rounded-2xl"
                  draggable={false}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
};

export default BeautyHero;
