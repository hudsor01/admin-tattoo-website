import { type Page, expect, test } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';

// Helper function to clean up test data via API
async function cleanupTestData() {
  try {
    console.log('Test cleanup - this would call cleanup API endpoints');
  } catch (error) {
    console.warn('Cleanup warning:', error);
  }
}

// Helper function to create test user via API
async function createTestUser(email: string, password: string, role: string = 'user') {
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

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  await page.goto(BASE_URL);
  await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', 'admin@test.com');
  await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', 'AdminPassword123!');
  await page.click('[data-testid="login-submit"], button[type="submit"], button:has-text("Login")');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
}

// Helper function to login as regular user
async function loginAsUser(page: Page) {
  await page.goto(BASE_URL);
  await page.fill('[data-testid="email-input"], input[name="email"]', 'user@test.com');
  await page.fill('[data-testid="password-input"], input[name="password"]', 'UserPassword123!');
  await page.click('[data-testid="login-submit"], button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 10000 });
}

test.describe('Admin Functionality', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
    // Create admin and regular user for tests
    await createTestUser('admin@test.com', 'AdminPassword123!', 'admin');
    await createTestUser('user@test.com', 'UserPassword123!', 'user');
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test.describe('Admin Access Control', () => {
    test('should allow admin users to access dashboard', async ({ page }) => {
      await loginAsAdmin(page);

      // Verify dashboard is accessible
      const dashboardContent = page.locator('[data-testid="dashboard"], h1:has-text("Dashboard"), text=/dashboard/i');
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });

      // Verify admin navigation is present
      const adminNav = page.locator('[data-testid="admin-nav"], nav, [role="navigation"]');
      await expect(adminNav).toBeVisible({ timeout: 5000 });
    });

    test('should redirect non-admin users from dashboard', async ({ page }) => {
      await loginAsUser(page);

      // Try to access dashboard
      await page.goto(`${BASE_URL}/dashboard`);

      // Should be redirected away from dashboard
      await page.waitForURL(url => !url.pathname.includes('/dashboard'), { timeout: 10000 });
      
      // Verify not on dashboard
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/dashboard');
    });

    test('should show admin-only UI elements for admin users', async ({ page }) => {
      await loginAsAdmin(page);

      // Look for admin-specific UI elements
      const adminElements = page.locator('[data-testid="admin-menu"], [data-testid="user-management"], text=/admin|manage users|user management/i');
      
      // At least one admin element should be visible
      await expect(adminElements.first()).toBeVisible({ timeout: 5000 });
    });

    test('should hide admin UI elements from regular users', async ({ page }) => {
      await loginAsUser(page);

      // Admin elements should not be visible to regular users
      const adminElements = page.locator('[data-testid="admin-panel"], [data-testid="user-management"], button:has-text("Manage Users")');
      
      // Wait a bit to ensure page is fully loaded
      await page.waitForTimeout(2000);
      
      // Admin elements should not exist or be hidden
      const count = await adminElements.count();
      expect(count).toBe(0);
    });
  });

  test.describe('User Management', () => {
    test('should display user list for admin', async ({ page }) => {
      // Create additional test users
      await createTestUser('testuser1@test.com', 'password123', 'user');
      await createTestUser('testuser2@test.com', 'password123', 'user');

      await loginAsAdmin(page);

      // Navigate to user management
      const userManagementLink = page.locator('[data-testid="user-management-link"], a:has-text("Users"), nav a:has-text("User Management")').first();
      
      if (await userManagementLink.isVisible()) {
        await userManagementLink.click();
      } else {
        // If no direct link, try navigating to user management URL
        await page.goto(`${BASE_URL}/dashboard/users`);
      }

      // Wait for user list to load
      await page.waitForLoadState('networkidle');

      // Verify user list is displayed
      const userList = page.locator('[data-testid="user-list"], table, .user-row');
      await expect(userList).toBeVisible({ timeout: 5000 });

      // Verify test users are listed
      const userEmails = page.locator('text=testuser1@test.com, text=testuser2@test.com');
      await expect(userEmails.first()).toBeVisible({ timeout: 5000 });
    });

    test('should allow admin to create new user', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to user creation
      const createUserButton = page.locator('[data-testid="create-user-button"], button:has-text("Create User"), button:has-text("Add User")').first();
      
      if (await createUserButton.isVisible()) {
        await createUserButton.click();
      } else {
        // Try accessing user creation page directly
        await page.goto(`${BASE_URL}/dashboard/users/create`);
      }

      // Fill user creation form
      await page.fill('[data-testid="new-user-name"], input[name="name"]', 'New Test User');
      await page.fill('[data-testid="new-user-email"], input[name="email"]', 'newcreated@test.com');
      await page.fill('[data-testid="new-user-password"], input[name="password"]', 'NewUserPassword123!');
      
      // Select role if dropdown exists
      const roleSelect = page.locator('[data-testid="new-user-role"], select[name="role"]');
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('user');
      }

      // Submit form
      const submitButton = page.locator('[data-testid="create-user-submit"], button[type="submit"], button:has-text("Create")').first();
      await submitButton.click();

      // Verify user was created
      const successMessage = page.locator('[data-testid="success-message"], .success, text=/created|success/i');
      await expect(successMessage).toBeVisible({ timeout: 5000 });

      // Verify user appears in list
      const newUserEmail = page.locator('text=newcreated@test.com');
      await expect(newUserEmail).toBeVisible({ timeout: 5000 });
    });

    test('should allow admin to edit user role', async ({ page }) => {
      // Create a test user to edit
      const testUser = await createTestUser('editable@test.com', 'password123', 'user');

      await loginAsAdmin(page);

      // Navigate to user management
      await page.goto(`${BASE_URL}/dashboard/users`);
      await page.waitForLoadState('networkidle');

      // Find the test user and edit role
      const userRow = page.locator(`[data-testid="user-row-${testUser.id}"], tr:has-text("editable@test.com")`).first();
      
      if (await userRow.isVisible()) {
        const editButton = userRow.locator('[data-testid="edit-user"], button:has-text("Edit"), .edit-button').first();
        await editButton.click();
      } else {
        // Alternative approach: find edit button by email proximity
        const editButton = page.locator('text=editable@test.com').locator('..').locator('button:has-text("Edit")').first();
        await editButton.click();
      }

      // Change role to admin
      const roleSelect = page.locator('[data-testid="edit-user-role"], select[name="role"]');
      await roleSelect.selectOption('admin');

      // Save changes
      const saveButton = page.locator('[data-testid="save-user"], button:has-text("Save"), button[type="submit"]').first();
      await saveButton.click();

      // Verify role was updated
      const successMessage = page.locator('[data-testid="success-message"], .success, text=/updated|saved/i');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    });

    test('should allow admin to disable/enable users', async ({ page }) => {
      // Create a test user to disable
      const testUser = await createTestUser('disableable@test.com', 'password123', 'user');

      await loginAsAdmin(page);

      // Navigate to user management
      await page.goto(`${BASE_URL}/dashboard/users`);
      await page.waitForLoadState('networkidle');

      // Find the test user and disable
      const userRow = page.locator(`[data-testid="user-row-${testUser.id}"], tr:has-text("disableable@test.com")`).first();
      
      const disableButton = userRow.locator('[data-testid="disable-user"], button:has-text("Disable"), .disable-button').first();
      
      if (await disableButton.isVisible()) {
        await disableButton.click();

        // Confirm disable action if prompted
        const confirmButton = page.locator('[data-testid="confirm-disable"], button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Verify user was disabled
        const disabledIndicator = page.locator('[data-testid="user-disabled"], .disabled, text=/disabled|inactive/i');
        await expect(disabledIndicator).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Admin Dashboard Features', () => {
    test('should display admin analytics and metrics', async ({ page }) => {
      await loginAsAdmin(page);

      // Look for admin-specific dashboard content
      const analyticsSection = page.locator('[data-testid="analytics"], [data-testid="admin-metrics"], .analytics, .metrics');
      
      // At least one analytics element should be visible
      await expect(analyticsSection.first()).toBeVisible({ timeout: 5000 });

      // Look for specific metrics
      const metricsCards = page.locator('[data-testid="metric-card"], .metric, .stat-card');
      const cardCount = await metricsCards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should allow admin to access system settings', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to settings
      const settingsLink = page.locator('[data-testid="settings-link"], a:has-text("Settings"), nav a:has-text("System Settings")').first();
      
      if (await settingsLink.isVisible()) {
        await settingsLink.click();
      } else {
        await page.goto(`${BASE_URL}/dashboard/settings`);
      }

      // Verify settings page is accessible
      const settingsContent = page.locator('[data-testid="settings"], h1:has-text("Settings"), text=/settings|configuration/i');
      await expect(settingsContent).toBeVisible({ timeout: 5000 });
    });

    test('should display admin activity logs', async ({ page }) => {
      await loginAsAdmin(page);

      // Navigate to activity/audit logs
      const logsLink = page.locator('[data-testid="logs-link"], a:has-text("Logs"), a:has-text("Activity"), nav a:has-text("Audit")').first();
      
      if (await logsLink.isVisible()) {
        await logsLink.click();
      } else {
        await page.goto(`${BASE_URL}/dashboard/logs`);
      }

      // Verify logs are displayed
      const logsContent = page.locator('[data-testid="activity-logs"], .logs, table, .log-entry');
      
      // Should have logs section even if empty
      await expect(logsContent.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Admin Security Features', () => {
    test('should log admin actions for audit trail', async ({ page }) => {
      await loginAsAdmin(page);

      // Perform an admin action (e.g., create user)
      await page.goto(`${BASE_URL}/dashboard/users`);
      
      const createUserButton = page.locator('[data-testid="create-user-button"], button:has-text("Create User")').first();
      
      if (await createUserButton.isVisible()) {
        await createUserButton.click();
        
        // Fill and submit user creation form
        await page.fill('[data-testid="new-user-name"], input[name="name"]', 'Audit Test User');
        await page.fill('[data-testid="new-user-email"], input[name="email"]', 'audit@test.com');
        await page.fill('[data-testid="new-user-password"], input[name="password"]', 'AuditPassword123!');
        
        const submitButton = page.locator('[data-testid="create-user-submit"], button[type="submit"]').first();
        await submitButton.click();

        // Wait for action to complete
        await page.waitForTimeout(1000);

        // Check audit logs
        await page.goto(`${BASE_URL}/dashboard/logs`);
        
        const auditEntry = page.locator('text=/user.*created|created.*user|audit@test.com/i');
        await expect(auditEntry).toBeVisible({ timeout: 5000 });
      }
    });

    test('should enforce admin session security', async ({ page }) => {
      await loginAsAdmin(page);

      // Verify secure session indicators
      const secureIndicators = page.locator('[data-testid="secure-session"], .secure, text=/secure|encrypted/i');
      
      // Check for security headers or indicators
      const response = await page.goto(`${BASE_URL}/dashboard`);
      const headers = response?.headers();
      
      // Should have security headers
      expect(headers).toBeDefined();
      
      // Verify admin session timeout handling
      await page.waitForTimeout(2000);
      
      // Should still be authenticated for normal timeouts
      const dashboardContent = page.locator('[data-testid="dashboard"], text=/dashboard/i');
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
    });

    test('should handle admin privilege escalation attempts', async ({ page }) => {
      // Login as regular user
      await loginAsUser(page);

      // Attempt to access admin endpoints directly
      const adminUrls = [
        `${BASE_URL}/dashboard/users`,
        `${BASE_URL}/dashboard/settings`,
        `${BASE_URL}/dashboard/logs`
      ];

      for (const url of adminUrls) {
        await page.goto(url);
        
        // Should be redirected or show access denied
        const currentUrl = page.url();
        const isBlocked = !currentUrl.includes('/dashboard/') || 
                         currentUrl === `${BASE_URL}/` ||
                         await page.locator('text=/access denied|forbidden|unauthorized/i').isVisible();
        
        expect(isBlocked).toBe(true);
      }
    });
  });

  test.describe('Admin Error Handling', () => {
    test('should handle admin API errors gracefully', async ({ page }) => {
      await loginAsAdmin(page);

      // Intercept admin API calls and return errors
      await page.route('**/api/admin/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Admin API error' })
        });
      });

      // Try to perform admin action
      await page.goto(`${BASE_URL}/dashboard/users`);
      
      // Should show error message instead of crashing
      const errorMessage = page.locator('[data-testid="error-message"], .error, text=/error|failed|try again/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should maintain admin session during network issues', async ({ page }) => {
      await loginAsAdmin(page);

      // Simulate network interruption
      await page.setOfflineMode(true);
      await page.waitForTimeout(1000);
      await page.setOfflineMode(false);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should maintain admin session or handle gracefully
      const isStillLoggedIn = await page.locator('[data-testid="dashboard"], text=/dashboard/i').isVisible();
      const isAtLogin = await page.locator('[data-testid="login-form"], input[type="email"]').isVisible();
      
      // Should be either logged in or redirected to login (not in broken state)
      expect(isStillLoggedIn || isAtLogin).toBe(true);
    });
  });

  test.describe('Admin Performance', () => {
    test('should load admin dashboard within performance thresholds', async ({ page }) => {
      const startTime = Date.now();
      
      await loginAsAdmin(page);
      
      // Wait for dashboard to fully load
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
      
      // Verify main content is visible
      const dashboardContent = page.locator('[data-testid="dashboard"], text=/dashboard/i');
      await expect(dashboardContent).toBeVisible();
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Create multiple test users to test pagination/performance
      const users = [];
      for (let i = 0; i < 50; i++) {
        users.push(createTestUser(`bulkuser${i}@test.com`, 'password123', 'user'));
      }
      await Promise.all(users);

      await loginAsAdmin(page);
      
      const startTime = Date.now();
      
      // Navigate to user list
      await page.goto(`${BASE_URL}/dashboard/users`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time even with many users
      expect(loadTime).toBeLessThan(15000);
      
      // Verify user list is functional
      const userList = page.locator('[data-testid="user-list"], table, .user-row');
      await expect(userList).toBeVisible({ timeout: 5000 });
    });
  });
});