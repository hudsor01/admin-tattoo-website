import { describe, it, expect } from 'vitest'
import { isAdmin, canAccessDashboard } from '@/lib/authorization'
import type { User } from '@/types/auth'

describe('Authorization System', () => {
  const mockAdminUser: User = {
    id: '1',
    email: 'admin@test.com',
    emailVerified: true,
    role: 'admin',
    name: 'Admin User',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockRegularUser: User = {
    id: '2',
    email: 'user@test.com',
    emailVerified: true,
    role: 'user',
    name: 'Regular User',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockUnverifiedUser: UserWithRole = {
    id: '3',
    email: 'unverified@test.com',
    emailVerified: false,
    role: 'admin',
    name: 'Unverified Admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      expect(isAdmin(mockAdminUser)).toBe(true)
    })

    it('should return false for non-admin role', () => {
      expect(isAdmin(mockRegularUser)).toBe(false)
    })
  })

  // Removed isVerifiedAdmin since we simplified to just use role-based auth

  describe('canAccessDashboard', () => {
    it('should allow verified admin access', () => {
      expect(canAccessDashboard(mockAdminUser)).toBe(true)
    })

    it('should allow unverified admin access', () => {
      expect(canAccessDashboard(mockUnverifiedUser)).toBe(true)
    })

    it('should deny regular user access', () => {
      expect(canAccessDashboard(mockRegularUser)).toBe(false)
    })
  })
})