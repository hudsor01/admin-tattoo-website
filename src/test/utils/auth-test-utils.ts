import { vi } from 'vitest';
import type { Session, User } from '@/types/auth';

/**
 * Test utilities for Better Auth testing
 * 
 * Provides mocks, fixtures, and helper functions for testing auth functionality
 */

// Mock user fixtures
export const mockUsers = {
  admin: {
    id: 'admin-123',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
    emailVerified: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    lastLoginAt: new Date(),
    loginAttempts: 0
  } as User,

  user: {
    id: 'user-123',
    email: 'user@test.com',
    name: 'Regular User',
    role: 'user',
    emailVerified: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    lastLoginAt: new Date(),
    loginAttempts: 0
  } as User,

  unverified: {
    id: 'unverified-123',
    email: 'unverified@test.com',
    name: 'Unverified User',
    role: 'user',
    emailVerified: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    lastLoginAt: null,
    loginAttempts: 0
  } as User,

  inactive: {
    id: 'inactive-123',
    email: 'inactive@test.com',
    name: 'Inactive User',
    role: 'user',
    emailVerified: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: false,
    lastLoginAt: new Date(),
    loginAttempts: 0
  } as User
};

// Mock session fixtures
export const mockSessions = {
  adminSession: {
    id: 'session-admin-123',
    userId: 'admin-123',
    token: 'admin-session-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent'
  } as Session,

  userSession: {
    id: 'session-user-123',
    userId: 'user-123',
    token: 'user-session-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent'
  } as Session,

  expiredSession: {
    id: 'session-expired-123',
    userId: 'user-123',
    token: 'expired-session-token',
    expiresAt: new Date(Date.now() - 1000), // Expired
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent'
  } as Session
};

/**
 * Mock Better Auth client with common scenarios
 */
export function createMockAuthClient() {
  return {
    useSession: vi.fn(),
    signIn: {
      email: vi.fn()
    },
    signUp: {
      email: vi.fn()
    },
    signOut: vi.fn(),
    createUser: vi.fn(),
    listUsers: vi.fn(),
    setUserRole: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    verifyEmail: vi.fn(),
    sendVerificationEmail: vi.fn()
  };
}

/**
 * Mock Better Auth server instance
 */
export function createMockAuthServer() {
  return {
    api: {
      getSession: vi.fn(),
      createSession: vi.fn(),
      deleteSession: vi.fn(),
      validateSession: vi.fn()
    },
    handler: vi.fn()
  };
}

/**
 * Setup authenticated user session mock
 */
export function mockAuthenticatedUser(user: User, session?: Session) {
  const mockAuthClient = createMockAuthClient();
  const mockSession = session || {
    ...mockSessions.userSession,
    userId: user.id
  };

  mockAuthClient.useSession.mockReturnValue({
    data: {
      user,
      session: mockSession
    },
    isPending: false,
    error: null
  });

  return mockAuthClient;
}

/**
 * Setup unauthenticated session mock
 */
export function mockUnauthenticatedUser() {
  const mockAuthClient = createMockAuthClient();

  mockAuthClient.useSession.mockReturnValue({
    data: null,
    isPending: false,
    error: null
  });

  return mockAuthClient;
}

/**
 * Setup loading session mock
 */
export function mockLoadingSession() {
  const mockAuthClient = createMockAuthClient();

  mockAuthClient.useSession.mockReturnValue({
    data: null,
    isPending: true,
    error: null
  });

  return mockAuthClient;
}

/**
 * Setup session error mock
 */
export function mockSessionError(error: Error) {
  const mockAuthClient = createMockAuthClient();

  mockAuthClient.useSession.mockReturnValue({
    data: null,
    isPending: false,
    error
  });

  return mockAuthClient;
}

/**
 * Mock login success
 */
export function mockLoginSuccess(user: User) {
  const mockAuthClient = createMockAuthClient();

  mockAuthClient.signIn.email.mockResolvedValue({
    data: {
      user,
      session: {
        ...mockSessions.userSession,
        userId: user.id
      }
    },
    error: null
  });

  return mockAuthClient;
}

/**
 * Mock login failure
 */
export function mockLoginFailure(errorMessage: string) {
  const mockAuthClient = createMockAuthClient();

  mockAuthClient.signIn.email.mockResolvedValue({
    data: null,
    error: {
      message: errorMessage,
      code: 'INVALID_CREDENTIALS'
    }
  });

  return mockAuthClient;
}

/**
 * Mock signup success
 */
export function mockSignupSuccess(user: User) {
  const mockAuthClient = createMockAuthClient();

  mockAuthClient.signUp.email.mockResolvedValue({
    data: {
      user,
      session: {
        ...mockSessions.userSession,
        userId: user.id
      }
    },
    error: null
  });

  return mockAuthClient;
}

/**
 * Mock signup failure
 */
export function mockSignupFailure(errorMessage: string) {
  const mockAuthClient = createMockAuthClient();

  mockAuthClient.signUp.email.mockResolvedValue({
    data: null,
    error: {
      message: errorMessage,
      code: 'SIGNUP_FAILED'
    }
  });

  return mockAuthClient;
}

/**
 * Mock admin operations
 */
export function mockAdminOperations() {
  const mockAuthClient = createMockAuthClient();

  // Mock list users
  mockAuthClient.listUsers.mockResolvedValue({
    users: [mockUsers.admin, mockUsers.user],
    total: 2,
    page: 1,
    limit: 10
  });

  // Mock create user
  mockAuthClient.createUser.mockResolvedValue({
    user: mockUsers.user,
    success: true
  });

  // Mock set user role
  mockAuthClient.setUserRole.mockResolvedValue({
    success: true,
    user: { ...mockUsers.user, role: 'admin' }
  });

  // Mock ban user
  mockAuthClient.banUser.mockResolvedValue({
    success: true,
    bannedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  // Mock unban user
  mockAuthClient.unbanUser.mockResolvedValue({
    success: true
  });

  return mockAuthClient;
}

/**
 * Mock middleware auth check
 */
export function mockMiddlewareAuth(user?: User, session?: Session) {
  const mockAuth = createMockAuthServer();

  if (user && session) {
    mockAuth.api.getSession.mockResolvedValue({
      user,
      session
    });
  } else {
    mockAuth.api.getSession.mockResolvedValue(null);
  }

  return mockAuth;
}

/**
 * Test helper to create request headers with session
 */
export function createAuthHeaders(sessionToken: string) {
  return {
    'Cookie': `better-auth.session_token=${sessionToken}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Test helper to create mock request
 */
export function createMockRequest(
  url: string,
  method: string = 'GET',
  body?: Record<string, unknown>,
  headers?: Record<string, string>
) {
  return {
    url,
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers
    }),
    json: () => Promise.resolve(body || {})
  };
}

/**
 * Test helper to create mock response
 */
export function createMockResponse(data: Record<string, unknown>, status: number = 200) {
  return {
    status,
    json: () => Promise.resolve(data),
    headers: new Headers({
      'Content-Type': 'application/json'
    })
  };
}

/**
 * Database test helpers
 */
export const dbTestHelpers = {
  /**
   * Clean up all auth-related test data
   */
  async cleanupAuth() {
    const { prisma } = await import('@/lib/prisma');
    try {
      await prisma.session.deleteMany({
        where: {
          userId: {
            in: Object.values(mockUsers).map(u => u.id)
          }
        }
      });
      await prisma.account.deleteMany({
        where: {
          userId: {
            in: Object.values(mockUsers).map(u => u.id)
          }
        }
      });
      await prisma.user.deleteMany({
        where: {
          id: {
            in: Object.values(mockUsers).map(u => u.id)
          }
        }
      });
    } catch (error) {
      console.warn('Database cleanup warning:', error);
    }
  },

  /**
   * Create test user in database
   */
  async createTestUser(userData: Partial<User>) {
    const { prisma } = await import('@/lib/prisma');
    return prisma.user.create({
      data: {
        email: userData.email || 'test@example.com',
        name: userData.name || 'Test User',
        role: userData.role || 'user',
        emailVerified: userData.emailVerified || new Date(),
        isActive: userData.isActive ?? true,
        ...userData
      }
    });
  },

  /**
   * Create test session in database
   */
  async createTestSession(userId: string, sessionData?: Partial<Session>) {
    const { prisma } = await import('@/lib/prisma');
    return prisma.session.create({
      data: {
        userId,
        token: sessionData?.token || `test-token-${Date.now()}`,
        expiresAt: sessionData?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: sessionData?.ipAddress || '127.0.0.1',
        userAgent: sessionData?.userAgent || 'test-agent',
        ...sessionData
      }
    });
  }
};

/**
 * Performance test helpers
 */
export const performanceHelpers = {
  /**
   * Measure function execution time
   */
  async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  },

  /**
   * Create large dataset for performance testing
   */
  createLargeUserDataset(count: number = 100) {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push({
        id: `perf-user-${i}`,
        email: `perfuser${i}@test.com`,
        name: `Performance User ${i}`,
        role: i % 10 === 0 ? 'admin' : 'user',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        lastLoginAt: new Date(),
        loginAttempts: 0
      } as User);
    }
    return users;
  }
};

/**
 * Security test helpers
 */
export const securityHelpers = {
  /**
   * Create malicious request payloads for security testing
   */
  createMaliciousPayloads() {
    return {
      sqlInjection: "'; DROP TABLE users; --",
      xssScript: '<script>alert("xss")</script>',
      longString: 'a'.repeat(10000),
      nullBytes: 'test\x00admin',
      pathTraversal: '../../../etc/passwd',
      commandInjection: '; cat /etc/passwd',
      jsonInjection: '{"admin": true}',
      prototypePoison: '{"__proto__": {"admin": true}}'
    };
  },

  /**
   * Create rate limiting test scenarios
   */
  createRateLimitingScenarios() {
    return {
      normalLoad: 10,
      heavyLoad: 50,
      attackLoad: 200,
      sustainedLoad: 1000
    };
  }
};

/**
 * Export all utilities
 */
export {
  createMockAuthClient,
  createMockAuthServer,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  mockLoadingSession,
  mockSessionError,
  mockLoginSuccess,
  mockLoginFailure,
  mockSignupSuccess,
  mockSignupFailure,
  mockAdminOperations,
  mockMiddlewareAuth
};
