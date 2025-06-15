import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    // Check if we're redirected to login or if login form is visible
    await expect(page).toHaveURL(/.*login.*/);
    
    // Look for email and password fields
    const emailField = page.locator('input[type="email"], input[name="email"]');
    const passwordField = page.locator('input[type="password"], input[name="password"]');
    
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('should login with admin credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', 'admin@ink37tattoos.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123456');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Check for admin-specific content
    await expect(page.locator('text=Dashboard, text=Admin')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'admin@ink37tattoos.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")');
    
    // Should show error message
    await expect(page.locator('text=Invalid, text=Error, text=Wrong')).toBeVisible();
  });

  test('should show auth API status', async ({ page }) => {
    // Test the auth API directly
    const response = await page.request.get('/api/auth/get-session');
    console.log('Auth API Response Status:', response.status());
    console.log('Auth API Response:', await response.text());
    
    // Should return 200 (even if session is null)
    expect(response.status()).toBe(200);
  });

  test('should test sign-in API directly', async ({ page }) => {
    // Test the sign-in API directly
    const response = await page.request.post('/api/auth/sign-in/email', {
      data: {
        email: 'admin@ink37tattoos.com',
        password: 'admin123456'
      }
    });
    
    console.log('Sign-in API Response Status:', response.status());
    console.log('Sign-in API Response Headers:', response.headers());
    console.log('Sign-in API Response:', await response.text());
    
    // Should not return 500
    expect(response.status()).not.toBe(500);
  });
});