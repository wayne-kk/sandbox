// CarHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Car, ArrowRight, Star } from "lucide-react";

// 1 Brand color (blue), 3 neutrals (white, gray, black), 1 accent (orange)
// Colors used: #2563eb (blue-600), #fff (white), #f3f4f6 (gray-100), #1f2937 (gray-800), #f59e42 (orange-400)
// TOTAL COLORS: 5

export type CarHeroProps = Partial<{
  headline: string;
  subheading: string;
  cars: {
    id: string;
    name: string;
    image: string;
    price: string;
    rating: number;
    tags: string[];
  }[];
  primaryColor: string;
  accentColor: string;
}>;

const mockCars = [
  {
    id: "1",
    name: "Tesla Model S",
    image:
      "https://images.unsplash.com/photo-1511918984145-48de785d4c4e?auto=format&fit=crop&w=800&q=80",
    price: "$89,990",
    rating: 4.8,
    tags: ["Electric", "Luxury"],
  },
  {
    id: "2",
    name: "BMW i8",
    image:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80",
    price: "$147,500",
    rating: 4.6,
    tags: ["Hybrid", "Sport"],
  },
  {
    id: "3",
    name: "Audi A6",
    image:
      "https://images.unsplash.com/photo-1461632830798-3adb3034e4c8?auto=format&fit=crop&w=800&q=80",
    price: "$55,900",
    rating: 4.5,
    tags: ["Sedan", "Comfort"],
  },
  {
    id: "4",
    name: "Ford Mustang",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80",
    price: "$42,300",
    rating: 4.7,
    tags: ["Classic", "Sport"],
  },
  {
    id: "5",
    name: "Toyota RAV4",
    image:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80",
    price: "$27,700",
    rating: 4.3,
    tags: ["SUV", "Family"],
  },
];

const CarHero: React.FC<CarHeroProps> = ({
  headline = "Find Your Dream Car",
  subheading = "Discover top-rated cars, compare features and choose the perfect ride for you.",
  cars = mockCars,
  primaryColor = "#2563eb", // blue
  accentColor = "#f59e42", // orange
}) => {
  const [selectedCarIdx, setSelectedCarIdx] = useState(0);

  const selectedCar = cars[selectedCarIdx];

  const handleContactDealer = () => {
    toast.success(`Contact request for ${selectedCar.name} sent!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full bg-white dark:bg-gray-800 px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8"
      style={{ backgroundColor: "#fff" }}
    >
      {/* Left: Text */}
      <motion.div
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="flex flex-col gap-4 max-w-xl md:max-w-lg lg:max-w-2xl"
      >
        <h1
          className="text-3xl lg:text-5xl font-bold font-sans text-left"
          style={{ color: primaryColor }}
        >
          <Car className="inline-block mr-2" size={36} style={{ color: accentColor }} />
          {headline}
        </h1>
        <p className="text-base lg:text-xl text-gray-800 dark:text-gray-100 font-serif leading-relaxed mt-2">
          {subheading}
        </p>
        <div className="flex gap-2 mt-4">
          {selectedCar.tags.map((tag) => (
            <Badge
              key={tag}
              className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 px-3 py-1 rounded-full font-mono text-sm"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <Separator className="my-6 bg-gray-100 dark:bg-gray-700" />
        <div className="flex items-center gap-6">
          <span className="text-lg lg:text-2xl font-bold font-sans" style={{ color: accentColor }}>
            {selectedCar.price}
          </span>
          <span className="flex items-center gap-1 text-gray-800 dark:text-gray-100 font-mono">
            <Star className="text-yellow-400" size={20} /> {selectedCar.rating}
          </span>
          <Button
            size="lg"
            className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-semibold flex gap-2"
            style={{ backgroundColor: primaryColor }}
            onClick={handleContactDealer}
          >
            Contact Dealer <ArrowRight size={18} />
          </Button>
        </div>
      </motion.div>

      {/* Right: Car Card */}
      <motion.div
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="flex flex-col items-center gap-6"
      >
        <Card className="shadow-xl bg-white dark:bg-gray-800 p-0 w-[340px] max-w-xs">
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedCar.id}
                src={selectedCar.image}
                alt={selectedCar.name}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.19 }}
                className="w-full h-[200px] object-cover rounded-t-xl"
                style={{ background: "#f3f4f6" }}
              />
            </AnimatePresence>
            <div className="p-4 flex flex-col gap-2">
              <h2 className="text-xl font-bold font-sans text-gray-900 dark:text-gray-100">
                {selectedCar.name}
              </h2>
              <div className="flex items-center gap-2">
                <Star className="text-yellow-400" size={16} />
                <span className="text-base font-mono text-gray-800 dark:text-gray-100">
                  {selectedCar.rating} / 5
                </span>
              </div>
              <span className="text-lg font-semibold font-sans" style={{ color: accentColor }}>
                {selectedCar.price}
              </span>
            </div>
          </CardContent>
        </Card>
        {/* Car selector */}
        <div className="flex gap-4 mt-2">
          {cars.map((car, idx) => (
            <button
              key={car.id}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow ${
                idx === selectedCarIdx
                  ? "border-blue-600"
                  : "border-gray-200 dark:border-gray-700"
              } bg-gray-100 dark:bg-gray-800 transition-all duration-200`}
              onClick={() => setSelectedCarIdx(idx)}
              aria-label={car.name}
              style={
                idx === selectedCarIdx
                  ? {
                      borderColor: primaryColor,
                      boxShadow: `0 0 0 2px ${accentColor}`,
                    }
                  : undefined
              }
            >
              <img
                src={car.image}
                alt={car.name}
                className="w-10 h-10 object-cover rounded-full"
                style={{ background: "#f3f4f6" }}
              />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CarHero;
