// PetHero.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, Dog, Cat, Turtle, Rabbit } from "lucide-react";

// Color system: 5 colors
// 1. Primary: #279EFF (blue, trust)
// 2. Neutral 1: #FFFFFF (white)
// 3. Neutral 2: #F1F5F9 (gray-100)
// 4. Neutral 3: #1E293B (gray-800)
// 5. Accent: #FFB72B (orange, warmth)

// --- Mock data ---
const mockPets = [
  {
    id: 1,
    name: "Charlie",
    type: "Dog",
    breed: "Golden Retriever",
    image: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=500&q=80",
    description: "Friendly and energetic, loves playing fetch.",
    featured: true,
  },
  {
    id: 2,
    name: "Luna",
    type: "Cat",
    breed: "Siberian",
    image: "https://images.unsplash.com/photo-1518715308788-3003f51c7fd4?auto=format&fit=crop&w=500&q=80",
    description: "Gentle and playful, enjoys sunbathing.",
    featured: false,
  },
  {
    id: 3,
    name: "Rocky",
    type: "Turtle",
    breed: "Red-Eared Slider",
    image: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=500&q=80",
    description: "Calm and curious, loves water.",
    featured: false,
  },
  {
    id: 4,
    name: "Milo",
    type: "Rabbit",
    breed: "Mini Lop",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=500&q=80",
    description: "Cute and cuddly, hops around joyfully.",
    featured: false,
  },
  {
    id: 5,
    name: "Simba",
    type: "Cat",
    breed: "British Shorthair",
    image: "https://images.unsplash.com/photo-1518715308788-3003f51c7fd4?auto=format&fit=crop&w=500&q=80",
    description: "Smart and affectionate, loves playing with toys.",
    featured: false,
  },
];

// --- Icon selector ---
const typeIcon = {
  Dog: Dog,
  Cat: Cat,
  Turtle: Turtle,
  Rabbit: Rabbit,
};

export type PetHeroProps = Partial<{
  pets: typeof mockPets;
  title: string;
  subtitle: string;
  showFeaturedBadge: boolean;
  onAdopt?: (pet: typeof mockPets[0]) => void;
}>;

const PetHero = ({
  pets = mockPets,
  title = "Find Your Perfect Pet Companion",
  subtitle = "Discover loving pets waiting for a home.",
  showFeaturedBadge = true,
  onAdopt = (pet) => toast.success(`${pet.name} adopted!`),
}: PetHeroProps) => {
  const [selected, setSelected] = useState<number>(pets[0]?.id || 1);

  const handleAdopt = (pet: typeof mockPets[0]) => {
    onAdopt && onAdopt(pet);
  };

  // Color classes
  const colors = {
    brand: "#279EFF",
    neutral1: "#FFFFFF",
    neutral2: "#F1F5F9",
    neutral3: "#1E293B",
    accent: "#FFB72B",
  };

  // Responsive layout: desktop grid, tablet flex, mobile stacked
  return (
    <motion.div
      className="w-full bg-[#F1F5F9] py-10 px-8 md:px-16 lg:px-32"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-screen-xl mx-auto">
        <Card className="shadow-lg bg-[#FFFFFF]">
          <CardHeader className="pb-0">
            <h1
              className="text-2xl lg:text-3xl font-bold font-sans text-[#279EFF] leading-relaxed mb-2"
            >
              {title}
            </h1>
            <p
              className="text-base lg:text-lg font-serif text-[#1E293B] leading-6 mb-4"
            >
              {subtitle}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-8 md:grid-cols-2 sm:grid-cols-1">
              {pets.map((pet) => {
                const Icon = typeIcon[pet.type as keyof typeof typeIcon] || Dog;
                const isSelected = selected === pet.id;
                return (
                  <motion.div
                    key={pet.id}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.15 }}
                    className={`flex flex-col items-center gap-4 p-6 rounded-xl shadow-md bg-[#F1F5F9] border-2 border-transparent ${
                      isSelected ? "border-[#279EFF]" : ""
                    }`}
                  >
                    <Avatar className="w-24 h-24 shadow-lg">
                      <AvatarImage src={pet.image} alt={pet.name} />
                      <AvatarFallback className="bg-[#279EFF] text-white">
                        <Icon size={40} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold font-sans text-[#1E293B] leading-6">
                        {pet.name}
                      </h2>
                      {showFeaturedBadge && pet.featured && (
                        <Badge className="bg-[#FFB72B] text-[#1E293B] font-mono">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-base text-[#1E293B] font-serif leading-relaxed text-center">
                      {pet.description}
                    </p>
                    <div className="flex gap-2 items-center">
                      <span className="px-2 py-1 rounded bg-[#279EFF] text-white text-sm font-mono">
                        {pet.type}
                      </span>
                      <span className="px-2 py-1 rounded bg-[#FFFFFF] text-[#1E293B] text-sm font-mono border border-[#F1F5F9]">
                        {pet.breed}
                      </span>
                    </div>
                    <Button
                      className="mt-2 shadow-md bg-[#279EFF] hover:bg-[#FFB72B] text-white font-bold leading-6"
                      onClick={() => {
                        setSelected(pet.id);
                        handleAdopt(pet);
                      }}
                    >
                      <Heart
                        className="mr-2"
                        size={18}
                        color={isSelected ? colors.accent : colors.brand}
                        strokeWidth={2}
                      />
                      Adopt
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default PetHero;
