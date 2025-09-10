// EcommerceHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingCart, ArrowRight, Star } from "lucide-react";

// Mock Data: Featured products (for hero highlights)
const FEATURED_PRODUCTS = [
  {
    id: "1",
    name: "Eco-Friendly Reusable Bottle",
    description: "Stay hydrated sustainably. Available in vivid coral!",
    image:
      "https://images.unsplash.com/photo-1519864602590-cf7e3f1b9cf4?auto=format&fit=crop&w=900&q=80",
    price: "$19.99",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Wireless Earbuds",
    description: "Experience pure sound. Color: Arctic Blue.",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    price: "$59.99",
    rating: 4.7,
  },
  {
    id: "3",
    name: "Minimalist Backpack",
    description: "Perfect for daily commute. Color: Charcoal Gray.",
    image:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80",
    price: "$39.99",
    rating: 4.6,
  },
];

// Color System
const COLORS = {
  brand: {
    primary: "bg-orange-500 text-white hover:bg-orange-600",
  },
  neutral: {
    bg: "bg-neutral-50 dark:bg-neutral-900",
    surface: "bg-white dark:bg-neutral-800",
    text: "text-neutral-900 dark:text-neutral-100",
    border: "border-neutral-200 dark:border-neutral-700",
  },
  accent: {
    1: "bg-yellow-400 text-yellow-900",
    2: "bg-blue-400 text-blue-900",
  },
};

export type EcommerceHeroProps = Partial<{
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaSecondaryLabel: string;
  featuredProducts: typeof FEATURED_PRODUCTS;
}>;

const defaultProps: EcommerceHeroProps = {
  title: "Shop the Latest Trends & Essentials",
  subtitle:
    "Discover exclusive deals and bestsellers. Fast shipping, easy returns, and daily new arrivals.",
  ctaLabel: "Shop Now",
  ctaSecondaryLabel: "Browse Deals",
  featuredProducts: FEATURED_PRODUCTS,
};

function EcommerceHero({
  title = defaultProps.title,
  subtitle = defaultProps.subtitle,
  ctaLabel = defaultProps.ctaLabel,
  ctaSecondaryLabel = defaultProps.ctaSecondaryLabel,
  featuredProducts = defaultProps.featuredProducts,
}: EcommerceHeroProps) {
  const [search, setSearch] = useState("");

  // Simple search toast
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Searching for "${search}"...`);
    setSearch("");
  };

  return (
    <motion.div
      className={
        `w-full ${COLORS.neutral.bg} py-12 px-6 md:px-12 lg:px-24 flex flex-col gap-8`
      }
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {/* Left section: Heading + CTA + search */}
        <div className="flex flex-col gap-6">
          <h1 className={
            `font-sans text-3xl lg:text-5xl font-bold ${COLORS.neutral.text} leading-tight`
          }>{title}</h1>
          <p className={
            `font-sans text-lg lg:text-xl ${COLORS.neutral.text} leading-relaxed`
          }>{subtitle}</p>
          {/* CTA Buttons */}
          <div className="flex flex-row gap-4 mt-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                className={`shadow-lg ${COLORS.brand.primary} px-6 py-3 text-base font-bold`}
                onClick={() => toast.success("Welcome to our shop!")}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {ctaLabel}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="outline"
                className={`shadow ${COLORS.neutral.text} border ${COLORS.neutral.border} px-6 py-3 font-bold`}
                onClick={() => toast.info("Best deals just for you!")}
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                {ctaSecondaryLabel}
              </Button>
            </motion.div>
          </div>
          {/* Search bar */}
          <form
            className="flex gap-2 mt-4 max-w-md"
            onSubmit={handleSearch}
          >
            <Input
              type="text"
              placeholder="Search products, brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-3 text-base shadow"
            />
            <Button
              type="submit"
              className={`${COLORS.brand.primary} shadow px-6 py-3 font-bold`}
            >
              Search
            </Button>
          </form>
        </div>

        {/* Right section: Featured product cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
        >
          {featuredProducts?.slice(0, 3).map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Card className={`shadow-lg ${COLORS.neutral.surface} border-0 p-0 overflow-hidden flex flex-col`}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                  style={{ backgroundColor: "#f7f7f7" }}
                />
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className={`font-sans font-bold text-lg ${COLORS.neutral.text}`}>{product.name}</div>
                  <div className={`font-sans text-base ${COLORS.neutral.text} leading-relaxed`}>{product.description}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`font-mono text-xl font-bold ${COLORS.brand.primary.split(" ")[0]} px-2 rounded`}>{product.price}</span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-sans text-base font-semibold text-neutral-700">{product.rating}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default EcommerceHero;
