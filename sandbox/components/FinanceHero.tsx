// components/FinanceHero.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Banknote, LineChart, ShieldCheck } from "lucide-react";
import React, { useState } from "react";

// Color system (cool, finance/professional):
// brand.primary: #2563eb (blue-600)
// neutral.1: #f9fafb (zinc-50, background)
// neutral.2: #1e293b (slate-800, text)
// neutral.3: #e5e7eb (zinc-200, card/bg)
// accent.1: #38bdf8 (sky-400)
// accent.2: #34d399 (emerald-400)

export type FinanceHeroProps = Partial<{
  title: string;
  subtitle: string;
  highlights: { icon: React.ReactNode; label: string; }[];
  ctaText: string;
  ctaSecondaryText: string;
  heroImageUrl: string;
  onCTAClick?: () => void;
  onSecondaryClick?: () => void;
}>;

const mockHighlights = [
  {
    icon: <Banknote className="w-5 h-5 text-sky-400" aria-hidden />, label: "Secure Investments"
  },
  {
    icon: <LineChart className="w-5 h-5 text-emerald-400" aria-hidden />, label: "Real-time Analytics"
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-blue-600" aria-hidden />, label: "Bank-level Security"
  }
];

export const mockProps: FinanceHeroProps = {
  title: "Grow Your Wealth with Confidence",
  subtitle: "Trusted finance solutions to manage, invest, and analyze your assets – all in one secure platform.",
  highlights: mockHighlights,
  ctaText: "Get Started Free",
  ctaSecondaryText: "Learn More",
  heroImageUrl: "https://images.unsplash.com/photo-1519643381401-22c77e60520e?auto=format&fit=crop&w=900&q=80"
};

const animationProps = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: 24, transition: { duration: 0.2 } }
};

function FinanceHero({
  title = mockProps.title,
  subtitle = mockProps.subtitle,
  highlights = mockProps.highlights,
  ctaText = mockProps.ctaText,
  ctaSecondaryText = mockProps.ctaSecondaryText,
  heroImageUrl = mockProps.heroImageUrl,
  onCTAClick,
  onSecondaryClick
}: FinanceHeroProps) {
  const [email, setEmail] = useState("");

  return (
    <motion.section 
      className="relative w-full bg-[linear-gradient(90deg,_#f9fafb_65%,_#e5e7eb_100%)] dark:bg-slate-900 py-20 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-12"
      {...animationProps}
    >
      {/* Left: Textual Content */}
      <motion.div className="flex-1 max-w-xl flex flex-col gap-8 md:gap-10">
        <motion.h1 className="font-sans text-4xl md:text-5xl font-bold text-slate-800 dark:text-zinc-50 leading-tight">
          {title}
        </motion.h1>
        <motion.p className="text-lg md:text-xl text-slate-600 dark:text-zinc-200 leading-relaxed">
          {subtitle}
        </motion.p>
        {/* Highlights */}
        <motion.div className="flex flex-wrap gap-4 md:gap-6">
          {highlights?.map((h, i) => (
            <Badge 
              key={h.label} 
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-slate-800 border-0 text-slate-800 dark:text-zinc-100 font-sans text-base shadow-sm">
              {h.icon}
              <span>{h.label}</span>
            </Badge>
          ))}
        </motion.div>
        {/* CTA: Email Signup */}
        <motion.form 
          className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-2"
          onSubmit={e => { e.preventDefault(); onCTAClick?.(); }}
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 min-w-[180px] bg-white dark:bg-slate-900 border-zinc-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600"
            required
            aria-label="Email address"
          />
          <Button
            type="submit"
            size="lg"
            className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 px-6"
            aria-label={ctaText}
          >
            {ctaText}
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="shadow-md border-blue-600 text-blue-600 font-semibold"
            onClick={onSecondaryClick}
            aria-label={ctaSecondaryText}
          >
            {ctaSecondaryText}
          </Button>
        </motion.form>
      </motion.div>
      {/* Right: Hero Image Card (desktop) */}
      <motion.div className="hidden md:flex flex-1 justify-center items-center">
        <Card className="overflow-hidden shadow-2xl max-w-lg w-full bg-white dark:bg-slate-800 border-0">
          <CardContent className="p-0">
            <img
              src={heroImageUrl}
              alt="Finance dashboard preview"
              className="w-full h-[360px] object-cover object-center"
              style={{ background: "#f3f4f6" }}
              loading="lazy"
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.section>
  );
}

export default FinanceHero;
