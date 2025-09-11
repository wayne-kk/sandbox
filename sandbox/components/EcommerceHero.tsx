// components/EcommerceHero.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingCart, Star, ChevronRight } from "lucide-react";
import Image from "next/image";
import * as React from "react";

// Mock featured products
const mockProducts = [
  {
    id: 1,
    name: "Summer Linen Shirt",
    price: "$39.99",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
    rating: 4.7,
  },
  {
    id: 2,
    name: "Classic Canvas Sneakers",
    price: "$54.00",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    rating: 4.9,
  },
  {
    id: 3,
    name: "Eco Tote Bag",
    price: "$24.50",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    rating: 4.6,
  },
];

// Color palette (warm, energetic, retail-friendly)
// brand.primary: #FF762E (orange)
// neutral.900: #231F20 (rich dark text)
// neutral.100: #FFF9F6 (off-white bg)
// accent.1: #FFB84D (warm yellow)
// accent.2: #FF4D4F (friendly red, for highlights)

export type EcommerceHeroProps = Partial<{
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaSecondaryLabel: string;
  featuredProducts: typeof mockProducts;
  backgroundGradient: string;
}>;

const defaultHeadline = "Shop the Summer Drop: New Arrivals & Bestsellers";
const defaultSubheadline =
  "Fresh finds for every style—shop our handpicked collection and enjoy fast, free shipping on all orders.";
const defaultCtaLabel = "Shop Now";
const defaultCtaSecondaryLabel = "Explore Collections";

const defaultGradient = "bg-gradient-to-br from-[#FF762E]/90 via-[#FFB84D]/70 to-[#FFF9F6]";

function handleCtaClick() {
  toast.success("Welcome! Explore our latest arrivals.");
}

const heroVariants = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

const productCardVariants = {
  initial: { opacity: 0, y: 32 },
  animate: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.18 + i * 0.05 } }),
};

const EcommerceHero: React.FC<EcommerceHeroProps> = ({
  headline = defaultHeadline,
  subheadline = defaultSubheadline,
  ctaLabel = defaultCtaLabel,
  ctaSecondaryLabel = defaultCtaSecondaryLabel,
  featuredProducts = mockProducts,
  backgroundGradient = defaultGradient,
}) => {
  return (
    <section
      className={`relative overflow-hidden w-full py-16 md:py-24 lg:py-28 ${backgroundGradient}`}
      style={{ fontFamily: "Nunito, Quicksand, system-ui, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        {/* Left: Headline & CTA */}
        <motion.div
          variants={heroVariants}
          initial="initial"
          animate="animate"
          className="flex-1 min-w-0"
        >
          <Badge
            className="mb-4 rounded-md px-3 py-1 text-[15px] font-semibold bg-[#FF4D4F]/90 text-white shadow-lg"
            variant="default"
          >
            New Season • Free Shipping
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4 text-neutral-900 leading-tight drop-shadow-sm">
            {headline}
          </h1>
          <p className="text-lg md:text-xl text-neutral-800 leading-relaxed mb-7 max-w-xl">
            {subheadline}
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Button
              size="lg"
              className="bg-[#FF762E] hover:bg-[#FFB84D] text-white shadow-xl font-semibold text-lg px-8 py-3 rounded-md transition-colors"
              onClick={handleCtaClick}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {ctaLabel}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-neutral-300 text-[#FF762E] hover:border-[#FF762E] font-semibold px-7 py-3 shadow-md bg-white"
            >
              {ctaSecondaryLabel}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
        {/* Right: Featured Products */}
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          <AnimatePresence>
            {featuredProducts.slice(0, 3).map((product, i) => (
              <motion.div
                key={product.id}
                variants={productCardVariants}
                initial="initial"
                animate="animate"
                custom={i}
                exit="initial"
                className="h-full"
              >
                <Card className="shadow-xl rounded-lg bg-white/90 hover:shadow-2xl transition-shadow min-h-[320px] flex flex-col justify-between">
                  <CardContent className="flex flex-col p-4 gap-3 h-full justify-between">
                    <div className="flex-1 flex flex-col items-center">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={220}
                        height={160}
                        className="rounded-md object-cover shadow-md mb-3 w-full max-w-[220px] h-[160px]"
                        style={{ backgroundColor: "#FFF9F6" }}
                      />
                      <span className="font-bold text-base text-neutral-900 mb-1 mt-2 text-center">
                        {product.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-[#FFB84D] fill-[#FFB84D]" />
                        <span className="text-sm font-semibold text-neutral-700">
                          {product.rating}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row items-center justify-between mt-3">
                      <span className="text-lg font-bold text-[#FF762E]">
                        {product.price}
                      </span>
                      <Button
                        size="sm"
                        className="bg-[#FF4D4F] hover:bg-[#FF762E] text-white shadow-md rounded-md px-4"
                        onClick={() => toast.success(`Added "${product.name}" to your cart!`)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default EcommerceHero;
