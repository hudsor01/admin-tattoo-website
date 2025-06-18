import { beforeAll, describe, expect, it } from 'vitest';
import { auth } from '@/lib/auth';

describe('Google OAuth Configuration Test', () => {
  beforeAll(() => {
    // Ensure we have the required environment variables
    console.log('Environment check:');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
    console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
    console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? 'Set' : 'Missing');
  });

  it('should have Google OAuth configured', () => {
    expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
  });

  it('should have proper auth URL configuration', () => {
    expect(process.env.BETTER_AUTH_URL).toBe('http://localhost:3001/api/auth');
  });

  it('should have auth instance configured', () => {
    expect(auth).toBeDefined();
    expect(auth.api).toBeDefined();
  });

  it('should test auth endpoints are accessible', async () => {
    // Test that the auth handler responds
    try {
      const response = await fetch('http://localhost:3001/api/auth', {
        method: 'GET',
      });
      
      console.log('Auth endpoint status:', response.status);
      console.log('Auth endpoint response:', await response.text());
      
      // Should get some response (not necessarily 200, but should not fail completely)
      expect(response).toBeDefined();
    } catch (error) {
      console.error('Auth endpoint test failed:', error);
      throw error;
    }
  });

  it('should test Google OAuth initiation endpoint', async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/sign-in/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: 'http://localhost:3001/dashboard'
        }),
      });
      
      console.log('Google OAuth initiation status:', response.status);
      const responseText = await response.text();
      console.log('Google OAuth initiation response:', responseText);
      
      // Should either redirect or return auth URL
      expect(response.status).toBeOneOf([200, 302, 307, 308]);
    } catch (error) {
      console.error('Google OAuth initiation test failed:', error);
      throw error;
    }
  });

  it('should verify auth client configuration', async () => {
    const { authClient } = await import('@/lib/auth-client');
    
    expect(authClient).toBeDefined();
    expect(authClient.signIn).toBeDefined();
    expect(authClient.signIn.social).toBeDefined();
  });
});

describe('Database Connection Test', () => {
  it('should connect to database', async () => {
    const { prisma } = await import('@/lib/auth');
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection: OK');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  });

  it('should verify auth tables exist', async () => {
    const { prisma } = await import('@/lib/auth');
    
    try {
      // Check if required auth tables exist
      const userCount = await prisma.user.count();
      const sessionCount = await prisma.session.count();
      const accountCount = await prisma.account.count();
      
      console.log('User table count:', userCount);
      console.log('Session table count:', sessionCount);
      console.log('Account table count:', accountCount);
      
      expect(userCount).toBeGreaterThanOrEqual(0);
      expect(sessionCount).toBeGreaterThanOrEqual(0);
      expect(accountCount).toBeGreaterThanOrEqual(0);
    } catch (error) {
      console.error('Auth tables verification failed:', error);
      throw error;
    }
  });
});