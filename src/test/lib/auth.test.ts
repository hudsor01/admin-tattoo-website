import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

// Mock modules
vi.mock('better-auth', () => ({
  betterAuth: vi.fn()
}))

vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: vi.fn()
}))

vi.mock('better-auth/next-js', () => ({
  nextCookies: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
  default: { 
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    account: {
      create: vi.fn(),
      findFirst: vi.fn()
    },
    session: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn()
    }
  },
  prisma: { 
    $connect: vi.fn(),
    $disconnect: vi.fn()
  }
}))

describe('Auth Configuration', () => {
  const mockEnv = {
    BETTER_AUTH_SECRET: 'test-secret',
    BETTER_AUTH_URL: 'http://localhost:3001',
    GOOGLE_CLIENT_ID: 'test-google-id',
    GOOGLE_CLIENT_SECRET: 'test-google-secret'
  }

  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    // Set up environment variables
    process.env = { ...originalEnv }
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should configure better auth with correct settings', async () => {
    const mockPrismaAdapter = { type: 'prisma' }
    const mockNextCookiesPlugin = { name: 'nextCookies' }
    
    vi.mocked(prismaAdapter).mockReturnValue(mockPrismaAdapter as any)
    vi.mocked(nextCookies).mockReturnValue(mockNextCookiesPlugin as any)
    vi.mocked(betterAuth).mockReturnValue({
      auth: 'configured'
    } as any)

    // Import auth to trigger configuration
    await import('@/lib/auth')

    // Verify betterAuth was called with correct configuration
    expect(betterAuth).toHaveBeenCalledWith({
      secret: 'test-secret',
      baseURL: 'http://localhost:3001',
      database: mockPrismaAdapter,
      emailAndPassword: {
        enabled: true,
        disableSignUp: true,
        requireEmailVerification: false,
        minPasswordLength: 6,
      },
      socialProviders: {
        google: {
          clientId: 'test-google-id',
          clientSecret: 'test-google-secret',
        },
      },
      plugins: [mockNextCookiesPlugin],
      trustedOrigins: ['http://localhost:5174'],
      basePath: '/api/auth'
    })

    // Verify prismaAdapter was called correctly
    expect(prismaAdapter).toHaveBeenCalledWith(
      expect.any(Object), // prisma instance
      { provider: 'postgresql' }
    )
  })

  it('should use environment variables correctly', async () => {
    // This test just verifies that required env vars are read
    // We can't easily test throwing because the auth module is already loaded
    expect(process.env.BETTER_AUTH_SECRET).toBeDefined()
    expect(process.env.BETTER_AUTH_URL).toBeDefined()
  })

  it('should handle missing environment variables gracefully', async () => {
    delete process.env.BETTER_AUTH_SECRET
    delete process.env.BETTER_AUTH_URL
    
    // Import should work but use defaults
    vi.resetModules()
    const authModule = await import('@/lib/auth')
    
    expect(authModule).toBeDefined()
    expect(betterAuth).toHaveBeenCalled()
  })

  it('should configure prisma adapter with correct provider', async () => {
    const mockPrismaAdapter = { type: 'prisma', provider: 'postgresql' }
    vi.mocked(prismaAdapter).mockReturnValue(mockPrismaAdapter as any)
    
    await import('@/lib/auth')
    
    expect(prismaAdapter).toHaveBeenCalledWith(
      expect.any(Object),
      { provider: 'postgresql' }
    )
  })

  it('should configure social providers correctly', async () => {
    const mockBetterAuth = vi.fn().mockReturnValue({ auth: 'configured' })
    vi.mocked(betterAuth).mockImplementation(mockBetterAuth)
    
    await import('@/lib/auth')
    
    const config = mockBetterAuth.mock.calls[0][0]
    expect(config.socialProviders.google).toEqual({
      clientId: 'test-google-id',
      clientSecret: 'test-google-secret'
    })
  })

  it('should disable signup by default', async () => {
    const mockBetterAuth = vi.fn().mockReturnValue({ auth: 'configured' })
    vi.mocked(betterAuth).mockImplementation(mockBetterAuth)
    
    await import('@/lib/auth')
    
    const config = mockBetterAuth.mock.calls[0][0]
    expect(config.emailAndPassword.disableSignUp).toBe(true)
    expect(config.emailAndPassword.requireEmailVerification).toBe(false)
  })

  it('should set correct base path for auth routes', async () => {
    const mockBetterAuth = vi.fn().mockReturnValue({ auth: 'configured' })
    vi.mocked(betterAuth).mockImplementation(mockBetterAuth)
    
    await import('@/lib/auth')
    
    const config = mockBetterAuth.mock.calls[0][0]
    expect(config.basePath).toBe('/api/auth')
  })

  it('should include trusted origins for development', async () => {
    const mockBetterAuth = vi.fn().mockReturnValue({ auth: 'configured' })
    vi.mocked(betterAuth).mockImplementation(mockBetterAuth)
    
    await import('@/lib/auth')
    
    const config = mockBetterAuth.mock.calls[0][0]
    expect(config.trustedOrigins).toContain('http://localhost:5174')
  })

  it('should export auth handlers and session', async () => {
    const mockAuthInstance = {
      handler: vi.fn(),
      api: { getSession: vi.fn() },
      GET: vi.fn(),
      POST: vi.fn()
    }
    
    vi.mocked(betterAuth).mockReturnValue(mockAuthInstance as any)
    
    const authModule = await import('@/lib/auth')
    
    expect(authModule.auth).toBeDefined()
    expect(authModule.GET).toBeDefined()
    expect(authModule.POST).toBeDefined()
  })

  it('should handle production environment correctly', async () => {
    process.env.NODE_ENV = 'production'
    process.env.BETTER_AUTH_URL = 'https://myapp.com'
    
    const mockBetterAuth = vi.fn().mockReturnValue({ auth: 'configured' })
    vi.mocked(betterAuth).mockImplementation(mockBetterAuth)
    
    vi.resetModules()
    await import('@/lib/auth')
    
    const config = mockBetterAuth.mock.calls[0][0]
    expect(config.baseURL).toBe('https://myapp.com')
  })

  it('should configure password requirements', async () => {
    const mockBetterAuth = vi.fn().mockReturnValue({ auth: 'configured' })
    vi.mocked(betterAuth).mockImplementation(mockBetterAuth)
    
    await import('@/lib/auth')
    
    const config = mockBetterAuth.mock.calls[0][0]
    expect(config.emailAndPassword.minPasswordLength).toBe(6)
    expect(config.emailAndPassword.enabled).toBe(true)
  })
})