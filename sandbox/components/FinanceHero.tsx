// FinanceHero.tsx
"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

// Brand palette and neutral/accent colors (for reference, should be set in Tailwind config):
// brand.primary: #2563eb (blue-600)
// neutral.900: #0f172a (slate-900)
// neutral.50: #f8fafc (slate-50)
// accent.1: #38bdf8 (sky-400)
// accent.2: #facc15 (yellow-400)
// success: #22c55e (green-500)
// warning: #f59e42 (orange-400)
// error: #ef4444 (red-500)
// info: #0ea5e9 (sky-500)

// Mock feature items
const features = [
  {
    icon: <TrendingUp className="text-accent-1 w-6 h-6" aria-hidden />,
    title: "Smart Portfolio Growth",
    desc: "AI-driven insights to maximize your wealth.",
  },
  {
    icon: <ShieldCheck className="text-accent-2 w-6 h-6" aria-hidden />,
    title: "Trusted Security",
    desc: "Your data and assets are protected 24/7.",
  },
  {
    icon: <ArrowRight className="text-brand-primary w-6 h-6" aria-hidden />,
    title: "Seamless Transfers",
    desc: "Move funds instantly, worldwide.",
  },
];

// Unsplash finance-themed hero images
const heroImages = [
  "https://images.unsplash.com/photo-1515168833906-d2a3b82b36ab?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
];

export type FinanceHeroProps = Partial<{
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaPlaceholder: string;
  imageUrl: string;
  features: typeof features;
}>;

const defaultHeadline = "Empower Your Financial Future";
const defaultSubheadline =
  "Manage, grow and protect your wealth with our secure, AI-driven platform. Trusted by over 500,000 investors.";
const defaultCtaLabel = "Get Started";
const defaultCtaPlaceholder = "Enter your email";

export default function FinanceHero({
  headline = defaultHeadline,
  subheadline = defaultSubheadline,
  ctaLabel = defaultCtaLabel,
  ctaPlaceholder = defaultCtaPlaceholder,
  imageUrl = heroImages[0],
  features: featureList = features,
}: FinanceHeroProps) {
  const [email, setEmail] = useState("");
  
  function handleCta(e: React.FormEvent) {
    e.preventDefault();
    if (!email.match(/^[\w\-.]+@[\w-]+\.[\w-.]+$/)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("Thank you! We'll be in touch soon.");
    setEmail("");
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full bg-neutral-50 dark:bg-neutral-900 py-16 md:py-24"
      aria-label="Finance site hero section"
    >
      <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center gap-12 md:gap-16">
        {/* Left Content */}
        <div className="flex-1 flex flex-col items-start gap-8 max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            className="font-sans text-4xl lg:text-5xl font-bold text-brand-primary dark:text-brand-primary mb-2 leading-tight"
          >
            {headline}
          </motion.h1>
          <p className="font-sans text-lg md:text-xl text-neutral-700 dark:text-neutral-100 leading-relaxed mb-2">
            {subheadline}
          </p>
          {/* CTA Form */}
          <form
            onSubmit={handleCta}
            className="flex flex-col sm:flex-row gap-4 w-full"
            aria-label="Get started form"
          >
            <Input
              type="email"
              placeholder={ctaPlaceholder}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 bg-white dark:bg-neutral-800 shadow-sm focus:ring-brand-primary"
              aria-label="Email address"
              autoComplete="email"
            />
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-accent-1 text-white shadow-lg font-semibold px-6 py-3 rounded-lg transition-colors"
              size="lg"
            >
              {ctaLabel} <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>
          {/* Features Row */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            {featureList.map((feature, i) => (
              <Card
                key={feature.title}
                className="shadow-md bg-white dark:bg-neutral-800 border-0 flex-1 min-w-[220px]"
              >
                <CardContent className="flex items-start gap-3 p-4">
                  {feature.icon}
                  <div>
                    <h3 className="font-sans text-base font-semibold text-neutral-900 dark:text-neutral-50">
                      {feature.title}
                    </h3>
                    <p className="font-sans text-sm text-neutral-700 dark:text-neutral-200 leading-6">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        {/* Right Image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, delay: 0.1 }}
          className="flex-1 hidden md:block"
        >
          <div className="relative w-full max-w-md mx-auto aspect-[4/3] shadow-xl rounded-2xl overflow-hidden">
            <Image
              src={imageUrl}
              alt="Finance platform hero"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover object-center"
              priority
            />
            {/* Light overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/30 to-brand-primary/10 dark:from-neutral-900/60 dark:via-neutral-900/30 dark:to-brand-primary/10 pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
