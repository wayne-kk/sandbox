// components/EcommerceHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingCart, ChevronRight, Star, Sparkle, Truck } from "lucide-react";

// --- Color system --- //
// Brand: Indigo-600
// Accent1: Orange-500
// Accent2: Emerald-500
// Neutral: Gray-50, Gray-800, Gray-500
// Accessible contrast

// --- Mock data --- //
const mockFeatured = [
  {
    name: "EcoSmart Water Bottle",
    image: "https://images.unsplash.com/photo-1519864601152-0057c7e7d7b8?auto=format&fit=crop&w=800&q=80",
    price: "$29.99",
    rating: 4.8,
    badge: "Best Seller",
  },
  {
    name: "Minimalist Wooden Lamp",
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
    price: "$59.00",
    rating: 4.7,
    badge: "Editor's Choice",
  },
  {
    name: "UltraSoft Blanket",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    price: "$39.49",
    rating: 4.9,
    badge: "Customer Favorite",
  },
];

export type EcommerceHeroProps = Partial<{
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaIcon?: React.ReactNode;
  featured: typeof mockFeatured;
}>;

const defaultProps: EcommerceHeroProps = {
  headline: "Discover Your Next Favorite Product",
  subheadline:
    "Shop top-rated items handpicked for style, sustainability, and everyday joy.",
  ctaLabel: "Shop Now",
  ctaIcon: <ShoppingCart className="w-5 h-5 mr-2" />,
  featured: mockFeatured,
};

const heroBgGradient =
  "bg-gradient-to-br from-indigo-600 via-indigo-400 to-gray-50 dark:from-indigo-800 dark:via-indigo-600 dark:to-gray-900";
const cardShadow = "shadow-xl";

function EcommerceHero(props: EcommerceHeroProps = defaultProps) {
  const {
    headline,
    subheadline,
    ctaLabel,
    ctaIcon,
    featured,
  } = { ...defaultProps, ...props };
  const [email, setEmail] = useState("");

  // CTA: Email signup
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length < 5) {
      toast.error("Please enter a valid email.");
      return;
    }
    toast.success("Thanks for joining! We'll keep you updated.");
    setEmail("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`w-full min-h-[520px] md:min-h-[400px] flex flex-col justify-center items-center ${heroBgGradient} py-16 md:py-20 px-4 md:px-8 lg:px-20`}
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
        {/* Text zone */}
        <div className="flex-1 flex flex-col gap-6 items-start">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="font-sans text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-gray-50 leading-tight"
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="font-sans text-lg md:text-xl text-gray-700 dark:text-gray-200 leading-relaxed max-w-xl"
          >
            {subheadline}
          </motion.p>
          <div className="flex items-center gap-4 mt-2">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
                onClick={() => toast.info("Navigating to shop...")}
              >
                {ctaIcon}
                {ctaLabel}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </div>
          {/* Email signup */}
          <form
            onSubmit={handleSignup}
            className="flex items-center gap-2 mt-4 w-full max-w-md"
          >
            <Input
              type="email"
              placeholder="Get updates: your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 flex-1 px-4 py-2 rounded-md"
            />
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-md shadow-md font-medium"
            >
              <Sparkle className="w-4 h-4 mr-1" />
              Join
            </Button>
          </form>
          <div className="flex gap-6 mt-3 text-sm text-gray-700 dark:text-gray-200">
            <span className="flex items-center gap-1"><Truck className="w-4 h-4" /> Free shipping</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /> 4.8+ rated</span>
          </div>
        </div>
        {/* Featured products zone */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
          {featured?.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, delay: 0.08 * idx }}
            >
              <Card className={`overflow-hidden bg-white dark:bg-gray-900 rounded-xl ${cardShadow} transition-all hover:scale-[1.03] hover:shadow-orange-500/30`}>
                <div className="relative w-full h-44 md:h-40 lg:h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center rounded-t-xl"
                    loading="lazy"
                  />
                  <Badge className="absolute top-3 left-3 bg-indigo-600 text-white font-semibold shadow-md">
                    {item.badge}
                  </Badge>
                </div>
                <CardContent className="flex flex-col gap-2 p-4">
                  <span className="font-sans font-semibold text-lg text-gray-900 dark:text-gray-50 leading-6">
                    {item.name}
                  </span>
                  <span className="text-base text-orange-500 font-serif font-bold">
                    {item.price}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300 text-sm">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {item.rating}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    onClick={() => toast.success(`Added ${item.name} to cart!`)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default EcommerceHero;
