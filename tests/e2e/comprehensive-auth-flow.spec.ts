import { test, expect, Page } from '@playwright/test';

// Test data
const ADMIN_USER = {
  email: 'admin@ink37tattoos.com',
  password: 'AdminPassword123!',
  name: 'Admin User'
};

const REGULAR_USER = {
  email: 'user@example.com',
  password: 'UserPassword123!',
  name: 'Regular User'
};

// Helper functions
async function loginUser(page: Page, email: string, password: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

async function logout(page: Page) {
  // Look for logout button in navigation or dropdown
  const logoutButton = page.locator('button:has-text("Sign Out"), [data-testid="logout-button"]').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    
    // Handle confirmation dialog if present
    const confirmButton = page.locator('button:has-text("Sign Out")').last();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
  }
}

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test.describe('Login Process', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access dashboard directly
      await page.goto('/dashboard');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('h1:has-text("Login to your account")')).toBeVisible();
    });

    test('should display login form correctly', async ({ page }) => {
      await page.goto('/login');
      
      // Check login form elements
      await expect(page.locator('h1:has-text("Login to your account")')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('text=Need admin access?')).toBeVisible();
      await expect(page.locator('a[href="mailto:admin@ink37tattoos.com"]')).toBeVisible();
    });

    test('should show validation errors for invalid login', async ({ page }) => {
      await page.goto('/login');
      
      // Try to login with empty fields
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('text=required', { timeout: 5000 })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Try to login with invalid credentials
      await loginUser(page, 'invalid@example.com', 'wrongpassword');
      
      // Should show error message
      await expect(page.locator('text=Invalid credentials, text=Invalid email or password', { timeout: 5000 })).toBeVisible();
    });

    test('should successfully login admin user', async ({ page }) => {
      await page.goto('/login');
      
      // Mock successful admin login
      await page.route('/api/auth/**', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                user: {
                  id: '1',
                  email: ADMIN_USER.email,
                  name: ADMIN_USER.name,
                  role: 'admin'
                },
                session: {
                  id: 'session-1',
                  token: 'mock-token'
                }
              }
            })
          });
        } else {
          await route.continue();
        }
      });
      
      await loginUser(page, ADMIN_USER.email, ADMIN_USER.password);
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('text=Dashboard, text=Overview')).toBeVisible({ timeout: 10000 });
    });

    test('should deny access for non-admin users', async ({ page }) => {
      await page.goto('/login');
      
      // Mock regular user login
      await page.route('/api/auth/**', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                user: {
                  id: '2',
                  email: REGULAR_USER.email,
                  name: REGULAR_USER.name,
                  role: 'user'
                },
                session: {
                  id: 'session-2',
                  token: 'mock-token-user'
                }
              }
            })
          });
        } else {
          await route.continue();
        }
      });
      
      await loginUser(page, REGULAR_USER.email, REGULAR_USER.password);
      
      // Try to access dashboard
      await page.goto('/dashboard');
      
      // Should show access denied
      await expect(page.locator('text=Access Denied')).toBeVisible();
      await expect(page.locator('text=You need admin permissions')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // Mock authenticated session
      await page.route('/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: '1',
                email: ADMIN_USER.email,
                name: ADMIN_USER.name,
                role: 'admin'
              },
              session: {
                id: 'session-1',
                token: 'mock-token'
              }
            }
          })
        });
      });
      
      await page.goto('/dashboard');
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Refresh the page
      await page.reload();
      
      // Should still be authenticated
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should handle session expiration', async ({ page }) => {
      // First, mock valid session
      await page.route('/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: '1',
                email: ADMIN_USER.email,
                name: ADMIN_USER.name,
                role: 'admin'
              }
            }
          })
        });
      });
      
      await page.goto('/dashboard');
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Then mock expired session
      await page.route('/api/auth/**', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Session expired'
          })
        });
      });
      
      // Try to navigate or refresh
      await page.reload();
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Logout Process', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authenticated admin session for logout tests
      await page.route('/api/auth/**', async (route) => {
        const url = route.request().url();
        if (url.includes('get-session')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                user: {
                  id: '1',
                  email: ADMIN_USER.email,
                  name: ADMIN_USER.name,
                  role: 'admin'
                },
                session: {
                  id: 'session-1',
                  token: 'mock-token'
                }
              }
            })
          });
        } else if (url.includes('sign-out')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        } else {
          await route.continue();
        }
      });
      
      await page.goto('/dashboard');
    });

    test('should successfully logout user', async ({ page }) => {
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Look for user menu or logout button
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Admin User"), button:has-text("Sign Out")').first();
      
      if (await userMenu.isVisible()) {
        await userMenu.click();
        
        // If it's a dropdown menu, look for logout option
        const logoutOption = page.locator('button:has-text("Sign Out"), [data-testid="logout-button"]').last();
        if (await logoutOption.isVisible()) {
          await logoutOption.click();
        }
      }
      
      // Handle confirmation dialog if present
      const confirmLogout = page.locator('button:has-text("Sign Out")').last();
      if (await confirmLogout.isVisible()) {
        await confirmLogout.click();
      }
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('h1:has-text("Login to your account")')).toBeVisible();
    });

    test('should clear user data after logout', async ({ page }) => {
      await expect(page.locator('text=Dashboard')).toBeVisible();
      
      // Logout
      await logout(page);
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should be redirected to login (session cleared)
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Navigation Protection', () => {
    test('should protect all dashboard routes', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/dashboard/analytics',
        '/dashboard/appointments',
        '/dashboard/customers',
        '/dashboard/media-management',
        '/dashboard/reports',
        '/dashboard/settings'
      ];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        
        // Should redirect to login
        await expect(page).toHaveURL(/\/login/);
        await expect(page.locator('h1:has-text("Login to your account")')).toBeVisible();
      }
    });

    test('should allow access to dashboard routes for admin users', async ({ page }) => {
      // Mock authenticated admin session
      await page.route('/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: '1',
                email: ADMIN_USER.email,
                name: ADMIN_USER.name,
                role: 'admin'
              },
              session: {
                id: 'session-1',
                token: 'mock-token'
              }
            }
          })
        });
      });
      
      const allowedRoutes = [
        { path: '/dashboard', text: 'Dashboard' },
        { path: '/dashboard/analytics', text: 'Analytics' },
        { path: '/dashboard/appointments', text: 'Appointments' },
        { path: '/dashboard/customers', text: 'Customers' },
        { path: '/dashboard/media-management', text: 'Media' },
        { path: '/dashboard/settings', text: 'Settings' }
      ];
      
      for (const route of allowedRoutes) {
        await page.goto(route.path);
        
        // Should access the page successfully
        await expect(page).toHaveURL(route.path);
        // Check for common dashboard elements
        await expect(page.locator('nav, [data-testid="sidebar"], text=Dashboard')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors during login', async ({ page }) => {
      await page.goto('/login');
      
      // Mock network error
      await page.route('/api/auth/**', async (route) => {
        await route.abort('failed');
      });
      
      await loginUser(page, ADMIN_USER.email, ADMIN_USER.password);
      
      // Should show error message
      await expect(page.locator('text=network error, text=connection failed, text=try again')).toBeVisible({ timeout: 5000 });
    });

    test('should handle server errors during login', async ({ page }) => {
      await page.goto('/login');
      
      // Mock server error
      await page.route('/api/auth/**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        });
      });
      
      await loginUser(page, ADMIN_USER.email, ADMIN_USER.password);
      
      // Should show error message
      await expect(page.locator('text=server error, text=something went wrong, text=try again')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Form Validation', () => {
    test('should validate email format', async ({ page }) => {
      await page.goto('/login');
      
      // Enter invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show email validation error
      await expect(page.locator('text=valid email, text=email format')).toBeVisible({ timeout: 5000 });
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/login');
      
      // Submit without filling fields
      await page.click('button[type="submit"]');
      
      // Should show required field errors
      await expect(page.locator('text=required, text=Please enter')).toBeVisible({ timeout: 5000 });
    });

    test('should validate password length', async ({ page }) => {
      await page.goto('/login');
      
      // Enter short password
      await page.fill('input[type="email"]', 'user@example.com');
      await page.fill('input[type="password"]', '123');
      await page.click('button[type="submit"]');
      
      // Should show password validation error
      await expect(page.locator('text=password must be, text=at least')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels and ARIA attributes', async ({ page }) => {
      await page.goto('/login');
      
      // Check for proper form labels
      await expect(page.locator('label[for="email"], input[aria-label*="email"]')).toBeVisible();
      await expect(page.locator('label[for="password"], input[aria-label*="password"]')).toBeVisible();
      
      // Check for proper button text
      await expect(page.locator('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")')).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Focus email field
      await expect(page.locator('input[type="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Focus password field
      await expect(page.locator('input[type="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab'); // Focus submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });
  });
});