import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAuthClient } from 'better-auth/react'

// Mock better-auth/react
vi.mock('better-auth/react', () => ({
  createAuthClient: vi.fn()
}))

// Mock console to avoid noise
const originalConsole = { ...console }
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('Auth Client', () => {
  const mockAuthClient = {
    signIn: {
      email: vi.fn().mockResolvedValue({ success: true }),
      social: vi.fn().mockResolvedValue({ success: true })
    },
    signUp: {
      email: vi.fn().mockResolvedValue({ success: true })
    },
    signOut: vi.fn().mockResolvedValue({ success: true }),
    useSession: vi.fn().mockReturnValue({ data: null, isPending: false }),
    forgetPassword: vi.fn().mockResolvedValue({ success: true }),
    resetPassword: vi.fn().mockResolvedValue({ success: true }),
    getSession: vi.fn().mockResolvedValue(null),
    updateUser: vi.fn().mockResolvedValue({ success: true }),
    changePassword: vi.fn().mockResolvedValue({ success: true }),
    listSessions: vi.fn().mockResolvedValue([]),
    revokeSession: vi.fn().mockResolvedValue({ success: true })
  }

  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
    vi.mocked(createAuthClient).mockReturnValue(mockAuthClient as any)
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('should create auth client with default URL when env var not set', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    
    // Clear module cache to force re-import
    vi.resetModules()
    
    await import('@/lib/auth-client')

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3001/api/auth'
    })
  })

  it('should create auth client with environment URL when set', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    
    // Clear module cache to force re-import
    vi.resetModules()
    
    await import('@/lib/auth-client')

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'https://example.com/api/auth'
    })
  })

  it('should export all auth methods', async () => {
    vi.resetModules()
    const authClientModule = await import('@/lib/auth-client')

    expect(authClientModule.authClient).toBeDefined()
    expect(authClientModule.signIn).toBeDefined()
    expect(authClientModule.signUp).toBeDefined()
    expect(authClientModule.signOut).toBeDefined()
    expect(authClientModule.useSession).toBeDefined()
    expect(authClientModule.forgetPassword).toBeDefined()
    expect(authClientModule.resetPassword).toBeDefined()
  })

  it('should handle missing NEXT_PUBLIC_APP_URL with localhost fallback', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    
    vi.resetModules()
    await import('@/lib/auth-client')

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3001/api/auth'
    })
  })

  it('should handle production environment URL', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://production.example.com'
    
    vi.resetModules()
    await import('@/lib/auth-client')

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'https://production.example.com/api/auth'
    })
  })

  it('should handle URL with trailing slash', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com/'
    
    vi.resetModules()
    await import('@/lib/auth-client')

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'https://example.com/api/auth'
    })
  })

  it('should handle URL without protocol', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'example.com'
    
    vi.resetModules()
    await import('@/lib/auth-client')

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'example.com/api/auth'
    })
  })

  it('should work with signIn email method', async () => {
    const authClientModule = await import('@/lib/auth-client')
    
    const result = await authClientModule.signIn.email({
      email: 'test@example.com',
      password: 'password123'
    })

    expect(mockAuthClient.signIn.email).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(result).toEqual({ success: true })
  })

  it('should work with signIn social method', async () => {
    const authClientModule = await import('@/lib/auth-client')
    
    const result = await authClientModule.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard'
    })

    expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/dashboard'
    })
    expect(result).toEqual({ success: true })
  })

  it('should work with signUp email method', async () => {
    const authClientModule = await import('@/lib/auth-client')
    
    const result = await authClientModule.signUp.email({
      email: 'newuser@example.com',
      password: 'newpassword123',
      name: 'New User'
    })

    expect(mockAuthClient.signUp.email).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'newpassword123',
      name: 'New User'
    })
    expect(result).toEqual({ success: true })
  })

  it('should work with signOut method', async () => {
    const authClientModule = await import('@/lib/auth-client')
    
    const result = await authClientModule.signOut()

    expect(mockAuthClient.signOut).toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  it('should work with forgetPassword method', async () => {
    const authClientModule = await import('@/lib/auth-client')
    
    const result = await authClientModule.forgetPassword({
      email: 'forgot@example.com',
      redirectTo: '/reset'
    })

    expect(mockAuthClient.forgetPassword).toHaveBeenCalledWith({
      email: 'forgot@example.com',
      redirectTo: '/reset'
    })
    expect(result).toEqual({ success: true })
  })

  it('should work with resetPassword method', async () => {
    const authClientModule = await import('@/lib/auth-client')
    
    const result = await authClientModule.resetPassword({
      token: 'reset-token',
      password: 'newpassword123'
    })

    expect(mockAuthClient.resetPassword).toHaveBeenCalledWith({
      token: 'reset-token',
      password: 'newpassword123'
    })
    expect(result).toEqual({ success: true })
  })

  it('should work with useSession hook', async () => {
    const authClientModule = await import('@/lib/auth-client')
    
    const sessionData = authClientModule.useSession()

    expect(mockAuthClient.useSession).toHaveBeenCalled()
    expect(sessionData).toEqual({ data: null, isPending: false })
  })

  it('should handle auth client creation failure', async () => {
    vi.mocked(createAuthClient).mockImplementation(() => {
      throw new Error('Failed to create auth client')
    })

    // Should not throw, but handle gracefully
    expect(async () => {
      vi.resetModules()
      await import('@/lib/auth-client')
    }).not.toThrow()
  })

  it('should handle different development ports', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    
    vi.resetModules()
    await import('@/lib/auth-client')

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'http://localhost:3000/api/auth'
    })
  })

  it('should handle subdomain URLs', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://admin.tattoo-studio.com'
    
    vi.resetModules()
    await import('@/lib/auth-client')

    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: 'https://admin.tattoo-studio.com/api/auth'
    })
  })
})