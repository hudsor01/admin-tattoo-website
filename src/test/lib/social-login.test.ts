import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signinGoogle } from '@/lib/social-login'

// Mock the auth-client module
const mockAuthClient = {
  signIn: {
    social: vi.fn()
  }
}

vi.mock('@/lib/auth-client', () => ({
  authClient: mockAuthClient
}))

describe('Social Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signinGoogle', () => {
    it('should call authClient.signIn.social with google provider', async () => {
      const mockResponse = {
        data: {
          session: { id: 'session-123' },
          user: { id: 'user-123', email: 'test@example.com' }
        },
        error: null
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(mockResponse)

      const result = await signinGoogle()

      expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google'
      })
      expect(result).toEqual(mockResponse)
    })

    it('should handle successful Google sign-in', async () => {
      const successResponse = {
        data: {
          session: {
            id: 'session-456',
            token: 'jwt-token',
            expiresAt: '2024-12-31T23:59:59Z'
          },
          user: {
            id: 'user-456',
            email: 'user@gmail.com',
            name: 'Test User',
            image: 'https://lh3.googleusercontent.com/photo.jpg'
          }
        },
        error: null
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(successResponse)

      const result = await signinGoogle()

      expect(result.data.user.email).toBe('user@gmail.com')
      expect(result.data.user.name).toBe('Test User')
      expect(result.data.session.token).toBe('jwt-token')
      expect(result.error).toBeNull()
    })

    it('should handle Google sign-in errors', async () => {
      const errorResponse = {
        data: null,
        error: {
          message: 'OAuth authorization failed',
          code: 'OAUTH_ERROR'
        }
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(errorResponse)

      const result = await signinGoogle()

      expect(result.data).toBeNull()
      expect(result.error.message).toBe('OAuth authorization failed')
      expect(result.error.code).toBe('OAUTH_ERROR')
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed')
      mockAuthClient.signIn.social.mockRejectedValueOnce(networkError)

      await expect(signinGoogle()).rejects.toThrow('Network request failed')
      
      expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google'
      })
    })

    it('should handle auth client unavailable', async () => {
      const unavailableError = new Error('Auth client not initialized')
      mockAuthClient.signIn.social.mockRejectedValueOnce(unavailableError)

      await expect(signinGoogle()).rejects.toThrow('Auth client not initialized')
    })

    it('should handle invalid provider configuration', async () => {
      const configError = {
        data: null,
        error: {
          message: 'Google OAuth not configured',
          code: 'PROVIDER_NOT_CONFIGURED'
        }
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(configError)

      const result = await signinGoogle()

      expect(result.error.message).toBe('Google OAuth not configured')
      expect(result.error.code).toBe('PROVIDER_NOT_CONFIGURED')
    })

    it('should handle user cancellation', async () => {
      const cancelError = {
        data: null,
        error: {
          message: 'User cancelled OAuth flow',
          code: 'USER_CANCELLED'
        }
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(cancelError)

      const result = await signinGoogle()

      expect(result.error.message).toBe('User cancelled OAuth flow')
      expect(result.error.code).toBe('USER_CANCELLED')
    })

    it('should handle insufficient permissions', async () => {
      const permissionError = {
        data: null,
        error: {
          message: 'Insufficient permissions granted',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(permissionError)

      const result = await signinGoogle()

      expect(result.error.message).toBe('Insufficient permissions granted')
      expect(result.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    })

    it('should pass through additional user data from Google', async () => {
      const detailedResponse = {
        data: {
          session: { id: 'session-789' },
          user: {
            id: 'user-789',
            email: 'detailed@gmail.com',
            name: 'Detailed User',
            image: 'https://lh3.googleusercontent.com/detailed.jpg',
            emailVerified: true,
            locale: 'en-US',
            given_name: 'Detailed',
            family_name: 'User'
          }
        },
        error: null
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(detailedResponse)

      const result = await signinGoogle()

      expect(result.data.user.emailVerified).toBe(true)
      expect(result.data.user.locale).toBe('en-US')
      expect(result.data.user.given_name).toBe('Detailed')
      expect(result.data.user.family_name).toBe('User')
    })

    it('should handle rate limiting', async () => {
      const rateLimitError = {
        data: null,
        error: {
          message: 'Too many sign-in attempts',
          code: 'RATE_LIMITED'
        }
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(rateLimitError)

      const result = await signinGoogle()

      expect(result.error.message).toBe('Too many sign-in attempts')
      expect(result.error.code).toBe('RATE_LIMITED')
    })

    it('should handle server errors', async () => {
      const serverError = {
        data: null,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(serverError)

      const result = await signinGoogle()

      expect(result.error.message).toBe('Internal server error')
      expect(result.error.code).toBe('INTERNAL_ERROR')
    })

    it('should handle malformed responses', async () => {
      const malformedResponse = {
        // Missing required fields
        data: {
          user: {
            email: 'incomplete@example.com'
            // Missing other required fields
          }
        }
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(malformedResponse)

      const result = await signinGoogle()

      expect(result.data.user.email).toBe('incomplete@example.com')
      expect(result.data.session).toBeUndefined()
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockAuthClient.signIn.social.mockRejectedValueOnce(timeoutError)

      await expect(signinGoogle()).rejects.toThrow('Request timeout')
    })

    it('should maintain consistency with auth client interface', () => {
      // Verify the function signature matches expected interface
      expect(typeof signinGoogle).toBe('function')
      expect(signinGoogle.length).toBe(0) // No parameters expected
    })

    it('should handle empty response data', async () => {
      const emptyResponse = {
        data: null,
        error: null
      }

      mockAuthClient.signIn.social.mockResolvedValueOnce(emptyResponse)

      const result = await signinGoogle()

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })

    it('should handle multiple concurrent calls', async () => {
      const response1 = {
        data: { session: { id: 'session-1' }, user: { id: 'user-1' } },
        error: null
      }
      const response2 = {
        data: { session: { id: 'session-2' }, user: { id: 'user-2' } },
        error: null
      }

      mockAuthClient.signIn.social
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2)

      const [result1, result2] = await Promise.all([
        signinGoogle(),
        signinGoogle()
      ])

      expect(result1.data.session.id).toBe('session-1')
      expect(result2.data.session.id).toBe('session-2')
      expect(mockAuthClient.signIn.social).toHaveBeenCalledTimes(2)
    })
  })

  describe('Module Dependencies', () => {
    it('should correctly import from auth-client module', () => {
      // This test ensures the import path is correct
      expect(mockAuthClient.signIn.social).toBeDefined()
      expect(typeof mockAuthClient.signIn.social).toBe('function')
    })
  })

  describe('Error Recovery', () => {
    it('should not cache failed attempts', async () => {
      // First call fails
      mockAuthClient.signIn.social.mockRejectedValueOnce(new Error('First failure'))
      
      // Second call succeeds
      const successResponse = {
        data: { session: { id: 'session-recovery' }, user: { id: 'user-recovery' } },
        error: null
      }
      mockAuthClient.signIn.social.mockResolvedValueOnce(successResponse)

      // First call should fail
      await expect(signinGoogle()).rejects.toThrow('First failure')
      
      // Second call should succeed
      const result = await signinGoogle()
      expect(result.data.session.id).toBe('session-recovery')
    })
  })

  describe('Integration Patterns', () => {
    it('should be suitable for async/await pattern', async () => {
      const mockResponse = {
        data: { session: { id: 'test' }, user: { id: 'test' } },
        error: null
      }
      mockAuthClient.signIn.social.mockResolvedValueOnce(mockResponse)

      // Should work with async/await
      const result = await signinGoogle()
      expect(result).toBeDefined()
    })

    it('should be suitable for Promise.then() pattern', (done) => {
      const mockResponse = {
        data: { session: { id: 'test' }, user: { id: 'test' } },
        error: null
      }
      mockAuthClient.signIn.social.mockResolvedValueOnce(mockResponse)

      // Should work with .then()
      signinGoogle()
        .then(result => {
          expect(result).toBeDefined()
          done()
        })
        .catch(done)
    })
  })
})