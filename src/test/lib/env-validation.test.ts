import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock console methods before importing the module
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalExit = process.exit
const originalEnv = process.env

describe('Environment Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    console.error = vi.fn()
    console.warn = vi.fn()
    process.exit = vi.fn() as any
    
    // Reset module cache to ensure fresh imports
    vi.resetModules()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
    process.exit = originalExit
    process.env = originalEnv
  })

  describe('Environment Schema Validation', () => {
    it('should validate with minimal required environment variables', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'a'.repeat(32)
      }

      const { env, isDevelopment, isProduction, isTest } = await import('@/lib/env-validation')

      expect(env.NODE_ENV).toBe('development')
      expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db')
      expect(env.BETTER_AUTH_SECRET).toBe('a'.repeat(32))
      expect(env.PORT).toBe(3001) // default value
      expect(env.LOG_LEVEL).toBe('info') // default value
      expect(env.MAX_FILE_SIZE).toBe(104857600) // default value

      expect(isDevelopment).toBe(true)
      expect(isProduction).toBe(false)
      expect(isTest).toBe(false)
    })

    it('should validate with all environment variables', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        PORT: '3002',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'a'.repeat(40),
        NEXT_PUBLIC_APP_URL: 'https://example.com',
        GOOGLE_CLIENT_ID: 'google-client-id',
        GOOGLE_CLIENT_SECRET: 'google-client-secret',
        MAIN_WEBSITE_API_URL: 'https://api.example.com',
        MAIN_WEBSITE_API_KEY: 'api-key',
        BLOB_READ_WRITE_TOKEN: 'blob-token',
        CSRF_SECRET: 'b'.repeat(32),
        LOG_LEVEL: 'debug',
        MAX_FILE_SIZE: '52428800'
      }

      const { env, isDevelopment, isProduction, isTest } = await import('@/lib/env-validation')

      expect(env.NODE_ENV).toBe('production')
      expect(env.PORT).toBe(3002)
      expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db')
      expect(env.BETTER_AUTH_SECRET).toBe('a'.repeat(40))
      expect(env.NEXT_PUBLIC_APP_URL).toBe('https://example.com')
      expect(env.GOOGLE_CLIENT_ID).toBe('google-client-id')
      expect(env.GOOGLE_CLIENT_SECRET).toBe('google-client-secret')
      expect(env.MAIN_WEBSITE_API_URL).toBe('https://api.example.com')
      expect(env.MAIN_WEBSITE_API_KEY).toBe('api-key')
      expect(env.BLOB_READ_WRITE_TOKEN).toBe('blob-token')
      expect(env.CSRF_SECRET).toBe('b'.repeat(32))
      expect(env.LOG_LEVEL).toBe('debug')
      expect(env.MAX_FILE_SIZE).toBe(52428800)

      expect(isDevelopment).toBe(false)
      expect(isProduction).toBe(true)
      expect(isTest).toBe(false)
    })

    it('should handle test environment', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/test_db',
        BETTER_AUTH_SECRET: 'c'.repeat(32)
      }

      const { env, isDevelopment, isProduction, isTest } = await import('@/lib/env-validation')

      expect(env.NODE_ENV).toBe('test')
      expect(isDevelopment).toBe(false)
      expect(isProduction).toBe(false)
      expect(isTest).toBe(true)
    })

    it('should use default values for optional fields', async () => {
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'd'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.NODE_ENV).toBe('development')
      expect(env.PORT).toBe(3001)
      expect(env.LOG_LEVEL).toBe('info')
      expect(env.MAX_FILE_SIZE).toBe(104857600)
    })

    it('should handle invalid NODE_ENV values', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'invalid',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'e'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.NODE_ENV).toBe('development') // falls back to default
    })

    it('should handle string PORT conversion', async () => {
      process.env = {
        ...originalEnv,
        PORT: '4000',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'f'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.PORT).toBe(4000)
      expect(typeof env.PORT).toBe('number')
    })

    it('should handle invalid PORT values', async () => {
      process.env = {
        ...originalEnv,
        PORT: 'invalid',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'g'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.PORT).toBe(3001) // falls back to default
    })

    it('should validate LOG_LEVEL enum values', async () => {
      const validLevels = ['error', 'warn', 'info', 'debug']

      for (const level of validLevels) {
        process.env = {
          ...originalEnv,
          LOG_LEVEL: level,
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
          BETTER_AUTH_SECRET: 'h'.repeat(32)
        }

        vi.resetModules()
        const { env } = await import('@/lib/env-validation')

        expect(env.LOG_LEVEL).toBe(level)
      }
    })

    it('should handle invalid LOG_LEVEL values', async () => {
      process.env = {
        ...originalEnv,
        LOG_LEVEL: 'invalid',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'i'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.LOG_LEVEL).toBe('info') // falls back to default
    })

    it('should validate MAX_FILE_SIZE number conversion', async () => {
      process.env = {
        ...originalEnv,
        MAX_FILE_SIZE: '209715200',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'j'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.MAX_FILE_SIZE).toBe(209715200)
      expect(typeof env.MAX_FILE_SIZE).toBe('number')
    })
  })

  describe('Error Handling', () => {
    it('should exit in production when required variables are missing', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production'
        // Missing DATABASE_URL and BETTER_AUTH_SECRET
      }

      await import('@/lib/env-validation')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Environment validation failed:')
      )
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    it('should warn in development when required variables are missing', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development'
        // Missing DATABASE_URL and BETTER_AUTH_SECRET
      }

      const { env } = await import('@/lib/env-validation')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Environment validation failed:')
      )
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️  Continuing with potentially invalid environment in development'
      )
      expect(process.exit).not.toHaveBeenCalled()
      expect(env).toBeDefined()
    })

    it('should handle short BETTER_AUTH_SECRET', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'short' // less than 32 characters
      }

      await import('@/lib/env-validation')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Environment validation failed:')
      )
    })

    it('should handle invalid URL format', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'k'.repeat(32),
        NEXT_PUBLIC_APP_URL: 'not-a-url'
      }

      await import('@/lib/env-validation')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Environment validation failed:')
      )
    })

    it('should handle short CSRF_SECRET', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'l'.repeat(32),
        CSRF_SECRET: 'short' // less than 32 characters
      }

      await import('@/lib/env-validation')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Environment validation failed:')
      )
    })
  })

  describe('Configuration Getters', () => {
    beforeEach(() => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'm'.repeat(32),
        PORT: '3001'
      }
    })

    it('should return auth config in development', async () => {
      const { getAuthConfig } = await import('@/lib/env-validation')
      const config = getAuthConfig()

      expect(config).toEqual({
        secret: 'm'.repeat(32),
        baseUrl: 'http://localhost:3001'
      })
    })

    it('should return auth config in production with custom URL', async () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://custom.example.com'
      }

      vi.resetModules()
      const { getAuthConfig } = await import('@/lib/env-validation')
      const config = getAuthConfig()

      expect(config).toEqual({
        secret: 'm'.repeat(32),
        baseUrl: 'https://custom.example.com'
      })
    })

    it('should return auth config in production with default URL', async () => {
      process.env = {
        ...process.env,
        NODE_ENV: 'production'
      }

      vi.resetModules()
      const { getAuthConfig } = await import('@/lib/env-validation')
      const config = getAuthConfig()

      expect(config).toEqual({
        secret: 'm'.repeat(32),
        baseUrl: 'https://admin.ink37tattoos.com'
      })
    })

    it('should return upload config with defaults', async () => {
      const { getUploadConfig } = await import('@/lib/env-validation')
      const config = getUploadConfig()

      expect(config).toEqual({
        maxFileSize: 104857600,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
      })
    })

    it('should return upload config with custom max file size', async () => {
      process.env = {
        ...process.env,
        MAX_FILE_SIZE: '52428800'
      }

      vi.resetModules()
      const { getUploadConfig } = await import('@/lib/env-validation')
      const config = getUploadConfig()

      expect(config).toEqual({
        maxFileSize: 52428800,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4']
      })
    })
  })

  describe('Default Export', () => {
    it('should export env as default', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'n'.repeat(32)
      }

      const defaultExport = await import('@/lib/env-validation').then(m => m.default)
      const { env } = await import('@/lib/env-validation')

      expect(defaultExport).toBe(env)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string values', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'o'.repeat(32),
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: ''
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.GOOGLE_CLIENT_ID).toBeUndefined()
      expect(env.GOOGLE_CLIENT_SECRET).toBeUndefined()
    })

    it('should handle whitespace-only values', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: '   ',
        BETTER_AUTH_SECRET: 'p'.repeat(32)
      }

      await import('@/lib/env-validation')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Environment validation failed:')
      )
    })

    it('should handle very large PORT numbers', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        PORT: '65535',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'q'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.PORT).toBe(65535)
    })

    it('should handle negative PORT numbers', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        PORT: '-1',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 'r'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.PORT).toBe(-1)
    })

    it('should handle very large MAX_FILE_SIZE', async () => {
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        BETTER_AUTH_SECRET: 's'.repeat(32),
        MAX_FILE_SIZE: '1073741824' // 1GB
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.MAX_FILE_SIZE).toBe(1073741824)
    })

    it('should handle complex DATABASE_URL', async () => {
      const complexUrl = 'postgresql://user:p%40ssw0rd@localhost:5432/db?sslmode=require'
      process.env = {
        ...originalEnv,
        NODE_ENV: 'development',
        DATABASE_URL: complexUrl,
        BETTER_AUTH_SECRET: 't'.repeat(32)
      }

      const { env } = await import('@/lib/env-validation')

      expect(env.DATABASE_URL).toBe(complexUrl)
    })
  })
})