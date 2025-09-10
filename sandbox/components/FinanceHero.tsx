// FinanceHero.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, ShieldCheck, BarChart2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

// Color system (example):
// brand.primary: #2563eb (blue-600)
// neutral.1: #f8fafc (slate-50)
// neutral.2: #334155 (slate-700)
// accent.1: #22d3ee (cyan-400)
// accent.2: #f59e42 (orange-400)

export type FinanceHeroProps = Partial<{
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
  imageUrl: string;
  features: { icon: React.ReactNode; label: string; description: string }[];
  stats: { label: string; value: string }[];
  newsletterLabel: string;
}>;

const mockFeatures = [
  {
    icon: <ShieldCheck className="text-brand-primary w-6 h-6" />,
    label: "Bank-level Security",
    description: "Your data is encrypted and protected."
  },
  {
    icon: <BarChart2 className="text-accent-1 w-6 h-6" />,
    label: "Real-time Analytics",
    description: "Track your portfolio with up-to-date insights."
  },
  {
    icon: <ArrowRight className="text-accent-2 w-6 h-6" />,
    label: "Easy Transfers",
    description: "Move funds instantly, with no hidden fees."
  }
];

const mockStats = [
  { label: "Active Users", value: "120K+" },
  { label: "Assets Managed", value: "$8.2B" },
  { label: "Avg. Growth", value: "16%/yr" }
];

export default function FinanceHero({
  title = "Modern Finance, Simplified.",
  subtitle = "All-in-one banking, investing, and analytics platform. Secure your future with trustworthy technology.",
  ctaLabel = "Get Started Free",
  onCta = () => toast.success("Welcome to FinTrust!"),
  imageUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80",
  features = mockFeatures,
  stats = mockStats,
  newsletterLabel = "Subscribe for updates",
}: FinanceHeroProps) {
  const [email, setEmail] = useState("");

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
      toast.success("Thank you for subscribing!");
      setEmail("");
    } else {
      toast.error("Please enter a valid email.");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.26 } }}
      className="w-full bg-neutral-1 dark:bg-neutral-2 py-20 px-4 md:px-10"
    >
      <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12">
        {/* Left: Content */}
        <div className="flex-1 flex flex-col items-start gap-8">
          <h1 className="font-sans text-3xl md:text-5xl font-bold text-brand-primary dark:text-white leading-tight">
            {title}
          </h1>
          <p className="font-sans text-lg md:text-xl text-neutral-2 dark:text-neutral-1 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
          {/* Stats */}
          <div className="flex gap-8 md:gap-12">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-start">
                <span className="font-serif text-2xl md:text-3xl font-semibold text-brand-primary dark:text-accent-1">
                  {s.value}
                </span>
                <span className="font-sans text-base text-neutral-2 dark:text-neutral-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          {/* CTA & Newsletter */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.18 }}
              className="shadow-lg"
            >
              <Button
                size="lg"
                onClick={onCta}
                className="text-white bg-brand-primary hover:bg-accent-1 shadow-xl px-8 py-4 rounded-lg font-sans text-base font-semibold"
              >
                {ctaLabel}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
            <form
              className="flex items-center gap-2 mt-1"
              onSubmit={handleNewsletter}
              aria-label="Newsletter signup"
            >
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-44 md:w-56 px-3 py-2 text-base rounded-md shadow-sm bg-white dark:bg-neutral-2 border border-neutral-2 dark:border-neutral-1"
                aria-label="Email"
              />
              <Button
                type="submit"
                size="sm"
                className="bg-accent-1 hover:bg-brand-primary text-neutral-2 font-sans shadow-md"
                aria-label={newsletterLabel}
              >
                Subscribe
              </Button>
            </form>
          </div>
          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 w-full max-w-2xl">
            {features.map((f, i) => (
              <Card
                key={i}
                className="flex flex-row items-center gap-3 p-4 shadow-md bg-white dark:bg-neutral-2"
              >
                <div>{f.icon}</div>
                <div>
                  <div className="font-sans font-semibold text-base text-brand-primary dark:text-accent-1">
                    {f.label}
                  </div>
                  <div className="font-sans text-sm text-neutral-2 dark:text-neutral-1 leading-6">
                    {f.description}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        {/* Right: Image */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1, transition: { duration: 0.22 } }}
          className="flex-1 flex justify-center items-center w-full max-w-xl"
        >
          <div className="relative w-full h-80 md:h-96 rounded-2xl shadow-2xl overflow-hidden">
            <Image
              src={imageUrl}
              alt="Finance dashboard preview"
              fill
              className="object-cover rounded-2xl"
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            {/* Optional overlay gradient for legibility (light only) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/80 via-brand-primary/10 to-transparent dark:from-neutral-2/80 dark:via-brand-primary/30 pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}