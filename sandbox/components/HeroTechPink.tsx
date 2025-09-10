// components/HeroTechPink.tsx
"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkle, Share2 } from "lucide-react";
import * as React from "react";

// Pink Tech theme color system
const COLORS = {
  brand: {
    primary: "#ef4f93", // Brand Pink
  },
  neutral: {
    bg: "#f9fafb",
    surface: "#ffffff",
    text: "#191724",
    border: "#e5e7eb",
  },
  accent: {
    one: "#ffb4e6", // Light pink accent
    two: "#be4bdb", // Purple accent
  },
};

// Mock data: Tech Hero Messages
const mockMessages = [
  {
    headline: "Empower Your Creativity with AI",
    subtext:
      "Next-gen tools for creators, powered by neural networks and real-time data.",
    cta: "Get Started",
    image:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
  },
  {
    headline: "Seamless Collaboration, Instantly",
    subtext:
      "Connect, innovate, and build together in our futuristic workspace.",
    cta: "Try Now",
    image:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
  },
  {
    headline: "Data. Design. Delivered.",
    subtext:
      "Visualize insights and drive smart decisions with style.",
    cta: "Explore Features",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  },
];

type HeroTechPinkProps = Partial<{
  headline: string;
  subtext: string;
  cta: string;
  image: string;
}>;

const HeroTechPink: React.FC<HeroTechPinkProps> = ({
  headline = mockMessages[0].headline,
  subtext = mockMessages[0].subtext,
  cta = mockMessages[0].cta,
  image = mockMessages[0].image,
}) => {
  return (
    <motion.section
      className="w-full min-h-[520px] flex items-center justify-center bg-[linear-gradient(112deg,_#ef4f93_0%,_#be4bdb_100%)] dark:bg-[linear-gradient(112deg,_#be4bdb_0%,_#ef4f93_100%)] px-8 py-16"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="flex flex-row items-center gap-12 max-w-7xl w-full md:flex-row flex-col md:gap-16"
      >
        {/* Text Section */}
        <motion.div className="flex-1 flex flex-col gap-6 md:items-start items-center text-center md:text-left">
          <motion.div className="flex items-center gap-2 mb-2">
            <Sparkle
              className="text-[--brand-primary] text-xl"
              color={COLORS.brand.primary}
              size={28}
            />
            <span
              className="uppercase tracking-widest font-mono text-sm text-[--accent-one]"
              style={{ color: COLORS.accent.one }}
            >
              Tech Innovation
            </span>
          </motion.div>

          <h1
            className="font-sans text-4xl lg:text-5xl font-bold text-[--neutral-text] leading-tight"
            style={{ color: COLORS.neutral.text }}
          >
            {headline}
          </h1>

          <p
            className="font-sans text-lg text-[--neutral-text] leading-relaxed max-w-xl opacity-90"
            style={{ color: COLORS.neutral.text }}
          >
            {subtext}
          </p>

          <div className="flex flex-row gap-4 mt-4">
            <Button
              size="lg"
              className="font-sans text-base font-semibold px-6 py-3 shadow-lg bg-[--brand-primary] hover:bg-[--accent-two] text-white rounded-full transition-colors duration-200"
              style={{
                backgroundColor: COLORS.brand.primary,
                boxShadow: "0 8px 32px 0 rgba(239, 79, 147, 0.18)",
              }}
            >
              {cta}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-sans text-base px-6 py-3 rounded-full border-2 border-[--accent-one] text-[--brand-primary] bg-white shadow-md hover:bg-[--accent-one]/20 transition-colors duration-200"
              style={{
                borderColor: COLORS.accent.one,
                color: COLORS.brand.primary,
              }}
            >
              <Share2 className="mr-2 w-5 h-5" /> Share
            </Button>
          </div>
        </motion.div>
        {/* Image Section */}
        <motion.div
          className="flex-1 flex justify-center items-center md:mt-0 mt-10"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.23 }}
        >
          <Card
            className="shadow-2xl rounded-3xl overflow-hidden bg-[--neutral-surface] border-0 w-full max-w-lg"
            style={{ background: COLORS.neutral.surface }}
          >
            <img
              src={image}
              alt="Tech Hero visual"
              className="object-cover w-full h-[340px] md:h-[400px]"
              style={{
                background: COLORS.accent.one,
                borderBottom: `4px solid ${COLORS.accent.two}`,
              }}
            />
          </Card>
        </motion.div>
      </motion.div>
      <style jsx global>{`
        :root {
          --brand-primary: ${COLORS.brand.primary};
          --accent-one: ${COLORS.accent.one};
          --accent-two: ${COLORS.accent.two};
          --neutral-bg: ${COLORS.neutral.bg};
          --neutral-surface: ${COLORS.neutral.surface};
          --neutral-text: ${COLORS.neutral.text};
        }
      `}</style>
    </motion.section>
  );
};

export default HeroTechPink;
