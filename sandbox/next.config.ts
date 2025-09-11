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
      allowedOrigins: ['wayne.beer', 'sandbox.wayne.beer'], // 限制为特定域名
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
    // 检查是否为开发环境
    const isDevelopment = process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_NODE_ENV === 'development' ||
      !process.env.NODE_ENV;

    // 根据环境设置不同的 CSP 配置
    const frameAncestors = isDevelopment
      ? "'self' http://localhost:* http://127.0.0.1:*"  // 开发环境允许 localhost
      : "'self' https://wayne.beer https://sandbox.wayne.beer";  // 生产环境限制特定域名

    const corsOrigin = isDevelopment
      ? 'http://localhost:3000, http://127.0.0.1:3000'  // 开发环境允许 localhost
      : 'https://wayne.beer, https://sandbox.wayne.beer';  // 生产环境限制特定域名

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: corsOrigin,
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
            value: `frame-ancestors ${frameAncestors}`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;