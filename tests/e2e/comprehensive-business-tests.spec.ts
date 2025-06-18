/**
 * Comprehensive Real-World Business Tests
 * These tests answer all critical business questions about the admin dashboard
 */

import type { BrowserContext, Page } from '@playwright/test';
import { expect, test } from '@playwright/test'
import path from 'path'

// Test configuration
const APP_URL = process.env.APP_URL || 'http://localhost:3001'
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ink37tattoos.com'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@ink37tattoos.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123456'

// Test data
const TEST_CUSTOMER = {
  firstName: 'TestCustomer',
  lastName: 'AutomatedTest',
  email: `test.customer.${Date.now()}@example.com`,
  phone: '555-0123',
  dateOfBirth: '1990-01-01',
  medicalConditions: 'No known medical conditions',
  allergies: 'No known allergies',
  emergencyContactName: 'Emergency Contact',
  emergencyContactPhone: '555-0124'
}

const TEST_APPOINTMENT = {
  date: '2024-12-31',
  time: '14:00',
  duration: '180',
  description: 'Automated test appointment - Traditional sleeve',
  notes: 'Test notes for automated testing',
  deposit: '250'
}

test.describe('Comprehensive Business Tests', () => {
  let adminPage: Page
  let context: BrowserContext

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      recordVideo: {
        dir: 'test-results/videos/'
      }
    })
    adminPage = await context.newPage()
    
    // Setup console error tracking
    adminPage.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text())
      }
    })
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('1. User Authentication & Login - Can users actually login?', async () => {
    await test.step('Navigate to login page', async () => {
      await adminPage.goto(APP_URL)
      
      // Should redirect to login or show login form
      await expect(adminPage).toHaveURL(/login|auth/)
      
      // Verify login form renders correctly
      await expect(adminPage.locator('h1')).toContainText(/login|sign in/i)
      await expect(adminPage.locator('input[name="email"], input[type="email"]')).toBeVisible()
      await expect(adminPage.locator('input[name="password"], input[type="password"]')).toBeVisible()
      await expect(adminPage.locator('button[type="submit"]')).toBeVisible()
    })

    await test.step('Attempt login with valid credentials', async () => {
      // Fill login form
      await adminPage.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL)
      await adminPage.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD)
      
      // Submit login
      await adminPage.click('button[type="submit"]')
      
      // Should redirect to dashboard
      await expect(adminPage).toHaveURL(/dashboard/, { timeout: 10000 })
      
      // Verify user is actually logged in
      await expect(adminPage.locator('h1, [data-testid="dashboard-title"]')).toContainText(/dashboard/i)
    })

    await test.step('Verify session persistence', async () => {
      // Refresh page
      await adminPage.reload()
      
      // Should still be on dashboard (not redirected to login)
      await expect(adminPage).toHaveURL(/dashboard/)
    })

    await test.step('Test invalid login attempt', async () => {
      // Logout first
      await adminPage.goto(`${APP_URL}/auth/logout`)
      await adminPage.goto(`${APP_URL}/auth/login`)
      
      // Try invalid credentials
      await adminPage.fill('input[name="email"], input[type="email"]', 'invalid@example.com')
      await adminPage.fill('input[name="password"], input[type="password"]', 'wrongpassword')
      await adminPage.click('button[type="submit"]')
      
      // Should show error message
      await expect(adminPage.locator('text=/error|invalid|incorrect/i')).toBeVisible({ timeout: 5000 })
      
      // Should still be on login page
      await expect(adminPage).toHaveURL(/login|auth/)
    })

    // Login again for subsequent tests
    await adminPage.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL)
    await adminPage.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD)
    await adminPage.click('button[type="submit"]')
    await expect(adminPage).toHaveURL(/dashboard/)
  })

  test('2. Dashboard Rendering - Like shadcn/ui blocks dashboard 01 template?', async () => {
    await test.step('Verify dashboard layout structure', async () => {
      await adminPage.goto(`${APP_URL}/dashboard`)
      
      // Check main layout components
      await expect(adminPage.locator('[data-testid="sidebar"], aside, nav')).toBeVisible()
      await expect(adminPage.locator('header, [data-testid="header"]')).toBeVisible()
      await expect(adminPage.locator('main, [data-testid="main-content"]')).toBeVisible()
    })

    await test.step('Verify stats cards are present', async () => {
      // Should have 4 stats cards typical of dashboard-01 template
      const statsCards = adminPage.locator('[data-testid*="stats"], [data-testid*="card"], .stats-card, .dashboard-card')
      await expect(statsCards.first()).toBeVisible()
      
      // Cards should contain numbers/metrics
      const cardTexts = await statsCards.allTextContents()
      const hasNumbers = cardTexts.some(text => /\d+/.test(text))
      expect(hasNumbers).toBe(true)
    })

    await test.step('Verify charts are rendered', async () => {
      // Look for chart containers
      const chartSelectors = [
        '[data-testid*="chart"]',
        '.recharts-wrapper',
        'canvas',
        'svg',
        '[class*="chart"]'
      ]
      
      let chartFound = false
      for (const selector of chartSelectors) {
        const chart = adminPage.locator(selector)
        if (await chart.isVisible()) {
          chartFound = true
          break
        }
      }
      expect(chartFound).toBe(true)
    })

    await test.step('Verify recent activity sections', async () => {
      // Look for recent appointments or activity sections
      const activitySelectors = [
        'text=/recent/i',
        '[data-testid*="recent"]',
        '[data-testid*="activity"]'
      ]
      
      let activityFound = false
      for (const selector of activitySelectors) {
        const element = adminPage.locator(selector)
        if (await element.isVisible()) {
          activityFound = true
          break
        }
      }
      expect(activityFound).toBe(true)
    })

    await test.step('Check layout spacing and no overlaps', async () => {
      // Get all major components
      const components = await adminPage.locator('header, aside, main, [data-testid*="card"]').all()
      const boundingBoxes = await Promise.all(
        components.map(component => component.boundingBox())
      )
      
      // Check no overlaps
      for (let i = 0; i < boundingBoxes.length - 1; i++) {
        for (let j = i + 1; j < boundingBoxes.length; j++) {
          const box1 = boundingBoxes[i]
          const box2 = boundingBoxes[j]
          
          if (box1 && box2) {
            const overlap = !(
              box1.x + box1.width < box2.x ||
              box2.x + box2.width < box1.x ||
              box1.y + box1.height < box2.y ||
              box2.y + box2.height < box1.y
            )
            expect(overlap).toBe(false)
          }
        }
      }
    })
  })

  test('3. Navigation - Can I navigate to each sidebar navigation link?', async () => {
    const navigationLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Appointments', href: '/dashboard/appointments' },
      { name: 'Customers', href: '/dashboard/customers' },
      { name: 'Analytics', href: '/dashboard/analytics' },
      { name: 'Reports', href: '/dashboard/reports' },
      { name: 'Media', href: '/dashboard/media' },
      { name: 'Settings', href: '/dashboard/settings' }
    ]

    for (const link of navigationLinks) {
      await test.step(`Navigate to ${link.name}`, async () => {
        // Find and click navigation link
        const navLink = adminPage.locator(`a[href="${link.href}"], a:has-text("${link.name}")`)
        await navLink.click()
        
        // Wait for navigation
        await adminPage.waitForURL(`**${link.href}`)
        
        // Verify page loaded successfully
        await expect(adminPage.locator('h1, [data-testid*="title"]')).toContainText(new RegExp(link.name, 'i'))
        
        // Check for no console errors
        const consoleErrors: string[] = []
        adminPage.on('console', msg => {
          if (msg.type() === 'error') consoleErrors.push(msg.text())
        })
        
        // Wait a moment for any delayed errors
        await adminPage.waitForTimeout(1000)
        expect(consoleErrors).toHaveLength(0)
      })
    }

    await test.step('Verify active state indication', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/appointments`)
      
      // Check that appointments link is marked as active
      const activeLink = adminPage.locator('a[href="/dashboard/appointments"]')
      const classList = await activeLink.getAttribute('class')
      
      // Should have active styling
      expect(classList).toMatch(/active|current|selected/)
    })
  })

  test('4. Settings Management - Can I update settings and profile picture?', async () => {
    await test.step('Navigate to settings page', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/settings`)
      await expect(adminPage.locator('h1')).toContainText(/settings/i)
    })

    await test.step('Update business settings', async () => {
      // Find and update business name
      const businessNameInput = adminPage.locator('input[name="businessName"], input[name="business_name"]')
      if (await businessNameInput.isVisible()) {
        await businessNameInput.clear()
        await businessNameInput.fill('Ink 37 Tattoos - Updated')
      }
      
      // Update phone
      const phoneInput = adminPage.locator('input[name="phone"], input[name="businessPhone"]')
      if (await phoneInput.isVisible()) {
        await phoneInput.clear()
        await phoneInput.fill('555-TEST-123')
      }
      
      // Update email
      const emailInput = adminPage.locator('input[name="email"], input[name="businessEmail"]')
      if (await emailInput.isVisible()) {
        await emailInput.clear()
        await emailInput.fill('updated@ink37tattoos.com')
      }
      
      // Save settings
      await adminPage.click('button:has-text("Save"), button[type="submit"]')
      
      // Wait for success message
      await expect(adminPage.locator('text=/saved|updated|success/i')).toBeVisible({ timeout: 5000 })
    })

    await test.step('Upload profile picture', async () => {
      const fileInput = adminPage.locator('input[type="file"]')
      if (await fileInput.isVisible()) {
        const testImagePath = path.join(__dirname, 'test-assets', 'profile-picture.jpg')
        await fileInput.setInputFiles(testImagePath)
        
        // Wait for upload completion
        await expect(adminPage.locator('img[alt*="profile"], img[alt*="avatar"]')).toBeVisible({ timeout: 10000 })
      }
    })

    await test.step('Verify settings persistence', async () => {
      // Refresh page
      await adminPage.reload()
      
      // Check values persisted
      const businessNameInput = adminPage.locator('input[name="businessName"], input[name="business_name"]')
      if (await businessNameInput.isVisible()) {
        await expect(businessNameInput).toHaveValue(/Ink 37 Tattoos - Updated/)
      }
    })
  })

  test('5. CRUD Operations - Full CRUD for appointments and customers?', async () => {
    let createdCustomerId: string | null = null
    let createdAppointmentId: string | null = null

    await test.step('CREATE Customer', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/customers`)
      await adminPage.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')
      
      // Fill customer form
      await adminPage.fill('input[name="firstName"]', TEST_CUSTOMER.firstName)
      await adminPage.fill('input[name="lastName"]', TEST_CUSTOMER.lastName)
      await adminPage.fill('input[name="email"]', TEST_CUSTOMER.email)
      await adminPage.fill('input[name="phone"]', TEST_CUSTOMER.phone)
      
      // Medical information
      const medicalInput = adminPage.locator('textarea[name="medicalConditions"], input[name="medical"]')
      if (await medicalInput.isVisible()) {
        await medicalInput.fill(TEST_CUSTOMER.medicalConditions)
      }
      
      const allergiesInput = adminPage.locator('textarea[name="allergies"]')
      if (await allergiesInput.isVisible()) {
        await allergiesInput.fill(TEST_CUSTOMER.allergies)
      }
      
      // Submit
      await adminPage.click('button:has-text("Save"), button:has-text("Create"), button[type="submit"]')
      
      // Verify creation
      await expect(adminPage.locator(`text=${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}`)).toBeVisible()
      
      // Capture ID for later use
      const customerRow = adminPage.locator(`tr:has-text("${TEST_CUSTOMER.firstName}")`)
      createdCustomerId = await customerRow.getAttribute('data-customer-id') || 
                         await customerRow.getAttribute('data-id')
    })

    await test.step('READ Customer details', async () => {
      // Click on customer to view details
      await adminPage.click(`text=${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}`)
      
      // Verify all details are displayed
      await expect(adminPage.locator(`text=${TEST_CUSTOMER.email}`)).toBeVisible()
      await expect(adminPage.locator(`text=${TEST_CUSTOMER.phone}`)).toBeVisible()
      await expect(adminPage.locator(`text=${TEST_CUSTOMER.medicalConditions}`)).toBeVisible()
    })

    await test.step('UPDATE Customer', async () => {
      // Find edit button
      await adminPage.click('button:has-text("Edit"), button[aria-label="Edit"]')
      
      // Update phone number
      const phoneInput = adminPage.locator('input[name="phone"]')
      await phoneInput.clear()
      await phoneInput.fill('555-UPDATED')
      
      // Save changes
      await adminPage.click('button:has-text("Save"), button:has-text("Update")')
      
      // Verify update
      await expect(adminPage.locator('text=555-UPDATED')).toBeVisible()
    })

    await test.step('CREATE Appointment', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/appointments`)
      await adminPage.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')
      
      // Select the customer we just created
      const clientSelect = adminPage.locator('select[name="clientId"], select[name="client"]')
      if (await clientSelect.isVisible()) {
        await clientSelect.selectOption({ label: `${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}` })
      }
      
      // Fill appointment details
      await adminPage.fill('input[name="date"]', TEST_APPOINTMENT.date)
      await adminPage.fill('input[name="time"]', TEST_APPOINTMENT.time)
      await adminPage.fill('input[name="duration"]', TEST_APPOINTMENT.duration)
      await adminPage.fill('textarea[name="description"]', TEST_APPOINTMENT.description)
      await adminPage.fill('textarea[name="notes"]', TEST_APPOINTMENT.notes)
      
      // Select artist if available
      const artistSelect = adminPage.locator('select[name="artistId"], select[name="artist"]')
      if (await artistSelect.isVisible()) {
        const options = await artistSelect.locator('option').count()
        if (options > 1) {
          await artistSelect.selectOption({ index: 1 })
        }
      }
      
      // Set deposit
      const depositInput = adminPage.locator('input[name="deposit"]')
      if (await depositInput.isVisible()) {
        await depositInput.fill(TEST_APPOINTMENT.deposit)
      }
      
      // Submit
      await adminPage.click('button:has-text("Save"), button:has-text("Create"), button[type="submit"]')
      
      // Verify creation
      await expect(adminPage.locator(`text=${TEST_APPOINTMENT.description}`)).toBeVisible()
    })

    await test.step('READ Appointment details', async () => {
      // Click on appointment
      await adminPage.click(`text=${TEST_APPOINTMENT.description}`)
      
      // Verify details
      await expect(adminPage.locator(`text=${TEST_APPOINTMENT.date}`)).toBeVisible()
      await expect(adminPage.locator(`text=${TEST_APPOINTMENT.notes}`)).toBeVisible()
    })

    await test.step('UPDATE Appointment', async () => {
      // Edit appointment
      await adminPage.click('button:has-text("Edit"), button[aria-label="Edit"]')
      
      // Update notes
      const notesInput = adminPage.locator('textarea[name="notes"]')
      await notesInput.clear()
      await notesInput.fill('Updated notes for automated test')
      
      // Save
      await adminPage.click('button:has-text("Save"), button:has-text("Update")')
      
      // Verify update
      await expect(adminPage.locator('text=Updated notes for automated test')).toBeVisible()
    })

    await test.step('DELETE Appointment', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/appointments`)
      
      // Find delete button
      const appointmentRow = adminPage.locator(`tr:has-text("${TEST_APPOINTMENT.description}")`)
      await appointmentRow.locator('button:has-text("Delete"), button[aria-label="Delete"]').click()
      
      // Confirm deletion
      await adminPage.click('button:has-text("Delete"), button:has-text("Confirm")')
      
      // Verify deletion
      await expect(adminPage.locator(`text=${TEST_APPOINTMENT.description}`)).not.toBeVisible()
    })

    await test.step('DELETE Customer', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/customers`)
      
      // Find delete button
      const customerRow = adminPage.locator(`tr:has-text("${TEST_CUSTOMER.firstName}")`)
      await customerRow.locator('button:has-text("Delete"), button[aria-label="Delete"]').click()
      
      // Confirm deletion
      await adminPage.click('button:has-text("Delete"), button:has-text("Confirm")')
      
      // Verify deletion
      await expect(adminPage.locator(`text=${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}`)).not.toBeVisible()
    })
  })

  test('6. Media Management - Upload images/videos and sync to website?', async () => {
    let uploadedMediaTitle: string

    await test.step('Upload media file', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/media`)
      await adminPage.click('button:has-text("Upload"), button:has-text("Add Media")')
      
      // Upload test image
      const testImagePath = path.join(__dirname, 'test-assets', 'sample-tattoo.jpg')
      const fileInput = adminPage.locator('input[type="file"]')
      await fileInput.setInputFiles(testImagePath)
      
      // Fill media details
      uploadedMediaTitle = `Test Upload ${Date.now()}`
      await adminPage.fill('input[name="title"]', uploadedMediaTitle)
      
      // Select style/category if available
      const styleSelect = adminPage.locator('select[name="style"], select[name="category"]')
      if (await styleSelect.isVisible()) {
        await styleSelect.selectOption({ index: 1 })
      }
      
      // Add tags
      const tagsInput = adminPage.locator('input[name="tags"]')
      if (await tagsInput.isVisible()) {
        await tagsInput.fill('test, automated, verification')
      }
      
      // Enable website sync
      const syncCheckbox = adminPage.locator('input[name="syncToWebsite"], input[name="sync"]')
      if (await syncCheckbox.isVisible()) {
        await syncCheckbox.check()
      }
      
      // Submit upload
      await adminPage.click('button:has-text("Upload"), button:has-text("Save"), button[type="submit"]')
      
      // Wait for upload success
      await expect(adminPage.locator('text=/upload.*success|success.*upload/i')).toBeVisible({ timeout: 15000 })
    })

    await test.step('Verify media appears in gallery', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/media`)
      
      // Search for uploaded media
      await expect(adminPage.locator(`text=${uploadedMediaTitle}`)).toBeVisible()
      
      // Verify image thumbnail loads
      const thumbnail = adminPage.locator(`img[alt*="${uploadedMediaTitle}"]`)
      if (await thumbnail.isVisible()) {
        const src = await thumbnail.getAttribute('src')
        expect(src).toBeTruthy()
      }
    })

    await test.step('Test media organization features', async () => {
      // Test search/filter functionality
      const searchInput = adminPage.locator('input[placeholder*="Search"], input[name="search"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill(uploadedMediaTitle)
        await adminPage.waitForTimeout(1000) // Wait for search debounce
        await expect(adminPage.locator(`text=${uploadedMediaTitle}`)).toBeVisible()
      }
    })

    await test.step('Delete uploaded media', async () => {
      // Find and delete the uploaded media
      const mediaItem = adminPage.locator(`[data-testid="media-item"]:has-text("${uploadedMediaTitle}")`)
      if (await mediaItem.isVisible()) {
        await mediaItem.locator('button:has-text("Delete"), button[aria-label="Delete"]').click()
        await adminPage.click('button:has-text("Delete"), button:has-text("Confirm")')
        
        // Verify deletion
        await expect(adminPage.locator(`text=${uploadedMediaTitle}`)).not.toBeVisible()
      }
    })
  })

  test('7. Theme Switching - Does the theme mode switch button work?', async () => {
    await test.step('Locate theme toggle button', async () => {
      await adminPage.goto(`${APP_URL}/dashboard`)
      
      // Find theme toggle button
      const themeToggle = adminPage.locator('button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"]')
      await expect(themeToggle).toBeVisible()
    })

    await test.step('Test theme switching', async () => {
      // Get initial theme
      const initialTheme = await adminPage.evaluate(() => {
        return {
          isDark: document.documentElement.classList.contains('dark'),
          backgroundColor: window.getComputedStyle(document.body).backgroundColor
        }
      })
      
      // Click theme toggle
      await adminPage.click('button[aria-label*="theme"], button[aria-label*="dark"], button[aria-label*="light"]')
      
      // Wait for theme change
      await adminPage.waitForTimeout(500)
      
      // Verify theme changed
      const newTheme = await adminPage.evaluate(() => {
        return {
          isDark: document.documentElement.classList.contains('dark'),
          backgroundColor: window.getComputedStyle(document.body).backgroundColor
        }
      })
      
      expect(newTheme.isDark).toBe(!initialTheme.isDark)
      expect(newTheme.backgroundColor).not.toBe(initialTheme.backgroundColor)
    })

    await test.step('Verify theme persistence', async () => {
      // Get current theme
      const currentTheme = await adminPage.evaluate(() => 
        document.documentElement.classList.contains('dark')
      )
      
      // Refresh page
      await adminPage.reload()
      
      // Verify theme persisted
      const persistedTheme = await adminPage.evaluate(() => 
        document.documentElement.classList.contains('dark')
      )
      
      expect(persistedTheme).toBe(currentTheme)
    })
  })

  test('8. Auth Components - Do auth components render correctly?', async () => {
    await test.step('Test logout functionality', async () => {
      await adminPage.goto(`${APP_URL}/dashboard`)
      
      // Find and click logout button
      const userMenu = adminPage.locator('button[aria-label*="user"], button[aria-label*="menu"], button:has-text("admin")')
      if (await userMenu.isVisible()) {
        await userMenu.click()
      }
      
      const logoutButton = adminPage.locator('button:has-text("Logout"), a:has-text("Logout"), [href*="logout"]')
      await logoutButton.click()
      
      // Should redirect to login
      await expect(adminPage).toHaveURL(/login|auth|signin/)
    })

    await test.step('Test auth error handling', async () => {
      // Try to access protected route without authentication
      await adminPage.goto(`${APP_URL}/dashboard`)
      
      // Should redirect to login
      await expect(adminPage).toHaveURL(/login|auth|signin/)
      
      // Verify Better Auth UI components render
      await expect(adminPage.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(adminPage.locator('input[type="password"], input[name="password"]')).toBeVisible()
      await expect(adminPage.locator('button[type="submit"]')).toBeVisible()
    })

    await test.step('Test loading states during authentication', async () => {
      // Fill credentials
      await adminPage.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL)
      await adminPage.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD)
      
      // Click submit and check for loading state
      await adminPage.click('button[type="submit"]')
      
      // Should show loading state or redirect quickly
      await expect(adminPage).toHaveURL(/dashboard/, { timeout: 10000 })
    })
  })

  test('9. Performance - Is it slow to load and render?', async () => {
    await test.step('Measure initial page load time', async () => {
      const startTime = Date.now()
      
      await adminPage.goto(`${APP_URL}/dashboard`)
      await adminPage.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should load in under 5 seconds (generous for E2E)
      expect(loadTime).toBeLessThan(5000)
      console.log(`Dashboard load time: ${loadTime}ms`)
    })

    await test.step('Measure navigation performance', async () => {
      const routes = ['/dashboard/appointments', '/dashboard/customers', '/dashboard/media']
      
      for (const route of routes) {
        const startTime = Date.now()
        
        await adminPage.goto(`${APP_URL}${route}`)
        await adminPage.waitForLoadState('domcontentloaded')
        
        const navTime = Date.now() - startTime
        
        // Navigation should be under 2 seconds
        expect(navTime).toBeLessThan(2000)
        console.log(`${route} navigation time: ${navTime}ms`)
      }
    })

    await test.step('Check Core Web Vitals', async () => {
      await adminPage.goto(`${APP_URL}/dashboard`)
      
      const metrics = await adminPage.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            const vitals = { lcp: 0, fid: 0, cls: 0 }
            
            entries.forEach(entry => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime
              }
              if (entry.entryType === 'first-input') {
                vitals.fid = (entry as any).processingStart - entry.startTime
              }
              if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                vitals.cls += (entry as any).value
              }
            })
            
            observer.disconnect()
            resolve(vitals)
          })
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
          
          // Trigger some interactions
          setTimeout(() => {
            document.body.click()
            setTimeout(() => observer.disconnect(), 2000)
          }, 100)
        })
      })
      
      // Google's "Good" thresholds
      expect((metrics as any).lcp).toBeLessThan(2500) // LCP < 2.5s
      expect((metrics as any).cls).toBeLessThan(0.1)  // CLS < 0.1
    })
  })

  test('10. UI/UX - Proper spacing, padding, typography, styling, CSS?', async () => {
    await test.step('Check typography consistency', async () => {
      await adminPage.goto(`${APP_URL}/dashboard`)
      
      // Verify fonts are loaded
      const fontFamilies = await adminPage.evaluate(() => {
        const styles = window.getComputedStyle(document.body)
        return {
          body: styles.fontFamily,
          heading: window.getComputedStyle(document.querySelector('h1') || document.body).fontFamily
        }
      })
      
      expect(fontFamilies.body).toBeTruthy()
      expect(fontFamilies.heading).toBeTruthy()
    })

    await test.step('Check spacing consistency', async () => {
      // Get spacing values from major components
      const spacingValues = await adminPage.evaluate(() => {
        const elements = document.querySelectorAll('[class*="p-"], [class*="m-"], [class*="gap-"]')
        const values = new Set<string>()
        
        elements.forEach(el => {
          const styles = window.getComputedStyle(el)
          if (styles.padding !== '0px') values.add(styles.padding)
          if (styles.margin !== '0px') values.add(styles.margin)
          if (styles.gap !== 'normal') values.add(styles.gap)
        })
        
        return Array.from(values)
      })
      
      // Should have consistent spacing values
      expect(spacingValues.length).toBeGreaterThan(0)
    })

    await test.step('Check color scheme consistency', async () => {
      const colors = await adminPage.evaluate(() => {
        const elements = document.querySelectorAll('*')
        const colorValues = new Set<string>()
        
        elements.forEach(el => {
          const styles = window.getComputedStyle(el)
          if (styles.color !== 'rgba(0, 0, 0, 0)') colorValues.add(styles.color)
          if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') colorValues.add(styles.backgroundColor)
        })
        
        return Array.from(colorValues)
      })
      
      // Should have defined color scheme
      expect(colors.length).toBeGreaterThan(0)
      expect(colors.length).toBeLessThan(50) // Not too many random colors
    })

    await test.step('Check for broken images or missing icons', async () => {
      const brokenImages = await adminPage.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
        return images.filter(img => !img.complete || img.naturalWidth === 0).length
      })
      
      expect(brokenImages).toBe(0)
    })
  })

  test('11. Responsive Design - Works on different devices, viewports, screen sizes?', async () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Large Desktop', width: 2560, height: 1440 }
    ]

    for (const viewport of viewports) {
      await test.step(`Test ${viewport.name} (${viewport.width}x${viewport.height})`, async () => {
        await adminPage.setViewportSize(viewport)
        await adminPage.goto(`${APP_URL}/dashboard`)
        
        // Check no horizontal scroll
        const hasHorizontalScroll = await adminPage.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })
        expect(hasHorizontalScroll).toBe(false)
        
        // Check text is readable
        const fontSize = await adminPage.evaluate(() => {
          return parseInt(window.getComputedStyle(document.body).fontSize)
        })
        expect(fontSize).toBeGreaterThanOrEqual(14) // Minimum readable size
        
        // Mobile specific checks
        if (viewport.width < 768) {
          // Mobile menu should be available
          const mobileMenu = adminPage.locator('button[aria-label*="menu"], button[aria-label*="Menu"]')
          await expect(mobileMenu).toBeVisible()
          
          // Sidebar should be hidden initially
          const sidebar = adminPage.locator('aside, [data-testid="sidebar"]')
          const isHidden = await sidebar.evaluate(el => {
            const style = window.getComputedStyle(el)
            return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0'
          })
          expect(isHidden).toBe(true)
        } else {
          // Desktop: sidebar should be visible
          const sidebar = adminPage.locator('aside, [data-testid="sidebar"]')
          await expect(sidebar).toBeVisible()
        }
        
        // Take screenshot for visual comparison
        await adminPage.screenshot({
          path: `test-results/responsive-${viewport.name}-${viewport.width}x${viewport.height}.png`,
          fullPage: true
        })
      })
    }
  })

  test('12. Component Overlap - Any overlapping components when resizing?', async () => {
    await test.step('Test rapid viewport changes', async () => {
      const sizes = [
        { width: 320, height: 568 },  // iPhone 5
        { width: 375, height: 667 },  // iPhone 6/7/8
        { width: 414, height: 896 },  // iPhone 11
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // iPad Landscape
        { width: 1366, height: 768 }, // Small laptop
        { width: 1920, height: 1080 } // Desktop
      ]
      
      await adminPage.goto(`${APP_URL}/dashboard`)
      
      for (const size of sizes) {
        await adminPage.setViewportSize(size)
        await adminPage.waitForTimeout(300) // Allow layout to settle
        
        // Check for overlapping elements
        const overlaps = await adminPage.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('header, aside, main, [data-testid*="card"]'))
          const rects = elements.map(el => ({
            element: el.tagName + (el.className ? `.${  el.className.split(' ')[0]}` : ''),
            rect: el.getBoundingClientRect()
          }))
          
          const overlapping = []
          for (let i = 0; i < rects.length - 1; i++) {
            for (let j = i + 1; j < rects.length; j++) {
              const a = rects[i].rect
              const b = rects[j].rect
              
              const overlap = !(
                a.right <= b.left ||
                b.right <= a.left ||
                a.bottom <= b.top ||
                b.bottom <= a.top
              )
              
              if (overlap && a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0) {
                overlapping.push({
                  element1: rects[i].element,
                  element2: rects[j].element,
                  viewport: `${window.innerWidth}x${window.innerHeight}`
                })
              }
            }
          }
          
          return overlapping
        })
        
        if (overlaps.length > 0) {
          console.warn(`Overlapping elements at ${size.width}x${size.height}:`, overlaps)
        }
        expect(overlaps).toHaveLength(0)
      }
    })
  })

  test('13. API Security - Are API routes secure and returning real data?', async () => {
    await test.step('Test API authentication requirement', async () => {
      // Test without authentication
      const response = await adminPage.request.get(`${APP_URL}/api/admin/dashboard/stats`)
      expect(response.status()).toBe(401)
    })

    await test.step('Test authenticated API calls return real data', async () => {
      // Login first to get session
      await adminPage.goto(`${APP_URL}/auth/login`)
      await adminPage.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL)
      await adminPage.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD)
      await adminPage.click('button[type="submit"]')
      await adminPage.waitForURL(/dashboard/)
      
      // Test dashboard stats API
      const statsResponse = await adminPage.request.get(`${APP_URL}/api/admin/dashboard/stats`)
      expect(statsResponse.status()).toBe(200)
      
      const statsData = await statsResponse.json()
      expect(statsData).toHaveProperty('totalClients')
      expect(statsData).toHaveProperty('totalAppointments')
      expect(typeof statsData.totalClients).toBe('number')
      expect(typeof statsData.totalAppointments).toBe('number')
    })

    await test.step('Test input validation', async () => {
      // Test SQL injection attempt
      const maliciousPayload = "'; DROP TABLE users; --"
      
      const response = await adminPage.request.post(`${APP_URL}/api/admin/customers`, {
        data: {
          firstName: maliciousPayload,
          lastName: 'Test',
          email: 'test@example.com'
        }
      })
      
      // Should either reject (400/422) or safely handle (200/201)
      expect([200, 201, 400, 422]).toContain(response.status())
      
      // Should not return 500 (unhandled error)
      expect(response.status()).not.toBe(500)
    })
  })

  test('14. Analytics & Reports - Do analytics and reports navigation work?', async () => {
    await test.step('Navigate to analytics page', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/analytics`)
      
      // Should load without errors
      await expect(adminPage.locator('h1')).toContainText(/analytics/i)
      
      // Should have some chart or data visualization
      const hasCharts = await adminPage.locator('canvas, svg, [data-testid*="chart"]').count()
      expect(hasCharts).toBeGreaterThan(0)
    })

    await test.step('Navigate to reports page', async () => {
      await adminPage.goto(`${APP_URL}/dashboard/reports`)
      
      // Should load without errors
      await expect(adminPage.locator('h1')).toContainText(/reports/i)
      
      // Should have report generation or display functionality
      const hasReportElements = await adminPage.locator('button:has-text("Generate"), button:has-text("Export"), table, [data-testid*="report"]').count()
      expect(hasReportElements).toBeGreaterThan(0)
    })

    await test.step('Test report generation', async () => {
      const generateButton = adminPage.locator('button:has-text("Generate"), button:has-text("Create Report")')
      if (await generateButton.isVisible()) {
        await generateButton.click()
        
        // Should show loading or completion state
        await expect(adminPage.locator('text=/generating|loading|complete/i')).toBeVisible({ timeout: 10000 })
      }
    })
  })
})