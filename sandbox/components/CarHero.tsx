// CarHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowRight, Star, Car, Info } from "lucide-react";

// Color system (warm, for retail/auto)
// brand.primary: #E4572E
// neutral.100: #FFF8F6
// neutral.700: #2D2D2D
// accent.1: #FFC857
// accent.2: #29335C

export type CarHeroProps = Partial<{
  title: string;
  subtitle: string;
  cars: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    price: string;
    rating: number;
    isFeatured?: boolean;
  }>;
  onExplore?: (carId: string) => void;
}>;

const mockCars = [
  {
    id: "mustang",
    name: "Ford Mustang GT",
    description: "Iconic American muscle meets modern tech. 5.0L V8, 450hp.",
    imageUrl:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=80",
    price: "$55,000",
    rating: 4.7,
    isFeatured: true,
  },
  {
    id: "tesla",
    name: "Tesla Model S Plaid",
    description: "Luxury electric sedan, 0-60 in 1.99s, 396mi range.",
    imageUrl:
      "https://images.unsplash.com/photo-1511918984145-48de785d4c4e?auto=format&fit=crop&w=800&q=80",
    price: "$89,990",
    rating: 4.9,
    isFeatured: false,
  },
  {
    id: "camaro",
    name: "Chevrolet Camaro ZL1",
    description: "Supercharged V8, track-ready suspension and bold looks.",
    imageUrl:
      "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80",
    price: "$62,500",
    rating: 4.6,
    isFeatured: false,
  },
  {
    id: "supra",
    name: "Toyota GR Supra",
    description: "Modern legend. Turbocharged inline-6, razor-sharp handling.",
    imageUrl:
      "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
    price: "$54,500",
    rating: 4.5,
    isFeatured: true,
  },
  {
    id: "audi",
    name: "Audi RS5 Coupe",
    description: "Quattro AWD, twin-turbo V6, refined interior luxury.",
    imageUrl:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80",
    price: "$75,900",
    rating: 4.8,
    isFeatured: false,
  },
];

const CarHero: React.FC<CarHeroProps> = ({
  title = "Discover Your Dream Car",
  subtitle = "Explore our exclusive collection of top-rated vehicles. Performance, luxury & style in one place.",
  cars = mockCars,
  onExplore = (id) => toast.success(`Explore details for car: ${id}`),
}) => {
  const [selected, setSelected] = useState<string>(cars[0]?.id || "");

  const selectedCar = cars.find((c) => c.id === selected) || cars[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full px-8 py-12 md:py-20 bg-[linear-gradient(120deg,#FFF8F6_0%,#FFC857_80%)]"
    >
      <motion.div
        className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22 }}
      >
        {/* Hero Text */}
        <div className="flex-1 min-w-[320px] md:max-w-lg flex flex-col gap-6">
          <h1 className="text-4xl lg:text-5xl font-bold font-sans text-[#2D2D2D] leading-tight">
            {title}
          </h1>
          <p className="text-lg font-sans text-[#29335C] leading-relaxed">
            {subtitle}
          </p>
          {/* Featured badges */}
          <div className="flex gap-3 flex-wrap mt-2">
            {cars
              .filter((c) => c.isFeatured)
              .map((c) => (
                <Badge
                  key={c.id}
                  className="bg-[#FFC857] text-[#2D2D2D] font-semibold px-4 py-2 shadow-md"
                >
                  <Star size={16} className="inline mr-1" />
                  {c.name}
                </Badge>
              ))}
          </div>
        </div>
        {/* Car Card */}
        <motion.div
          className="flex-1 min-w-[320px] md:max-w-xl"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
        >
          <Card className="shadow-xl bg-white/95 rounded-xl overflow-hidden border-0">
            <CardHeader className="p-0">
              <div className="w-full h-64 md:h-72 relative">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedCar.id}
                    src={selectedCar.imageUrl}
                    alt={selectedCar.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="object-cover w-full h-full"
                    style={{ borderBottom: "4px solid #FFC857" }}
                  />
                </AnimatePresence>
                <span className="absolute top-4 left-4 bg-[#E4572E] text-white px-3 py-1 rounded-full text-sm font-bold shadow-md flex items-center gap-1">
                  <Car size={16} />
                  {selectedCar.name}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-2">
              <p className="text-base md:text-lg font-sans text-[#29335C] font-semibold leading-6">
                {selectedCar.description}
              </p>
              <div className="flex gap-4 items-center mt-2">
                <span className="text-xl font-bold text-[#E4572E] font-sans">{selectedCar.price}</span>
                <span className="flex items-center gap-1 text-[#29335C] font-semibold">
                  <Star size={18} className="text-[#FFC857]" />
                  {selectedCar.rating}
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-6 flex justify-between gap-4">
              <Button
                size="lg"
                className="bg-[#E4572E] hover:bg-[#FF6F4C] text-white font-bold shadow-lg px-6 py-2 rounded-lg"
                onClick={() => {
                  onExplore(selectedCar.id);
                  toast(
                    `${selectedCar.name}: Discover more details!`,
                    {
                      icon: <Info className="text-[#E4572E]" size={18} />,
                    }
                  );
                }}
              >
                Explore Details
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </CardFooter>
          </Card>
          {/* Car selector thumbnails */}
          <div className="flex gap-4 mt-6 justify-center flex-wrap">
            {cars.map((c) => (
              <motion.button
                key={c.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 shadow-md transition-all bg-[#FFF8F6] ${
                  selected === c.id ? "border-[#E4572E]" : "border-transparent"
                }`}
                onClick={() => setSelected(c.id)}
                aria-label={`Select ${c.name}`}
              >
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="object-cover w-full h-full"
                />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default CarHero;
