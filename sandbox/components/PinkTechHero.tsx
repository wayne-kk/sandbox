// PinkTechHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Rocket, MonitorSmartphone } from "lucide-react";

// Mock data relevant to the hero theme
const features = [
  {
    icon: <Sparkles size={28} className="text-accent-1" />,
    title: "AI-Powered Creativity",
    desc: "Unleash your ideas with smart automation and generative AI."
  },
  {
    icon: <Rocket size={28} className="text-accent-2" />,
    title: "Lightning Performance",
    desc: "Experience ultra-fast technology for seamless workflows."
  },
  {
    icon: <MonitorSmartphone size={28} className="text-brand-primary" />,
    title: "Mobile First Tech",
    desc: "Designs adapt perfectly across devices, always pixel-perfect."
  }
];

// Accessible color system for Pink Tech theme
const COLORS = {
  brand: {
    primary: "#FF4F9A" // Vibrant pink
  },
  neutral: {
    bg: "#F8F8FA",
    surface: "#FFFFFF",
    text: "#1C1C1E",
    border: "#E5E5EA"
  },
  accent: {
    1: "#B56DFF", // Purple accent
    2: "#FFB8EC" // Light pink accent
  }
};

// Props definition
export type PinkTechHeroProps = Partial<{
  title: string;
  subtitle: string;
  ctaLabel: string;
  imageUrl: string;
}>;

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80";

const gradientBg =
  "bg-gradient-to-r from-[#FF4F9A]/90 via-[#B56DFF]/80 to-[#FFB8EC]/70";

const PinkTechHero: React.FC<PinkTechHeroProps> = ({
  title = "Empower Your Ideas with Pink Tech",
  subtitle = "A futuristic platform for creators, powered by AI & beautiful design.",
  ctaLabel = "Get Started",
  imageUrl = DEFAULT_IMAGE
}) => {
  const [loading, setLoading] = useState(false);

  const handleCta = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success("Welcome aboard! 🚀 Pink Tech activated.");
      setLoading(false);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.23 } }}
      className={`w-full min-h-[520px] flex items-center justify-center ${gradientBg} px-8 py-20 md:py-24 lg:py-32`}
      style={{
        color: COLORS.neutral.text,
        backgroundColor: COLORS.neutral.bg
      }}
    >
      <div className="flex flex-row gap-16 items-center w-full max-w-6xl">
        {/* Left: Content */}
        <div className="flex-1 flex flex-col gap-8 items-start justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
            className="text-4xl lg:text-5xl font-extrabold font-sans leading-tight mb-2 text-brand-primary"
            style={{ color: COLORS.brand.primary }}
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.21 } }}
            className="text-lg md:text-xl font-serif leading-relaxed text-neutral-700 mb-2"
            style={{ color: COLORS.neutral.text }}
          >
            {subtitle}
          </motion.p>
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-2">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.18 + i * 0.04 } }}
              >
                <Card className="flex flex-col items-center gap-2 px-4 py-6 shadow-lg rounded-xl bg-white border border-neutral-200">
                  <div>{f.icon}</div>
                  <div className="text-lg font-semibold text-brand-primary" style={{ color: COLORS.brand.primary }}>{f.title}</div>
                  <div className="text-sm font-serif text-neutral-600 leading-6 text-center" style={{ color: COLORS.neutral.text }}>{f.desc}</div>
                </Card>
              </motion.div>
            ))}
          </div>
          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
            className="mt-4"
          >
            <Button
              size="lg"
              className="shadow-xl font-sans bg-brand-primary hover:bg-accent-1 text-white px-7 py-3 text-lg rounded-full transition-colors"
              style={{ backgroundColor: COLORS.brand.primary }}
              disabled={loading}
              onClick={handleCta}
            >
              {loading ? "Loading..." : (
                <span className="flex items-center gap-2">
                  {ctaLabel} <ArrowRight size={20} />
                </span>
              )}
            </Button>
          </motion.div>
        </div>
        {/* Right: Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.21 } }}
          className="flex-1 flex items-center justify-center"
        >
          <Card className="shadow-2xl p-0 bg-white rounded-3xl overflow-hidden border-0 max-w-lg w-full">
            <img
              src={imageUrl}
              alt="Pink Tech Hero Visual"
              className="w-full h-96 object-cover"
              style={{ background: COLORS.accent[2] }}
            />
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PinkTechHero;
