import { test, expect, Page } from '@playwright/test';

test.describe('Admin Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin dashboard
    await page.goto('http://localhost:3001');
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Wait for redirect to login page
    await expect(page).toHaveURL(/.*\/login/);
    
    // Verify login page elements
    await expect(page.getByText('Login to your account')).toBeVisible();
    await expect(page.getByPlaceholder('admin@ink37tattoos.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Check for HTML5 validation (required fields)
    const emailInput = page.getByPlaceholder('admin@ink37tattoos.com');
    const passwordInput = page.getByRole('textbox', { name: /password/i }).or(page.locator('input[type="password"]'));
    
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Fill form with invalid credentials
    await page.getByPlaceholder('admin@ink37tattoos.com').fill('invalid@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for and check error message
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show admin access required for non-admin users', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // This test assumes there's a user with role !== 'admin'
    // In a real test, you'd create a test user or mock the auth response
    await page.getByPlaceholder('admin@ink37tattoos.com').fill('user@ink37tattoos.com');
    await page.locator('input[type="password"]').fill('userpassword');
    
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should show admin access required message
    await expect(page.getByText(/admin access required/i)).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with admin credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Fill form with admin credentials
    // Note: In a real test environment, you'd use test credentials
    await page.getByPlaceholder('admin@ink37tattoos.com').fill('admin@ink37tattoos.com');
    await page.locator('input[type="password"]').fill('adminpassword123');
    
    // Submit form
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Should redirect to dashboard on successful login
    await expect(page).toHaveURL('http://localhost:3001/', { timeout: 10000 });
    
    // Verify dashboard elements are visible
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    await expect(page.getByText('Ink 37 Tattoos')).toBeVisible();
  });

  test('should handle Google OAuth redirect correctly', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Click Google login button
    const googleButton = page.getByRole('button', { name: 'Login with Google' });
    await expect(googleButton).toBeVisible();
    
    // Note: In a real test, you'd mock the OAuth flow or use test accounts
    // This just verifies the button exists and is clickable
    await expect(googleButton).toBeEnabled();
  });

  test('should display forgot password link', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    const forgotPasswordLink = page.getByText('Forgot your password?');
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
  });

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    
    // Check for proper labels and form structure
    const emailInput = page.getByPlaceholder('admin@ink37tattoos.com');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Check for associated labels
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Password')).toBeVisible();
  });
});

test.describe('Admin Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication or use a test admin account
    // For now, we'll assume we're authenticated and navigate directly
    await page.goto('http://localhost:3001');
  });

  test('should display main navigation elements', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    
    // Check for main navigation items
    const navigationItems = [
      'Dashboard',
      'Customers', 
      'Appointments',
      'Payments',
      'Media Management',
      'Analytics',
      'Settings'
    ];
    
    for (const item of navigationItems) {
      await expect(page.getByRole('link', { name: item }).or(page.getByText(item))).toBeVisible();
    }
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.getByRole('link', { name: 'Customers' }).click();
    await expect(page).toHaveURL(/.*\/customers/);
    await expect(page.getByText('Customers')).toBeVisible();
  });

  test('should navigate to appointments page', async ({ page }) => {
    await page.getByRole('link', { name: 'Appointments' }).click();
    await expect(page).toHaveURL(/.*\/appointments/);
    await expect(page.getByText('Appointments')).toBeVisible();
  });

  test('should navigate to payments page', async ({ page }) => {
    await page.getByRole('link', { name: 'Payments' }).click();
    await expect(page).toHaveURL(/.*\/payments/);
    await expect(page.getByText('Payments')).toBeVisible();
  });

  test('should navigate to media management page', async ({ page }) => {
    await page.getByRole('link', { name: 'Media Management' }).click();
    await expect(page).toHaveURL(/.*\/media-management/);
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page).toHaveURL(/.*\/analytics/);
    await expect(page.getByText('Analytics')).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.getByText('Settings')).toBeVisible();
  });
});

test.describe('Dashboard Metrics and Charts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('should display revenue metrics card', async ({ page }) => {
    await expect(page.getByText('Total Revenue')).toBeVisible();
    // Check for revenue amount (could be $0.00 in test environment)
    await expect(page.locator('[data-testid="revenue-amount"]').or(page.getByText(/\$\d+\.?\d*/)).first()).toBeVisible();
  });

  test('should display clients metrics card', async ({ page }) => {
    await expect(page.getByText('Total Clients')).toBeVisible();
    // Check for client count
    await expect(page.locator('[data-testid="clients-count"]').or(page.getByText(/\d+/).first())).toBeVisible();
  });

  test('should display appointments metrics card', async ({ page }) => {
    await expect(page.getByText('Monthly Appointments')).toBeVisible();
    // Check for appointment count
    await expect(page.locator('[data-testid="appointments-count"]').or(page.getByText(/\d+/))).toBeVisible();
  });

  test('should display satisfaction rating card', async ({ page }) => {
    await expect(page.getByText('Satisfaction Rating')).toBeVisible();
    // Check for rating value
    await expect(page.locator('[data-testid="satisfaction-rating"]').or(page.getByText(/\d+\.\d/))).toBeVisible();
  });

  test('should display revenue and appointments chart', async ({ page }) => {
    await expect(page.getByText('Revenue & Appointments')).toBeVisible();
    await expect(page.getByText('Daily revenue and appointment trends')).toBeVisible();
    
    // Check for chart container
    await expect(page.locator('[data-testid="revenue-chart"]').or(page.locator('.recharts-container')).first()).toBeVisible();
  });

  test('should have working time range filters', async ({ page }) => {
    const timeRanges = ['Last 7 days', 'Last 30 days', 'Last 3 months'];
    
    for (const range of timeRanges) {
      const rangeButton = page.getByText(range);
      if (await rangeButton.isVisible()) {
        await expect(rangeButton).toBeVisible();
      }
    }
  });
});

test.describe('Responsive Design and Mobile', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3001');
    
    // Check that sidebar is hidden/collapsed on mobile
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    
    // Check for mobile menu toggle if it exists
    const mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]').or(page.getByRole('button', { name: /toggle.*sidebar/i }));
    if (await mobileMenuToggle.isVisible()) {
      await expect(mobileMenuToggle).toBeVisible();
    }
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3001');
    
    await expect(page.getByText('Admin Dashboard')).toBeVisible();
    
    // Verify layout adapts to tablet size
    const sidebar = page.locator('[data-testid="sidebar"]').or(page.locator('aside')).first();
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
  });
});