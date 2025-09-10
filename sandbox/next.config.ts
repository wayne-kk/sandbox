import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 设置基础路径和静态资源前缀，确保与主应用隔离
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  // 配置开发服务器
  devIndicators: {
    buildActivity: false,
  },
  // 禁用HMR以避免WebSocket问题
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 禁用HMR
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
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          // 允许iframe嵌入
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
