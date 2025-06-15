import { describe, it, expect } from 'vitest';
import { isAdmin, canAccessDashboard } from '@/lib/authorization';
import type { User } from '@/types/auth';

describe('Auth Client Unit Tests', () => {
  describe('isAdmin function', () => {
    it('should return true for user with admin role', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@ink37tattoos.com',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return true for admin email fallback', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@ink37tattoos.com',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return true for email containing admin', () => {
      const adminUser: User = {
        id: '1',
        email: 'superadmin@company.com',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for regular user', () => {
      const regularUser: User = {
        id: '1',
        email: 'user@company.com',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(isAdmin(regularUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('should return false for undefined user', () => {
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe('canAccessDashboard function', () => {
    it('should return true for admin user', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@ink37tattoos.com',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(canAccessDashboard(adminUser)).toBe(true);
    });

    it('should return false for regular user', () => {
      const regularUser: User = {
        id: '1',
        email: 'user@company.com',
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(canAccessDashboard(regularUser)).toBe(false);
    });
  });
});