// TechLanding.tsx
"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Rocket, Shield, Code, User } from "lucide-react";
import React, { useState } from "react";

// Brand & Color system
const COLORS = {
  brand: {
    primary: "#3B82F6", // blue-500
  },
  neutral: {
    canvas: "#0F172A", // slate-900
    surface: "#1E293B", // slate-800
    text: "#F1F5F9", // slate-100
    border: "#334155", // slate-700
  },
  accent: {
    1: "#38BDF8", // sky-400
    2: "#818CF8", // indigo-400
  },
  functional: {
    success: "#22C55E",
    warning: "#FACC15",
    error: "#EF4444",
    info: "#0EA5E9",
  },
};

// Mock Data
const FEATURES = [
  {
    icon: <Rocket size={28} />, title: "Blazing Performance", desc: "Optimized for lightning-fast load times and smooth user experience."
  },
  {
    icon: <Shield size={28} />, title: "Enterprise Security", desc: "Advanced protection and privacy for all your data."
  },
  {
    icon: <Code size={28} />, title: "Developer Friendly", desc: "Clean API, full documentation, and open source."
  },
];
const TEAM = [
  {
    name: "Alex Kim",
    role: "Lead Developer",
    img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=128&h=128&facepad=2&q=80",
  },
  {
    name: "Jordan Lee",
    role: "Product Designer",
    img: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=128&h=128&facepad=2&q=80",
  },
  {
    name: "Sam Taylor",
    role: "AI Engineer",
    img: "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=facearea&w=128&h=128&facepad=2&q=80",
  },
];

const HERO_IMAGE = "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80";

export type TechLandingProps = Partial<{
  brandName: string;
  tagline: string;
  heroImg: string;
  features: typeof FEATURES;
  team: typeof TEAM;
}>;

const TechLanding: React.FC<TechLandingProps> = ({
  brandName = "NovaTech AI",
  tagline = "Innovating Tomorrow, Today",
  heroImg = HERO_IMAGE,
  features = FEATURES,
  team = TEAM,
}) => {
  const [email, setEmail] = useState("");
  const handleSubscribe = () => {
    if (email.length > 5 && email.includes("@")) {
      toast.success("Subscribed successfully!");
      setEmail("");
    } else {
      toast.error("Please enter a valid email address.");
    }
  };

  return (
    <div className="bg-[${COLORS.neutral.canvas}] min-h-screen font-sans">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-8 py-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex-1 flex flex-col gap-6"
        >
          <span className="text-3xl md:text-5xl font-bold text-[${COLORS.brand.primary}]">{brandName}</span>
          <span className="text-lg md:text-2xl font-semibold text-[${COLORS.neutral.text}] leading-relaxed">{tagline}</span>
          <div className="flex gap-4 mt-4">
            <Button
              asChild
              className="shadow-lg bg-[${COLORS.brand.primary}] text-white hover:bg-[${COLORS.accent[1]}]"
              size="lg"
            >
              <a href="#features" className="flex items-center gap-2">
                Learn More <ArrowRight size={18} />
              </a>
            </Button>
            <Button
              className="shadow-lg bg-[${COLORS.accent[2]}] text-white hover:bg-[${COLORS.brand.primary}]"
              size="lg"
              onClick={() => toast.info("Demo coming soon!")}
            >
              Request Demo
            </Button>
          </div>
          {/* Email Subscription */}
          <div className="flex gap-2 mt-8 items-center">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[${COLORS.neutral.surface}] border-[${COLORS.neutral.border}] text-[${COLORS.neutral.text}]"
            />
            <Button
              className="shadow-md bg-[${COLORS.accent[1]}] text-white"
              onClick={handleSubscribe}
            >
              Subscribe
            </Button>
          </div>
        </motion.div>
        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="flex-1 flex justify-center"
        >
          <Card className="shadow-2xl bg-[${COLORS.neutral.surface}] border-none p-0 max-w-md w-full">
            <img src={heroImg} alt="Tech Hero" className="w-full h-64 object-cover rounded-xl" />
          </Card>
        </motion.div>
      </div>

      {/* Features Section */}
      <div id="features" className="px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[${COLORS.brand.primary}] mb-8 text-left">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.18, delay: i * 0.04 }}
            >
              <Card className="flex flex-col gap-3 items-start p-6 shadow-xl bg-[${COLORS.neutral.surface}] border-none">
                <div className="text-[${COLORS.accent[1]}]">{f.icon}</div>
                <span className="text-lg font-semibold text-[${COLORS.neutral.text}] leading-6">{f.title}</span>
                <span className="text-base text-[${COLORS.neutral.text}] leading-relaxed opacity-80">{f.desc}</span>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="px-8 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[${COLORS.brand.primary}] mb-8 text-left">Meet the Team</h2>
        <div className="flex flex-wrap gap-8">
          {team.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.16, delay: idx * 0.04 }}
              className="flex flex-col items-center gap-3"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="w-20 h-20 shadow-lg">
                    <AvatarImage src={member.img} alt={member.name} />
                    <AvatarFallback className="bg-[${COLORS.accent[2]}] text-white">{member.name.split(' ')[0][0]}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent className="bg-[${COLORS.neutral.surface}] text-[${COLORS.neutral.text}] border-[${COLORS.neutral.border}]">
                  {member.role}
                </TooltipContent>
              </Tooltip>
              <span className="text-base font-semibold text-[${COLORS.neutral.text}] leading-6">{member.name}</span>
              <span className="text-sm text-[${COLORS.accent[2]}]">{member.role}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-8 max-w-6xl mx-auto border-t border-[${COLORS.neutral.border}] mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[${COLORS.neutral.text}] text-sm">
          <span>&copy; 2024 {brandName}. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <User size={18} /> Powered by Next.js & shadcn/ui
          </span>
        </div>
      </footer>
    </div>
  );
};

export default TechLanding;
