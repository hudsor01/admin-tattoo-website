/**
 * Critical test: Verify media actually syncs to the website
 * This is THE most important feature to test
 */

import { expect, test } from '@playwright/test'

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001'
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://ink37tattoos.com'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@ink37tattoos.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'testpassword123'

test.describe('Media Website Sync Verification', () => {
  let adminPage
  let websitePage

  test.beforeAll(async ({ browser }) => {
    // Open two contexts - one for admin, one for public website
    const adminContext = await browser.newContext()
    const websiteContext = await browser.newContext()
    
    adminPage = await adminContext.newPage()
    websitePage = await websiteContext.newPage()
    
    // Login to admin
    await adminPage.goto(`${ADMIN_URL}/auth/login`)
    await adminPage.fill('input[name="email"]', ADMIN_EMAIL)
    await adminPage.fill('input[name="password"]', ADMIN_PASSWORD)
    await adminPage.click('button[type="submit"]')
    await adminPage.waitForURL('**/dashboard')
  })

  test('Upload media and verify it appears on public website', async () => {
    // Step 1: Upload media in admin dashboard
    await test.step('Upload new tattoo image', async () => {
      await adminPage.goto(`${ADMIN_URL}/dashboard/media`)
      await adminPage.click('button:has-text("Upload Media")')
      
      // Upload a test image
      const timestamp = Date.now()
      const uniqueTitle = `Test Tattoo ${timestamp}`
      
      await adminPage.locator('input[type="file"]').setInputFiles({
        name: 'test-tattoo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data') // In real test, use actual image
      })
      
      await adminPage.fill('input[name="title"]', uniqueTitle)
      await adminPage.selectOption('select[name="style"]', 'Traditional')
      await adminPage.fill('input[name="tags"]', 'test, automated, verification')
      await adminPage.fill('textarea[name="description"]', 'Automated test upload')
      
      // CRITICAL: Enable website sync
      await adminPage.check('input[name="syncToWebsite"]')
      
      // Submit
      await adminPage.click('button:has-text("Upload")')
      
      // Wait for success message
      await expect(adminPage.locator('text=Upload successful')).toBeVisible({ timeout: 10000 })
      await expect(adminPage.locator('text=Synced to website')).toBeVisible({ timeout: 10000 })
      
      // Verify appears in admin gallery
      await expect(adminPage.locator(`text="${uniqueTitle}"`)).toBeVisible()
    })

    // Step 2: Check public website gallery
    await test.step('Verify on public website', async () => {
      // Navigate to website gallery
      await websitePage.goto(`${WEBSITE_URL}/gallery`)
      
      // Might need to refresh or wait for sync
      await websitePage.reload()
      await websitePage.waitForLoadState('networkidle')
      
      // Look for the uploaded image
      const uniqueTitle = adminPage.locator('[data-last-upload-title]').textContent()
      
      // Check if image appears
      const imageOnWebsite = await websitePage.locator(`img[alt*="${uniqueTitle}"]`).first()
      await expect(imageOnWebsite).toBeVisible({ timeout: 30000 })
      
      // Verify image loads (not broken)
      const imageSrc = await imageOnWebsite.getAttribute('src')
      const imageResponse = await websitePage.request.get(imageSrc)
      expect(imageResponse.status()).toBe(200)
    })

    // Step 3: Verify metadata synced correctly
    await test.step('Verify metadata on website', async () => {
      const uniqueTitle = adminPage.locator('[data-last-upload-title]').textContent()
      
      // Click on image to see details (if applicable)
      await websitePage.click(`img[alt*="${uniqueTitle}"]`)
      
      // Check style tag
      await expect(websitePage.locator('text=Traditional')).toBeVisible()
      
      // Check description
      await expect(websitePage.locator('text=Automated test upload')).toBeVisible()
    })

    // Step 4: Test unsync functionality
    await test.step('Unsync from website', async () => {
      const uniqueTitle = adminPage.locator('[data-last-upload-title]').textContent()
      
      // Go back to admin media page
      await adminPage.goto(`${ADMIN_URL}/dashboard/media`)
      
      // Find the uploaded item
      const mediaItem = adminPage.locator(`[data-testid="media-item"]:has-text("${uniqueTitle}")`)
      
      // Click unsync button
      await mediaItem.locator('button[aria-label="Unsync from website"]').click()
      
      // Confirm action
      await adminPage.click('button:has-text("Confirm")')
      
      // Wait for unsync confirmation
      await expect(adminPage.locator('text=Removed from website')).toBeVisible()
    })

    // Step 5: Verify removal from public website
    await test.step('Verify removed from website', async () => {
      const uniqueTitle = adminPage.locator('[data-last-upload-title]').textContent()
      
      // Refresh website gallery
      await websitePage.reload()
      await websitePage.waitForLoadState('networkidle')
      
      // Image should no longer be visible
      await expect(websitePage.locator(`img[alt*="${uniqueTitle}"]`)).not.toBeVisible()
    })
  })

  test('Bulk sync operations', async () => {
    await test.step('Upload multiple media items', async () => {
      await adminPage.goto(`${ADMIN_URL}/dashboard/media`)
      
      // Upload 3 test images
      for (let i = 1; i <= 3; i++) {
        await adminPage.click('button:has-text("Upload Media")')
        
        await adminPage.locator('input[type="file"]').setInputFiles({
          name: `test-tattoo-${i}.jpg`,
          mimeType: 'image/jpeg',
          buffer: Buffer.from(`fake-image-data-${i}`)
        })
        
        await adminPage.fill('input[name="title"]', `Bulk Test ${i}`)
        await adminPage.check('input[name="syncToWebsite"]')
        await adminPage.click('button:has-text("Upload")')
        
        await expect(adminPage.locator('text=Upload successful')).toBeVisible()
      }
    })

    await test.step('Select all and bulk unsync', async () => {
      // Select all checkboxes
      await adminPage.check('input[aria-label="Select all"]')
      
      // Click bulk actions
      await adminPage.click('button:has-text("Bulk Actions")')
      await adminPage.click('text=Unsync from website')
      
      // Confirm
      await adminPage.click('button:has-text("Confirm")')
      
      // Wait for bulk operation
      await expect(adminPage.locator('text=items unsynced')).toBeVisible()
    })

    await test.step('Verify bulk removal from website', async () => {
      await websitePage.goto(`${WEBSITE_URL}/gallery`)
      await websitePage.reload()
      
      // None of the bulk items should be visible
      for (let i = 1; i <= 3; i++) {
        await expect(websitePage.locator(`text=Bulk Test ${i}`)).not.toBeVisible()
      }
    })
  })

  test('Video upload and sync', async () => {
    await test.step('Upload video file', async () => {
      await adminPage.goto(`${ADMIN_URL}/dashboard/media`)
      await adminPage.click('button:has-text("Upload Media")')
      
      // Upload video
      await adminPage.locator('input[type="file"]').setInputFiles({
        name: 'tattoo-process.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.from('fake-video-data')
      })
      
      await adminPage.fill('input[name="title"]', 'Tattoo Process Video')
      await adminPage.check('input[name="syncToWebsite"]')
      
      // Video specific options
      await adminPage.check('input[name="generateThumbnail"]')
      
      await adminPage.click('button:has-text("Upload")')
      
      // Video upload might take longer
      await expect(adminPage.locator('text=Upload successful')).toBeVisible({ timeout: 30000 })
    })

    await test.step('Verify video on website', async () => {
      await websitePage.goto(`${WEBSITE_URL}/gallery`)
      await websitePage.reload()
      
      // Look for video element or video thumbnail
      const videoElement = await websitePage.locator('video[title*="Tattoo Process"]').or(
        websitePage.locator('[data-video-thumbnail*="Tattoo Process"]')
      )
      
      await expect(videoElement).toBeVisible({ timeout: 30000 })
    })
  })

  test.afterAll(async () => {
    // Cleanup test data
    await adminPage.close()
    await websitePage.close()
  })
})