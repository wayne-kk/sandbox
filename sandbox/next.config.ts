import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === 'development'
        ? ['localhost:3000', '127.0.0.1:3000', '192.168.31.161:3000', 'wayne.beer', 'sandbox.wayne.beer'] // 开发环境添加localhost
        : ['wayne.beer', 'sandbox.wayne.beer'], // 生产环境限制为特定域名
    },
  },
  devIndicators: {
    buildActivity: false,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' 
              ? '*' // 开发环境允许所有域名
              : 'https://wayne.beer, https://sandbox.wayne.beer', // 生产环境限制为特定域名
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          // 使用 CSP 替代 X-Frame-Options，允许 iframe 嵌入
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "frame-ancestors 'self' http://localhost:3000 http://localhost:3001 http://127.0.0.1:3000 http://192.168.31.161:3000" // 开发环境允许常见localhost端口
              : "frame-ancestors 'self' https://wayne.beer https://sandbox.wayne.beer", // 生产环境限制
          },
        ],
      },
    ];
  },
};

export default nextConfig;