import type { NextConfig } from "next";

const BACKEND_URL =
  process.env.BACKEND_URL || "https://credaxis-backend.onrender.com";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Proxy /api/* → Render backend so the real URL is never exposed to the browser
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Mock Node.js native modules for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        readline: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;

