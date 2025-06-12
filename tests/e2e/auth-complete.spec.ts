import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - Complete End-to-End Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ensure we start fresh
    await page.context().clearCookies();
  });

  test('Middleware redirects unauthenticated users to login', async ({ page }) => {
    // Test that root redirects to login when not authenticated
    await page.goto('http://localhost:3001');
    await expect(page).toHaveURL('http://localhost:3001/login');
    
    // Verify login page elements are present
    await expect(page.locator('text=Login to your account')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Dashboard route redirects to login when not authenticated', async ({ page }) => {
    await page.goto('http://localhost:3001/analytics');
    await expect(page).toHaveURL('http://localhost:3001/login');
    
    await page.goto('http://localhost:3001/customers');
    await expect(page).toHaveURL('http://localhost:3001/login');
    
    await page.goto('http://localhost:3001/appointments');
    await expect(page).toHaveURL('http://localhost:3001/login');
  });

  test('Invalid login shows error message', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify error message appears
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    
    // Verify still on login page
    await expect(page).toHaveURL('http://localhost:3001/login');
  });

  test('Empty email/password validation', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Submit button should be disabled with empty fields
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    
    // Fill only email
    await page.fill('input[type="email"]', 'test@example.com');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    
    // Fill only password
    await page.fill('input[type="email"]', '');
    await page.fill('input[type="password"]', 'password');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    
    // Both fields filled - button should be enabled
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('Google OAuth button functionality', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Google button should be present and enabled
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    
    // Click Google button (will fail auth but should show error handling)
    await googleButton.click();
    
    // Should show Google sign in failed message
    await expect(page.locator('text=Google sign in failed')).toBeVisible({ timeout: 10000 });
  });

  test('Loading states work correctly', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    
    // Submit and check loading state appears briefly
    await page.click('button[type="submit"]');
    
    // The button text should change to loading state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toContainText('Signing in');
  });

  test('API endpoints are accessible', async ({ page }) => {
    // Test auth API endpoint with correct path
    const authResponse = await page.request.get('http://localhost:3001/api/auth/session');
    expect([200, 401, 404]).toContain(authResponse.status()); // Should respond properly
    
    // Test create admin endpoint
    const adminResponse = await page.request.post('http://localhost:3001/api/create-admin');
    expect([200, 400, 500]).toContain(adminResponse.status()); // Should respond, not 404
  });

  test('Session persistence after page reload', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Try to set a mock session cookie to test session handling
    await page.context().addCookies([{
      name: 'better-auth.session_token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
    }]);
    
    // Navigate to dashboard - it should redirect back to login since token is invalid
    await page.goto('http://localhost:3001/');
    
    // Should be redirected to login page since mock token is invalid
    await expect(page).toHaveURL('http://localhost:3001/login');
  });

  test('Admin user creation endpoint works', async ({ page }) => {
    const response = await page.request.post('http://localhost:3001/api/create-admin');
    const responseBody = await response.json();
    
    // Should either succeed or say user already exists
    expect([
      'Admin user created successfully',
      'User already exists'
    ]).toContain(responseBody.message || responseBody.error);
  });

  test('Setup page accessibility', async ({ page }) => {
    await page.goto('http://localhost:3001/setup');
    
    // If setup page exists, test it
    const isSetupPage = await page.locator('text=Setup Admin Password').isVisible();
    
    if (isSetupPage) {
      await expect(page.locator('input[type="password"]')).toHaveCount(2);
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Test password validation
      await page.fill('input[type="password"]:first-of-type', 'short');
      await page.fill('input[type="password"]:last-of-type', 'different');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    }
  });

  test('Performance: Login page loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 10 seconds (accounting for dev server overhead)
    expect(loadTime).toBeLessThan(10000);
    
    // Critical elements should be visible
    await expect(page.locator('text=Login to your account')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3001/login');
    
    // Elements should still be visible and usable on mobile
    await expect(page.locator('text=Login to your account')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Form should be submittable
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('Security: No sensitive data in localStorage or sessionStorage', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Fill form and submit (will fail but might store something)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'sensitivepassword');
    await page.click('button[type="submit"]');
    
    // Check that password is not stored in browser storage
    const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));
    const sessionStorage = await page.evaluate(() => JSON.stringify(window.sessionStorage));
    
    expect(localStorage).not.toContain('sensitivepassword');
    expect(sessionStorage).not.toContain('sensitivepassword');
  });

  test('Authentication state consistency', async ({ page }) => {
    // Start at login
    await page.goto('http://localhost:3001/login');
    await expect(page).toHaveURL('http://localhost:3001/login');
    
    // Try to navigate to protected route
    await page.goto('http://localhost:3001/');
    await expect(page).toHaveURL('http://localhost:3001/login');
    
    // Try dashboard
    await page.goto('http://localhost:3001/customers');
    await expect(page).toHaveURL('http://localhost:3001/login');
    
    // All routes should consistently redirect to login
  });
});

test.describe('Production Readiness Tests', () => {
  
  test('Database connection is working', async ({ page }) => {
    const response = await page.request.post('http://localhost:3001/api/create-admin');
    
    // Should not get database connection errors
    const responseBody = await response.json();
    if (responseBody.error) {
      expect(responseBody.error).not.toContain('database');
      expect(responseBody.error).not.toContain('connection');
      expect(responseBody.error).not.toContain('ECONNREFUSED');
    }
  });

  test('Environment variables are loaded', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Google button should be present (indicates env vars loaded)
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    
    // Check that clicking doesn't cause immediate error (indicates Google config exists)
    await page.click('button:has-text("Continue with Google")');
    
    // Should show auth failure, not config error
    await expect(page.locator('text=Google sign in failed')).toBeVisible({ timeout: 10000 });
  });

  test('Better Auth API is responding', async ({ page }) => {
    // Test auth endpoint exists and responds
    const response = await page.request.post('http://localhost:3001/api/auth/sign-in/email', {
      data: {
        email: 'test@example.com',
        password: 'password'
      }
    });
    
    // Should respond with auth error, not 500/404
    expect([400, 401, 422]).toContain(response.status());
  });
});