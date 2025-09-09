import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  // 配置WebSocket和静态资源路径
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 配置WebSocket连接
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // 配置开发服务器
  devIndicators: {
    buildActivity: false,
  },
  // 配置静态资源路径
  assetPrefix: process.env.NODE_ENV === 'production' ? '/sandbox-assets' : '',
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
