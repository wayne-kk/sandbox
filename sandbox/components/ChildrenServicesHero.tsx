// ChildrenServicesHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Smile, BookOpen, Users, Star } from "lucide-react";

// Color tokens (example):
// brand.primary: #FF9800 (orange)
// neutral.100: #FFF8F2
// neutral.900: #231F1A
// accent.1: #FFB74D
// accent.2: #FFD180

// Mock data for hero carousel
const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    alt: "Children playing together in a sunny park"
  },
  {
    src: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1200&q=80",
    alt: "Smiling teacher reading a book to kids"
  },
  {
    src: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80",
    alt: "Creative crafts time at children's center"
  }
];

const mockBadges = [
  { icon: <Smile className="w-4 h-4 mr-1" />, label: "Fun & Safe" },
  { icon: <BookOpen className="w-4 h-4 mr-1" />, label: "Learning" },
  { icon: <Users className="w-4 h-4 mr-1" />, label: "Community" },
];

export type ChildrenServicesHeroProps = Partial<{
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  badges: { icon: React.ReactNode; label: string }[];
  images: { src: string; alt: string }[];
}>;

const defaultTitle = "Enriching Children's Lives Every Day";
const defaultSubtitle =
  "Discover safe, nurturing, and creative programs for children of all ages. Join our vibrant community and spark lifelong curiosity, friendships, and fun!";
const defaultCtaLabel = "Explore Programs";
const defaultCtaHref = "/programs";

function ChildrenServicesHero({
  title = defaultTitle,
  subtitle = defaultSubtitle,
  ctaLabel = defaultCtaLabel,
  ctaHref = defaultCtaHref,
  badges = mockBadges,
  images = heroImages
}: ChildrenServicesHeroProps) {
  const [imgIdx, setImgIdx] = useState(0);

  const handleNext = () => setImgIdx((i) => (i + 1) % images.length);
  const handlePrev = () => setImgIdx((i) => (i - 1 + images.length) % images.length);

  const handleCta = () => {
    toast.success("Let's explore! See all our children's programs.");
  };

  return (
    <motion.section
      className="w-full bg-[var(--neutral-100,#FFF8F2)] dark:bg-[var(--neutral-900,#231F1A)] py-16 md:py-20"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 max-w-[1280px]">
        {/* Textual Content */}
        <div className="flex-1 flex flex-col gap-6 max-w-xl">
          <div className="flex flex-row gap-2">
            {badges.map((badge, i) => (
              <Badge
                key={badge.label}
                className="bg-[var(--accent-1,#FFB74D)] dark:bg-[var(--brand-primary,#FF9800)] text-[var(--neutral-900,#231F1A)] font-sans px-3 py-1 text-sm rounded-xl flex items-center gap-1 shadow-md"
              >
                {badge.icon}
                {badge.label}
              </Badge>
            ))}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--brand-primary,#FF9800)] leading-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-[var(--neutral-900,#231F1A)] dark:text-[var(--neutral-100,#FFF8F2)] leading-relaxed font-sans">
            {subtitle}
          </p>
          <div className="mt-2 flex gap-4 items-center">
            <Button
              asChild
              className="bg-[var(--brand-primary,#FF9800)] hover:bg-[var(--accent-1,#FFB74D)] text-white font-bold text-lg px-6 py-3 rounded-xl shadow-lg transition-colors"
              onClick={handleCta}
              aria-label={ctaLabel}
            >
              <a href={ctaHref}>
                <span className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {ctaLabel}
                </span>
              </a>
            </Button>
          </div>
        </div>

        {/* Image Carousel */}
        <div className="flex-1 flex flex-col items-center gap-4 min-w-[320px] max-w-lg">
          <Card className="overflow-hidden rounded-3xl shadow-xl border-0 bg-gradient-to-br from-[var(--accent-2,#FFD180)] to-[var(--accent-1,#FFB74D)] dark:bg-[var(--brand-primary,#FF9800)]">
            <CardContent className="p-0">
              <div className="relative w-full h-[300px] md:h-[360px] flex items-center justify-center">
                <AnimatePresence initial={false}>
                  <motion.img
                    key={images[imgIdx].src}
                    src={images[imgIdx].src}
                    alt={images[imgIdx].alt}
                    className="object-cover w-full h-full"
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                    draggable={false}
                  />
                </AnimatePresence>
                {/* Carousel Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={img.src}
                      type="button"
                      aria-label={`Go to image ${idx + 1}`}
                      className={`w-3 h-3 rounded-full transition-all ${
                        idx === imgIdx
                          ? "bg-[var(--brand-primary,#FF9800)] scale-110"
                          : "bg-white/80 border border-[var(--brand-primary,#FF9800)]"
                      }`}
                      onClick={() => setImgIdx(idx)}
                    />
                  ))}
                </div>
                {/* Prev/Next buttons */}
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-[var(--accent-1,#FFB74D)] transition-colors"
                  aria-label="Previous image"
                  onClick={handlePrev}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-[var(--accent-1,#FFB74D)] transition-colors"
                  aria-label="Next image"
                  onClick={handleNext}
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.section>
  );
}

export default ChildrenServicesHero;
