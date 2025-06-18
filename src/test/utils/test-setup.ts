import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Make React available globally for JSX
globalThis.React = React;

/**
 * Global test setup for Better Auth testing
 * 
 * This file configures the testing environment for auth-related tests
 */

// Mock environment variables for testing
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.BETTER_AUTH_URL = 'http://localhost:3001/api/auth';
process.env.GOOGLE_CLIENT_ID = 'mock-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-google-client-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';

// Global mocks
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn()
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn()
    },
    account: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn()
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn()
  }
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn()
}));

// Mock Next.js server components
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url: string | URL, init?: RequestInit) {
      this.url = typeof url === 'string' ? url : url.toString();
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.nextUrl = new URL(this.url);
    }
    url: string;
    method: string;
    headers: Headers;
    nextUrl: URL;
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    }),
    redirect: (url: string | URL, status: number = 307) => new Response(null, {
      status,
      headers: { 'Location': url.toString() }
    }),
    next: () => new Response()
  }
}));

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Mock console methods but allow them to be restored
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterEach(() => {
  // Clean up React Testing Library state
  cleanup();
  
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Custom matchers for Better Auth testing
expect.extend({
  toBeValidUser(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.email === 'string' &&
      typeof received.name === 'string' &&
      ['user', 'admin'].includes(received.role);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid user`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid user with id, email, name, and role`,
        pass: false
      };
    }
  },

  toBeValidSession(received) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.userId === 'string' &&
      typeof received.token === 'string' &&
      received.expiresAt instanceof Date &&
      received.expiresAt > new Date();

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid session`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid session with id, userId, token, and future expiresAt`,
        pass: false
      };
    }
  },

  toBeAuthError(received) {
    const pass = received &&
      typeof received.message === 'string' &&
      received.message.length > 0;

    if (pass) {
      return {
        message: () => `expected ${received} not to be an auth error`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be an auth error with message`,
        pass: false
      };
    }
  }
});

// Extend expect interface for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidUser(): T;
    toBeValidSession(): T;
    toBeAuthError(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidUser(): any;
    toBeValidSession(): any;
    toBeAuthError(): any;
  }
}

// Global test configuration
export const testConfig = {
  // Test timeouts
  timeouts: {
    short: 1000,
    medium: 5000,
    long: 10000
  },
  
  // Test URLs
  urls: {
    base: 'http://localhost:3001',
    auth: 'http://localhost:3001/api/auth',
    dashboard: 'http://localhost:3001/dashboard'
  },
  
  // Test users
  testUsers: {
    admin: {
      email: 'admin@test.com',
      password: 'AdminPassword123!',
      role: 'admin'
    },
    user: {
      email: 'user@test.com',
      password: 'UserPassword123!',
      role: 'user'
    }
  }
};

// Test database helpers
export const testDb = {
  async cleanAll() {
    const { prisma } = await import('@/lib/prisma');
    try {
      await prisma.session.deleteMany();
      await prisma.account.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      console.warn('Test DB cleanup warning:', error);
    }
  },
  
  async createUser(userData: any) {
    const { prisma } = await import('@/lib/prisma');
    return prisma.user.create({ data: userData });
  },
  
  async createSession(sessionData: any) {
    const { prisma } = await import('@/lib/prisma');
    return prisma.session.create({ data: sessionData });
  }
};

// Export for use in tests
export { vi };

// Global error handler for unhandled promises in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

console.log('Better Auth test setup complete');