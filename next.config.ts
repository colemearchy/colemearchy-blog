import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  reactStrictMode: true,
  // Temporarily disable experimental features to ensure stable builds
  experimental: {},
};

export default nextConfig;
