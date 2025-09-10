// FinanceHero.tsx
"use client";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Avatar,
  Badge
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TrendingUp, ShieldCheck, Bank } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Color system
const COLORS = {
  brand: {
    primary: "#2166C4", // blue, trustworthy
  },
  neutral: {
    bg: "#F5F8FA",
    surface: "#FFFFFF",
    text: "#1A2330",
    border: "#E2E8F0"
  },
  accent: {
    one: "#23B26F", // green for growth
    two: "#FFC76C" // yellow for optimism
  },
};

// Mock data for hero highlights
const heroHighlights = [
  {
    icon: TrendingUp,
    label: "Smart Investments",
    description: "Grow your wealth with AI-powered insights."
  },
  {
    icon: ShieldCheck,
    label: "Secure Savings",
    description: "Your assets protected with top-grade security."
  },
  {
    icon: Bank,
    label: "Easy Banking",
    description: "Manage accounts & transactions in one place."
  }
];

// Mock testimonials
const testimonials = [
  {
    name: "Ava Lee",
    role: "Entrepreneur",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=64&q=80",
    quote: "FinanceFlow helped grow my portfolio 25% in just 6 months!"
  },
  {
    name: "James Kim",
    role: "Investor",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=64&q=80",
    quote: "Secure and easy to use. The AI advice is a game changer."
  },
  {
    name: "Sophia Zhang",
    role: "Freelancer",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=64&q=80",
    quote: "I love the clean design and quick transfers!"
  }
];

export type FinanceHeroProps = Partial<{
  title: string;
  subtitle: string;
  ctaText: string;
  backgroundImage: string;
}>;

const defaultBG =
  "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1600&q=80";

function handleDemoCTA() {
  toast.success("Demo requested! We'll be in touch soon.");
}

const FinanceHero = ({
  title = "Your Money, Smarter.",
  subtitle = "FinanceFlow empowers you with secure banking and intelligent investment tools—all in one powerful platform.",
  ctaText = "Get Started Free",
  backgroundImage = defaultBG
}: FinanceHeroProps) => {
  const [email, setEmail] = useState("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="relative w-full min-h-[540px] flex items-center justify-center bg-gradient-to-br from-[#2166C4] via-[#23B26F] to-[#FFC76C]"
      style={{ background: `linear-gradient(112deg, ${COLORS.brand.primary} 40%, ${COLORS.accent.one} 70%, ${COLORS.accent.two} 100%)` }}
    >
      {/* Overlay for contrast */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt="Finance background"
          fill
          className="object-cover opacity-35"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/0 dark:from-[#1A2330]/85 dark:via-[#2166C4]/40 dark:to-[#23B26F]/10"
        />
      </div>
      <div className="relative z-10 w-full max-w-5xl px-8 py-16 flex flex-col gap-12">
        {/* Hero Main Section */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 flex flex-col gap-6">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.19 }}
              className="text-4xl lg:text-5xl font-bold font-sans text-[#1A2330] dark:text-white leading-tight"
            >
              {title}
            </motion.h1>
            <p className="text-lg lg:text-xl font-serif text-[#2166C4] dark:text-[#FFC76C] leading-relaxed max-w-xl">
              {subtitle}
            </p>
            {/* CTA form */}
            <form
              className="flex flex-col sm:flex-row items-center gap-4 mt-2"
              onSubmit={e => {
                e.preventDefault();
                handleDemoCTA();
              }}
            >
              <Input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/80 border border-[#E2E8F0] text-base px-4 py-2 rounded-lg font-sans"
                required
                aria-label="Email address"
              />
              <Button
                type="submit"
                className="shadow-lg bg-[#2166C4] hover:bg-[#23B26F] text-white font-bold px-6 py-2 rounded-lg text-base"
                aria-label={ctaText}
              >
                {ctaText}
              </Button>
            </form>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.16 }}
            className="flex-1 flex items-center justify-center"
          >
            <Card className="shadow-2xl bg-white/90 border border-[#E2E8F0] rounded-2xl max-w-sm p-6 flex flex-col gap-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2166C4] font-bold text-lg">
                  <Bank className="w-6 h-6 text-[#23B26F]" />
                  FinanceFlow
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {heroHighlights.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-[#FFC76C]" />
                    <span className="font-medium text-[#2166C4]">{item.label}</span>
                  </div>
                ))}
              </CardContent>
              <Badge className="bg-[#23B26F] text-white text-sm font-mono px-3 py-1">
                AI Powered
              </Badge>
            </Card>
          </motion.div>
        </div>
        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, idx) => (
            <Card
              key={idx}
              className="shadow-lg border border-[#E2E8F0] bg-white/90 flex flex-col gap-3 p-5 rounded-xl"
            >
              <CardHeader className="flex items-center gap-3">
                <Avatar>
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                </Avatar>
                <div>
                  <span className="font-bold text-[#2166C4] text-base">{t.name}</span>
                  <br />
                  <span className="text-sm text-[#1A2330]">{t.role}</span>
                </div>
              </CardHeader>
              <CardContent className="text-[#1A2330] text-base leading-relaxed font-serif">
                “{t.quote}”
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FinanceHero;
