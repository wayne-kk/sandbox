// components/FinanceHero.tsx
"use client";
import React, { FC } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";

// Theme Colors (example, should match Tailwind config):
// brand.primary: #2563eb (blue-600)
// neutral.900: #18181b
// neutral.100: #f4f4f5
// accent.1: #10b981 (emerald-500)
// accent.2: #f59e42 (orange-400)

export type FinanceHeroProps = Partial<{
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  stats: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }[];
}>;

const mockStats = [
  {
    icon: <TrendingUp className="text-accent-1" size={28} />,
    label: "Assets Managed",
    value: "$4.2B+"
  },
  {
    icon: <ShieldCheck className="text-primary" size={28} />,
    label: "Security Rating",
    value: "AAA"
  },
  {
    icon: <ArrowRight className="text-accent-2" size={28} />,
    label: "Active Clients",
    value: "14,000+"
  }
];

const defaultImage =
  "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=900&q=80";

const FinanceHero: FC<FinanceHeroProps> = ({
  heading = "Empower Your Financial Future",
  subheading = "Professional wealth management and investment strategies tailored for you. Trust, security, and growth—all in one place.",
  ctaLabel = "Get Started",
  ctaHref = "#signup",
  imageUrl = defaultImage,
  stats = mockStats
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-neutral-100 dark:bg-neutral-900 min-h-[540px] flex items-center w-full px-8 py-16 md:py-24 lg:py-32"
    >
      <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div className="flex flex-col gap-8">
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            className="text-4xl lg:text-5xl font-bold font-sans text-neutral-900 dark:text-neutral-100 leading-tight"
          >
            {heading}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.15 }}
            className="text-lg font-serif text-neutral-700 dark:text-neutral-200 leading-relaxed max-w-xl"
          >
            {subheading}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, delay: 0.23 }}
            className="flex items-center gap-4 mt-2"
          >
            <Button
              asChild
              className="shadow-lg font-medium px-7 py-3 text-lg bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors duration-200"
              size="lg"
            >
              <a href={ctaHref}>
                {ctaLabel}
                <ArrowRight className="inline ml-2 -mr-1 w-5 h-5" />
              </a>
            </Button>
            <Input
              className="max-w-xs bg-white dark:bg-neutral-800 border-none shadow-md focus:ring-2 focus:ring-primary/50"
              placeholder="Enter your email"
              type="email"
            />
          </motion.div>
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.32 }}
            className="flex gap-6 md:gap-8 mt-4"
          >
            {stats.map((stat, idx) => (
              <Card
                key={idx}
                className="flex items-center gap-3 px-4 py-3 shadow-md bg-white dark:bg-neutral-800 border-0 min-w-[140px]"
              >
                <div>{stat.icon}</div>
                <div>
                  <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 block leading-6">
                    {stat.value}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 font-sans">
                    {stat.label}
                  </span>
                </div>
              </Card>
            ))}
          </motion.div>
        </div>
        {/* Right image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.23, delay: 0.09 }}
          className="w-full flex justify-center items-center"
        >
          <Card className="overflow-hidden shadow-2xl border-0 bg-white dark:bg-neutral-800 p-0">
            <img
              src={imageUrl}
              alt="Finance illustration"
              className="w-full object-cover max-h-[420px] min-h-[260px] md:min-h-[320px] rounded-lg"
              style={{ aspectRatio: '16/9' }}
            />
          </Card>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FinanceHero;
