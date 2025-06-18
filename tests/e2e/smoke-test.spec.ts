/**
 * Smoke Test - Quick verification that basic functionality works
 * Run this first to ensure the test environment is properly configured
 */

import { expect, test } from '@playwright/test'

const APP_URL = process.env.APP_URL || 'http://localhost:3001'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@ink37tattoos.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123456'

test.describe('Smoke Test', () => {
  test('Application loads and login works', async ({ page }) => {
    // Test 1: Application loads
    await test.step('Application responds and loads', async () => {
      const response = await page.goto(APP_URL)
      expect(response?.status()).toBe(200)
      console.log('✅ Application loads successfully')
    })

    // Test 2: Login form is present
    await test.step('Login form renders', async () => {
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
      console.log('✅ Login form renders correctly')
    })

    // Test 3: Login works
    await test.step('Admin can login', async () => {
      await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL)
      await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD)
      await page.click('button[type="submit"]')
      
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
      console.log('✅ Login successful')
    })

    // Test 4: Dashboard loads
    await test.step('Dashboard renders', async () => {
      await expect(page.locator('h1, [data-testid*="title"]')).toContainText(/dashboard/i)
      console.log('✅ Dashboard renders successfully')
    })

    // Test 5: Navigation exists
    await test.step('Navigation is present', async () => {
      const navItems = await page.locator('nav a, aside a, [data-testid="nav"] a').count()
      expect(navItems).toBeGreaterThan(0)
      console.log(`✅ Navigation present with ${navItems} items`)
    })

    console.log('🎉 Smoke test passed - environment is ready for comprehensive testing!')
  })

  test('Environment configuration check', async ({ page }) => {
    await test.step('Check environment variables', async () => {
      console.log('🔧 Environment Configuration:')
      console.log(`   APP_URL: ${APP_URL}`)
      console.log(`   ADMIN_EMAIL: ${ADMIN_EMAIL}`)
      console.log(`   PASSWORD: ${ADMIN_PASSWORD ? '[SET]' : '[NOT SET]'}`)
      
      expect(APP_URL).toBeTruthy()
      expect(ADMIN_EMAIL).toBeTruthy()
      expect(ADMIN_PASSWORD).toBeTruthy()
    })

    await test.step('Check Playwright configuration', async () => {
      const viewportSize = page.viewportSize()
      console.log(`   Viewport: ${viewportSize?.width}x${viewportSize?.height}`)
      
      const userAgent = await page.evaluate(() => navigator.userAgent)
      console.log(`   User Agent: ${userAgent}`)
      
      expect(viewportSize?.width).toBeGreaterThan(0)
      expect(viewportSize?.height).toBeGreaterThan(0)
    })
  })
})