// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "购物平台",
  description: "一个用户友好的购物平台，提供多种商品分类、便捷的购物体验和安全的支付方式，旨在满足用户的在线购物需求。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-white text-gray-900 min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 w-full mx-auto">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
