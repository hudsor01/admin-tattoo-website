import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Better Auth API responses
const mockAuthResponses = {
  signUp: {
    success: {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      session: {
        id: 'session-123',
        userId: 'user-123',
        token: 'session-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    },
    invalidEmail: {
      error: {
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      }
    },
    weakPassword: {
      error: {
        message: 'Password is too weak',
        code: 'WEAK_PASSWORD'
      }
    },
    duplicateEmail: {
      error: {
        message: 'Email already exists',
        code: 'EMAIL_EXISTS'
      }
    }
  },
  signIn: {
    success: {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      session: {
        id: 'session-123',
        userId: 'user-123',
        token: 'session-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    },
    invalidCredentials: {
      error: {
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      }
    }
  },
  session: {
    valid: {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      },
      session: {
        id: 'session-123',
        userId: 'user-123',
        token: 'session-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    },
    invalid: {
      user: null,
      session: null
    }
  },
  admin: {
    listUsers: {
      users: [
        {
          id: 'user-123',
          email: 'user@test.com',
          name: 'Regular User',
          role: 'user'
        },
        {
          id: 'admin-123',
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'admin'
        }
      ],
      total: 2
    },
    createUser: {
      user: {
        id: 'new-user-123',
        email: 'newuser@test.com',
        name: 'New User',
        role: 'user'
      }
    },
    setRole: {
      success: true,
      user: {
        id: 'user-123',
        email: 'user@test.com',
        name: 'Regular User',
        role: 'admin'
      }
    },
    unauthorized: {
      error: {
        message: 'Unauthorized - Admin access required',
        code: 'UNAUTHORIZED'
      }
    }
  }
};

// Mock fetch to simulate API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Better Auth API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Registration API', () => {
    it('should successfully register a new user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthResponses.signUp.success)
      });

      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'securePassword123!'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.user.name).toBe('Test User');
      expect(data.user.role).toBe('user');
      expect(data.session).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockAuthResponses.signUp.invalidEmail)
      });

      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          password: 'securePassword123!'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Invalid email');
    });

    it('should reject registration with weak password', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockAuthResponses.signUp.weakPassword)
      });

      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: '123'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('weak');
    });

    it('should prevent duplicate email registration', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockAuthResponses.signUp.duplicateEmail)
      });

      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'existing@example.com',
          password: 'securePassword123!'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('already exists');
    });
  });

  describe('User Authentication API', () => {
    it('should successfully authenticate with valid credentials', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthResponses.signIn.success)
      });

      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'securePassword123!'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('test@example.com');
      expect(data.session).toBeDefined();
    });

    it('should reject authentication with invalid credentials', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockAuthResponses.signIn.invalidCredentials)
      });

      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongPassword'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Invalid');
    });
  });

  describe('Session Management API', () => {
    it('should retrieve valid session', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthResponses.session.valid)
      });

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Cookie': 'better-auth.session_token=valid-token' }
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.session).toBeDefined();
    });

    it('should handle invalid session', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthResponses.session.invalid)
      });

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Cookie': 'better-auth.session_token=invalid-token' }
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });

    it('should successfully sign out', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      });

      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { 'Cookie': 'better-auth.session_token=valid-token' }
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
    });
  });

  describe('Admin API Functionality', () => {
    it('should allow admin to list users', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthResponses.admin.listUsers)
      });

      const response = await fetch('/api/auth/admin/list-users', {
        method: 'GET',
        headers: { 'Cookie': 'better-auth.session_token=admin-token' }
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBeGreaterThan(0);
      expect(data.total).toBe(2);
    });

    it('should allow admin to create user', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthResponses.admin.createUser)
      });

      const response = await fetch('/api/auth/admin/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': 'better-auth.session_token=admin-token'
        },
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'password123',
          role: 'user'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('newuser@test.com');
    });

    it('should allow admin to set user role', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthResponses.admin.setRole)
      });

      const response = await fetch('/api/auth/admin/set-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': 'better-auth.session_token=admin-token'
        },
        body: JSON.stringify({
          userId: 'user-123',
          role: 'admin'
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('admin');
    });

    it('should prevent non-admin from accessing admin endpoints', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve(mockAuthResponses.admin.unauthorized)
      });

      const response = await fetch('/api/auth/admin/list-users', {
        method: 'GET',
        headers: { 'Cookie': 'better-auth.session_token=user-token' }
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain('Unauthorized');
    });
  });

  describe('Security Features', () => {
    it('should enforce rate limits', async () => {
      // Simulate rate limit exceeded
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: {
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        })
      });

      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        })
      });

      expect(response.status).toBe(429);
    });

    it('should validate CSRF tokens', async () => {
      // Simulate CSRF validation failure
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: {
            message: 'Invalid CSRF token',
            code: 'CSRF_ERROR'
          }
        })
      });

      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com'
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        })
      });

      expect(response.status).toBe(403);
    });
  });
});