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
  
  // Turbopack configuration for development
  ...(process.env.NODE_ENV === 'development' ? {
    turbopack: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  } : {}),
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
      // Production images will use HTTPS only
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
