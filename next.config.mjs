import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', 
          },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: false,
        stream: false,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      "bn.js": path.resolve("./node_modules/bn.js"),
    };

    return config;
  },
};

export default nextConfig;