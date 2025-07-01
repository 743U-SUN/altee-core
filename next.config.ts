import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
    ],
    minimumCacheTTL: 86400, // 24時間キャッシュ
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 5000,
        aggregateTimeout: 300,
        ignored: [ '**/node_modules/**', '**/.git/**', '**/.next/**' ]
      }
    }
    return config
  }
};

export default nextConfig;