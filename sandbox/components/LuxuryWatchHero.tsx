// LuxuryWatchHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronRight, Star, ShoppingCart } from "lucide-react";

// Color system
const colorTheme = {
  brand: {
    primary: "#6C3EB7" // Royal Purple (Luxury)
  },
  neutral: {
    bg: "#F8F6F9", // Light gray background
    surface: "#FFFFFF",
    text: "#212024",
    border: "#D7D2E0"
  },
  accent: {
    1: "#CDAA7D", // Gold accent
    2: "#7D94C9"  // Subtle blue accent
  }
};

// Mock luxury watch data
const watchHighlights = [
  {
    id: 1,
    name: "Rolex Cosmograph Daytona",
    desc: "Precision and prestige, crafted in 18ct gold.",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    name: "Omega De Ville Tourbillon",
    desc: "Timeless elegance meets mechanical mastery.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    name: "Audemars Piguet Royal Oak",
    desc: "Iconic octagonal design with exquisite finishing.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
  }
];

export type LuxuryWatchHeroProps = Partial<{
  headline: string;
  subheadline: string;
  ctaLabel: string;
  featuredWatches: typeof watchHighlights;
  gradientFrom?: string;
  gradientTo?: string;
}>;

const defaultHeadline = "Experience Timeless Luxury";
const defaultSubheadline = "Discover the world's finest timepieces.";
const defaultCtaLabel = "Explore Collection";

const LuxuryWatchHero: React.FC<LuxuryWatchHeroProps> = ({
  headline = defaultHeadline,
  subheadline = defaultSubheadline,
  ctaLabel = defaultCtaLabel,
  featuredWatches = watchHighlights,
  gradientFrom = colorTheme.brand.primary,
  gradientTo = colorTheme.accent[1]
}) => {
  const [selected, setSelected] = useState<number>(0);

  // Responsive image/slider section
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={
        `relative flex flex-col lg:flex-row items-center justify-between min-h-[520px] w-full px-8 py-16 gap-8 lg:gap-16 bg-[${colorTheme.neutral.bg}]`
      }
      style={{
        background:
          `linear-gradient(90deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
      }}
    >
      {/* Text Section */}
      <div className="flex-1 flex flex-col items-start justify-center lg:max-w-xl gap-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="font-serif text-4xl lg:text-5xl font-bold leading-tight text-[${colorTheme.neutral.text}]"
        >
          {headline}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="font-sans text-lg lg:text-xl leading-relaxed text-[${colorTheme.neutral.text}]/90"
        >
          {subheadline}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="flex flex-row gap-4 items-center mt-2"
        >
          <Button
            size="lg"
            className={
              `shadow-lg font-semibold rounded-lg px-7 py-3 bg-[${colorTheme.brand.primary}] hover:bg-[${colorTheme.accent[1]}] text-white text-base transition-colors duration-200`
            }
            onClick={() => {
              toast.success("Welcome to the luxury collection!", {
                description: "Browse exclusive timepieces."
              });
            }}
          >
            <span>{ctaLabel}</span>
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
        {/* Featured watches badges */}
        <div className="flex flex-row gap-2 mt-5">
          {featuredWatches.map((watch, idx) => (
            <Badge
              key={watch.id}
              variant={selected === idx ? "default" : "outline"}
              className={
                `px-3 py-1 font-sans text-sm font-semibold rounded-full cursor-pointer shadow ${selected === idx ? `bg-[${colorTheme.accent[1]}] text-white` : `bg-[${colorTheme.neutral.surface}] text-[${colorTheme.neutral.text}] border-[${colorTheme.neutral.border}]`}`
              }
              onClick={() => setSelected(idx)}
            >
              <Star className="inline-block mr-1 w-4 h-4 text-[${colorTheme.accent[1]}]" />
              {watch.name.split(" ")[0]}
            </Badge>
          ))}
        </div>
      </div>
      {/* Image & Watch Card Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="flex-1 flex flex-col items-center justify-center gap-6 lg:max-w-md w-full"
      >
        <Card
          className={
            `shadow-2xl bg-[${colorTheme.neutral.surface}] border-[${colorTheme.neutral.border}] p-0 overflow-hidden max-w-md w-full`
          }
        >
          <CardContent className="p-0">
            <motion.img
              key={featuredWatches[selected].image}
              src={featuredWatches[selected].image}
              alt={featuredWatches[selected].name}
              className="w-full h-[300px] object-cover"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
              style={{ borderBottom: `2px solid ${colorTheme.brand.primary}` }}
            />
            <div className="p-6 flex flex-col gap-3">
              <h2 className="font-serif text-2xl font-bold text-[${colorTheme.brand.primary}] leading-tight">
                {featuredWatches[selected].name}
              </h2>
              <p className="font-sans text-base leading-relaxed text-[${colorTheme.neutral.text}]/85">
                {featuredWatches[selected].desc}
              </p>
              <Button
                variant="outline"
                className={
                  `shadow font-semibold border-[${colorTheme.brand.primary}] text-[${colorTheme.brand.primary}] px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-[${colorTheme.brand.primary}] hover:text-white transition-colors duration-200`
                }
                onClick={() => {
                  toast.success("Added to cart!", {
                    description: featuredWatches[selected].name
                  });
                }}
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default LuxuryWatchHero;
