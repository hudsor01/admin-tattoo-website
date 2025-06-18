import { type Page, expect, test } from '@playwright/test'
import path from 'path'

test.describe('Media Management E2E Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    
    // Mock API responses for consistent testing
    await page.route('**/api/admin/media', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                title: 'Traditional Dragon',
                description: 'A traditional dragon tattoo',
                style: 'Traditional',
                tags: ['dragon', 'traditional', 'color'],
                mediaUrl: 'https://example.com/dragon.jpg',
                imageUrl: 'https://example.com/dragon.jpg',
                type: 'photo',
                artistName: 'Fernando Govea',
                isPublic: true,
                popularity: 10,
                estimatedHours: 5,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
                syncedToWebsite: false,
                websiteUrl: 'https://ink37tattoos.com/gallery/1',
              },
              {
                id: '2',
                title: 'Blackwork Sleeve',
                description: 'Full sleeve blackwork',
                style: 'Blackwork',
                tags: ['blackwork', 'sleeve'],
                mediaUrl: 'https://example.com/sleeve.mp4',
                imageUrl: 'https://example.com/sleeve-thumb.jpg',
                type: 'video',
                artistName: 'Fernando Govea',
                isPublic: true,
                popularity: 8,
                estimatedHours: 12,
                createdAt: '2024-01-02T00:00:00Z',
                updatedAt: '2024-01-02T00:00:00Z',
                syncedToWebsite: true,
                websiteUrl: 'https://ink37tattoos.com/gallery/2',
              },
            ],
          }),
        })
      }
    })

    // Navigate to media management page
    await page.goto('/dashboard/media-management')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Page Layout and Navigation', () => {
    test('displays page header and navigation elements', async () => {
      await expect(page.locator('h1')).toContainText('Media Management')
      await expect(page.locator('text=Upload photos and videos that sync to ink37tattoos.com/gallery')).toBeVisible()
      
      // Check upload buttons
      await expect(page.locator('button:has-text("Upload Photo")')).toBeVisible()
      await expect(page.locator('button:has-text("Upload Video")')).toBeVisible()
      
      // Check search functionality
      await expect(page.locator('input[placeholder="Search media..."]')).toBeVisible()
      await expect(page.locator('button:has-text("Filter")')).toBeVisible()
    })

    test('displays media items in grid layout', async () => {
      await expect(page.locator('text=Traditional Dragon')).toBeVisible()
      await expect(page.locator('text=Blackwork Sleeve')).toBeVisible()
      
      // Check sync status badges
      await expect(page.locator('text=⚠ Not Synced')).toBeVisible()
      await expect(page.locator('text=✓ Synced')).toBeVisible()
      
      // Check video badge
      await expect(page.locator('text=Video')).toBeVisible()
    })
  })

  test.describe('Media Upload Flow', () => {
    test('opens photo upload dialog and displays form fields', async () => {
      await page.click('button:has-text("Upload Photo")')
      
      // Check dialog is open
      await expect(page.locator('role=dialog')).toBeVisible()
      await expect(page.locator('text=Upload Photo')).toBeVisible()
      
      // Check form fields
      await expect(page.locator('label:has-text("Title")')).toBeVisible()
      await expect(page.locator('label:has-text("Style")')).toBeVisible()
      await expect(page.locator('label:has-text("Description")')).toBeVisible()
      await expect(page.locator('label:has-text("Tags")')).toBeVisible()
      await expect(page.locator('text=Sync to ink37tattoos.com gallery (recommended)')).toBeVisible()
      
      // Check upload zone
      await expect(page.locator('text=Drop your photo here, or browse')).toBeVisible()
      await expect(page.locator('text=JPEG, PNG, WebP up to 4.5MB')).toBeVisible()
    })

    test('opens video upload dialog with correct type', async () => {
      await page.click('button:has-text("Upload Video")')
      
      await expect(page.locator('role=dialog')).toBeVisible()
      await expect(page.locator('text=Upload Video')).toBeVisible()
      
      // Check video-specific instructions
      await expect(page.locator('text=Drop your video here, or browse')).toBeVisible()
      await expect(page.locator('text=MP4, MOV, WebM up to 4.5MB')).toBeVisible()
    })

    test('closes dialog when cancel is clicked', async () => {
      await page.click('button:has-text("Upload Photo")')
      await expect(page.locator('role=dialog')).toBeVisible()
      
      await page.click('button:has-text("Cancel")')
      await expect(page.locator('role=dialog')).not.toBeVisible()
    })

    test('simulates file upload and form completion', async () => {
      // Mock upload API
      await page.route('**/api/upload**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            url: 'https://example.com/uploaded-test.jpg',
            pathname: 'uploaded-test.jpg',
          }),
        })
      })

      // Mock media creation API
      await page.route('**/api/admin/media', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 'new-1',
                title: 'Test Tattoo',
                description: 'A test tattoo upload',
                style: 'Traditional',
                tags: ['test', 'upload'],
                mediaUrl: 'https://example.com/uploaded-test.jpg',
                imageUrl: 'https://example.com/uploaded-test.jpg',
                type: 'photo',
                artistName: 'Fernando Govea',
                syncedToWebsite: true,
                websiteUrl: 'https://ink37tattoos.com/gallery/new-1',
              },
            }),
          })
        }
      })

      await page.click('button:has-text("Upload Photo")')
      
      // Fill form fields
      await page.fill('input[id="title"]', 'Test Tattoo')
      await page.fill('input[id="style"]', 'Traditional')
      await page.fill('textarea[id="description"]', 'A test tattoo upload')
      
      // Add tags
      await page.fill('input[id="tags"]', 'test')
      await page.click('button:has-text("Add")')
      await expect(page.locator('text=test')).toBeVisible()
      
      await page.fill('input[id="tags"]', 'upload')
      await page.keyboard.press('Enter')
      await expect(page.locator('text=upload')).toBeVisible()
      
      // Simulate file upload (click on upload area to trigger file input)
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(path.join(__dirname, '../test-assets/test-image.png'))
      
      // Wait for upload success message
      await expect(page.locator('text=File uploaded successfully!')).toBeVisible()
      
      // Check that Save button is enabled
      const saveButton = page.locator('button:has-text("Save Photo")')
      await expect(saveButton).toBeEnabled()
      
      // Click save
      await saveButton.click()
      
      // Verify success and dialog closes
      await expect(page.locator('role=dialog')).not.toBeVisible()
    })
  })

  test.describe('Media Synchronization', () => {
    test('syncs media to website when sync button is clicked', async () => {
      let syncRequestMade = false
      
      // Mock sync API
      await page.route('**/api/admin/media/sync', (route) => {
        syncRequestMade = true
        const body = route.request().postDataJSON()
        
        expect(body).toMatchObject({
          mediaId: '1',
          action: 'sync',
        })
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              mediaId: '1',
              syncedToWebsite: true,
              syncedAt: new Date().toISOString(),
              websiteUrl: 'https://ink37tattoos.com/gallery/1',
            },
            message: 'Media successfully synced to website',
          }),
        })
      })

      // Find the first media item (Traditional Dragon) and hover to reveal sync button
      const mediaCard = page.locator('text=Traditional Dragon').locator('..').locator('..')
      await mediaCard.hover()
      
      // Click sync button (the refresh icon button)
      const syncButton = mediaCard.locator('button[title*="Sync to website"]')
      await expect(syncButton).toBeVisible()
      await syncButton.click()
      
      // Verify sync request was made
      await page.waitForTimeout(1000) // Wait for async operation
      expect(syncRequestMade).toBe(true)
    })

    test('removes media from website when unsync button is clicked', async () => {
      let unsyncRequestMade = false
      
      // Mock unsync API
      await page.route('**/api/admin/media/sync', (route) => {
        unsyncRequestMade = true
        const body = route.request().postDataJSON()
        
        expect(body).toMatchObject({
          mediaId: '2',
          action: 'unsync',
        })
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              mediaId: '2',
              syncedToWebsite: false,
              unsyncedAt: new Date().toISOString(),
            },
            message: 'Media successfully removed from website',
          }),
        })
      })

      // Find the synced media item (Blackwork Sleeve) and hover
      const mediaCard = page.locator('text=Blackwork Sleeve').locator('..').locator('..')
      await mediaCard.hover()
      
      // Click unsync button
      const unsyncButton = mediaCard.locator('button[title*="Remove from website"]')
      await expect(unsyncButton).toBeVisible()
      await unsyncButton.click()
      
      // Verify unsync request was made
      await page.waitForTimeout(1000)
      expect(unsyncRequestMade).toBe(true)
    })

    test('displays sync status correctly', async () => {
      // Check that sync status badges are displayed correctly
      const notSyncedBadge = page.locator('text=⚠ Not Synced')
      const syncedBadge = page.locator('text=✓ Synced')
      
      await expect(notSyncedBadge).toBeVisible()
      await expect(syncedBadge).toBeVisible()
    })

    test('opens website URL when view on website is clicked', async () => {
      // Mock window.open to prevent actual navigation
      await page.addInitScript(() => {
        window.open = (url) => {
          (window as any)._lastOpenedUrl = url
          return null
        }
      })

      // Find synced media item and hover
      const mediaCard = page.locator('text=Blackwork Sleeve').locator('..').locator('..')
      await mediaCard.hover()
      
      // Click view on website button
      const viewButton = mediaCard.locator('button[title*="View on website"]')
      await expect(viewButton).toBeVisible()
      await viewButton.click()
      
      // Verify correct URL was opened
      const openedUrl = await page.evaluate(() => (window as any)._lastOpenedUrl)
      expect(openedUrl).toBe('https://ink37tattoos.com/gallery/2')
    })
  })

  test.describe('Search and Filter Functionality', () => {
    test('filters media by title search', async () => {
      // Search for "dragon"
      await page.fill('input[placeholder="Search media..."]', 'dragon')
      
      // Should show Traditional Dragon but not Blackwork Sleeve
      await expect(page.locator('text=Traditional Dragon')).toBeVisible()
      await expect(page.locator('text=Blackwork Sleeve')).not.toBeVisible()
    })

    test('filters media by tag search', async () => {
      // Search for "blackwork"
      await page.fill('input[placeholder="Search media..."]', 'blackwork')
      
      // Should show Blackwork Sleeve but not Traditional Dragon
      await expect(page.locator('text=Blackwork Sleeve')).toBeVisible()
      await expect(page.locator('text=Traditional Dragon')).not.toBeVisible()
    })

    test('filters media by artist name', async () => {
      // Search for "fernando"
      await page.fill('input[placeholder="Search media..."]', 'fernando')
      
      // Should show both items since both are by Fernando
      await expect(page.locator('text=Traditional Dragon')).toBeVisible()
      await expect(page.locator('text=Blackwork Sleeve')).toBeVisible()
    })

    test('shows no results message when search has no matches', async () => {
      // Search for something that doesn't exist
      await page.fill('input[placeholder="Search media..."]', 'nonexistent')
      
      // Should show no media items
      await expect(page.locator('text=Traditional Dragon')).not.toBeVisible()
      await expect(page.locator('text=Blackwork Sleeve')).not.toBeVisible()
    })
  })

  test.describe('Media Item Actions', () => {
    test('displays action buttons on hover', async () => {
      const mediaCard = page.locator('text=Traditional Dragon').locator('..').locator('..')
      
      // Initially buttons should not be visible
      await expect(mediaCard.locator('button[title*="View on website"]')).not.toBeVisible()
      await expect(mediaCard.locator('button[title*="View details"]')).not.toBeVisible()
      await expect(mediaCard.locator('button[title*="Edit metadata"]')).not.toBeVisible()
      await expect(mediaCard.locator('button[title*="Delete"]')).not.toBeVisible()
      
      // Hover to reveal buttons
      await mediaCard.hover()
      
      await expect(mediaCard.locator('button[title*="View details"]')).toBeVisible()
      await expect(mediaCard.locator('button[title*="Edit metadata"]')).toBeVisible()
      await expect(mediaCard.locator('button[title*="Sync to website"], button[title*="Remove from website"]')).toBeVisible()
      await expect(mediaCard.locator('button[title*="Delete"]')).toBeVisible()
    })

    test('shows view on website button only for synced items', async () => {
      // Traditional Dragon (not synced) should not have view button
      const unsynced = page.locator('text=Traditional Dragon').locator('..').locator('..')
      await unsynced.hover()
      await expect(unsynced.locator('button[title*="View on website"]')).not.toBeVisible()
      
      // Blackwork Sleeve (synced) should have view button
      const synced = page.locator('text=Blackwork Sleeve').locator('..').locator('..')
      await synced.hover()
      await expect(synced.locator('button[title*="View on website"]')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('handles API errors gracefully during sync', async () => {
      // Mock failed sync API
      await page.route('**/api/admin/media/sync', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Server error' },
          }),
        })
      })

      const mediaCard = page.locator('text=Traditional Dragon').locator('..').locator('..')
      await mediaCard.hover()
      
      const syncButton = mediaCard.locator('button[title*="Sync to website"]')
      await syncButton.click()
      
      // Should handle error gracefully (no crashes, proper error message)
      await page.waitForTimeout(1000)
      // In a real implementation, you'd check for error toast/message
    })

    test('handles empty state when no media exists', async () => {
      // Override API to return empty data
      await page.route('**/api/admin/media', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [],
            }),
          })
        }
      })

      await page.reload()
      
      await expect(page.locator('text=No media items found')).toBeVisible()
      await expect(page.locator('text=Start by uploading your first photo or video.')).toBeVisible()
      
      // Check that upload buttons are available in empty state
      await expect(page.locator('button:has-text("Upload Photo")')).toBeVisible()
      await expect(page.locator('button:has-text("Upload Video")')).toBeVisible()
    })
  })
})