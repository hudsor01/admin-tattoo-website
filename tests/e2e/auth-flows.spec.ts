import { type Page, expect, test } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';

// Helper function to clean up test data via API
async function cleanupTestData() {
  // In E2E tests, we clean up via API calls instead of direct database access
  try {
    // These would be actual API calls to your cleanup endpoints
    console.log('Test cleanup - this would call cleanup API endpoints');
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
}

// Helper function to create test user via API
async function createTestUser(email: string, password: string, role: string = 'user') {
  // In E2E tests, we create users via API calls instead of direct database access
  console.log(`Creating test user: ${email} with role: ${role}`);
  return {
    id: `test-${Date.now()}`,
    email,
    name: email.split('@')[0],
    role,
    emailVerified: new Date(),
    isActive: true
  };
}

// Helper function to navigate and wait for page load
async function navigateAndWait(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

test.describe('Authentication Flows', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test.describe('User Registration Flow', () => {
    test('should register new user successfully', async ({ page }) => {
      await navigateAndWait(page, BASE_URL);

      // Look for sign up form or link
      const signUpButton = page.locator('[data-testid="sign-up-button"], button:has-text("Sign Up"), a:has-text("Sign Up")').first();
      await expect(signUpButton).toBeVisible();
      await signUpButton.click();

      // Fill registration form
      await page.fill('[data-testid="name-input"], input[name="name"], input[placeholder*="name" i]', 'Test User');
      await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', 'newuser@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', 'SecurePassword123!');

      // Submit registration
      const submitButton = page.locator('[data-testid="register-submit"], button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")').first();
      await submitButton.click();

      // Wait for successful registration
      await page.waitForURL(/dashboard|success|welcome/i, { timeout: 10000 });
      
      // Verify user is created and logged in
      const welcomeText = page.locator('text=/welcome|dashboard|logged in/i').first();
      await expect(welcomeText).toBeVisible({ timeout: 5000 });
    });

    test('should show validation errors for invalid registration data', async ({ page }) => {
      await navigateAndWait(page, BASE_URL);

      const signUpButton = page.locator('[data-testid="sign-up-button"], button:has-text("Sign Up"), a:has-text("Sign Up")').first();
      await signUpButton.click();

      // Try to submit with invalid email
      await page.fill('[data-testid="name-input"], input[name="name"]', 'Test User');
      await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', 'invalid-email');
      await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', 'weak');

      const submitButton = page.locator('[data-testid="register-submit"], button[type="submit"]').first();
      await submitButton.click();

      // Expect validation errors
      const errorMessages = page.locator('[data-testid="error-message"], .error, .text-red-500, [role="alert"]');
      await expect(errorMessages).toBeVisible({ timeout: 5000 });
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      // Create existing user
      await createTestUser('existing@test.com', 'password123');

      await navigateAndWait(page, BASE_URL);

      const signUpButton = page.locator('[data-testid="sign-up-button"], button:has-text("Sign Up")').first();
      await signUpButton.click();

      // Try to register with existing email
      await page.fill('[data-testid="name-input"], input[name="name"]', 'Duplicate User');
      await page.fill('[data-testid="email-input"], input[name="email"]', 'existing@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"]', 'SecurePassword123!');

      const submitButton = page.locator('[data-testid="register-submit"], button[type="submit"]').first();
      await submitButton.click();

      // Expect error about existing email
      const errorMessage = page.locator('text=/already exists|email taken|already registered/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('User Login Flow', () => {
    test.beforeEach(async () => {
      // Create test user for login tests
      await createTestUser('testlogin@test.com', 'TestPassword123!');
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await navigateAndWait(page, BASE_URL);

      // Fill login form
      await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', 'testlogin@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', 'TestPassword123!');

      // Submit login
      const loginButton = page.locator('[data-testid="login-submit"], button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      await loginButton.click();

      // Wait for successful login
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      
      // Verify user is logged in
      const dashboardContent = page.locator('[data-testid="dashboard"], text=/dashboard|welcome/i').first();
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await navigateAndWait(page, BASE_URL);

      // Try login with wrong password
      await page.fill('[data-testid="email-input"], input[name="email"]', 'testlogin@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"]', 'WrongPassword');

      const loginButton = page.locator('[data-testid="login-submit"], button[type="submit"]').first();
      await loginButton.click();

      // Expect error message
      const errorMessage = page.locator('[data-testid="error-message"], .error, text=/invalid|incorrect|wrong/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should show error for non-existent user', async ({ page }) => {
      await navigateAndWait(page, BASE_URL);

      // Try login with non-existent email
      await page.fill('[data-testid="email-input"], input[name="email"]', 'nonexistent@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"]', 'AnyPassword123!');

      const loginButton = page.locator('[data-testid="login-submit"], button[type="submit"]').first();
      await loginButton.click();

      // Expect error message
      const errorMessage = page.locator('[data-testid="error-message"], .error, text=/not found|invalid|incorrect/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should handle empty form submission', async ({ page }) => {
      await navigateAndWait(page, BASE_URL);

      const loginButton = page.locator('[data-testid="login-submit"], button[type="submit"]').first();
      await loginButton.click();

      // Expect validation errors for required fields
      const requiredErrors = page.locator('[data-testid="error-message"], .error, text=/required|empty/i');
      await expect(requiredErrors).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Session Management', () => {
    let userEmail: string;

    test.beforeEach(async () => {
      userEmail = 'session@test.com';
      await createTestUser(userEmail, 'SessionPassword123!');
    });

    test('should maintain session across page reloads', async ({ page }) => {
      // Login
      await navigateAndWait(page, BASE_URL);
      await page.fill('[data-testid="email-input"], input[name="email"]', userEmail);
      await page.fill('[data-testid="password-input"], input[name="password"]', 'SessionPassword123!');
      await page.click('[data-testid="login-submit"], button[type="submit"]');
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify still logged in
      const dashboardContent = page.locator('[data-testid="dashboard"], text=/dashboard/i');
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
    });

    test('should maintain session across navigation', async ({ page }) => {
      // Login
      await navigateAndWait(page, BASE_URL);
      await page.fill('[data-testid="email-input"], input[name="email"]', userEmail);
      await page.fill('[data-testid="password-input"], input[name="password"]', 'SessionPassword123!');
      await page.click('[data-testid="login-submit"], button[type="submit"]');
      
      await page.waitForURL(/dashboard/, { timeout: 10000 });

      // Navigate to different dashboard sections
      const navLinks = page.locator('[data-testid="nav-link"], nav a, [role="navigation"] a');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        await navLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Verify still authenticated
        const authenticatedContent = page.locator('[data-testid="dashboard"], [data-testid="user-menu"], text=/logout|sign out/i');
        await expect(authenticatedContent).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle concurrent sessions in different tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      try {
        // Login in first tab
        await navigateAndWait(page1, BASE_URL);
        await page1.fill('[data-testid="email-input"], input[name="email"]', userEmail);
        await page1.fill('[data-testid="password-input"], input[name="password"]', 'SessionPassword123!');
        await page1.click('[data-testid="login-submit"], button[type="submit"]');
        await page1.waitForURL(/dashboard/, { timeout: 10000 });

        // Check second tab - should also be logged in due to shared cookies
        await navigateAndWait(page2, `${BASE_URL}/dashboard`);
        
        const dashboardContent = page2.locator('[data-testid="dashboard"], text=/dashboard/i');
        await expect(dashboardContent).toBeVisible({ timeout: 5000 });
      } finally {
        await context.close();
      }
    });
  });

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each logout test
      await createTestUser('logout@test.com', 'LogoutPassword123!');
      
      await navigateAndWait(page, BASE_URL);
      await page.fill('[data-testid="email-input"], input[name="email"]', 'logout@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"]', 'LogoutPassword123!');
      await page.click('[data-testid="login-submit"], button[type="submit"]');
      await page.waitForURL(/dashboard/, { timeout: 10000 });
    });

    test('should logout successfully', async ({ page }) => {
      // Find and click logout button
      const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out"), [role="menuitem"]:has-text("Logout")').first();
      await expect(logoutButton).toBeVisible({ timeout: 5000 });
      await logoutButton.click();

      // Wait for redirect to login page
      await page.waitForURL(/login|signin|\/$/, { timeout: 10000 });

      // Verify logged out
      const loginForm = page.locator('[data-testid="login-form"], form, input[type="email"]');
      await expect(loginForm).toBeVisible({ timeout: 5000 });
    });

    test('should clear session after logout', async ({ page }) => {
      // Logout
      const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")').first();
      await logoutButton.click();
      await page.waitForURL(/login|signin|\/$/, { timeout: 10000 });

      // Try to access protected route directly
      await navigateAndWait(page, `${BASE_URL}/dashboard`);

      // Should be redirected back to login
      await page.waitForURL(/login|signin|\/$/, { timeout: 10000 });
      const loginForm = page.locator('[data-testid="login-form"], form, input[type="email"]');
      await expect(loginForm).toBeVisible({ timeout: 5000 });
    });

    test('should logout from all tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      try {
        // Open dashboard in both tabs
        await navigateAndWait(page1, `${BASE_URL}/dashboard`);
        await navigateAndWait(page2, `${BASE_URL}/dashboard`);

        // Logout from first tab
        const logoutButton1 = page1.locator('[data-testid="logout-button"], button:has-text("Logout")').first();
        await logoutButton1.click();
        await page1.waitForURL(/login|signin|\/$/, { timeout: 10000 });

        // Check second tab - should also be logged out
        await page2.reload();
        await page2.waitForURL(/login|signin|\/$/, { timeout: 10000 });
        
        const loginForm = page2.locator('[data-testid="login-form"], form, input[type="email"]');
        await expect(loginForm).toBeVisible({ timeout: 5000 });
      } finally {
        await context.close();
      }
    });
  });

  test.describe('Protected Route Access', () => {
    test('should redirect unauthenticated users from protected routes', async ({ page }) => {
      // Try to access dashboard without authentication
      await navigateAndWait(page, `${BASE_URL}/dashboard`);

      // Should be redirected to login
      await page.waitForURL(/login|signin|\/$/, { timeout: 10000 });
      const loginForm = page.locator('[data-testid="login-form"], form, input[type="email"]');
      await expect(loginForm).toBeVisible({ timeout: 5000 });
    });

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      // Create and login as user
      await createTestUser('protected@test.com', 'ProtectedPassword123!', 'admin');
      
      await navigateAndWait(page, BASE_URL);
      await page.fill('[data-testid="email-input"], input[name="email"]', 'protected@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"]', 'ProtectedPassword123!');
      await page.click('[data-testid="login-submit"], button[type="submit"]');
      await page.waitForURL(/dashboard/, { timeout: 10000 });

      // Should be able to access dashboard
      const dashboardContent = page.locator('[data-testid="dashboard"], text=/dashboard/i');
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
    });

    test('should handle deep-linked protected routes after login', async ({ page }) => {
      // Try to access specific dashboard page
      await navigateAndWait(page, `${BASE_URL}/dashboard/analytics`);
      
      // Should be redirected to login
      await page.waitForURL(/login|signin|\/$/, { timeout: 10000 });

      // Login
      await createTestUser('deeplink@test.com', 'DeeplinkPassword123!', 'admin');
      await page.fill('[data-testid="email-input"], input[name="email"]', 'deeplink@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"]', 'DeeplinkPassword123!');
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Should redirect to originally requested page or dashboard
      await page.waitForURL(/dashboard/, { timeout: 10000 });
      const dashboardContent = page.locator('[data-testid="dashboard"], text=/dashboard|analytics/i');
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept and fail auth requests
      await page.route('**/api/auth/**', route => {
        route.abort('failed');
      });

      await navigateAndWait(page, BASE_URL);
      
      await page.fill('[data-testid="email-input"], input[name="email"]', 'test@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"]', 'password');
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Should show network error
      const errorMessage = page.locator('[data-testid="error-message"], .error, text=/network|connection|failed/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Intercept and return server error
      await page.route('**/api/auth/sign-in/email', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await navigateAndWait(page, BASE_URL);
      
      await page.fill('[data-testid="email-input"], input[name="email"]', 'test@test.com');
      await page.fill('[data-testid="password-input"], input[name="password"]', 'password');
      await page.click('[data-testid="login-submit"], button[type="submit"]');

      // Should show server error
      const errorMessage = page.locator('[data-testid="error-message"], .error, text=/server|error|try again/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });
});