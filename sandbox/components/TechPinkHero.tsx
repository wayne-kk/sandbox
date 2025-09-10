// components/TechPinkHero.tsx
"use client";
import React, { FC } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Rocket, Cpu } from "lucide-react";

// Color Tokens
// brand.primary.500: #FF4F9C (oklch(65% 0.25 336))
// neutral.bg: #18181B (oklch(18% 0.01 270))
// neutral.surface: #232336 (oklch(22% 0.02 260))
// neutral.text: #F3F4F6 (oklch(96% 0.01 270))
// accent.1: #FEE6F6 (oklch(96% 0.04 330))
// accent.2: #B983FF (oklch(70% 0.18 295))

// Mock Data
const heroData = {
  title: "Reimagine Your Workflow with PinkTech",
  subtitle:
    "Next-generation AI platform for creators, teams, and innovators. Experience blazing speed and beautiful design.",
  highlights: [
    {
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      label: "AI-Powered Automation"
    },
    {
      icon: <Rocket className="w-6 h-6 text-accent-2" />,
      label: "Launch in Seconds"
    },
    {
      icon: <Cpu className="w-6 h-6 text-brand-primary" />,
      label: "Secure Cloud Compute"
    }
  ],
  imageUrl: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80"
};

// Custom color classes for tokens (to be added to Tailwind config for production)
const brandPrimary = "#FF4F9C";
const accent2 = "#B983FF";

interface TechPinkHeroProps {
  title?: string;
  subtitle?: string;
  highlights?: { icon: React.ReactNode; label: string }[];
  imageUrl?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

const TechPinkHero: FC<Partial<TechPinkHeroProps>> = ({
  title = heroData.title,
  subtitle = heroData.subtitle,
  highlights = heroData.highlights,
  imageUrl = heroData.imageUrl,
  ctaLabel = "Get Started",
  onCtaClick = () => {}
}) => {
  return (
    <section className="w-full bg-neutral-bg text-neutral-text min-h-[60vh] flex items-center justify-center py-16 px-4 lg:px-0">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="max-w-6xl w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-24"
      >
        {/* Textual Content */}
        <div className="flex-1 flex flex-col items-start gap-6">
          <Badge
            className="bg-[rgba(255,79,156,0.16)] text-brand-primary font-mono text-sm px-3 py-1 rounded-lg mb-2"
          >
            PinkTech v2.0
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight font-sans text-brand-primary drop-shadow-lg">
            {title}
          </h1>
          <p className="mt-2 text-lg lg:text-xl leading-relaxed text-neutral-text/90 max-w-xl font-serif">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            {highlights.map((item, idx) => (
              <Card
                key={idx}
                className="shadow-lg border-none bg-neutral-surface/90 backdrop-blur-sm"
              >
                <CardContent className="flex items-center gap-2 py-3 px-4">
                  {item.icon}
                  <span className="text-base font-medium font-sans text-neutral-text">
                    {item.label}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            asChild
            className="mt-6 bg-brand-primary text-white shadow-xl hover:bg-pink-600 font-bold px-8 py-3 text-lg rounded-xl"
            onClick={onCtaClick}
          >
            <a href="#get-started">{ctaLabel}</a>
          </Button>
        </div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex justify-center items-center"
        >
          <Card className="overflow-hidden shadow-2xl border-none bg-accent-1 p-2 rounded-2xl max-w-lg w-full">
            <img
              src={imageUrl}
              alt="Futuristic pink technology illustration"
              className="w-full h-80 object-cover rounded-xl bg-neutral-surface"
              loading="lazy"
              style={{ boxShadow: `0 6px 32px 0 ${brandPrimary}33` }}
            />
          </Card>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default TechPinkHero;
