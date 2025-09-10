// components/BeautyHero.tsx
"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { sparkle, star, arrowRight } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

// Color system
// brand.primary: #7D5FFF (purple)
// neutral.900: #17141F (dark surface)
// neutral.100: #F5F4FA (light bg)
// neutral.700: #54467B (text, border)
// accent.1: #FF6F91 (pink)
// accent.2: #A6FFFA (mint)

export type BeautyHeroProps = Partial<{
  headline: string;
  subheadline: string;
  ctaText: string;
  featuredImages: { src: string; alt: string }[];
  stats: { icon: React.ReactNode; label: string; value: string }[];
  onSearch: (q: string) => void;
}>;

const defaultImages = [
  {
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    alt: "Beauty model with glowing skin",
  },
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
    alt: "Serene woman with radiant makeup",
  },
  {
    src: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=900&q=80",
    alt: "Closeup of luminous skin",
  },
];

const defaultStats = [
  {
    icon: <sparkle className="w-5 h-5 text-accent-1" />,
    label: "Pro Artists",
    value: "500+",
  },
  {
    icon: <star className="w-5 h-5 text-accent-2" />,
    label: "Reviews",
    value: "4.9/5",
  },
  {
    icon: <arrowRight className="w-5 h-5 text-brand-primary" />,
    label: "Services",
    value: "120+",
  },
];

const defaultHeadline = "Discover Your Beauty";
const defaultSubheadline =
  "Unleash your radiance with top-rated artists, premium products, and transformative experiences. Elevate your look today.";
const defaultCtaText = "Book Now";

function BeautyHero({
  headline = defaultHeadline,
  subheadline = defaultSubheadline,
  ctaText = defaultCtaText,
  featuredImages = defaultImages,
  stats = defaultStats,
  onSearch = () => {},
}: BeautyHeroProps) {
  const [search, setSearch] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full bg-neutral-100 dark:bg-neutral-900 py-12 md:py-20 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:grid md:grid-cols-2 gap-12 items-center">
        {/* Hero Text Section */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="flex flex-col gap-6"
        >
          <h1
            className="font-serif font-bold text-[2.5rem] md:text-[3rem] lg:text-[3.5rem] text-brand-primary leading-tight"
            style={{ color: "#7D5FFF" }}
          >
            {headline}
          </h1>
          <p className="text-neutral-700 dark:text-neutral-100 font-sans text-lg md:text-xl leading-relaxed max-w-xl">
            {subheadline}
          </p>
          <form
            className="flex gap-2 mt-2"
            onSubmit={e => {
              e.preventDefault();
              onSearch(search);
            }}
          >
            <Input
              value={search}
              aria-label="Search beauty services"
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services, artists..."
              className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-base px-4 py-2 rounded-md font-sans"
            />
            <Button
              type="submit"
              size="lg"
              className="shadow-lg bg-brand-primary text-white font-semibold px-6 py-2 rounded-md hover:bg-purple-600 transition"
              style={{ backgroundColor: "#7D5FFF" }}
            >
              {ctaText}
            </Button>
          </form>
          <div className="flex gap-8 mt-6">
            {stats.map((stat, i) => (
              <Card
                key={i}
                className="flex flex-row gap-2 items-center bg-white dark:bg-neutral-900 shadow-lg px-4 py-3 border-0 rounded-xl"
              >
                {stat.icon}
                <div className="flex flex-col">
                  <span className="text-neutral-700 dark:text-neutral-100 text-base font-semibold">
                    {stat.value}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm font-sans">
                    {stat.label}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
        {/* Images Section */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.21 }}
          className="grid grid-cols-3 gap-4 justify-center items-center"
        >
          {featuredImages.map((img, idx) => (
            <Card
              key={img.src}
              className="shadow-xl border-0 p-0 overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 flex items-center justify-center"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={220}
                height={320}
                className="object-cover w-full h-[220px] md:h-[320px]"
                priority={idx === 0}
                style={{ filter: idx === 1 ? "brightness(0.95)" : undefined }}
              />
            </Card>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default BeautyHero;
