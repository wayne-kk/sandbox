// components/HealthcareHero.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Stethoscope, HeartPulse, UserPlus2 } from "lucide-react";

// Mock healthcare specialties/services
const healthServices = [
  {
    title: "Primary Care",
    icon: Stethoscope,
    description: "Comprehensive health services for all ages."
  },
  {
    title: "Cardiology",
    icon: HeartPulse,
    description: "Expert heart health and diagnostics."
  },
  {
    title: "New Patient Signup",
    icon: UserPlus2,
    description: "Easily register and start your journey."
  }
];

// Color tokens for light/dark mode
const colorTokens = {
  light: {
    'brand-primary': '#2179d7', // Blue - trust/professionalism
    'neutral-bg': '#f9fafb',    // Light gray
    'neutral-surface': '#ffffff',
    'neutral-text': '#1e293b',  // Dark gray for text
    'accent-1': '#38bdf8',      // Light blue accent
    'accent-2': '#22c55e'       // Green accent
  },
  dark: {
    'brand-primary': '#60a5fa',
    'neutral-bg': '#111827',
    'neutral-surface': '#1e293b',
    'neutral-text': '#f1f5f9',
    'accent-1': '#0ea5e9',
    'accent-2': '#22d3ee'
  }
};

export type HealthcareHeroProps = Partial<{
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaSecondaryLabel: string;
  onCtaClick: () => void;
  onCtaSecondaryClick: () => void;
  imageUrl: string;
  services: typeof healthServices;
  darkMode: boolean;
}>;

const defaultImage =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80";

function HealthcareHero({
  title = "Your Health, Our Priority",
  subtitle =
    "Access world-class healthcare services, expert doctors, and modern facilities—right at your fingertips.",
  ctaLabel = "Book Appointment",
  ctaSecondaryLabel = "Learn More",
  onCtaClick = () => toast.success("Book Appointment clicked!"),
  onCtaSecondaryClick = () => toast.info("Learn More clicked!"),
  imageUrl = defaultImage,
  services = healthServices,
  darkMode = false
}: HealthcareHeroProps) {
  const colors = darkMode ? colorTokens.dark : colorTokens.light;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`w-full bg-[${colors['neutral-bg']}] dark:bg-[${colors['neutral-bg']}] pt-16 pb-24 px-8 md:px-16 lg:px-32`}
    >
      <div
        className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10"
      >
        {/* Left: Textual content */}
        <div className="flex-1 flex flex-col gap-6 items-start">
          <motion.h1
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.22, delay: 0.07}}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold font-sans leading-tight text-[${colors['brand-primary']}] dark:text-[${colors['brand-primary']}]`}
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.22, delay: 0.12}}
            className={`text-base md:text-lg font-sans text-[${colors['neutral-text']}] dark:text-[${colors['neutral-text']}] leading-relaxed max-w-xl`}
          >
            {subtitle}
          </motion.p>
          {/* CTA Buttons */}
          <motion.div
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.18, delay: 0.18}}
            className="flex gap-4 mt-2"
          >
            <Button
              asChild
              size="lg"
              className={`shadow-lg bg-[${colors['brand-primary']}] hover:bg-[${colors['accent-1']}] text-white font-semibold`}
              onClick={onCtaClick}
            >
              <span>{ctaLabel}</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className={`shadow text-[${colors['brand-primary']}] border-[${colors['brand-primary']}] hover:bg-[${colors['neutral-surface']}]`}
              onClick={onCtaSecondaryClick}
            >
              {ctaSecondaryLabel}
            </Button>
          </motion.div>
          {/* Services feature list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 w-full">
            {services.map((service, idx) => (
              <Card
                asChild
                key={idx}
                className={`flex flex-row gap-3 items-center p-4 shadow-md bg-[${colors['neutral-surface']}] dark:bg-[${colors['neutral-surface']}]`}
              >
                <motion.div
                  initial={{opacity: 0, scale: 0.95}}
                  animate={{opacity: 1, scale: 1}}
                  transition={{duration: 0.16, delay: 0.14 + idx * 0.06}}
                  className="flex items-center gap-3"
                >
                  <service.icon
                    size={28}
                    className={`text-[${colors['accent-1']}]`}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-semibold text-[${colors['neutral-text']}] leading-6 text-base">
                      {service.title}
                    </div>
                    <div className="text-sm text-[${colors['neutral-text']}] opacity-80 leading-relaxed">
                      {service.description}
                    </div>
                  </div>
                </motion.div>
              </Card>
            ))}
          </div>
        </div>
        {/* Right: Hero image */}
        <motion.div
          initial={{opacity: 0, scale: 0.98}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 0.22, delay: 0.22}}
          className="flex-1 flex justify-center items-center w-full min-w-[320px]"
        >
          <motion.div
            className={`relative rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg aspect-[5/4] bg-gradient-to-br from-[${colors['brand-primary']}] to-[${colors['accent-1']}]`}
          >
            <img
              src={imageUrl}
              alt="Healthcare hero"
              className="object-cover w-full h-full mix-blend-normal"
              style={{ filter: darkMode ? "brightness(0.85)" : undefined }}
              loading="lazy"
            />
            {/* Overlay gradient for contrast */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"
              aria-hidden="true"
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export default HealthcareHero;
