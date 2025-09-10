// TechLanding.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Rocket, Cpu, Cloud, Github, Menu, ArrowRight } from "lucide-react";
import React, { useState } from "react";

// Color system
type ColorScheme = {
  brand: { primary: string };
  neutral: { bg: string; surface: string; text: string; border: string };
  accent: { one: string; two: string };
};

const defaultColorScheme: ColorScheme = {
  brand: { primary: "#6366f1" }, // purple-500
  neutral: {
    bg: "#f8fafc",      // slate-50
    surface: "#fff",    // white
    text: "#0f172a",    // slate-900
    border: "#e2e8f0",  // slate-200
  },
  accent: { one: "#06b6d4", two: "#818cf8" }, // cyan-500, indigo-400
};

// Mock data
const features = [
  {
    icon: <Cpu size={28} />, // Lucide
    title: "AI Powered",
    desc: "Harness artificial intelligence to automate your workflow and boost productivity.",
  },
  {
    icon: <Cloud size={28} />,
    title: "Cloud Native",
    desc: "Deploy, scale, and manage seamlessly in the cloud with robust security.",
  },
  {
    icon: <Rocket size={28} />,
    title: "Super Fast",
    desc: "Lightning-fast performance, optimized for modern web and mobile devices.",
  },
];

const testimonials = [
  {
    name: "Alice Kim",
    company: "FintechX",
    avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&w=128&q=80",
    text: "Switched to TechLanding – our deployment speed improved by 60%. Highly recommended!",
  },
  {
    name: "Rahul Singh",
    company: "Cloudify",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&w=128&q=80",
    text: "The AI automation changed our business. TechLanding is a game changer!",
  },
  {
    name: "Marie Dupont",
    company: "InnovateAI",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&w=128&q=80",
    text: "Secure, scalable, and beautiful. Our clients love the new dashboard!",
  },
];

const logos = [
  {
    name: "Github",
    url: "https://github.com",
    icon: <Github size={24} />,
  },
  {
    name: "Unsplash",
    url: "https://unsplash.com",
    icon: <Cloud size={24} />,
  },
  {
    name: "Lucide",
    url: "https://lucide.dev",
    icon: <Rocket size={24} />,
  },
];

export type TechLandingProps = Partial<{
  colorScheme: ColorScheme;
  features: typeof features;
  testimonials: typeof testimonials;
  logos: typeof logos;
}>;

const TechLanding: React.FC<TechLandingProps> = ({
  colorScheme = defaultColorScheme,
  features: featuresData = features,
  testimonials: testimonialsData = testimonials,
  logos: logosData = logos,
}) => {
  const [email, setEmail] = useState("");
  const handleSubscribe = () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    toast.success("Subscribed successfully!");
    setEmail("");
  };

  // Responsive gradient
  const heroBg =
    "bg-gradient-to-r from-indigo-200 via-cyan-100 to-white dark:from-indigo-700 dark:via-cyan-600 dark:to-slate-900";

  return (
    <div
      className={`font-sans min-h-screen w-full ${heroBg}`}
      style={{ backgroundColor: colorScheme.neutral.bg }}
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="flex items-center justify-between px-8 py-6 md:px-16 lg:px-32"
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-400 p-2 shadow-lg"
          >
            <Cpu color={colorScheme.neutral.surface} size={24} />
          </span>
          <span
            className="ml-2 font-mono text-xl font-bold text-indigo-600 dark:text-indigo-300"
            style={{ color: colorScheme.brand.primary }}
          >
            TechLanding
          </span>
        </div>
        <nav className="hidden md:flex gap-6">
          <a className="text-base text-slate-700 hover:text-indigo-600 transition-colors" href="#features">Features</a>
          <a className="text-base text-slate-700 hover:text-indigo-600 transition-colors" href="#testimonials">Testimonials</a>
          <a className="text-base text-slate-700 hover:text-indigo-600 transition-colors" href="#contact">Contact</a>
        </nav>
        {/* Mobile menu icon */}
        <div className="md:hidden">
          <Menu size={24} />
        </div>
      </motion.header>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="flex flex-col md:flex-row items-center justify-between px-8 md:px-16 lg:px-32 py-16 gap-8"
      >
        <div className="flex-1 flex flex-col gap-4 max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
            Empower Your <span className="text-indigo-600" style={{ color: colorScheme.brand.primary }}>Tech</span> Business
          </h1>
          <p className="text-lg md:text-xl text-slate-700 dark:text-slate-200 leading-relaxed mb-6">
            Modern cloud infrastructure and AI automation for startups, enterprises, and innovators.
          </p>
          <div className="flex gap-4">
            <Button
              asChild
              className="shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-6 py-4 rounded-lg"
              style={{ backgroundColor: colorScheme.brand.primary }}
            >
              <a href="#features" className="flex items-center gap-1">
                <Rocket size={20} />
                Get Started
              </a>
            </Button>
            <Button
              variant="outline"
              className="shadow-md border border-slate-300 text-slate-900 px-6 py-4 rounded-lg"
            >
              <a href="#contact" className="flex items-center gap-1">
                <ArrowRight size={20} />
                Contact Us
              </a>
            </Button>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="flex-1 flex justify-center items-center"
        >
          {/* Unsplash tech image */}
          <Card className="shadow-2xl p-2 bg-white dark:bg-slate-900">
            <CardContent className="p-0">
              <img
                src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&w=720&q=80"
                alt="Tech Hero"
                className="rounded-xl w-full h-64 object-cover"
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>
      {/* Features Section */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.2 }}
        className="px-8 md:px-16 lg:px-32 py-12"
      >
        <Card className="bg-white dark:bg-slate-900 shadow-xl p-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-indigo-600 mb-4">Features</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-8">
            {featuresData.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.06 }}
                className="flex flex-col items-center text-center gap-3"
              >
                <div className="rounded-full bg-gradient-to-tr from-indigo-400 to-cyan-400 p-2 shadow-lg mb-2">
                  {f.icon}
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {f.title}
                </div>
                <div className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {f.desc}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.section>
      {/* Testimonials */}
      <motion.section
        id="testimonials"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.18 }}
        className="px-8 md:px-16 lg:px-32 py-12"
      >
        <Card className="bg-white dark:bg-slate-900 shadow-xl p-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-indigo-600 mb-4">Testimonials</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-8">
            {testimonialsData.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.17, delay: i * 0.05 }}
                className="flex flex-col items-center gap-3 text-center"
              >
                <Avatar className="w-14 h-14 mb-2 shadow-lg">
                  <AvatarImage src={t.avatar} alt={t.name} />
                  <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-base font-semibold text-slate-900 dark:text-white">{t.name}</div>
                <div className="text-sm text-indigo-600">{t.company}</div>
                <div className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mt-2">{t.text}</div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.section>
      {/* Call To Action (Newsletter) */}
      <motion.section
        id="contact"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.18 }}
        className="px-8 md:px-16 lg:px-32 py-16"
      >
        <Card className="bg-gradient-to-r from-indigo-50 via-cyan-100 to-white dark:from-indigo-800 dark:via-cyan-900 dark:to-slate-900 shadow-2xl p-8 flex flex-col items-center gap-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-indigo-600 text-center">Stay Updated</CardTitle>
          </CardHeader>
          <CardContent className="w-full max-w-lg flex flex-col gap-4 items-center">
            <div className="text-base text-slate-700 dark:text-slate-200 text-center mb-2 leading-relaxed">
              Subscribe to our newsletter for the latest tech insights, updates, and offers.
            </div>
            <div className="flex w-full gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-3 text-base rounded-md border border-slate-300"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Button
                className="shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md"
                style={{ backgroundColor: colorScheme.brand.primary }}
                onClick={handleSubscribe}
              >
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>
      {/* Footer */}
      <footer className="w-full px-8 md:px-16 lg:px-32 py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-200 mt-8">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg text-indigo-600 font-bold" style={{ color: colorScheme.brand.primary }}>
            TechLanding
          </span>
          <span className="text-sm text-slate-500 ml-2">© 2024 All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          {logosData.map((logo, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <a href={logo.url} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform">
                  {logo.icon}
                </a>
              </TooltipTrigger>
              <TooltipContent>{logo.name}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default TechLanding;
