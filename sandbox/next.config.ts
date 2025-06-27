import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/vite"],
          as: "*.css",
        },
      },
    },
  },
};

export default nextConfig;
