// PinkTechLanding - 科技风粉色网站首页组件
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Rocket, Cpu, Star, Users, ArrowRight } from "lucide-react";

// Colors
const BRAND = "#E91E63"; // 粉色主色
const NEUTRAL_1 = "#fff";
const NEUTRAL_2 = "#F3F4F6"; // gray-100
const NEUTRAL_3 = "#18181B"; // gray-900
const ACCENT = "#7C3AED"; // 紫色强调

// Mock data
const features = [
  {
    icon: <Rocket size={32} className="text-pink-500" />,
    title: "极速部署",
    desc: "一键启动你的AI项目，自动云托管。"
  },
  {
    icon: <Cpu size={32} className="text-pink-500" />,
    title: "智能引擎",
    desc: "集成最新模型，赋能每个业务场景。"
  },
  {
    icon: <Star size={32} className="text-pink-500" />,
    title: "极致体验",
    desc: "响应迅速，界面丝滑，科技感满满。"
  }
];

const testimonials = [
  {
    name: "李阳",
    title: "AI创业者",
    content: "PinkTech让我的产品上线速度提升了3倍！",
    avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=64&h=64&q=80"
  },
  {
    name: "王琪",
    title: "产品经理",
    content: "界面非常酷炫，用户反馈极好。",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=64&h=64&q=80"
  },
  {
    name: "周俊",
    title: "开发者",
    content: "API文档清晰，集成毫无压力。",
    avatar: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=64&h=64&q=80"
  }
];

interface PinkTechLandingProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
}

const PinkTechLanding: React.FC<Partial<PinkTechLandingProps>> = ({
  title = "PinkTech · 引领AI科技新潮流",
  subtitle = "极致粉色科技风，连接未来智能",
  ctaText = "免费体验"
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("体验申请已提交！");
      setEmail("");
    }, 220);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-pink-50 to-fuchsia-100 flex flex-col items-center justify-start pb-16">
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-4xl mx-auto pt-20 px-8 lg:px-0"
      >
        {/* Hero Section */}
        <Card className="shadow-xl bg-white border-0 px-10 py-12 mb-12">
          <CardHeader className="flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.24 }}
              className="flex items-center gap-2"
            >
              <Cpu className="text-pink-500" size={40} />
              <CardTitle className="text-3xl lg:text-4xl font-bold font-sans text-pink-600 leading-relaxed text-center">
                {title}
              </CardTitle>
            </motion.div>
            <p className="text-lg text-gray-700 font-sans leading-relaxed text-center max-w-xl mt-2">
              {subtitle}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 mt-6">
            <form onSubmit={handleSubmit} className="w-full flex flex-col md:flex-row gap-4 items-center justify-center">
              <Input
                type="email"
                required
                placeholder="请输入邮箱，立即体验"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="md:w-80 w-full bg-fuchsia-50 border-0 focus:ring-2 focus:ring-pink-400 text-base"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div initial={{ scale: 1 }} whileTap={{ scale: 0.96 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-pink-600 hover:bg-pink-500 text-white shadow-lg font-bold px-6 py-2 text-base flex items-center gap-2"
                    >
                      {ctaText}
                      <ArrowRight size={20} />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-pink-500 text-white">
                  免费试用无须信用卡
                </TooltipContent>
              </Tooltip>
            </form>
          </CardContent>
        </Card>

        {/* Features Section */}
        <section className="mt-8 mb-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: 0.1 * idx }}
              >
                <Card className="shadow-md bg-white border-0 px-6 py-8 flex flex-col items-center">
                  <div className="mb-3">{f.icon}</div>
                  <CardTitle className="text-xl text-pink-600 font-bold font-sans mb-2 text-center">
                    {f.title}
                  </CardTitle>
                  <p className="text-base text-gray-600 font-sans leading-relaxed text-center">
                    {f.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold font-sans text-pink-700 text-center mb-8">真实用户反馈</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: 0.08 * idx }}
              >
                <Card className="shadow-md bg-white border-0 px-6 py-7 flex flex-col items-center gap-2">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="rounded-full w-14 h-14 mb-2 border-2 border-pink-200 object-cover"
                  />
                  <p className="text-base text-gray-700 font-serif leading-relaxed text-center mb-2">
                    "{t.content}"
                  </p>
                  <div className="flex flex-col items-center">
                    <span className="text-pink-500 font-bold font-sans text-sm">{t.name}</span>
                    <span className="text-gray-500 text-xs">{t.title}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Showcase Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold font-sans text-pink-700 text-center mb-6">科技美学展示</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22 }}
            >
              <Card className="shadow-lg border-0 px-0 pt-0 pb-0">
                <img
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80"
                  alt="科技未来"
                  className="rounded-xl w-full h-64 object-cover"
                />
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, delay: 0.1 }}
            >
              <Card className="shadow-lg border-0 px-0 pt-0 pb-0">
                <img
                  src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80"
                  alt="粉色科技"
                  className="rounded-xl w-full h-64 object-cover"
                />
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="w-full text-center py-8 text-gray-500 text-sm font-mono">
          <span className="text-pink-500 font-bold">PinkTech</span> © 2024 · 粉色科技风体验站
        </footer>
      </motion.div>
    </div>
  );
};

export default PinkTechLanding;
