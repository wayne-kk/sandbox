// components/FinanceHero.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, TrendingUp, ShieldCheck } from "lucide-react";
import Image from "next/image";
import * as React from "react";

// Finance hero mock data
const heroMock = {
  headline: "Grow Your Wealth with Confidence",
  subheadline:
    "Professional tools and insights for modern investors. Secure, transparent, and built for your future.",
  cta: "Start Investing",
  secondaryCta: "Learn More",
  image:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  features: [
    { icon: TrendingUp, label: "Real-time Analytics", description: "Track market trends instantly." },
    { icon: ShieldCheck, label: "Bank-level Security", description: "Your data is protected 24/7." },
    { icon: CheckCircle, label: "Expert Support", description: "Get help from finance pros." },
  ],
};

// Color system for finance (cool theme)
const colorTheme = {
  brand: {
    primary: "#2463EB", // blue-600
  },
  neutral: {
    bg: "#F9FAFB",         // neutral-50
    surface: "#FFFFFF",    // neutral-0
    text: "#111827",       // neutral-900
    border: "#E5E7EB",    // neutral-200
  },
  accent: {
    1: "#38BDF8", // sky-400
    2: "#10B981", // emerald-500
  },
};

export type FinanceHeroProps = Partial<{
  headline: string;
  subheadline: string;
  cta: string;
  secondaryCta: string;
  image: string;
  features: {
    icon: React.ElementType;
    label: string;
    description: string;
  }[];
}>;

const defaultProps: FinanceHeroProps = { ...heroMock };

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function handleCtaClick() {
  toast.success("Welcome! Your journey to smarter investing starts now.");
}

const FinanceHero: React.FC<FinanceHeroProps> = (props = defaultProps) => {
  const {
    headline = heroMock.headline,
    subheadline = heroMock.subheadline,
    cta = heroMock.cta,
    secondaryCta = heroMock.secondaryCta,
    image = heroMock.image,
    features = heroMock.features,
  } = props;

  return (
    <section
      className="relative w-full min-h-[520px] md:min-h-[600px] bg-[var(--bg)] flex items-center justify-center overflow-hidden"
      style={{
        // Light mode default; dark mode handled by Tailwind classes if used
        backgroundColor: colorTheme.neutral.bg,
        color: colorTheme.neutral.text,
      }}
    >
      <div
        className="absolute inset-0 -z-10"
        aria-hidden="true"
      >
        {/* Subtle blue gradient overlay for hero decoration */}
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(110deg, rgba(36,99,235,0.10) 0%, rgba(56,189,248,0.09) 80%)",
          }}
        />
      </div>
      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* Left: Text + Actions */}
        <motion.div
          className="flex-1 flex flex-col items-start gap-8"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="font-sans font-bold text-[2.2rem] leading-[1.1] md:text-4xl lg:text-5xl text-[var(--text)] mb-2">
            {headline}
          </h1>
          <p className="font-sans text-base md:text-lg leading-relaxed text-gray-700 max-w-xl mb-4">
            {subheadline}
          </p>
          <div className="flex flex-wrap gap-4 items-center mb-2">
            <Button
              asChild
              size="lg"
              className="shadow-xl bg-[var(--brand-primary)] text-white hover:bg-blue-700 transition-colors"
              style={{ backgroundColor: colorTheme.brand.primary }}
              onClick={handleCtaClick}
            >
              <span>{cta}</span>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="shadow-md border-gray-200 text-[var(--brand-primary)] border-2"
              style={{ color: colorTheme.brand.primary, borderColor: colorTheme.neutral.border }}
            >
              <span>{secondaryCta}</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.label}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.16 + i * 0.06 }}
                className="w-full"
              >
                <Card className="shadow-md bg-white/95 border-0">
                  <CardContent className="flex items-center gap-3 py-4">
                    <feature.icon
                      className="text-[var(--accent1)] w-6 h-6"
                      style={{ color: colorTheme.accent[1] }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{feature.label}</div>
                      <div className="text-xs text-gray-500 leading-5">{feature.description}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* Right: Hero Image */}
        <motion.div
          className="flex-1 flex items-center justify-center"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <Image
              src={image}
              alt="Finance hero illustration"
              width={640}
              height={480}
              className="w-full h-auto object-cover rounded-2xl"
              priority
              style={{ background: '#F3F4F6' }}
            />
            {/* Optional overlay for contrast on text in dark mode */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>
      <style jsx global>{`
        :root {
          --brand-primary: ${colorTheme.brand.primary};
          --accent1: ${colorTheme.accent[1]};
          --accent2: ${colorTheme.accent[2]};
          --bg: ${colorTheme.neutral.bg};
          --surface: ${colorTheme.neutral.surface};
          --text: ${colorTheme.neutral.text};
          --border: ${colorTheme.neutral.border};
        }
        [data-theme="dark"] {
          --bg: #0e1433;
          --surface: #172554;
          --text: #f1f5f9;
          --border: #334155;
          --brand-primary: #60a5fa;
          --accent1: #38bdf8;
          --accent2: #10b981;
        }
      `}</style>
    </section>
  );
};

export default FinanceHero;
