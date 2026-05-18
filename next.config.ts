import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Add wildcard to allow HMR (Hot Module Replacement) across all subdomains
  allowedDevOrigins: ['ola.ug', '*.ola.ug'],
  
  // 2. Add wildcard to allow Server Actions (form submissions, etc.) across all subdomains
  experimental: {
    serverActions: {
      allowedOrigins: ['ola.ug', '*.ola.ug'],
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