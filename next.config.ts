import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  output: 'standalone',
  turbopack: {}, // Silence Turbopack warning for Next.js 16
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/@:handle',
        destination: '/:handle',
      },
      {
        source: '/@:handle/:path*',
        destination: '/:handle/:path*',
      },
    ]
  },
  async redirects() {
    return [
      // Product → Item migration redirects
      {
        source: '/admin/products/:path*',
        destination: '/admin/items/:path*',
        permanent: true,
      },
      {
        source: '/admin/categories/:path*',
        destination: '/admin/item-categories/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/products/:path*',
        destination: '/dashboard/items/:path*',
        permanent: true,
      },
      {
        source: '/@:handle/products/:path*',
        destination: '/@:handle/items/:path*',
        permanent: true,
      },
      // Device → Item migration redirects (Phase 10)
      {
        source: '/devices/:path*',
        destination: '/items/:path*',
        permanent: true,
      },
      {
        source: '/@:handle/devices/:path*',
        destination: '/@:handle/items/:path*',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'cdn.altee.me',
      },
    ],
    minimumCacheTTL: 86400, // 24時間キャッシュ
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 5000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**']
      }
    }
    return config
  }
};

export default withSerwist(nextConfig);