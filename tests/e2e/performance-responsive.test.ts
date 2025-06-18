/**
 * Performance and Responsive Design Tests
 * Ensures the app is fast and works on all devices
 */

import { devices, expect, test } from '@playwright/test'

const APP_URL = process.env.APP_URL || 'http://localhost:3001'

test.describe('Performance Tests', () => {
  test('Dashboard loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${APP_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000)
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals = {
            lcp: 0,
            fid: 0,
            cls: 0,
            ttfb: 0
          }
          
          entries.forEach(entry => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime
            }
            if (entry.entryType === 'layout-shift') {
              vitals.cls += entry.value
            }
          })
          
          resolve(vitals)
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
        
        // Trigger some interactions to measure
        setTimeout(() => {
          document.body.click()
        }, 100)
      })
    })
    
    // Google's recommended thresholds
    expect(metrics.lcp).toBeLessThan(2500) // LCP < 2.5s is good
    expect(metrics.fid).toBeLessThan(100)  // FID < 100ms is good
    expect(metrics.cls).toBeLessThan(0.1)  // CLS < 0.1 is good
  })

  test('Navigation between pages is under 1 second', async ({ page }) => {
    // Login first
    await page.goto(`${APP_URL}/dashboard`)
    
    const routes = [
      '/dashboard/appointments',
      '/dashboard/customers',
      '/dashboard/analytics',
      '/dashboard/media'
    ]
    
    for (const route of routes) {
      const startTime = Date.now()
      await page.click(`a[href="${route}"]`)
      await page.waitForLoadState('domcontentloaded')
      const navTime = Date.now() - startTime
      
      expect(navTime).toBeLessThan(1000)
    }
  })

  test('Handles 100+ items without performance degradation', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard/appointments`)
    
    // Measure initial render time
    const startTime = Date.now()
    await page.waitForSelector('[data-testid="appointments-table"]')
    const initialLoadTime = Date.now() - startTime
    
    // Scroll to load more (if pagination/virtualization)
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    
    // Check if virtualization is working (not all items in DOM)
    const visibleRows = await page.locator('tr[data-testid="appointment-row"]').count()
    const totalCount = await page.locator('[data-testid="total-count"]').textContent()
    
    // If we have 100+ items but only showing a subset, virtualization is working
    if (parseInt(totalCount) > 100) {
      expect(visibleRows).toBeLessThan(50) // Should use virtualization
    }
    
    // Interaction should still be fast
    const interactionStart = Date.now()
    await page.click('tr[data-testid="appointment-row"]:first-child')
    const interactionTime = Date.now() - interactionStart
    expect(interactionTime).toBeLessThan(200)
  })
})

test.describe('Responsive Design Tests', () => {
  // Test different devices
  const testDevices = [
    { name: 'iPhone 13', device: devices['iPhone 13'] },
    { name: 'iPhone SE', device: devices['iPhone SE'] },
    { name: 'iPad Pro', device: devices['iPad Pro'] },
    { name: 'Galaxy S9+', device: devices['Galaxy S9+'] },
    { name: 'Desktop Chrome', viewport: { width: 1920, height: 1080 } },
    { name: 'Small Laptop', viewport: { width: 1366, height: 768 } }
  ]

  testDevices.forEach(({ name, device, viewport }) => {
    test(`Renders correctly on ${name}`, async ({ browser }) => {
      const context = await browser.newContext({
        ...device,
        ...viewport && { viewport }
      })
      const page = await context.newPage()
      
      await page.goto(`${APP_URL}/dashboard`)
      
      // Take screenshot for visual comparison
      await page.screenshot({
        path: `./test-results/responsive-${name.replace(/\s+/g, '-')}.png`,
        fullPage: true
      })
      
      // Check for horizontal scroll (shouldn't exist)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
      
      // Check text is readable (font size appropriate)
      const bodyFontSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize
      })
      const fontSize = parseInt(bodyFontSize)
      expect(fontSize).toBeGreaterThanOrEqual(14) // Minimum readable size
      
      // Mobile specific checks
      if (device || viewport?.width < 768) {
        // Hamburger menu should be visible
        await expect(page.locator('[aria-label="Menu"]')).toBeVisible()
        
        // Sidebar should be hidden initially
        await expect(page.locator('aside[data-testid="sidebar"]')).toBeHidden()
        
        // Clicking hamburger should show sidebar
        await page.click('[aria-label="Menu"]')
        await expect(page.locator('aside[data-testid="sidebar"]')).toBeVisible()
        
        // Should have overlay to close sidebar
        await page.click('[data-testid="sidebar-overlay"]')
        await expect(page.locator('aside[data-testid="sidebar"]')).toBeHidden()
      } else {
        // Desktop: sidebar should be visible
        await expect(page.locator('aside[data-testid="sidebar"]')).toBeVisible()
      }
      
      await context.close()
    })
  })

  test('Handles rapid window resizing without breaking', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`)
    
    const sizes = [
      { width: 1920, height: 1080 },
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1366, height: 768 },
      { width: 414, height: 896 }
    ]
    
    // Rapidly resize
    for (let i = 0; i < 3; i++) {
      for (const size of sizes) {
        await page.setViewportSize(size)
        await page.waitForTimeout(100) // Small delay to let CSS transitions happen
        
        // Check no elements are cut off
        const overflowingElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('*')
          const overflowing = []
          
          elements.forEach(el => {
            const rect = el.getBoundingClientRect()
            if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
              overflowing.push({
                tag: el.tagName,
                class: el.className,
                rect
              })
            }
          })
          
          return overflowing
        })
        
        expect(overflowingElements).toHaveLength(0)
      }
    }
  })

  test('Touch interactions work on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
      hasTouch: true
    })
    const page = await context.newPage()
    
    await page.goto(`${APP_URL}/dashboard`)
    
    // Test swipe gestures if implemented
    const sidebar = page.locator('aside[data-testid="sidebar"]')
    
    // Swipe from left edge to open sidebar
    await page.touchscreen.swipe({
      startX: 0,
      startY: 300,
      endX: 200,
      endY: 300,
      steps: 10
    })
    
    // Sidebar should be visible after swipe
    await expect(sidebar).toBeVisible()
    
    // Tap outside to close
    await page.touchscreen.tap(300, 300)
    await expect(sidebar).toBeHidden()
    
    // Test pinch to zoom is disabled (for app-like experience)
    const initialScale = await page.evaluate(() => window.visualViewport.scale)
    
    // Attempt pinch zoom
    await page.touchscreen.pinch({
      x: 200,
      y: 200,
      scaleFactor: 2
    })
    
    const newScale = await page.evaluate(() => window.visualViewport.scale)
    expect(newScale).toBe(initialScale) // Should not zoom
    
    await context.close()
  })

  test('Forms are usable on mobile', async ({ browser }) => {
    const context = await browser.newContext(devices['iPhone 13'])
    const page = await context.newPage()
    
    await page.goto(`${APP_URL}/dashboard/appointments/new`)
    
    // Check form inputs are properly sized for touch
    const inputs = await page.locator('input, select, textarea').all()
    
    for (const input of inputs) {
      const box = await input.boundingBox()
      // Minimum touch target size is 44x44 (Apple HIG)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    
    // Test that tapping input brings up appropriate keyboard
    await page.tap('input[type="email"]')
    // Can't directly test keyboard, but check input is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBe('INPUT')
    
    await context.close()
  })
})

test.describe('Component Overlap and Spacing', () => {
  test('No components overlap at any screen size', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto(`${APP_URL}/dashboard`)
      
      // Get all major components
      const components = await page.evaluate(() => {
        const selectors = [
          '[data-testid="header"]',
          '[data-testid="sidebar"]',
          '[data-testid="main-content"]',
          '[data-testid="stats-cards"]',
          '[data-testid="charts"]'
        ]
        
        return selectors.map(selector => {
          const el = document.querySelector(selector)
          if (!el) return null
          const rect = el.getBoundingClientRect()
          return { selector, rect }
        }).filter(Boolean)
      })
      
      // Check for overlaps
      for (let i = 0; i < components.length; i++) {
        for (let j = i + 1; j < components.length; j++) {
          const a = components[i].rect
          const b = components[j].rect
          
          const overlap = !(
            a.right < b.left ||
            b.right < a.left ||
            a.bottom < b.top ||
            b.bottom < a.top
          )
          
          if (overlap) {
            console.error(`Overlap detected between ${components[i].selector} and ${components[j].selector}`)
          }
          expect(overlap).toBe(false)
        }
      }
    }
  })

  test('Consistent spacing throughout app', async ({ page }) => {
    await page.goto(`${APP_URL}/dashboard`)
    
    // Check spacing scale is consistent
    const spacings = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="p-"], [class*="m-"], [class*="gap-"]')
      const spacingValues = new Set()
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el)
        const values = [
          styles.padding,
          styles.margin,
          styles.gap
        ].filter(v => v && v !== '0px')
        
        values.forEach(v => spacingValues.add(v))
      })
      
      return Array.from(spacingValues)
    })
    
    // Should use consistent spacing scale (4px, 8px, 16px, etc.)
    const expectedScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64]
    spacings.forEach(spacing => {
      const value = parseInt(spacing)
      const isInScale = expectedScale.some(scale => value % scale === 0)
      expect(isInScale).toBe(true)
    })
  })
})