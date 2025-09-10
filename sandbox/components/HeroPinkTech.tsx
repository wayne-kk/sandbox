// HeroPinkTech.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Sparkle, ArrowRight, Star } from "lucide-react";

// Color system
// brand.primary: #FF53A7 (pink)
// neutral.100: #F7F7FB (background)
// neutral.700: #232335 (surface/text)
// accent.1: #FFD6EC (light pink accent)
// accent.2: #7D3AFF (violet accent)

export type HeroPinkTechProps = Partial<{
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  highlights: Array<{ icon: React.ReactNode; text: string }>;
  imageUrl: string;
}>;

const mockHighlights = [
  { icon: <Sparkle size={20} className="text-[accent.2]" />, text: "AI智能加持" },
  { icon: <Star size={20} className="text-[accent.2]" />, text: "高效云服务" },
  { icon: <ArrowRight size={20} className="text-[accent.2]" />, text: "一键启动" },
];

const mockImage =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

const gradientBg =
  "bg-gradient-to-tr from-[#FF53A7]/80 via-[#FFD6EC]/80 to-[#7D3AFF]/80";
const overlay =
  "bg-neutral-100/80 dark:bg-neutral-700/80 backdrop-blur-md";

function HeroPinkTech({
  title = "粉色未来，科技引领",
  subtitle = "发现创新科技，感受智能浪潮。为您打造更美好未来。",
  ctaLabel = "立即体验",
  ctaUrl = "#",
  highlights = mockHighlights,
  imageUrl = mockImage,
}: HeroPinkTechProps) {
  const [loading, setLoading] = useState(false);

  const handleCTA = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success("欢迎体验粉色科技世界！");
      setLoading(false);
    }, 1200);
  };

  return (
    <section
      className={
        `relative w-full min-h-[480px] flex items-center justify-center ${gradientBg}`
      }
    >
      {/* Overlay for contrast */}
      <div className={`absolute inset-0 ${overlay} z-0`} />
      <div
        className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 py-16 px-6 lg:px-20 max-w-[1280px] w-full mx-auto"
      >
        {/* Left: Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.22 } }}
          className="flex-1 flex flex-col gap-5 lg:gap-7"
        >
          <h1
            className="font-sans text-3xl md:text-4xl lg:text-5xl font-bold text-[#FF53A7] drop-shadow-lg leading-tight"
          >
            {title}
          </h1>
          <p
            className="font-sans text-base lg:text-lg text-neutral-700 dark:text-neutral-100 leading-relaxed max-w-xl"
          >
            {subtitle}
          </p>
          <div className="flex flex-col md:flex-row gap-4 mt-2">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Button
                size="lg"
                className="bg-[#FF53A7] hover:bg-[#7D3AFF] text-white shadow-xl font-semibold px-8 py-4 text-lg rounded-xl"
                onClick={handleCTA}
                disabled={loading}
              >
                {ctaLabel}
              </Button>
            </motion.div>
          </div>
          {/* Highlights */}
          <div className="flex flex-wrap gap-4 mt-6">
            {highlights.map((item, idx) => (
              <Card
                key={idx}
                className="flex items-center gap-2 px-4 py-2 shadow-lg bg-[#FFD6EC] dark:bg-[#7D3AFF]/30 border-0"
              >
                <span className="text-[#7D3AFF]">{item.icon}</span>
                <span className="font-sans text-sm text-[#232335] dark:text-neutral-100 font-medium">
                  {item.text}
                </span>
              </Card>
            ))}
          </div>
        </motion.div>
        {/* Right: Image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.22 } }}
          className="flex-1 flex items-center justify-center w-full"
        >
          <Card
            className="shadow-2xl bg-neutral-100/80 dark:bg-neutral-700/80 border-0 rounded-2xl p-0 overflow-hidden max-w-[420px]"
          >
            <Avatar className="w-full h-[320px] md:h-[400px] rounded-2xl">
              <AvatarImage src={imageUrl} alt="科技英雄图" className="object-cover w-full h-full" />
              <AvatarFallback className="flex items-center justify-center text-4xl font-mono text-[#FF53A7] bg-[#FFD6EC]">
                Tech
              </AvatarFallback>
            </Avatar>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroPinkTech;
