// HealthcareHero.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, HeartPulse, Stethoscope, ShieldCheck, ArrowRight } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import React, { useState } from "react";

// Color system for healthcare (cool: blue/green, neutrals, accent)
const COLORS = {
  brand: {
    primary: "#2563eb" // blue-600
  },
  neutral: {
    bg: "#f8fafc", // slate-50
    surface: "#ffffff",
    text: "#0f172a", // slate-900
    border: "#e2e8f0" // slate-200
  },
  accent: {
    one: "#14b8a6", // teal-500
    two: "#38bdf8" // sky-400
  },
  status: {
    success: "#22c55e",
    warning: "#f59e42",
    error: "#ef4444",
    info: "#0ea5e9"
  }
};

// Mock healthcare hero features
const HERO_FEATURES = [
  {
    icon: HeartPulse,
    title: "24/7 Patient Care",
    desc: "Round-the-clock support from expert medical teams."
  },
  {
    icon: Stethoscope,
    title: "Specialist Appointments",
    desc: "Book top-rated doctors in various specialties."
  },
  {
    icon: ShieldCheck,
    title: "Secure Health Records",
    desc: "Your data protected with industry-leading standards."
  }
];

// Unsplash image URLs (relevant, medical, professional)
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80", // doctor
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd22?auto=format&fit=crop&w=800&q=80", // healthcare team
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80" // hospital
];

export type HealthcareHeroProps = Partial<{
  headline: string;
  subtext: string;
  ctaText: string;
  imageUrl: string;
  features: typeof HERO_FEATURES;
}>;

const defaultProps: HealthcareHeroProps = {
  headline: "Your Health, Our Priority",
  subtext:
    "Trusted care, easy access. Book appointments, manage health records, and connect with experts—all in one place.",
  ctaText: "Find a Doctor",
  imageUrl: HERO_IMAGES[0],
  features: HERO_FEATURES
};

function HealthcareHero({
  headline = defaultProps.headline,
  subtext = defaultProps.subtext,
  ctaText = defaultProps.ctaText,
  imageUrl = defaultProps.imageUrl,
  features = defaultProps.features
}: HealthcareHeroProps) {
  const [search, setSearch] = useState("");

  // CTA handler
  const handleCTAClick = () => {
    toast.success("Searching for doctors near you!");
  };

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      toast.info(`Searching for '${search}'...`);
      setSearch("");
    } else {
      toast.warning("Enter a specialty or doctor name.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-[${COLORS.neutral.bg}] w-full flex flex-col lg:flex-row items-center justify-between px-8 py-16 gap-8 lg:gap-16"
      style={{ backgroundColor: COLORS.neutral.bg }}
    >
      {/* Left: Text & CTA */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="flex-1 flex flex-col gap-6 max-w-xl"
      >
        <h1
          className="font-sans text-4xl lg:text-5xl font-bold text-left text-[${COLORS.brand.primary}] leading-tight"
          style={{ color: COLORS.brand.primary }}
        >
          {headline}
        </h1>
        <p
          className="font-sans text-base lg:text-lg text-left text-[${COLORS.neutral.text}] leading-relaxed"
          style={{ color: COLORS.neutral.text }}
        >
          {subtext}
        </p>
        <form onSubmit={handleSearch} className="flex gap-4 items-center mt-2">
          <Input
            placeholder="Search specialty, doctor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 md:w-80 border border-[${COLORS.neutral.border}] shadow-sm text-base font-sans"
            style={{ borderColor: COLORS.neutral.border }}
          />
          <Button
            type="submit"
            variant="default"
            size="lg"
            className="shadow-lg text-white bg-[${COLORS.accent.one}] hover:bg-[${COLORS.brand.primary}]"
            style={{ backgroundColor: COLORS.accent.one }}
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </form>
        <Button
          onClick={handleCTAClick}
          variant="default"
          size="xl"
          className="mt-4 shadow-xl bg-[${COLORS.brand.primary}] hover:bg-[${COLORS.accent.one}] text-white font-semibold text-lg px-8 py-4"
          style={{ backgroundColor: COLORS.brand.primary }}
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          {ctaText}
        </Button>
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 + i * 0.04 }}
            >
              <Card className="flex items-center gap-3 p-4 shadow-md bg-[${COLORS.neutral.surface}] border border-[${COLORS.neutral.border}]">
                <f.icon
                  className="w-7 h-7 text-[${COLORS.accent.two}]"
                  style={{ color: COLORS.accent.two }}
                  aria-label={f.title}
                />
                <div className="flex flex-col">
                  <span className="font-sans text-base font-semibold text-[${COLORS.brand.primary}] leading-6" style={{ color: COLORS.brand.primary }}>{f.title}</span>
                  <span className="font-sans text-sm text-[${COLORS.neutral.text}] leading-relaxed" style={{ color: COLORS.neutral.text }}>{f.desc}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Right: Hero Image */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="flex-1 flex justify-center items-center"
      >
        <Card className="shadow-2xl p-0 border-0 overflow-hidden bg-[${COLORS.neutral.surface}] rounded-xl">
          <Image
            src={imageUrl}
            alt="Healthcare team hero image"
            width={520}
            height={400}
            className="object-cover w-full h-auto rounded-xl"
            style={{ maxWidth: "520px", minHeight: "320px" }}
            priority
          />
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default HealthcareHero;
