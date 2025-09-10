// TechHero.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Rocket, ShieldCheck, Cpu, ArrowRight, CloudLightning } from "lucide-react";
import React from "react";

// Color system (technology/cool):
// brand.primary: #2563eb (blue-600)
// neutral.bg: #f9fafb (gray-50)
// neutral.surface: #1e293b (slate-800)
// neutral.text: #0f172a (slate-900)
// accent.1: #14b8a6 (teal-500)
// accent.2: #6366f1 (indigo-500)
// Light/dark handled via Tailwind classes

export type TechHeroProps = Partial<{
  title: string;
  subtitle: string;
  features: {
    icon: React.ReactNode;
    label: string;
    description: string;
  }[];
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  gradient: boolean;
  darkMode: boolean;
}>;

const mockFeatures = [
  {
    icon: <Rocket className="text-brand-primary w-6 h-6" />, // Blue
    label: "极速部署",
    description: "一键实现云端加速，秒级上线你的应用。"
  },
  {
    icon: <ShieldCheck className="text-accent-1 w-6 h-6" />, // Teal
    label: "安全保障",
    description: "企业级安全策略与多层加密，数据无忧。"
  },
  {
    icon: <Cpu className="text-accent-2 w-6 h-6" />, // Indigo
    label: "智能引擎",
    description: "AI驱动自动优化，性能持续领先。"
  },
  {
    icon: <CloudLightning className="text-brand-primary w-6 h-6" />,
    label: "智能云",
    description: "弹性扩展，按需分配算力资源。"
  }
];

const mockImage =
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80"; // Data center tech

const TechHero: React.FC<TechHeroProps> = ({
  title = "驱动未来的科技引擎",
  subtitle = "云端智能，安全高效，点燃创新。",
  features = mockFeatures,
  ctaLabel = "立即体验",
  ctaUrl = "#",
  imageUrl = mockImage,
  gradient = true,
  darkMode = false
}) => {
  // Color classes
  const brandPrimary = darkMode ? "text-blue-400" : "text-blue-600";
  const accent1 = darkMode ? "text-teal-400" : "text-teal-500";
  const accent2 = darkMode ? "text-indigo-300" : "text-indigo-500";
  const bgMain = darkMode ? "bg-slate-800" : "bg-gray-50";
  const textMain = darkMode ? "text-slate-100" : "text-slate-900";

  // Gradient overlay
  const gradientStyle = gradient
    ? darkMode
      ? "bg-gradient-to-r from-blue-900 via-slate-800 to-indigo-900"
      : "bg-gradient-to-r from-blue-50 via-gray-50 to-teal-50"
    : bgMain;

  // Button hover gradient
  const btnGradient =
    "bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-500 hover:from-blue-700 hover:via-teal-600 hover:to-indigo-600 text-white shadow-lg";

  // Main layout: flex row desktop, column tablet/mobile
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`w-full ${gradientStyle} py-16 px-8 md:px-16 lg:px-32 flex flex-col md:flex-row items-center justify-between gap-12 min-h-[480px]`}
    >
      {/* Left: Content */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="flex flex-col gap-8 max-w-xl w-full"
      >
        <h1
          className={`font-sans font-semibold ${brandPrimary} text-4xl md:text-5xl leading-tight mb-2`}
        >
          {title}
        </h1>
        <p
          className={`font-sans ${textMain} text-lg md:text-xl leading-relaxed mb-4`}
        >
          {subtitle}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.slice(0, 4).map((f, idx) => (
            <Card key={idx} className="flex gap-4 items-start p-4 shadow-lg bg-white/70 dark:bg-slate-900/80">
              <div>{f.icon}</div>
              <div className="flex flex-col gap-1">
                <span className="font-sans font-medium text-base text-slate-800 dark:text-slate-100">
                  {f.label}
                </span>
                <span className="font-sans text-sm text-slate-600 dark:text-slate-400 leading-6">
                  {f.description}
                </span>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Button
            asChild
            className={
              `${btnGradient} px-6 py-3 font-sans font-semibold text-lg rounded-lg shadow-xl flex gap-2 items-center`
            }
            onClick={() =>
              toast.success("欢迎体验智能云平台！", {
                description: "已为您准备好极速部署与安全保障。",
                duration: 2200
              })
            }
          >
            <a href={ctaUrl}>
              {ctaLabel}
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </Button>
        </div>
      </motion.div>

      {/* Right: Image avatar/card */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-center w-full md:w-[380px] lg:w-[420px]"
      >
        <Card className="p-0 overflow-hidden shadow-2xl bg-white/80 dark:bg-slate-900/80">
          <Avatar className="w-full h-[340px] md:h-[360px] lg:h-[420px]">
            <AvatarImage
              src={imageUrl}
              alt="科技数据中心"
              className="object-cover w-full h-full"
            />
            <AvatarFallback className="flex items-center justify-center text-2xl font-mono bg-gray-100 dark:bg-slate-700">
              AI
            </AvatarFallback>
          </Avatar>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TechHero;
