import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Add it here at the root level to fix the HMR warning
  allowedDevOrigins: ['simple-maggot-expert.ngrok-free.app'],
  
  // 2. Keep serverActions allowedOrigins just in case for API POST requests
  experimental: {
    serverActions: {
      allowedOrigins: ['simple-maggot-expert.ngrok-free.app'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;