// ChildrenServicesHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Sparkles, Heart, Smile, BookOpen } from "lucide-react";

// Color system (warm, playful for children's services)
const COLORS = {
  brand: {
    primary: "#FF8C42" // vibrant orange
  },
  neutral: {
    background: "#FFF9F4",
    surface: "#FFFFFF",
    text: "#2D2D2D"
  },
  accent: {
    1: "#FFD166", // warm yellow
    2: "#49C6E5" // playful blue
  }
};

// Mock data for hero highlights
const HERO_FEATURES = [
  {
    icon: <Sparkles className="w-6 h-6 text-[#FFD166]" />, // accent.1
    title: "Creative Play",
    desc: "Safe spaces for children to explore and express themselves."
  },
  {
    icon: <Heart className="w-6 h-6 text-[#FF8C42]" />, // brand.primary
    title: "Caring Staff",
    desc: "Warm, friendly professionals dedicated to every child's wellbeing."
  },
  {
    icon: <Smile className="w-6 h-6 text-[#49C6E5]" />, // accent.2
    title: "Inclusive Community",
    desc: "Welcoming environment for every family and child."
  },
  {
    icon: <BookOpen className="w-6 h-6 text-[#2D2D2D]" />, // neutral.text
    title: "Learning & Growth",
    desc: "Programs supporting curiosity and development."
  }
];

const HERO_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    alt: "Children playing together in a sunny, safe environment"
  },
  {
    src: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
    alt: "Happy teacher with children in classroom"
  },
  {
    src: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
    alt: "Children drawing and learning in group activity"
  }
];

export type ChildrenServicesHeroProps = Partial<{
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaOnClick: () => void;
  images: typeof HERO_IMAGES;
  features: typeof HERO_FEATURES;
}>;

const ChildrenServicesHero: React.FC<ChildrenServicesHeroProps> = ({
  headline = "Welcome to Sunny Steps Children's Services!",
  subline = "Nurturing curiosity, creativity, and care for every child.",
  ctaLabel = "Book a Visit",
  ctaOnClick,
  images = HERO_IMAGES,
  features = HERO_FEATURES
}) => {
  // Image carousel state (for hero image)
  const [imgIdx, setImgIdx] = useState(0);

  // CTA handler
  const handleCTA = () => {
    if (ctaOnClick) {
      ctaOnClick();
    } else {
      toast.success("Visit booked! Our team will contact you soon.");
    }
  };

  return (
    <motion.div
      className="w-full min-h-[520px] flex flex-col lg:flex-row items-center justify-between gap-8 bg-[#FFF9F4] px-8 py-12 lg:py-16 lg:px-20"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* Left: Text content */}
      <div className="flex-1 flex flex-col gap-6 max-w-xl lg:max-w-2xl">
        <motion.h1
          className="font-sans text-4xl lg:text-5xl font-bold text-[#FF8C42] mb-2 leading-tight"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, delay: 0.06 }}
        >
          {headline}
        </motion.h1>
        <motion.p
          className="font-sans text-lg lg:text-xl text-[#2D2D2D] leading-relaxed mb-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14, delay: 0.11 }}
        >
          {subline}
        </motion.p>
        {/* Features list */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              className="flex flex-col items-center gap-2 bg-[#FFFFFF] p-4 rounded-xl shadow-md"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.17, delay: idx * 0.035 }}
            >
              <div>{feature.icon}</div>
              <div className="font-sans text-base font-semibold text-[#FF8C42] text-center">
                {feature.title}
              </div>
              <div className="font-sans text-sm text-[#2D2D2D] text-center leading-6">
                {feature.desc}
              </div>
            </motion.div>
          ))}
        </div>
        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.13, delay: 0.21 }}
        >
          <Button
            className="mt-6 px-8 py-3 text-lg font-bold rounded-full shadow-lg bg-[#FF8C42] hover:bg-[#FFD166] text-[#2D2D2D] transition"
            onClick={handleCTA}
            aria-label={ctaLabel}
          >
            {ctaLabel}
          </Button>
        </motion.div>
      </div>
      {/* Right: Hero image carousel */}
      <motion.div
        className="flex-1 flex flex-col items-center lg:items-end gap-4"
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18, delay: 0.1 }}
      >
        <Card className="w-full max-w-md lg:max-w-lg shadow-xl rounded-2xl overflow-hidden bg-[#FFFFFF]">
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={images[imgIdx].src}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22 }}
              >
                <img
                  src={images[imgIdx].src}
                  alt={images[imgIdx].alt}
                  className="w-full h-[320px] object-cover"
                  style={{ background: COLORS.neutral.surface }}
                />
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
        {/* Carousel controls */}
        <div className="flex items-center gap-2 mt-2">
          {images.map((img, idx) => (
            <button
              key={img.src}
              className={`w-3 h-3 rounded-full border-2 border-[#FF8C42] bg-${imgIdx === idx ? '[#FFD166]' : '[#FFF9F4]'} transition-all duration-150`}
              aria-label={`Show image ${idx + 1}`}
              style={{ boxShadow: imgIdx === idx ? '0 2px 8px #FFD16670' : undefined }}
              onClick={() => setImgIdx(idx)}
            />
          ))}
        </div>
        {/* Avatar group (mocked children faces for social proof) */}
        <div className="flex items-center gap-2 mt-4">
          <Avatar className="shadow-lg">
            <AvatarImage src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=64&q=80" alt="Smiling child" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <Avatar className="shadow-lg">
            <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="Happy child" />
            <AvatarFallback>HC</AvatarFallback>
          </Avatar>
          <Avatar className="shadow-lg">
            <AvatarImage src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&q=80" alt="Laughing child" />
            <AvatarFallback>LC</AvatarFallback>
          </Avatar>
          <span className="font-sans text-sm font-medium text-[#2D2D2D] ml-2">+1,000 happy children</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChildrenServicesHero;
