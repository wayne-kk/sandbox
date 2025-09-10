// PinkTechHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Sparkle, ArrowRight, Info } from "lucide-react";

// Color system (exactly 5):
// 1. Primary: #E75480 (Pink)
// 2. Neutral: #ffffff (White)
// 3. Neutral: #1A1A1A (Dark Gray)
// 4. Neutral: #E5E7EB (Light Gray)
// 5. Accent: #A855F7 (Purple)

// Mock data
const HERO_ITEMS = [
  {
    title: "Next-Gen AI Collaboration",
    desc: "Connect with intelligent agents for real-time creative synergy.",
    img: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Seamless Workflow Automation",
    desc: "Automate your business process with pink-powered innovation.",
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Secure Cloud Infrastructure",
    desc: "Experience ultra-fast, ultra-secure cloud deployment.",
    img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
  },
];

export type PinkTechHeroProps = Partial<{
  items: typeof HERO_ITEMS;
  headline: string;
  subline: string;
  ctaLabel: string;
}>;

const PinkTechHero: React.FC<PinkTechHeroProps> = ({
  items = HERO_ITEMS,
  headline = "Welcome to PinkTech",
  subline = "Empowering your business with vibrant technology.",
  ctaLabel = "Get Started",
}) => {
  const [active, setActive] = useState(0);

  const handleCTAClick = () => {
    toast.success("Welcome to PinkTech!", {
      description: "You've triggered the hero CTA.",
      icon: <Sparkle className="text-pink-500" />,
      duration: 2500,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full min-h-[520px] flex flex-col justify-center items-center px-8 py-12 gap-8 bg-white dark:bg-[#1A1A1A]"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="max-w-4xl w-full flex flex-col items-center text-center gap-4"
      >
        <h1 className="text-4xl lg:text-5xl font-bold font-sans text-[#E75480] leading-tight">
          {headline}
        </h1>
        <p className="text-base lg:text-xl font-serif text-[#1A1A1A] dark:text-white leading-relaxed">
          {subline}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="flex flex-row gap-8 justify-center items-center w-full"
      >
        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
          {items.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: 0.05 * idx }}
              className=""
            >
              <Card
                className={`shadow-lg hover:shadow-pink-200 transition-shadow duration-200 border-0 bg-white dark:bg-[#1A1A1A] px-4 pt-4 pb-6 flex flex-col items-center gap-4 cursor-pointer ${
                  active === idx ? "ring-2 ring-[#E75480]" : ""
                }`}
                onClick={() => setActive(idx)}
                aria-label={`Select: ${item.title}`}
              >
                <CardHeader className="flex flex-col items-center gap-2">
                  <Avatar className="w-20 h-20 shadow-md">
                    <AvatarImage src={item.img} alt={item.title} />
                    <AvatarFallback className="bg-[#A855F7] text-white text-lg font-mono">
                      <Info size={32} />
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-lg font-semibold text-[#A855F7] text-center leading-6">
                    {item.title}
                  </h2>
                </CardHeader>
                <CardContent className="text-sm font-sans text-[#1A1A1A] dark:text-white leading-6 text-center">
                  {item.desc}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
      {/* CTA */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="mt-6 flex flex-row gap-4 justify-center items-center"
      >
        <Button
          size="lg"
          className="bg-[#E75480] hover:bg-[#A855F7] text-white font-bold shadow-pink-200 px-7 py-4 text-lg rounded-xl"
          onClick={handleCTAClick}
        >
          {ctaLabel}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PinkTechHero;
