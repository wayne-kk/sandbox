// TechHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Rocket, Zap, ShieldCheck } from "lucide-react";

// Color System (3 colors):
// 1. Primary: #2563eb (blue-600)
// 2. Neutral: #fff (white), #1e293b (slate-800)
// 3. Accent: #38bdf8 (sky-400)

export type TechHeroProps = Partial<{
  title: string;
  subtitle: string;
  ctaLabel: string;
  features: Array<{ label: string; icon: React.ReactNode }>;
  imageUrl: string;
  onCtaClick: () => void;
}>;

const mockFeatures = [
  { label: "Blazing fast performance", icon: <Zap className="w-5 h-5 text-sky-400" /> },
  { label: "Advanced Security", icon: <ShieldCheck className="w-5 h-5 text-sky-400" /> },
  { label: "Launch-ready Tech", icon: <Rocket className="w-5 h-5 text-sky-400" /> }
];

const mockImage =
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=900&q=80";

function TechHero({
  title = "Empower Your Workflow with Next-Gen Tech",
  subtitle = "Scale smarter, innovate faster, stay secure. Our platform redefines what technology can do for your business.",
  ctaLabel = "Get Started",
  features = mockFeatures,
  imageUrl = mockImage,
  onCtaClick = () => toast.success("Welcome to Next-Gen Tech!")
}: TechHeroProps) {
  const [ctaPressed, setCtaPressed] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="w-full bg-white dark:bg-slate-800 flex items-center justify-center py-16 px-8 md:px-16 lg:px-32"
    >
      <div className="flex flex-row gap-12 items-center max-w-6xl w-full">
        {/* Left Side: Content */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="flex-1"
        >
          <Card className="shadow-xl bg-white dark:bg-slate-800 border-0 p-8">
            <CardHeader className="mb-4">
              <CardTitle className="text-3xl lg:text-4xl font-sans font-bold text-blue-600 leading-tight">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base lg:text-lg font-serif text-slate-800 dark:text-white leading-relaxed mb-6">
                {subtitle}
              </p>
              <div className="flex flex-col gap-4 mb-8">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span>{feature.icon}</span>
                    <span className="text-base font-mono text-slate-800 dark:text-white leading-6">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex gap-4"
              >
                <Button
                  onClick={() => {
                    setCtaPressed(true);
                    onCtaClick();
                  }}
                  className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-bold px-6 py-3 rounded-lg"
                >
                  {ctaLabel}
                </Button>
                <Badge className="bg-sky-400 text-white text-sm px-3 py-2">Tech Hero</Badge>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
        {/* Right Side: Image */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="flex-1 flex items-center justify-center"
        >
          <Avatar className="w-80 h-80 shadow-2xl border-4 border-sky-400">
            <img
              src={imageUrl}
              alt="Technology Hero"
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
          </Avatar>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default TechHero;
