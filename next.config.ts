import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],

  async headers() {
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      ...(isProd ? [{
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      }] : []),
      ...(isProd ? [{
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://accounts.google.com https://api.cal.com https://*.prisma-data.net",
          "frame-src 'self' https://accounts.google.com",
          "media-src 'self' data: blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "block-all-mixed-content",
          "upgrade-insecure-requests"
        ].join('; ')
      }] : []),
      {
        key: 'Permissions-Policy',
        value: [
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'payment=()',
          'usb=()',
          'magnetometer=()',
          'gyroscope=()',
          'speaker=()',
          'fullscreen=(self)',
          'sync-xhr=()'
        ].join(', ')
      },
      ...(isProd ? [{
        key: 'Cross-Origin-Embedder-Policy',
        value: 'credentialless'
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin'
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin'
      }] : []),
      {
        key: 'Server',
        value: ''
      }
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      },
      {
        source: '/api/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ]
      },
      {
        source: '/api/auth/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: isProd ? 'https://admin.ink37tattoos.com' : 'http://localhost:3001'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Cookie, Set-Cookie'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          }
        ]
      },
      {
        source: '/api/health/(.*)',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'public, max-age=30'
          }
        ]
      }
    ];
  },
  output: isProd ? 'standalone' : undefined,
  compress: isProd,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@tabler/icons-react'],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'github.com',
        pathname: '/**',
      },
      // Local development patterns
      {
        protocol: 'http' as const,
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http' as const,
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      // Vercel Blob storage patterns
      {
        protocol: 'https' as const,
        hostname: '*.vercel-storage.com',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      // General blob storage patterns
      {
        protocol: 'https' as const,
        hostname: '*.blob.core.windows.net',
        pathname: '/**',
      },
      // CDN patterns for tattoo images
      {
        protocol: 'https' as const,
        hostname: 'ink37tattoos.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'admin.ink37tattoos.com',
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default withBundleAnalyzer(nextConfig)
