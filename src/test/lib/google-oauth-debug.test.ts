import { describe, it } from 'vitest';

describe('Google OAuth Debug', () => {
  it('should log the actual OAuth request being made', async () => {
    // Test what happens when we call the Google OAuth endpoint directly
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
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      // Check if we get a redirect URL
      if (response.status >= 300 && response.status < 400) {
        console.log('Redirect location:', response.headers.get('location'));
      }
      
    } catch (error) {
      console.error('OAuth request failed:', error);
    }
  });

  it('should test the auth client directly', async () => {
    const { authClient } = await import('@/lib/auth-client');
    
    console.log('Auth client baseURL:', authClient.baseURL);
    
    try {
      // This should trigger the OAuth flow
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: 'http://localhost:3001/dashboard'
      });
      
      console.log('Auth client result:', result);
    } catch (error) {
      console.error('Auth client error:', error);
    }
  });
});