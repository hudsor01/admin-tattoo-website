import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signIn, signUp, searchAccount } from '@/lib/actions'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APIError } from 'better-auth/api'

// Mock dependencies
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signInEmail: vi.fn(),
      signUpEmail: vi.fn()
    }
  }
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    }
  }
}))

describe('Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('signIn', () => {
    it('should sign in successfully and redirect', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')

      vi.mocked(auth.api.signInEmail).mockResolvedValueOnce({})

      const result = await signIn({}, mockFormData)

      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      })
      expect(console.log).toHaveBeenCalledWith('Signed in')
      expect(redirect).toHaveBeenCalledWith('/dashboard')
      expect(result).toBeUndefined()
    })

    it('should handle UNAUTHORIZED error', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'wrongpassword')

      const unauthorizedError = new APIError('UNAUTHORIZED', 'User not found')
      vi.mocked(auth.api.signInEmail).mockRejectedValueOnce(unauthorizedError)

      const result = await signIn({}, mockFormData)

      expect(result).toEqual({ errorMessage: 'User Not Found.' })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should handle BAD_REQUEST error', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'invalid-email')
      mockFormData.append('pwd', 'password123')

      const badRequestError = new APIError('BAD_REQUEST', 'Invalid email')
      vi.mocked(auth.api.signInEmail).mockRejectedValueOnce(badRequestError)

      const result = await signIn({}, mockFormData)

      expect(result).toEqual({ errorMessage: 'Invalid email.' })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should handle unknown API error status', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')

      const unknownError = new APIError('INTERNAL_SERVER_ERROR', 'Server error')
      vi.mocked(auth.api.signInEmail).mockRejectedValueOnce(unknownError)

      const result = await signIn({}, mockFormData)

      expect(result).toEqual({ errorMessage: 'Something went wrong.' })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should rethrow non-APIError errors', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')

      const networkError = new Error('Network error')
      vi.mocked(auth.api.signInEmail).mockRejectedValueOnce(networkError)

      await expect(signIn({}, mockFormData)).rejects.toThrow('Network error')
      expect(console.error).toHaveBeenCalledWith('sign in with email has not worked', networkError)
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should handle empty form data', async () => {
      const mockFormData = new FormData()
      // No email or password added

      vi.mocked(auth.api.signInEmail).mockResolvedValueOnce({})

      await signIn({}, mockFormData)

      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: null,
          password: null
        }
      })
    })

    it('should handle previous state parameter', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')

      const prevState = { errorMessage: 'Previous error' }
      vi.mocked(auth.api.signInEmail).mockResolvedValueOnce({})

      await signIn(prevState, mockFormData)

      expect(auth.api.signInEmail).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('signUp', () => {
    it('should sign up successfully and redirect', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')
      mockFormData.append('firstname', 'John')
      mockFormData.append('lastname', 'Doe')

      vi.mocked(auth.api.signUpEmail).mockResolvedValueOnce({})

      const result = await signUp({}, mockFormData)

      expect(auth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123'
        }
      })
      expect(redirect).toHaveBeenCalledWith('/dashboard')
      expect(result).toBeUndefined()
    })

    it('should handle UNPROCESSABLE_ENTITY error (user exists)', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'existing@example.com')
      mockFormData.append('pwd', 'password123')
      mockFormData.append('firstname', 'John')
      mockFormData.append('lastname', 'Doe')

      const existsError = new APIError('UNPROCESSABLE_ENTITY', 'User already exists')
      vi.mocked(auth.api.signUpEmail).mockRejectedValueOnce(existsError)

      const result = await signUp({}, mockFormData)

      expect(result).toEqual({ errorMessage: 'User already exists.' })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should handle BAD_REQUEST error', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'invalid-email')
      mockFormData.append('pwd', 'password123')
      mockFormData.append('firstname', 'John')
      mockFormData.append('lastname', 'Doe')

      const badRequestError = new APIError('BAD_REQUEST', 'Invalid email')
      vi.mocked(auth.api.signUpEmail).mockRejectedValueOnce(badRequestError)

      const result = await signUp({}, mockFormData)

      expect(result).toEqual({ errorMessage: 'Invalid email.' })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should handle unknown API error status', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')
      mockFormData.append('firstname', 'John')
      mockFormData.append('lastname', 'Doe')

      const unknownError = new APIError('INTERNAL_SERVER_ERROR', 'Server error')
      vi.mocked(auth.api.signUpEmail).mockRejectedValueOnce(unknownError)

      const result = await signUp({}, mockFormData)

      expect(result).toEqual({ errorMessage: 'Something went wrong.' })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should handle non-APIError errors', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')
      mockFormData.append('firstname', 'John')
      mockFormData.append('lastname', 'Doe')

      const networkError = new Error('Network error')
      vi.mocked(auth.api.signUpEmail).mockRejectedValueOnce(networkError)

      const result = await signUp({}, mockFormData)

      // Should not return error state for non-APIError
      expect(result).toBeUndefined()
      expect(console.error).toHaveBeenCalledWith('sign up with email and password has not worked', networkError)
      expect(redirect).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle missing name fields', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')
      // No firstname or lastname

      vi.mocked(auth.api.signUpEmail).mockResolvedValueOnce({})

      await signUp({}, mockFormData)

      expect(auth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          name: 'null null',
          email: 'test@example.com',
          password: 'password123'
        }
      })
    })

    it('should handle partial name fields', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')
      mockFormData.append('firstname', 'John')
      // No lastname

      vi.mocked(auth.api.signUpEmail).mockResolvedValueOnce({})

      await signUp({}, mockFormData)

      expect(auth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          name: 'John null',
          email: 'test@example.com',
          password: 'password123'
        }
      })
    })
  })

  describe('searchAccount', () => {
    it('should return true when user exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)

      const result = await searchAccount('test@example.com')

      expect(result).toBe(true)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
    })

    it('should return false when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const result = await searchAccount('nonexistent@example.com')

      expect(result).toBe(false)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' }
      })
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(dbError)

      await expect(searchAccount('test@example.com')).rejects.toThrow('Database connection failed')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      })
    })

    it('should handle empty email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const result = await searchAccount('')

      expect(result).toBe(false)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: '' }
      })
    })

    it('should handle special email formats', async () => {
      const specialEmails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.com',
        '123@example.com'
      ]

      for (const email of specialEmails) {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: '1', email, name: 'User' })
        
        const result = await searchAccount(email)
        
        expect(result).toBe(true)
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email }
        })
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed FormData in signIn', async () => {
      const mockFormData = {
        get: vi.fn().mockReturnValue(null)
      } as unknown as FormData

      vi.mocked(auth.api.signInEmail).mockResolvedValueOnce({})

      await signIn({}, mockFormData)

      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: null,
          password: null
        }
      })
    })

    it('should handle malformed FormData in signUp', async () => {
      const mockFormData = {
        get: vi.fn().mockReturnValue(undefined)
      } as unknown as FormData

      vi.mocked(auth.api.signUpEmail).mockResolvedValueOnce({})

      await signUp({}, mockFormData)

      expect(auth.api.signUpEmail).toHaveBeenCalledWith({
        body: {
          name: 'undefined undefined',
          email: undefined,
          password: undefined
        }
      })
    })

    it('should handle redirect failures', async () => {
      const mockFormData = new FormData()
      mockFormData.append('email', 'test@example.com')
      mockFormData.append('pwd', 'password123')

      vi.mocked(auth.api.signInEmail).mockResolvedValueOnce({})
      vi.mocked(redirect).mockImplementation(() => {
        throw new Error('Redirect failed')
      })

      await expect(signIn({}, mockFormData)).rejects.toThrow('Redirect failed')
    })
  })
})