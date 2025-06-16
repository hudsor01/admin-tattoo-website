import { describe, it, expect } from 'vitest'
import type {
  AppUser,
  OrganizationMember,
  Organization,
  AppSession,
  StudioPermission,
  StudioRole,
  AuthContextType,
  AdminUserData,
  AdminUserFilters,
  CreateOrganizationData,
  InviteMemberData,
  UpdateMemberRoleData
} from '@/types/auth'
import { ROLE_PERMISSIONS } from '@/types/auth'

describe('Auth Types', () => {
  describe('AppUser Interface', () => {
    it('should extend User with additional properties', () => {
      const appUser: AppUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'admin',
        phone: '+1234567890',
        banned: false,
        banReason: undefined,
        banExpires: undefined
      }

      expect(appUser.role).toBe('admin')
      expect(appUser.phone).toBe('+1234567890')
      expect(appUser.banned).toBe(false)
      expect(typeof appUser.id).toBe('string')
      expect(typeof appUser.email).toBe('string')
    })

    it('should support admin role', () => {
      const adminUser: AppUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin User',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'admin'
      }

      expect(adminUser.role).toBe('admin')
    })

    it('should support user role', () => {
      const regularUser: AppUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Regular User',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'user'
      }

      expect(regularUser.role).toBe('user')
    })

    it('should support banned user with ban details', () => {
      const bannedUser: AppUser = {
        id: 'banned-1',
        email: 'banned@example.com',
        name: 'Banned User',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'user',
        banned: true,
        banReason: 'Violation of terms',
        banExpires: new Date('2024-12-31')
      }

      expect(bannedUser.banned).toBe(true)
      expect(bannedUser.banReason).toBe('Violation of terms')
      expect(bannedUser.banExpires).toBeInstanceOf(Date)
    })

    it('should handle optional properties', () => {
      const minimalUser: AppUser = {
        id: 'minimal-1',
        email: 'minimal@example.com',
        name: 'Minimal User',
        emailVerified: false,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'user'
      }

      expect(minimalUser.phone).toBeUndefined()
      expect(minimalUser.banned).toBeUndefined()
      expect(minimalUser.banReason).toBeUndefined()
      expect(minimalUser.banExpires).toBeUndefined()
    })
  })

  describe('OrganizationMember Interface', () => {
    it('should define organization member structure', () => {
      const member: OrganizationMember = {
        id: 'member-123',
        organizationId: 'org-456',
        userId: 'user-789',
        role: 'artist',
        createdAt: new Date(),
        user: {
          id: 'user-789',
          email: 'artist@example.com',
          name: 'Artist User',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'user'
        }
      }

      expect(member.role).toBe('artist')
      expect(member.user.email).toBe('artist@example.com')
      expect(typeof member.organizationId).toBe('string')
      expect(typeof member.userId).toBe('string')
    })

    it('should support all studio roles', () => {
      const roles: StudioRole[] = ['owner', 'manager', 'artist', 'receptionist']
      
      roles.forEach(role => {
        const member: OrganizationMember = {
          id: `member-${role}`,
          organizationId: 'org-1',
          userId: `user-${role}`,
          role,
          createdAt: new Date(),
          user: {
            id: `user-${role}`,
            email: `${role}@example.com`,
            name: `${role} User`,
            emailVerified: true,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'user'
          }
        }

        expect(member.role).toBe(role)
      })
    })
  })

  describe('Organization Interface', () => {
    it('should define organization structure', () => {
      const organization: Organization = {
        id: 'org-123',
        name: 'Ink 37 Tattoos',
        slug: 'ink-37-tattoos',
        logo: 'https://example.com/logo.png',
        createdAt: new Date(),
        metadata: '{"settings": {"theme": "dark"}}',
        members: []
      }

      expect(organization.name).toBe('Ink 37 Tattoos')
      expect(organization.slug).toBe('ink-37-tattoos')
      expect(organization.logo).toBe('https://example.com/logo.png')
      expect(Array.isArray(organization.members)).toBe(true)
    })

    it('should support organization with members', () => {
      const organizationWithMembers: Organization = {
        id: 'org-with-members',
        name: 'Studio with Team',
        createdAt: new Date(),
        members: [
          {
            id: 'member-1',
            organizationId: 'org-with-members',
            userId: 'owner-1',
            role: 'owner',
            createdAt: new Date(),
            user: {
              id: 'owner-1',
              email: 'owner@studio.com',
              name: 'Studio Owner',
              emailVerified: true,
              image: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              role: 'admin'
            }
          }
        ]
      }

      expect(organizationWithMembers.members).toHaveLength(1)
      expect(organizationWithMembers.members![0].role).toBe('owner')
    })

    it('should handle optional properties', () => {
      const minimalOrg: Organization = {
        id: 'minimal-org',
        name: 'Minimal Studio',
        createdAt: new Date()
      }

      expect(minimalOrg.slug).toBeUndefined()
      expect(minimalOrg.logo).toBeUndefined()
      expect(minimalOrg.metadata).toBeUndefined()
      expect(minimalOrg.members).toBeUndefined()
    })
  })

  describe('AppSession Interface', () => {
    it('should extend Session with user and organization context', () => {
      const appSession: AppSession = {
        id: 'session-123',
        userId: 'user-456',
        sessionToken: 'token-789',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        user: {
          id: 'user-456',
          email: 'session@example.com',
          name: 'Session User',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'user'
        },
        activeOrganizationId: 'org-active'
      }

      expect(appSession.user.email).toBe('session@example.com')
      expect(appSession.activeOrganizationId).toBe('org-active')
      expect(typeof appSession.sessionToken).toBe('string')
    })

    it('should handle session without active organization', () => {
      const sessionWithoutOrg: AppSession = {
        id: 'session-no-org',
        userId: 'user-no-org',
        sessionToken: 'token-no-org',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '10.0.0.1',
        userAgent: 'Test Agent',
        user: {
          id: 'user-no-org',
          email: 'noorg@example.com',
          name: 'No Org User',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'user'
        }
      }

      expect(sessionWithoutOrg.activeOrganizationId).toBeUndefined()
    })
  })

  describe('Permission Types', () => {
    it('should define all studio permissions', () => {
      const permissions: StudioPermission[] = [
        'booking:read',
        'booking:create',
        'booking:update',
        'booking:delete',
        'customer:read',
        'customer:create',
        'customer:update',
        'customer:delete',
        'payment:read',
        'payment:create',
        'payment:update',
        'analytics:read',
        'gallery:read',
        'gallery:create',
        'gallery:update',
        'gallery:delete',
        'appointment:read',
        'appointment:own',
        '*'
      ]

      permissions.forEach(permission => {
        expect(typeof permission).toBe('string')
        // Test that each permission follows expected pattern
        if (permission !== '*') {
          expect(permission).toMatch(/^[a-z]+:[a-z_]+$/)
        }
      })
    })

    it('should support wildcard permission', () => {
      const wildcardPermission: StudioPermission = '*'
      expect(wildcardPermission).toBe('*')
    })
  })

  describe('Role Permission Mapping', () => {
    it('should define permissions for owner role', () => {
      expect(ROLE_PERMISSIONS.owner).toEqual(['*'])
    })

    it('should define permissions for manager role', () => {
      const managerPermissions = ROLE_PERMISSIONS.manager
      expect(managerPermissions).toContain('analytics:read')
      expect(managerPermissions).toContain('booking:*' as StudioPermission)
      expect(managerPermissions).toContain('customer:*' as StudioPermission)
      expect(managerPermissions).toContain('payment:*' as StudioPermission)
      expect(managerPermissions).toContain('gallery:*' as StudioPermission)
    })

    it('should define permissions for artist role', () => {
      const artistPermissions = ROLE_PERMISSIONS.artist
      expect(artistPermissions).toContain('booking:read')
      expect(artistPermissions).toContain('booking:update')
      expect(artistPermissions).toContain('customer:read')
      expect(artistPermissions).toContain('gallery:*' as StudioPermission)
      expect(artistPermissions).toContain('appointment:own')
    })

    it('should define permissions for receptionist role', () => {
      const receptionistPermissions = ROLE_PERMISSIONS.receptionist
      expect(receptionistPermissions).toContain('booking:*' as StudioPermission)
      expect(receptionistPermissions).toContain('customer:*' as StudioPermission)
      expect(receptionistPermissions).toContain('payment:read')
      expect(receptionistPermissions).toContain('appointment:read')
    })

    it('should have permissions for all studio roles', () => {
      const roles: StudioRole[] = ['owner', 'manager', 'artist', 'receptionist']
      
      roles.forEach(role => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined()
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true)
        expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0)
      })
    })

    it('should not grant owner permissions to other roles', () => {
      const nonOwnerRoles: StudioRole[] = ['manager', 'artist', 'receptionist']
      
      nonOwnerRoles.forEach(role => {
        expect(ROLE_PERMISSIONS[role]).not.toContain('*')
      })
    })
  })

  describe('AuthContextType Interface', () => {
    it('should define complete auth context structure', () => {
      const authContext: AuthContextType = {
        user: {
          id: 'context-user',
          email: 'context@example.com',
          name: 'Context User',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'admin'
        },
        session: {
          id: 'context-session',
          userId: 'context-user',
          sessionToken: 'context-token',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Context Agent',
          user: {
            id: 'context-user',
            email: 'context@example.com',
            name: 'Context User',
            emailVerified: true,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'admin'
          }
        },
        isLoading: false,
        isSignedIn: true,
        activeOrganization: {
          id: 'active-org',
          name: 'Active Studio',
          createdAt: new Date()
        },
        organizations: [],
        permissions: ['*'],
        hasPermission: (permission: StudioPermission) => true
      }

      expect(authContext.isSignedIn).toBe(true)
      expect(authContext.isLoading).toBe(false)
      expect(authContext.activeOrganization?.name).toBe('Active Studio')
      expect(Array.isArray(authContext.organizations)).toBe(true)
      expect(Array.isArray(authContext.permissions)).toBe(true)
      expect(typeof authContext.hasPermission).toBe('function')
    })

    it('should handle unauthenticated state', () => {
      const unauthenticatedContext: AuthContextType = {
        user: null,
        session: null,
        isLoading: false,
        isSignedIn: false,
        activeOrganization: null,
        organizations: [],
        permissions: [],
        hasPermission: () => false
      }

      expect(unauthenticatedContext.user).toBeNull()
      expect(unauthenticatedContext.session).toBeNull()
      expect(unauthenticatedContext.isSignedIn).toBe(false)
      expect(unauthenticatedContext.activeOrganization).toBeNull()
      expect(unauthenticatedContext.hasPermission('booking:read')).toBe(false)
    })

    it('should handle loading state', () => {
      const loadingContext: AuthContextType = {
        user: null,
        session: null,
        isLoading: true,
        isSignedIn: false,
        activeOrganization: null,
        organizations: [],
        permissions: [],
        hasPermission: () => false
      }

      expect(loadingContext.isLoading).toBe(true)
      expect(loadingContext.isSignedIn).toBe(false)
    })
  })

  describe('Admin Action Types', () => {
    it('should define AdminUserData structure', () => {
      const adminUserData: AdminUserData = {
        name: 'New Admin',
        email: 'newadmin@example.com',
        password: 'securepassword123',
        role: 'admin'
      }

      expect(adminUserData.name).toBe('New Admin')
      expect(adminUserData.email).toBe('newadmin@example.com')
      expect(adminUserData.password).toBe('securepassword123')
      expect(adminUserData.role).toBe('admin')
    })

    it('should support AdminUserData without role', () => {
      const userDataWithoutRole: AdminUserData = {
        name: 'Regular User',
        email: 'regular@example.com',
        password: 'password123'
      }

      expect(userDataWithoutRole.role).toBeUndefined()
    })

    it('should define AdminUserFilters structure', () => {
      const filters: AdminUserFilters = {
        role: 'admin',
        limit: 20,
        offset: 0,
        search: 'test user'
      }

      expect(filters.role).toBe('admin')
      expect(filters.limit).toBe(20)
      expect(filters.offset).toBe(0)
      expect(filters.search).toBe('test user')
    })

    it('should support partial AdminUserFilters', () => {
      const partialFilters: AdminUserFilters = {
        search: 'partial'
      }

      expect(partialFilters.search).toBe('partial')
      expect(partialFilters.role).toBeUndefined()
      expect(partialFilters.limit).toBeUndefined()
    })
  })

  describe('Organization Action Types', () => {
    it('should define CreateOrganizationData structure', () => {
      const createOrgData: CreateOrganizationData = {
        name: 'New Tattoo Studio',
        description: 'A professional tattoo studio',
        slug: 'new-tattoo-studio'
      }

      expect(createOrgData.name).toBe('New Tattoo Studio')
      expect(createOrgData.description).toBe('A professional tattoo studio')
      expect(createOrgData.slug).toBe('new-tattoo-studio')
    })

    it('should support minimal CreateOrganizationData', () => {
      const minimalOrgData: CreateOrganizationData = {
        name: 'Minimal Studio'
      }

      expect(minimalOrgData.name).toBe('Minimal Studio')
      expect(minimalOrgData.description).toBeUndefined()
      expect(minimalOrgData.slug).toBeUndefined()
    })

    it('should define InviteMemberData structure', () => {
      const inviteData: InviteMemberData = {
        email: 'newmember@example.com',
        role: 'artist',
        organizationId: 'org-123'
      }

      expect(inviteData.email).toBe('newmember@example.com')
      expect(inviteData.role).toBe('artist')
      expect(inviteData.organizationId).toBe('org-123')
    })

    it('should define UpdateMemberRoleData structure', () => {
      const updateRoleData: UpdateMemberRoleData = {
        userId: 'user-456',
        organizationId: 'org-789',
        role: 'manager'
      }

      expect(updateRoleData.userId).toBe('user-456')
      expect(updateRoleData.organizationId).toBe('org-789')
      expect(updateRoleData.role).toBe('manager')
    })
  })

  describe('Type Safety and Validation', () => {
    it('should enforce role type safety', () => {
      const validRoles: StudioRole[] = ['owner', 'manager', 'artist', 'receptionist']
      
      validRoles.forEach(role => {
        const member: OrganizationMember = {
          id: 'test',
          organizationId: 'test',
          userId: 'test',
          role,
          createdAt: new Date(),
          user: {
            id: 'test',
            email: 'test@example.com',
            name: 'Test',
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'user'
          }
        }

        expect(member.role).toBe(role)
      })
    })

    it('should enforce permission type safety', () => {
      const validPermissions: StudioPermission[] = [
        'booking:read',
        'customer:create',
        'payment:update',
        'gallery:delete',
        'analytics:read',
        '*'
      ]

      validPermissions.forEach(permission => {
        const hasPermission = (p: StudioPermission) => p === permission
        expect(hasPermission(permission)).toBe(true)
      })
    })
  })

  describe('Complex Type Combinations', () => {
    it('should support complex auth context with multiple organizations', () => {
      const complexAuthContext: AuthContextType = {
        user: {
          id: 'complex-user',
          email: 'complex@example.com',
          name: 'Complex User',
          emailVerified: true,
          image: 'https://example.com/avatar.jpg',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: 'admin',
          phone: '+1234567890'
        },
        session: {
          id: 'complex-session',
          userId: 'complex-user',
          sessionToken: 'complex-token',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '203.0.113.1',
          userAgent: 'Mozilla/5.0 (Complex Browser)',
          user: {
            id: 'complex-user',
            email: 'complex@example.com',
            name: 'Complex User',
            emailVerified: true,
            image: 'https://example.com/avatar.jpg',
            createdAt: new Date(),
            updatedAt: new Date(),
            role: 'admin'
          },
          activeOrganizationId: 'primary-org'
        },
        isLoading: false,
        isSignedIn: true,
        activeOrganization: {
          id: 'primary-org',
          name: 'Primary Studio',
          slug: 'primary-studio',
          logo: 'https://example.com/logo.png',
          createdAt: new Date(),
          metadata: '{"theme": "dark", "timezone": "UTC"}'
        },
        organizations: [
          {
            id: 'primary-org',
            name: 'Primary Studio',
            createdAt: new Date()
          },
          {
            id: 'secondary-org',
            name: 'Secondary Studio',
            createdAt: new Date()
          }
        ],
        permissions: ['*'],
        hasPermission: (permission: StudioPermission) => permission === '*' || permission.includes('read')
      }

      expect(complexAuthContext.organizations).toHaveLength(2)
      expect(complexAuthContext.user?.phone).toBe('+1234567890')
      expect(complexAuthContext.activeOrganization?.metadata).toContain('theme')
      expect(complexAuthContext.hasPermission('booking:read')).toBe(true)
      expect(complexAuthContext.hasPermission('*')).toBe(true)
    })
  })
})