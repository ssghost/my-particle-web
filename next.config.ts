import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
      crypto: false,
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      "bn.js": path.resolve("./node_modules/bn.js"),
    };

    return config;
  },
};

export default nextConfig;