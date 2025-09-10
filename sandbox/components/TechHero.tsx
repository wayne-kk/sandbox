// TechHero.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Rocket, Sparkle, ShieldCheck, Cpu, Cloud } from "lucide-react";
import React from "react";

// Color system
const color = {
  brand: {
    primary: "#3B82F6" // blue
  },
  neutral: {
    bg: "#F9FAFB",
    surface: "#FFFFFF",
    text: "#1E293B",
    border: "#E5E7EB"
  },
  accent: {
    one: "#10B981", // teal
    two: "#A78BFA"  // purple
  }
};

// Mock data: hero features
const features = [
  {
    icon: <Cpu className="w-6 h-6 text-[#10B981]" aria-label="AI-powered" />,
    title: "AI-powered Engine",
    desc: "Harness next-gen artificial intelligence for your workflow."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-[#A78BFA]" aria-label="Security" />,
    title: "Robust Security",
    desc: "Enterprise-grade protection for your data at every step."
  },
  {
    icon: <Cloud className="w-6 h-6 text-[#3B82F6]" aria-label="Cloud" />,
    title: "Cloud Scalability",
    desc: "Effortlessly scale with resilient cloud infrastructure."
  }
];

// TechHero Props
export type TechHeroProps = Partial<{
  headline: string;
  subheading: string;
  ctaLabel: string;
  imageUrl: string;
  onCta: () => void;
}>;

const defaultImage = "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1200&q=80";

const TechHero: React.FC<TechHeroProps> = ({
  headline = "Empower Your Future with Cutting-edge Technology",
  subheading = "Unlock performance, security, and innovation for your organization with our advanced tech solutions.",
  ctaLabel = "Get Started",
  imageUrl = defaultImage,
  onCta = () => toast.success("Demo started!")
}) => {
  return (
    <motion.div
      className="w-full bg-[linear-gradient(120deg,#3B82F6_0%,#A78BFA_100%)] dark:bg-[#1E293B]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-screen-xl mx-auto px-8 py-16 flex flex-row items-center gap-12 md:gap-8 md:flex-col md:px-4 md:py-12">
        {/* Left: Text & CTA */}
        <motion.div
          className="flex-1 flex flex-col gap-8"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.22 }}
        >
          <Badge className="mb-2 w-fit px-3 py-1 bg-[#10B981] text-white font-mono text-sm shadow-md" variant="secondary">
            <Sparkle className="inline-block mr-2 w-4 h-4" />
            Technology Hero
          </Badge>
          <h1 className="font-sans text-4xl lg:text-5xl font-bold leading-tight text-white mb-4">
            {headline}
          </h1>
          <p className="font-serif text-lg leading-relaxed text-white/90 mb-2">
            {subheading}
          </p>

          {/* Features */}
          <div className="flex flex-row gap-6 md:gap-4">
            {features.map((feat, idx) => (
              <Card key={feat.title} className="flex items-center gap-2 px-4 py-3 shadow-lg bg-white/80 border-0">
                <span aria-hidden className="rounded-full bg-[#F9FAFB] p-2">
                  {feat.icon}
                </span>
                <div>
                  <span className="font-sans font-semibold text-base text-[#1E293B]">{feat.title}</span>
                  <span className="block text-sm text-[#475569] leading-6">{feat.desc}</span>
                </div>
              </Card>
            ))}
          </div>

          <Button
            asChild
            size="lg"
            className="mt-8 px-8 py-3 font-mono text-lg shadow-xl bg-[#3B82F6] hover:bg-gradient-to-r hover:from-[#3B82F6] hover:to-[#10B981] text-white"
            onClick={onCta}
          >
            <span>
              <Rocket className="inline-block mr-2 w-5 h-5" />
              {ctaLabel}
            </span>
          </Button>
        </motion.div>

        {/* Right: Image */}
        <motion.div
          className="flex-1 flex justify-center items-center"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.22 }}
        >
          <Card className="w-full max-w-md shadow-2xl bg-white border-0 flex flex-col items-center p-0">
            <Avatar className="w-full h-64 md:h-48">
              <AvatarImage src={imageUrl} alt="Tech hero banner" className="object-cover w-full h-full rounded-t-lg" />
              <AvatarFallback className="bg-[#E5E7EB] text-[#1E293B] font-mono">TECH</AvatarFallback>
            </Avatar>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TechHero;
