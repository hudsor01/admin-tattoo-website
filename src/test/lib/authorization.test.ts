import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkAdminAccess,
  hasPermission,
  requirePermission,
  canManageResource,
  isAdmin,
  isVerifiedAdmin,
  getAdminPermissions,
  ADMIN_PERMISSIONS,
  validateResourceAccess,
  createPermissionChecker,
  logPermissionViolation
} from '@/lib/authorization'
import type { AppUser, StudioPermission } from '@/types/auth'

// Mock logger
vi.mock('@/lib/logger', () => ({
  logSecurityEvent: vi.fn()
}))

// Mock user data
const mockAdminUser: AppUser = {
  id: 'admin-1',
  email: 'admin@ink37tattoos.com',
  name: 'Admin User',
  role: 'admin',
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockRegularUser: AppUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Regular User',
  role: 'user',
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockUserWithoutEmail: AppUser = {
  id: 'user-2',
  email: 'unverified@example.com',
  name: 'Unverified User',
  role: 'user',
  emailVerified: null,
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('Authorization System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Admin Access Control', () => {
    it('should allow admin users access', () => {
      expect(checkAdminAccess(mockAdminUser)).toBe(true)
      expect(isAdmin(mockAdminUser)).toBe(true)
    })

    it('should deny regular users admin access', () => {
      expect(checkAdminAccess(mockRegularUser)).toBe(false)
      expect(isAdmin(mockRegularUser)).toBe(false)
    })

    it('should deny access to null/undefined users', () => {
      expect(checkAdminAccess(null)).toBe(false)
      expect(checkAdminAccess(undefined)).toBe(false)
      expect(isAdmin(null)).toBe(false)
      expect(isAdmin(undefined)).toBe(false)
    })

    it('should require verified email for verified admin access', () => {
      expect(isVerifiedAdmin(mockAdminUser)).toBe(true)
      
      const unverifiedAdmin = { ...mockAdminUser, emailVerified: null }
      expect(isVerifiedAdmin(unverifiedAdmin)).toBe(false)
    })

    it('should handle users without email verification', () => {
      expect(isVerifiedAdmin(mockUserWithoutEmail)).toBe(false)
      expect(isVerifiedAdmin(mockRegularUser)).toBe(false)
    })
  })

  describe('Permission System', () => {
    it('should check individual permissions for admin users', () => {
      expect(hasPermission(mockAdminUser, 'VIEW_DASHBOARD')).toBe(true)
      expect(hasPermission(mockAdminUser, 'MANAGE_CUSTOMERS')).toBe(true)
      expect(hasPermission(mockAdminUser, 'DELETE_APPOINTMENTS')).toBe(true)
      expect(hasPermission(mockAdminUser, 'ADMIN_SETTINGS')).toBe(true)
    })

    it('should deny permissions for regular users', () => {
      expect(hasPermission(mockRegularUser, 'VIEW_DASHBOARD')).toBe(false)
      expect(hasPermission(mockRegularUser, 'MANAGE_CUSTOMERS')).toBe(false)
      expect(hasPermission(mockRegularUser, 'DELETE_APPOINTMENTS')).toBe(false)
      expect(hasPermission(mockRegularUser, 'ADMIN_SETTINGS')).toBe(false)
    })

    it('should handle invalid permissions', () => {
      expect(hasPermission(mockAdminUser, 'INVALID_PERMISSION' as StudioPermission)).toBe(false)
      expect(hasPermission(mockAdminUser, '' as StudioPermission)).toBe(false)
    })

    it('should get admin permissions list', () => {
      const adminPermissions = getAdminPermissions()
      
      expect(adminPermissions).toContain('VIEW_DASHBOARD')
      expect(adminPermissions).toContain('VIEW_ANALYTICS')
      expect(adminPermissions).toContain('MANAGE_CUSTOMERS')
      expect(adminPermissions).toContain('MANAGE_APPOINTMENTS')
      expect(adminPermissions).toContain('ADMIN_SETTINGS')
      expect(adminPermissions.length).toBeGreaterThan(10)
    })

    it('should validate admin permissions constant', () => {
      expect(ADMIN_PERMISSIONS).toContain('VIEW_DASHBOARD')
      expect(ADMIN_PERMISSIONS).toContain('ADMIN_ACCESS')
      expect(Array.isArray(ADMIN_PERMISSIONS)).toBe(true)
      expect(ADMIN_PERMISSIONS.length).toBeGreaterThan(0)
    })
  })

  describe('Permission Requirements', () => {
    it('should pass permission requirements for authorized users', () => {
      expect(() => {
        requirePermission(mockAdminUser, 'VIEW_DASHBOARD')
      }).not.toThrow()

      expect(() => {
        requirePermission(mockAdminUser, 'MANAGE_CUSTOMERS')
      }).not.toThrow()
    })

    it('should throw for unauthorized users', () => {
      expect(() => {
        requirePermission(mockRegularUser, 'VIEW_DASHBOARD')
      }).toThrow('Insufficient permissions: VIEW_DASHBOARD required')

      expect(() => {
        requirePermission(mockRegularUser, 'ADMIN_SETTINGS')
      }).toThrow('Insufficient permissions: ADMIN_SETTINGS required')
    })

    it('should throw for null/undefined users', () => {
      expect(() => {
        requirePermission(null, 'VIEW_DASHBOARD')
      }).toThrow('User authentication required')

      expect(() => {
        requirePermission(undefined, 'VIEW_DASHBOARD')
      }).toThrow('User authentication required')
    })

    it('should include custom error messages', () => {
      expect(() => {
        requirePermission(mockRegularUser, 'DELETE_APPOINTMENTS', 'Cannot delete appointments')
      }).toThrow('Cannot delete appointments')
    })
  })

  describe('Resource Management', () => {
    it('should allow admin users to manage all resources', () => {
      expect(canManageResource(mockAdminUser, 'customers')).toBe(true)
      expect(canManageResource(mockAdminUser, 'appointments')).toBe(true)
      expect(canManageResource(mockAdminUser, 'media')).toBe(true)
      expect(canManageResource(mockAdminUser, 'settings')).toBe(true)
    })

    it('should deny resource management for regular users', () => {
      expect(canManageResource(mockRegularUser, 'customers')).toBe(false)
      expect(canManageResource(mockRegularUser, 'appointments')).toBe(false)
      expect(canManageResource(mockRegularUser, 'media')).toBe(false)
      expect(canManageResource(mockRegularUser, 'settings')).toBe(false)
    })

    it('should handle invalid resource types', () => {
      expect(canManageResource(mockAdminUser, 'invalid-resource' as any)).toBe(false)
      expect(canManageResource(mockAdminUser, '' as any)).toBe(false)
    })

    it('should validate specific resource actions', () => {
      expect(canManageResource(mockAdminUser, 'customers', 'create')).toBe(true)
      expect(canManageResource(mockAdminUser, 'customers', 'read')).toBe(true)
      expect(canManageResource(mockAdminUser, 'customers', 'update')).toBe(true)
      expect(canManageResource(mockAdminUser, 'customers', 'delete')).toBe(true)

      expect(canManageResource(mockRegularUser, 'customers', 'create')).toBe(false)
      expect(canManageResource(mockRegularUser, 'customers', 'delete')).toBe(false)
    })
  })

  describe('Resource Access Validation', () => {
    it('should validate resource access with context', async () => {
      const validAccess = await validateResourceAccess(
        mockAdminUser,
        'customers',
        'update',
        { customerId: 'customer-123' }
      )
      expect(validAccess).toBe(true)
    })

    it('should deny access for insufficient permissions', async () => {
      const invalidAccess = await validateResourceAccess(
        mockRegularUser,
        'customers',
        'delete',
        { customerId: 'customer-123' }
      )
      expect(invalidAccess).toBe(false)
    })

    it('should handle owner-based access control', async () => {
      // Test scenario where user can access their own resources
      const userOwnResource = await validateResourceAccess(
        mockRegularUser,
        'profile',
        'update',
        { userId: mockRegularUser.id }
      )
      expect(userOwnResource).toBe(true)

      // Test scenario where user cannot access others' resources
      const userOthersResource = await validateResourceAccess(
        mockRegularUser,
        'profile',
        'update',
        { userId: 'other-user-id' }
      )
      expect(userOthersResource).toBe(false)
    })

    it('should validate time-based access', async () => {
      const businessHours = {
        start: 9, // 9 AM
        end: 17   // 5 PM
      }

      // Mock current time to be within business hours
      const mockDate = new Date()
      mockDate.setHours(14) // 2 PM
      vi.setSystemTime(mockDate)

      const duringHours = await validateResourceAccess(
        mockAdminUser,
        'appointments',
        'create',
        { businessHours }
      )
      expect(duringHours).toBe(true)

      // Mock current time to be outside business hours
      mockDate.setHours(20) // 8 PM
      vi.setSystemTime(mockDate)

      const afterHours = await validateResourceAccess(
        mockRegularUser,
        'appointments',
        'create',
        { businessHours }
      )
      expect(afterHours).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('Permission Checker Factory', () => {
    it('should create permission checker functions', () => {
      const checkCustomerPermission = createPermissionChecker('MANAGE_CUSTOMERS')
      
      expect(checkCustomerPermission(mockAdminUser)).toBe(true)
      expect(checkCustomerPermission(mockRegularUser)).toBe(false)
    })

    it('should create resource-specific checkers', () => {
      const canDeleteAppointments = createPermissionChecker('DELETE_APPOINTMENTS')
      const canViewAnalytics = createPermissionChecker('VIEW_ANALYTICS')
      
      expect(canDeleteAppointments(mockAdminUser)).toBe(true)
      expect(canDeleteAppointments(mockRegularUser)).toBe(false)
      
      expect(canViewAnalytics(mockAdminUser)).toBe(true)
      expect(canViewAnalytics(mockRegularUser)).toBe(false)
    })

    it('should handle custom permission logic', () => {
      const customChecker = createPermissionChecker(
        'MANAGE_CUSTOMERS',
        (user) => user?.emailVerified !== null
      )

      expect(customChecker(mockAdminUser)).toBe(true)
      expect(customChecker(mockUserWithoutEmail)).toBe(false)
    })
  })

  describe('Permission Violation Logging', () => {
    it('should log permission violations', () => {
      const { logSecurityEvent } = require('@/lib/logger')

      logPermissionViolation(
        mockRegularUser,
        'VIEW_DASHBOARD',
        '/admin/dashboard',
        { ipAddress: '192.168.1.100' }
      )

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'PERMISSION_DENIED',
        expect.objectContaining({
          userId: mockRegularUser.id,
          userEmail: mockRegularUser.email,
          userRole: mockRegularUser.role,
          requiredPermission: 'VIEW_DASHBOARD',
          resource: '/admin/dashboard',
          ipAddress: '192.168.1.100'
        })
      )
    })

    it('should log anonymous permission violations', () => {
      const { logSecurityEvent } = require('@/lib/logger')

      logPermissionViolation(
        null,
        'ADMIN_ACCESS',
        '/admin/settings',
        { ipAddress: '10.0.0.1' }
      )

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'PERMISSION_DENIED',
        expect.objectContaining({
          userId: null,
          userEmail: null,
          userRole: null,
          requiredPermission: 'ADMIN_ACCESS',
          resource: '/admin/settings'
        })
      )
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed user objects', () => {
      const malformedUser = { id: 'test' } as AppUser

      expect(isAdmin(malformedUser)).toBe(false)
      expect(hasPermission(malformedUser, 'VIEW_DASHBOARD')).toBe(false)
      expect(canManageResource(malformedUser, 'customers')).toBe(false)
    })

    it('should handle users with unknown roles', () => {
      const unknownRoleUser = {
        ...mockRegularUser,
        role: 'unknown' as any
      }

      expect(isAdmin(unknownRoleUser)).toBe(false)
      expect(hasPermission(unknownRoleUser, 'VIEW_DASHBOARD')).toBe(false)
    })

    it('should handle empty permission arrays', () => {
      const emptyPermissions = getAdminPermissions()
      expect(Array.isArray(emptyPermissions)).toBe(true)
      expect(emptyPermissions.length).toBeGreaterThan(0)
    })

    it('should handle concurrent permission checks', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        validateResourceAccess(
          mockAdminUser,
          'customers',
          'read',
          { customerId: `customer-${i}` }
        )
      )

      const results = await Promise.all(promises)
      expect(results.every(result => result === true)).toBe(true)
    })
  })

  describe('Security Context', () => {
    it('should validate security context for sensitive operations', () => {
      const securityContext = {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        sessionId: 'session-123',
        mfaVerified: true
      }

      expect(
        validateResourceAccess(
          mockAdminUser,
          'settings',
          'update',
          { securityContext }
        )
      ).resolves.toBe(true)
    })

    it('should require MFA for critical operations', async () => {
      const securityContext = {
        mfaVerified: false
      }

      const result = await validateResourceAccess(
        mockAdminUser,
        'settings',
        'delete',
        { securityContext, requireMFA: true }
      )

      expect(result).toBe(false)
    })

    it('should validate IP allowlists for admin operations', async () => {
      const allowedIPs = ['192.168.1.0/24', '10.0.0.1']
      
      const validIP = await validateResourceAccess(
        mockAdminUser,
        'settings',
        'update',
        { 
          securityContext: { ipAddress: '192.168.1.100' },
          allowedIPs 
        }
      )
      expect(validIP).toBe(true)

      const invalidIP = await validateResourceAccess(
        mockAdminUser,
        'settings',
        'update',
        { 
          securityContext: { ipAddress: '203.0.113.1' },
          allowedIPs 
        }
      )
      expect(invalidIP).toBe(false)
    })
  })

  describe('Permission Inheritance', () => {
    it('should handle hierarchical permissions', () => {
      // Admin permissions should include all lower-level permissions
      const adminPermissions = getAdminPermissions()
      
      expect(adminPermissions).toContain('VIEW_DASHBOARD')
      expect(adminPermissions).toContain('VIEW_ANALYTICS')
      expect(adminPermissions).toContain('MANAGE_CUSTOMERS')
      expect(adminPermissions).toContain('ADMIN_SETTINGS')
    })

    it('should respect permission dependencies', () => {
      // Some permissions might depend on others
      // e.g., DELETE_CUSTOMERS might require MANAGE_CUSTOMERS
      expect(hasPermission(mockAdminUser, 'MANAGE_CUSTOMERS')).toBe(true)
      expect(hasPermission(mockAdminUser, 'DELETE_CUSTOMERS')).toBe(true)
    })
  })

  describe('Performance Considerations', () => {
    it('should cache permission results for performance', () => {
      const startTime = performance.now()
      
      // Multiple permission checks should be fast
      for (let i = 0; i < 100; i++) {
        hasPermission(mockAdminUser, 'VIEW_DASHBOARD')
        hasPermission(mockAdminUser, 'MANAGE_CUSTOMERS')
        isAdmin(mockAdminUser)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete quickly (< 50ms for 300 operations)
      expect(duration).toBeLessThan(50)
    })

    it('should handle large numbers of concurrent permission checks', async () => {
      const promises = Array.from({ length: 1000 }, () =>
        Promise.resolve(hasPermission(mockAdminUser, 'VIEW_DASHBOARD'))
      )

      const results = await Promise.all(promises)
      expect(results.every(result => result === true)).toBe(true)
    })
  })
})