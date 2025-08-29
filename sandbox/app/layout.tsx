// 完整的TSX代码内容
'use client';

import '@/app/globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}