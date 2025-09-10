// HeroTechPink.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Sparkle, ArrowRight, ShieldCheck, Cpu, Code2 } from "lucide-react";
import React from "react";

// Color system
const brand = {
  primary: "#F472B6", // pink-400
};
const neutral = {
  bg: "#18181b", // zinc-900
  surface: "#27272a", // zinc-800
  text: "#fafafa", // zinc-50
  border: "#e5e7eb", // zinc-200
};
const accent = {
  one: "#C4B5FD", // purple-300
  two: "#38BDF8", // sky-400
};

// Mock hero features
const features = [
  {
    icon: <Sparkle size={24} strokeWidth={2} className="text-pink-400" />,
    title: "AI-Powered Insights",
    desc: "Harness intelligent algorithms for actionable data.",
  },
  {
    icon: <ShieldCheck size={24} strokeWidth={2} className="text-purple-400" />,
    title: "Secured by Design",
    desc: "End-to-end encryption for peace of mind.",
  },
  {
    icon: <Cpu size={24} strokeWidth={2} className="text-sky-400" />,
    title: "Lightning Performance",
    desc: "Built on next-gen technology for speed.",
  },
];

// Hero image
const heroImage =
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80"; // Tech pink

export type HeroTechPinkProps = Partial<{
  headline: string;
  description: string;
  buttonText: string;
  buttonAction: () => void;
  imageUrl: string;
  features: typeof features;
}>;

const defaultProps: HeroTechPinkProps = {
  headline: "Empower Your Workflow with AI & Tech",
  description:
    "Unlock next-level productivity and security with our cutting-edge platform. Experience technology that adapts to your needs.",
  buttonText: "Get Started",
  buttonAction: () => toast.success("Welcome to Tech Hero! 🚀"),
  imageUrl: heroImage,
  features,
};

const HeroTechPink: React.FC<HeroTechPinkProps> = (props = defaultProps) => {
  const {
    headline,
    description,
    buttonText,
    buttonAction,
    imageUrl,
    features: featureList,
  } = { ...defaultProps, ...props };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.22 }}
        className="w-full bg-[#18181b] text-[#fafafa] font-sans py-16 px-8 flex flex-col gap-12 items-center justify-center md:flex-row md:gap-16 md:py-24 md:px-16"
      >
        {/* Left: Text Content */}
        <motion.div
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-8 max-w-xl md:items-start items-center"
        >
          <h1
            className="text-4xl lg:text-5xl font-bold text-pink-400 mb-2 leading-tight text-center md:text-left"
            style={{ color: brand.primary }}
          >
            {headline}
          </h1>
          <p className="text-lg leading-relaxed text-zinc-100 mb-2 text-center md:text-left">
            {description}
          </p>
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
            {featureList?.map((f, i) => (
              <Card
                key={i}
                className="bg-[#27272a] shadow-lg border-none flex flex-col items-center justify-center p-4 gap-2"
              >
                <CardContent className="flex flex-col items-center gap-2">
                  {f.icon}
                  <span className="font-semibold text-base text-zinc-50 text-center">
                    {f.title}
                  </span>
                  <span className="text-sm leading-6 text-zinc-300 text-center">
                    {f.desc}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            size="lg"
            className="mt-6 shadow-xl bg-pink-400 hover:bg-pink-500 text-zinc-900 font-bold text-lg px-8 py-4 rounded-xl flex gap-2 items-center"
            onClick={buttonAction}
          >
            {buttonText}
            <ArrowRight size={20} />
          </Button>
        </motion.div>
        {/* Right: Hero Image */}
        <motion.div
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="flex justify-center items-center"
        >
          <Card className="bg-[#27272a] shadow-2xl border-none p-6 flex flex-col items-center gap-4 max-w-md">
            <Avatar className="w-64 h-64 shadow-xl">
              <AvatarImage src={imageUrl} alt="Tech Hero" />
              <AvatarFallback className="bg-pink-400 font-mono text-zinc-900 text-3xl">
                AI
              </AvatarFallback>
            </Avatar>
            <span className="text-base text-purple-300 font-serif mt-2">Powered by the future</span>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HeroTechPink;
