// CarHero.tsx
"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Car, Star } from "lucide-react";
import React from "react";

// Color system: (count: 5)
// 1. Primary: #2563eb (blue-600)
// 2. Neutral: #fff (white)
// 3. Neutral: #1e293b (slate-800)
// 4. Neutral: #64748b (slate-400)
// 5. Accent: #f59e42 (orange-400)

export type CarHeroProps = Partial<{
  cars: {
    name: string;
    image: string;
    price: string;
    badge?: string;
    rating?: number;
    desc: string;
  }[];
  title: string;
  subtitle: string;
  primaryBtnText: string;
  accentBtnText: string;
}>;

const mockCars = [
  {
    name: "Tesla Model S",
    image: "https://images.unsplash.com/photo-1511918984145-48de785d4c4e?auto=format&fit=crop&w=800&q=80",
    price: "$89,990",
    badge: "Electric",
    rating: 4.8,
    desc: "Luxury electric sedan with autopilot."
  },
  {
    name: "BMW M3",
    image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80",
    price: "$72,800",
    badge: "Sport",
    rating: 4.7,
    desc: "High-performance sports sedan."
  },
  {
    name: "Audi Q5",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
    price: "$55,300",
    badge: "SUV",
    rating: 4.6,
    desc: "Comfortable and versatile luxury SUV."
  }
];

const CarHero: React.FC<CarHeroProps> = ({
  cars = mockCars,
  title = "Discover Your Dream Car",
  subtitle = "Explore top-rated vehicles, hand-picked for you.",
  primaryBtnText = "View All Cars",
  accentBtnText = "Contact Dealer"
}) => {
  const handlePrimaryClick = () => {
    toast.success("Showing all cars!");
  };
  const handleAccentClick = () => {
    toast.info("A dealer will contact you soon.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="w-full bg-white dark:bg-slate-800 px-8 py-12"
    >
      <div className="max-w-screen-xl mx-auto flex flex-col gap-12">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="flex-1 flex flex-col gap-4 items-start">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18 }}
              className="text-4xl lg:text-5xl font-bold font-sans text-blue-600 leading-tight mb-2"
            >
              {title}
            </motion.h1>
            <p className="text-lg font-serif text-slate-400 leading-relaxed mb-2">
              {subtitle}
            </p>
            <div className="flex gap-4">
              <motion.div whileHover={{ scale: 1.04 }}>
                <Button
                  size="lg"
                  className="shadow-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  onClick={handlePrimaryClick}
                >
                  <Car className="w-5 h-5 mr-2" />
                  {primaryBtnText}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="shadow-lg border-orange-400 text-orange-400 hover:bg-orange-50 font-semibold"
                  onClick={handleAccentClick}
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  {accentBtnText}
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {cars.slice(0, 2).map((car, idx) => (
                <motion.div
                  key={car.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.22 }}
                >
                  <Card className="shadow-xl bg-white dark:bg-slate-800 rounded-xl overflow-hidden">
                    <CardContent className="p-0">
                      <img
                        src={car.image}
                        alt={car.name}
                        className="w-full h-52 object-cover"
                        style={{ minHeight: 208 }}
                      />
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-bold font-sans text-slate-800 dark:text-white">
                            {car.name}
                          </h2>
                          {car.badge && (
                            <Badge className="bg-orange-400 text-white font-mono text-xs px-2 py-1 rounded">
                              {car.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-base font-serif text-slate-400 leading-relaxed">
                          {car.desc}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-semibold text-blue-600 font-sans">
                            {car.price}
                          </span>
                          <span className="flex items-center gap-1 text-orange-400">
                            <Star className="w-4 h-4" fill="#f59e42" />
                            <span className="text-sm font-mono">{car.rating || "-"}</span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {/* List of more cars, desktop only */}
        <div className="hidden md:grid grid-cols-3 gap-6">
          {cars.map((car, idx) => (
            <motion.div
              key={car.name + "-list"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
            >
              <Card className="shadow-lg bg-white dark:bg-slate-800 rounded-xl">
                <CardContent className="p-0">
                  <img
                    src={car.image}
                    alt={car.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold font-sans text-slate-800 dark:text-white">
                        {car.name}
                      </h3>
                      {car.badge && (
                        <Badge className="bg-orange-400 text-white font-mono text-xs px-2 py-1 rounded">
                          {car.badge}
                        </Badge>
                      )}
                    </div>
                    <span className="text-blue-600 font-semibold font-sans text-base">
                      {car.price}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CarHero;
