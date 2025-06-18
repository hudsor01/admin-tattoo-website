import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  output: isProd ? 'standalone' : undefined,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@tabler/icons-react', 'recharts'],
    optimizeCss: isProd,
  },
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ...(isProd ? [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://accounts.google.com https://*.prisma-data.net",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
          ].join('; ')
        }
      ] : []),
    ];

    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/api/(.*)',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ]
      },
    ];
  },

  async redirects() {
    return [
      { source: '/', destination: '/dashboard', permanent: false },
      { source: '/admin/:path*', destination: '/dashboard/:path*', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.vercel-storage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ink37tattoos.com', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'admin.ink37tattoos.com', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/**' },
      { protocol: 'https', hostname: 'example.com', pathname: '/**' },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: isProd ? 60 : 0,
  },
}

export default withBundleAnalyzer(nextConfig)
