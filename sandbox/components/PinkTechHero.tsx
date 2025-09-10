// PinkTechHero.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import React from "react";

// Color palette
const COLORS = {
  brand: {
    primary: "#ED4B86"
  },
  neutral: {
    bg: "#FDF6FB",
    surface: "#FFFFFF",
    text: "#191825",
    border: "#E9D5EC"
  },
  accent: {
    accent1: "#D7B2F7",
    accent2: "#B6E1FC"
  }
};

// Mock data for feature highlights
const FEATURES = [
  {
    icon: <Sparkles size={28} strokeWidth={2.2} className="text-[#ED4B86]" />,
    title: "AI-Driven Automation",
    desc: "Unlock intelligent workflows powered by advanced algorithms."
  },
  {
    icon: <ShieldCheck size={28} strokeWidth={2.2} className="text-[#D7B2F7]" />,
    title: "Enterprise-Grade Security",
    desc: "Protect your data with next-gen encryption and privacy controls."
  },
  {
    icon: <ArrowRight size={28} strokeWidth={2.2} className="text-[#B6E1FC]" />,
    title: "Seamless Integration",
    desc: "Connect with your favorite tools in just one click."
  }
];

export type PinkTechHeroProps = Partial<{
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  features: typeof FEATURES;
}>;

function handleCTAClick(label: string) {
  toast.success(label + " clicked!", {
    description: "Your action was successful.",
    position: "top-center"
  });
}

const PinkTechHero: React.FC<PinkTechHeroProps> = ({
  title = "Next-Gen Tech, Pink Energy",
  subtitle = "Experience the future of innovation in a vibrant, powerful interface. Designed for creators, innovators, and dreamers.",
  ctaLabel = "Get Started",
  ctaUrl = "#",
  imageUrl = "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80",
  features = FEATURES
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full bg-[" + COLORS.neutral.bg + "] px-8 py-16 md:py-24"
      style={{ backgroundColor: COLORS.neutral.bg }}
    >
      <div className="flex flex-row items-center justify-between gap-16 max-w-6xl mx-auto flex-wrap md:flex-nowrap">
        {/* Text & CTA */}
        <div className="flex-1 min-w-[320px] flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <h1
              className="font-sans text-4xl md:text-5xl lg:text-6xl font-extrabold text-[" + COLORS.brand.primary + "] leading-tight"
              style={{ color: COLORS.brand.primary }}
            >
              {title}
            </h1>
            <p
              className="font-serif text-lg md:text-xl text-[" + COLORS.neutral.text + "] leading-relaxed max-w-xl"
              style={{ color: COLORS.neutral.text }}
            >
              {subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.20, delay: 0.18 }}
            className="flex gap-4 mt-2"
          >
            <Button
              size="lg"
              className="rounded-xl shadow-lg font-mono px-8 py-3 text-base bg-[" + COLORS.brand.primary + "] text-white hover:bg-[" + COLORS.accent.accent1 + "]"
              style={{ backgroundColor: COLORS.brand.primary }}
              onClick={() => handleCTAClick(ctaLabel)}
            >
              {ctaLabel}
            </Button>
          </motion.div>
        </div>

        {/* Image & Features */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="flex flex-col gap-6 min-w-[320px] max-w-lg w-full items-center"
        >
          <Card
            className="overflow-hidden rounded-2xl shadow-xl border-0 w-full bg-[" + COLORS.neutral.surface + "]"
            style={{ backgroundColor: COLORS.neutral.surface }}
          >
            <img
              src={imageUrl}
              alt="Tech Hero Visual"
              className="object-cover w-full h-60 md:h-72"
              style={{ borderRadius: "1rem 1rem 0 0" }}
            />
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 w-full">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22, delay: 0.15 + i * 0.05 }}
                className="flex flex-col items-center gap-2 text-center p-4 bg-[" + COLORS.accent.accent2 + "] rounded-lg shadow-md"
                style={{ backgroundColor: COLORS.accent.accent2 }}
              >
                <div>{f.icon}</div>
                <h3 className="font-sans text-base font-semibold text-[" + COLORS.brand.primary + "] leading-6" style={{ color: COLORS.brand.primary }}>{f.title}</h3>
                <p className="font-serif text-sm text-[" + COLORS.neutral.text + "] leading-relaxed" style={{ color: COLORS.neutral.text }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default PinkTechHero;
