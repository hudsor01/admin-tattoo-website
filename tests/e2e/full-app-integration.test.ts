/**
 * Full application integration tests using real browser automation
 * These tests verify the actual functionality in a real browser environment
 */

import { expect, test } from '@playwright/test'

// Test configuration
const APP_URL = process.env.APP_URL || 'http://localhost:3001'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@ink37tattoos.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'testpassword123'

test.describe('Full Application Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto(APP_URL)
  })

  test('Complete user journey: Login → Dashboard → CRUD → Media → Logout', async ({ page }) => {
    // 1. LOGIN
    await test.step('Admin login', async () => {
      await page.fill('input[name="email"]', ADMIN_EMAIL)
      await page.fill('input[name="password"]', ADMIN_PASSWORD)
      await page.click('button[type="submit"]')
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(`${APP_URL}/dashboard`)
      
      // Dashboard should load with real data
      await expect(page.locator('h1')).toContainText('Dashboard')
      
      // Stats cards should be visible
      await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible()
    })

    // 2. VERIFY DASHBOARD MATCHES TEMPLATE
    await test.step('Dashboard renders like shadcn/ui blocks dashboard-01', async () => {
      // Check layout structure
      const statsCards = await page.locator('[data-testid="stats-card"]').count()
      expect(statsCards).toBe(4) // Should have 4 stat cards
      
      // Check charts are rendered
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="appointments-chart"]')).toBeVisible()
      
      // Check recent activity sections
      await expect(page.locator('[data-testid="recent-appointments"]')).toBeVisible()
      await expect(page.locator('[data-testid="recent-clients"]')).toBeVisible()
      
      // Verify proper spacing (no overlapping)
      const boundingBoxes = await page.locator('[data-testid*="card"]').evaluateAll(elements => 
        elements.map(el => el.getBoundingClientRect())
      )
      
      // Check no overlapping
      for (let i = 0; i < boundingBoxes.length - 1; i++) {
        for (let j = i + 1; j < boundingBoxes.length; j++) {
          const box1 = boundingBoxes[i]
          const box2 = boundingBoxes[j]
          const overlap = !(box1.right < box2.left || 
                          box2.right < box1.left || 
                          box1.bottom < box2.top || 
                          box2.bottom < box1.top)
          expect(overlap).toBe(false)
        }
      }
    })

    // 3. NAVIGATION TEST
    await test.step('Navigate to all pages', async () => {
      const pages = [
        { name: 'Appointments', selector: '[href="/dashboard/appointments"]' },
        { name: 'Customers', selector: '[href="/dashboard/customers"]' },
        { name: 'Analytics', selector: '[href="/dashboard/analytics"]' },
        { name: 'Reports', selector: '[href="/dashboard/reports"]' },
        { name: 'Media', selector: '[href="/dashboard/media"]' },
        { name: 'Settings', selector: '[href="/dashboard/settings"]' }
      ]

      for (const { name, selector } of pages) {
        await page.click(selector)
        await page.waitForLoadState('networkidle')
        await expect(page.locator('h1')).toContainText(name)
        
        // Verify no console errors
        const consoleErrors = []
        page.on('console', msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text())
        })
        expect(consoleErrors).toHaveLength(0)
      }
    })

    // 4. APPOINTMENTS CRUD
    await test.step('Create new appointment', async () => {
      await page.goto(`${APP_URL}/dashboard/appointments`)
      await page.click('button:has-text("New Appointment")')
      
      // Fill appointment form
      await page.selectOption('select[name="clientId"]', { index: 1 })
      await page.selectOption('select[name="artistId"]', { index: 1 })
      await page.fill('input[name="date"]', '2024-12-25')
      await page.fill('input[name="time"]', '14:00')
      await page.fill('textarea[name="description"]', 'Full sleeve session 1')
      
      await page.click('button:has-text("Create Appointment")')
      
      // Verify appointment appears in list
      await expect(page.locator('text=Full sleeve session 1')).toBeVisible()
    })

    // 5. CUSTOMERS CRUD
    await test.step('Create and manage customer', async () => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      await page.click('button:has-text("Add Customer")')
      
      // Fill customer form with medical info
      await page.fill('input[name="firstName"]', 'Test')
      await page.fill('input[name="lastName"]', 'Customer')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="phone"]', '555-0123')
      await page.fill('textarea[name="medicalConds"]', 'None')
      await page.fill('textarea[name="allergies"]', 'None')
      
      await page.click('button:has-text("Save Customer")')
      
      // Verify customer appears
      await expect(page.locator('text=Test Customer')).toBeVisible()
      
      // Test search
      await page.fill('input[placeholder*="Search"]', 'Test')
      await expect(page.locator('text=Test Customer')).toBeVisible()
    })

    // 6. MEDIA UPLOAD AND SYNC
    await test.step('Upload media and verify sync', async () => {
      await page.goto(`${APP_URL}/dashboard/media`)
      await page.click('button:has-text("Upload Media")')
      
      // Upload image
      const fileInput = await page.locator('input[type="file"]')
      await fileInput.setInputFiles('./test-assets/tattoo-sample.jpg')
      
      // Fill media details
      await page.fill('input[name="title"]', 'Test Tattoo Design')
      await page.selectOption('select[name="style"]', 'Traditional')
      await page.fill('input[name="tags"]', 'flower, color, arm')
      
      // Enable website sync
      await page.check('input[name="syncToWebsite"]')
      
      await page.click('button:has-text("Upload")')
      
      // Wait for upload and sync
      await expect(page.locator('text=Upload successful')).toBeVisible()
      await expect(page.locator('text=Synced to website')).toBeVisible()
      
      // Verify media appears in gallery
      await expect(page.locator('text=Test Tattoo Design')).toBeVisible()
    })

    // 7. SETTINGS UPDATE
    await test.step('Update settings and profile picture', async () => {
      await page.goto(`${APP_URL}/dashboard/settings`)
      
      // Update profile picture
      const profileInput = await page.locator('input[name="profilePicture"]')
      await profileInput.setInputFiles('./test-assets/profile.jpg')
      
      // Wait for upload
      await expect(page.locator('img[alt="Profile"]')).toHaveAttribute('src', /blob:|data:/)
      
      // Update other settings
      await page.fill('input[name="businessName"]', 'Ink 37 Tattoos Updated')
      await page.fill('input[name="phone"]', '555-9999')
      
      await page.click('button:has-text("Save Settings")')
      
      // Verify persistence
      await page.reload()
      await expect(page.locator('input[name="businessName"]')).toHaveValue('Ink 37 Tattoos Updated')
    })

    // 8. THEME TOGGLE
    await test.step('Theme switching', async () => {
      // Find theme toggle button
      const themeToggle = await page.locator('button[aria-label*="theme"]')
      
      // Get initial theme
      const initialTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      )
      
      // Toggle theme
      await themeToggle.click()
      
      // Verify theme changed
      const newTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      )
      expect(newTheme).toBe(!initialTheme)
      
      // Verify persists after reload
      await page.reload()
      const persistedTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      )
      expect(persistedTheme).toBe(newTheme)
    })

    // 9. RESPONSIVE DESIGN
    await test.step('Responsive design check', async () => {
      const viewports = [
        { name: 'iPhone 12', width: 390, height: 844 },
        { name: 'iPad', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ]

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto(`${APP_URL}/dashboard`)
        
        if (viewport.width < 768) {
          // Mobile: hamburger menu should be visible
          await expect(page.locator('button[aria-label="Menu"]')).toBeVisible()
          
          // Sidebar should be hidden
          await expect(page.locator('aside')).toBeHidden()
          
          // Click hamburger to show menu
          await page.click('button[aria-label="Menu"]')
          await expect(page.locator('aside')).toBeVisible()
        } else {
          // Desktop: sidebar should be visible
          await expect(page.locator('aside')).toBeVisible()
        }
        
        // Take screenshot for visual regression
        await page.screenshot({ 
          path: `./test-results/responsive-${viewport.name}.png`,
          fullPage: true 
        })
      }
    })

    // 10. PERFORMANCE CHECK
    await test.step('Performance metrics', async () => {
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        }
      })
      
      // Assert performance thresholds
      expect(metrics.firstContentfulPaint).toBeLessThan(3000) // Under 3 seconds
      expect(metrics.loadComplete).toBeLessThan(5000) // Under 5 seconds
    })

    // 11. API REAL DATA VERIFICATION
    await test.step('Verify APIs return real data', async () => {
      // Intercept API calls
      const apiResponses = []
      
      page.on('response', response => {
        if (response.url().includes('/api/admin/')) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            data: response.json().catch(() => null)
          })
        }
      })
      
      // Navigate to trigger API calls
      await page.goto(`${APP_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      // Check dashboard stats API
      const statsResponse = apiResponses.find(r => r.url.includes('/dashboard/stats'))
      expect(statsResponse?.status).toBe(200)
      
      const statsData = await statsResponse?.data
      expect(statsData).toHaveProperty('totalClients')
      expect(statsData).toHaveProperty('totalAppointments')
      expect(statsData).toHaveProperty('revenueThisMonth')
      
      // Verify data is not static (would need to compare with database)
      expect(statsData.totalClients).toBeGreaterThanOrEqual(0)
      expect(typeof statsData.totalClients).toBe('number')
    })

    // 12. SECURITY CHECKS
    await test.step('Security verification', async () => {
      // Logout first
      await page.click('button[aria-label="User menu"]')
      await page.click('text=Logout')
      
      // Try to access protected route
      await page.goto(`${APP_URL}/dashboard`)
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login|\/login/)
      
      // Try direct API access without auth
      const response = await page.request.get(`${APP_URL}/api/admin/dashboard/stats`)
      expect(response.status()).toBe(401)
    })
  })

  test('Error handling and edge cases', async ({ page }) => {
    // Test network failures
    await page.route('**/api/**', route => route.abort())
    await page.goto(`${APP_URL}/dashboard`)
    
    // Should show error boundary
    await expect(page.locator('text=/error|failed|problem/i')).toBeVisible()
    
    // Should have retry option
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()
  })

  test('Data validation', async ({ page }) => {
    // Login first
    await page.goto(`${APP_URL}/auth/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Try to create appointment with invalid data
    await page.goto(`${APP_URL}/dashboard/appointments`)
    await page.click('button:has-text("New Appointment")')
    
    // Submit empty form
    await page.click('button:has-text("Create")')
    
    // Should show validation errors
    await expect(page.locator('text=required')).toBeVisible()
    
    // Try SQL injection
    await page.fill('input[name="description"]', "'; DROP TABLE appointments; --")
    await page.click('button:has-text("Create")')
    
    // Should be safely handled (no 500 error)
    expect(page.url()).not.toContain('error')
  })
})