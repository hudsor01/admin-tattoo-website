
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('AuthFlow_2025-06-12', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3001');

    // Take screenshot
    await page.screenshot({ path: 'initial-page-load.png', { fullPage: true } });

    // Fill input field
    await page.fill('input[type="email"]', 'invalid@example.com');

    // Fill input field
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click element
    await page.click('button[type="submit"]');

    // Take screenshot
    await page.screenshot({ path: 'invalid-login-attempt.png' });

    // Navigate to URL
    await page.goto('http://localhost:3001/setup');

    // Take screenshot
    await page.screenshot({ path: 'admin-setup-page.png' });

    // Fill input field
    await page.fill('input[type="password"]:first-of-type', 'SecureAdmin123!');

    // Fill input field
    await page.fill('input[type="password"]:last-of-type', 'SecureAdmin123!');

    // Click element
    await page.click('button[type="submit"]');

    // Navigate to URL
    await page.goto('http://localhost:3001/setup');

    // Fill input field
    await page.fill('input[type="email"]', 'admin@ink37tattoos.com');

    // Fill input field
    await page.fill('input[type="password"]', 'admin123');

    // Click element
    await page.click('button[type="submit"]');

    // Take screenshot
    await page.screenshot({ path: 'admin-login-attempt.png' });

    // Click element
    await page.click('button:has-text('Continue with Google')"');

    // Click element
    await page.click('button:has-text('Continue with Google')');

    // Take screenshot
    await page.screenshot({ path: 'google-oauth-redirect.png' });

    // Navigate to URL
    await page.goto('http://localhost:3001');
});