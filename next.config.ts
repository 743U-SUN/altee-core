import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 86400, // 24時間キャッシュ
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

export default nextConfig;