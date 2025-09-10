// TechLandingPage.tsx
"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Cpu, Cloud, Shield, ArrowRight } from "lucide-react";

// Core color palette
const colors = {
  brand: {
    primary: "#5168FA" // blue-violet (technology, trust, energy)
  },
  neutral: {
    bg: "#0F172A", // slate-900
    surface: "#1E293B", // slate-800
    text: "#F1F5F9", // slate-100
    border: "#334155" // slate-700
  },
  accent: {
    1: "#1DD3B0", // teal (innovation)
    2: "#FEA443" // orange (energy)
  },
  functional: {
    success: "#23D160",
    error: "#EF4444",
    info: "#3B82F6"
  }
};

// Mock data
const features = [
  {
    icon: <Rocket size={32} className="text-accent-1" />,
    title: "Lightning Fast Deployment",
    description: "Deploy your projects in seconds with our cutting-edge cloud infrastructure."
  },
  {
    icon: <Cpu size={32} className="text-brand-primary" />,
    title: "AI Powered Solutions",
    description: "Integrate advanced AI easily to automate and scale effortlessly."
  },
  {
    icon: <Cloud size={32} className="text-accent-2" />,
    title: "Secure Cloud Storage",
    description: "Store, manage, and share your data with end-to-end encryption."
  },
  {
    icon: <Shield size={32} className="text-functional-success" />,
    title: "Enterprise Grade Security",
    description: "Protect your assets with multilayered security and compliance."
  }
];

const testimonials = [
  {
    user: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=128&q=80",
    name: "Alexa L.",
    role: "CTO, FintechX",
    text: "This platform transformed our workflow, scaling with us as we grew rapidly."
  },
  {
    user: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=128&q=80",
    name: "Samir P.",
    role: "Lead Dev, HealthAI",
    text: "The deployment speed and security are unmatched. Highly recommended!"
  },
  {
    user: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=128&q=80",
    name: "Jenna W.",
    role: "Founder, EduTech",
    text: "AI integration is seamless. Our product is smarter than ever."
  }
];

const plans = [
  {
    name: "Starter",
    price: "$19/mo",
    features: ["1 Project", "Basic AI", "Community Support"],
    accent: "accent-1"
  },
  {
    name: "Pro",
    price: "$49/mo",
    features: ["Unlimited Projects", "Advanced AI", "Priority Support"],
    accent: "brand-primary"
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    features: ["Custom Integration", "Dedicated Cloud", "24/7 Support"],
    accent: "accent-2"
  }
];

// Main Component
interface TechLandingPageProps {
  title?: string;
  subtitle?: string;
  heroImage?: string;
  colorMode?: "light" | "dark";
}

const TechLandingPage: React.FC<Partial<TechLandingPageProps>> = ({
  title = "Innovate with NextGen Tech Platform",
  subtitle = "Empowering your ideas with speed, intelligence, and security.",
  heroImage = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
  colorMode = "dark"
}) => {
  const [selectedPlan, setSelectedPlan] = useState(plans[1].name);
  const [email, setEmail] = useState("");
  const handleSubscribe = () => {
    if (email.match(/^\S+@\S+\.\S+$/)) {
      toast.success("Subscribed successfully!");
      setEmail("");
    } else {
      toast.error("Please enter a valid email address.");
    }
  };

  // Dynamic theme
  const theme = colorMode === "light"
    ? {
        bg: "bg-white",
        surface: "bg-slate-100",
        text: "text-slate-900",
        border: "border-slate-300",
        accent1: "text-teal-600",
        accent2: "text-orange-500",
        brand: "text-indigo-600"
      }
    : {
        bg: "bg-slate-900",
        surface: "bg-slate-800",
        text: "text-slate-100",
        border: "border-slate-700",
        accent1: "text-teal-400",
        accent2: "text-orange-400",
        brand: "text-indigo-400"
      };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`${theme.bg} min-h-screen w-full font-sans`}
    >
      {/* Hero Section */}
      <div className={`flex flex-col lg:flex-row items-center justify-between gap-8 px-8 py-16 ${theme.bg}`}
        style={{ background: `linear-gradient(90deg, ${colors.brand.primary} 0%, ${colors.accent[1]} 100%)`, backgroundBlendMode: "overlay" }}>
        <div className="flex-1 flex flex-col gap-4 items-start max-w-xl">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.22 }}
            className={`text-4xl lg:text-5xl font-bold leading-tight ${theme.text}`}
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.24 }}
            className={`text-lg lg:text-xl leading-relaxed ${theme.text} opacity-80 mb-2`}
          >
            {subtitle}
          </motion.p>
          <div className="flex flex-row gap-4 mt-4">
            <Button
              className={`shadow-lg px-6 py-3 font-semibold ${theme.brand} hover:${theme.accent1} transition`}
              onClick={() => toast.info("Get Started clicked!")}
            >
              Get Started
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className={`shadow px-6 py-3 border ${theme.border} ${theme.text}`}>Demo</Button>
              </TooltipTrigger>
              <TooltipContent>Try the live demo</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.22 }}
          className="flex-1 flex justify-center lg:justify-end"
        >
          <img
            src={heroImage}
            alt="Tech Hero"
            className="rounded-xl shadow-xl w-full max-w-md object-cover border-4 border-transparent"
            style={{ background: `linear-gradient(120deg, ${colors.accent[1]} 0%, ${colors.accent[2]} 100%)` }}
          />
        </motion.div>
      </div>
      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.18 }}
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-12 ${theme.bg}`}
      >
        {features.map((feat, idx) => (
          <Card key={idx} className={`shadow-lg ${theme.surface} ${theme.text} border ${theme.border}`}>
            <CardHeader className="flex items-center gap-2">
              <span>{feat.icon}</span>
              <CardTitle className="text-lg font-semibold leading-6">{feat.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-base leading-relaxed opacity-80">
              {feat.description}
            </CardContent>
          </Card>
        ))}
      </motion.div>
      {/* Pricing Plans */}
      <div className={`px-8 py-16 ${theme.bg}`}>
        <h2 className={`text-2xl font-bold mb-8 ${theme.text}`}>Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.18 }}
            >
              <Card className={`shadow-xl border-2 ${theme.surface} ${theme.text} ${theme.border}`}
                style={{ borderColor: colors.accent[plan.accent as keyof typeof colors.accent] }}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-xl font-bold ${theme.text}`}>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold mb-2">{plan.price}</p>
                  <ul className="list-disc pl-4 leading-relaxed">
                    {plan.features.map((f) => (
                      <li key={f} className={`${theme.text} opacity-90 text-base`}>{f}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`shadow px-4 py-2 w-full font-semibold ${theme.brand} hover:${theme.accent1} transition`}
                    onClick={() => {
                      setSelectedPlan(plan.name);
                      toast.success(`Selected ${plan.name} plan`);
                    }}
                  >
                    Choose {plan.name}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Testimonials Section */}
      <div className={`px-8 py-16 ${theme.bg}`}>
        <h2 className={`text-2xl font-bold mb-8 ${theme.text}`}>What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.18 }}
            >
              <Card className={`shadow-lg ${theme.surface} border ${theme.border}`}>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar src={t.user} alt={t.name} className="w-14 h-14" />
                  <div>
                    <CardTitle className="text-base font-bold mb-1">{t.name}</CardTitle>
                    <span className={`text-sm opacity-70 ${theme.text}`}>{t.role}</span>
                  </div>
                </CardHeader>
                <CardContent className="text-base leading-relaxed opacity-90">
                  "{t.text}"
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Newsletter Signup */}
      <div className={`px-8 py-16 ${theme.bg} flex flex-col items-center`}>
        <h2 className={`text-2xl font-bold mb-4 ${theme.text}`}>Stay in the Loop</h2>
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-lg items-center">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`rounded-lg px-4 py-3 shadow w-full ${theme.surface} ${theme.text} border ${theme.border}`}
          />
          <Button
            className={`shadow px-6 py-3 font-semibold w-full md:w-auto ${theme.brand} hover:${theme.accent2} transition`}
            onClick={handleSubscribe}
          >
            Subscribe
          </Button>
        </div>
      </div>
      {/* Footer */}
      <footer className={`px-8 py-8 ${theme.surface} border-t ${theme.border} flex flex-col md:flex-row items-center justify-between gap-4`}>
        <span className={`text-sm ${theme.text}`}>© 2024 NextGen Tech Platform</span>
        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
          <SelectTrigger className={`w-40 ${theme.surface} ${theme.text} border ${theme.border} shadow`}>
            <SelectValue placeholder="Choose Plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.name} value={plan.name}>{plan.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </footer>
    </motion.div>
  );
};

export default TechLandingPage;
