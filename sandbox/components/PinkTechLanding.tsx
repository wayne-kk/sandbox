// PinkTechLanding.tsx
"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkle, ArrowRight, Shield, Cpu, Star } from "lucide-react";

// Mock tech features
type Feature = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};
const features: Feature[] = [
  {
    icon: <Sparkle className="text-pink-500" size={24} />,
    title: "AI 智能推荐",
    desc: "基于智能算法，为你量身定制科技内容。",
  },
  {
    icon: <Cpu className="text-pink-500" size={24} />,
    title: "极速性能",
    desc: "享受毫秒级响应的流畅体验。",
  },
  {
    icon: <Shield className="text-pink-500" size={24} />,
    title: "安全防护",
    desc: "数据加密，保障你的信息安全。",
  },
  {
    icon: <Star className="text-pink-500" size={24} />,
    title: "创新设计",
    desc: "独特粉色科技风格，视觉新体验。",
  },
  {
    icon: <ArrowRight className="text-pink-500" size={24} />,
    title: "便捷导航",
    desc: "一键直达你关注的板块。",
  }
];

const team = [
  {
    name: "李明",
    role: "产品经理",
    img: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=128&q=80"
  },
  {
    name: "杨倩",
    role: "前端工程师",
    img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=128&q=80"
  },
  {
    name: "赵强",
    role: "UI设计师",
    img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=128&q=80"
  }
];

export type PinkTechLandingProps = Partial<{
  title: string;
  subtitle: string;
  features: Feature[];
  team: typeof team;
}>;

const defaultTitle = "PinkTech 科技新纪元";
const defaultSubtitle = "极致粉色科技风，智能与美学的完美融合";

const PinkTechLanding: React.FC<PinkTechLandingProps> = ({
  title = defaultTitle,
  subtitle = defaultSubtitle,
  features: propFeatures = features,
  team: propTeam = team,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("订阅成功！感谢关注 PinkTech。", { position: "top-center" });
      setEmail("");
    }, 800);
  };

  return (
    <div className="w-full min-h-screen bg-white text-gray-800 font-sans">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="flex flex-col items-center justify-center gap-4 py-16 px-4 md:px-16 bg-gradient-to-b from-pink-100 to-white"
      >
        <motion.div
          initial={{ scale: 0.97 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.22 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-pink-500 text-center leading-tight">
            {title}
          </h1>
        </motion.div>
        <p className="text-lg md:text-2xl text-gray-600 text-center leading-relaxed mt-2 max-w-2xl">
          {subtitle}
        </p>
        <form
          onSubmit={handleSubscribe}
          className="flex flex-col md:flex-row items-center gap-4 mt-6 max-w-xl w-full"
        >
          <Label htmlFor="email" className="sr-only">
            邮箱
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="输入你的邮箱，获取最新科技资讯"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 text-base leading-6 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-200"
            required
            disabled={loading}
          />
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              type="submit"
              size="lg"
              className="bg-pink-500 hover:bg-pink-600 text-white shadow-lg px-6 py-2 rounded-xl"
              disabled={loading}
            >
              {loading ? "订阅中..." : "立即订阅"}
            </Button>
          </motion.div>
        </form>
      </motion.div>

      {/* FEATURES */}
      <section className="w-full flex flex-col items-center py-10 px-4 md:px-16 bg-white">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-pink-500 mb-8">
          核心科技亮点
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {propFeatures.slice(0, 5).map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: idx * 0.06 }}
            >
              <Card className="shadow-xl border-none bg-pink-50 hover:shadow-2xl transition-shadow duration-200 flex flex-col gap-4">
                <CardHeader className="flex items-center gap-2">
                  {f.icon}
                  <span className="text-lg font-semibold text-pink-600">{f.title}</span>
                </CardHeader>
                <CardContent className="text-gray-700 text-base leading-relaxed">
                  {f.desc}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="w-full flex flex-col items-center py-10 px-4 md:px-16 bg-pink-50">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-pink-500 mb-8">核心团队</h2>
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl">
          {propTeam.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.07 }}
            >
              <Card className="shadow-lg border-none bg-white flex flex-col items-center gap-2 px-6 py-4">
                <Avatar>
                  <img
                    src={member.img}
                    alt={member.name}
                    className="rounded-full w-16 h-16 object-cover border-2 border-pink-300"
                  />
                </Avatar>
                <CardHeader className="text-lg font-semibold text-pink-700 text-center">
                  {member.name}
                </CardHeader>
                <CardContent className="text-sm text-gray-600 text-center leading-6">
                  {member.role}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-8 px-4 md:px-16 bg-gray-900 text-white mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
          <span className="text-base text-pink-400 font-mono">© {new Date().getFullYear()} PinkTech</span>
          <span className="text-sm text-gray-400 leading-relaxed">科技，让生活更美好</span>
        </div>
      </footer>
    </div>
  );
};

export default PinkTechLanding;
