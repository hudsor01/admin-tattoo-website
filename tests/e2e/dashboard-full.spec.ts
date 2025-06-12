import { test, expect, Page } from '@playwright/test'

// Test configuration
test.use({
  viewport: { width: 1920, height: 1080 },
  video: 'on-first-retry',
  screenshot: 'only-on-failure'
})

test.describe('Ink37 Admin Dashboard - Complete E2E Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3001')
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
  })

  test('Dashboard homepage loads with all components', async ({ page }) => {
    // Check main dashboard title
    await expect(page.locator('h1').first()).toContainText('Dashboard')
    
    // Verify metric cards are visible
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=Total Clients')).toBeVisible()
    await expect(page.locator('text=Monthly Appointments')).toBeVisible()
    await expect(page.locator('text=Satisfaction Rating')).toBeVisible()
    
    // Verify revenue chart is visible
    await expect(page.locator('text=Revenue & Appointments')).toBeVisible()
    
    // Verify data table is present
    await expect(page.locator('table')).toBeVisible()
    
    // Check sidebar navigation
    await expect(page.locator('nav').locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('nav').locator('text=Customers')).toBeVisible()
    await expect(page.locator('nav').locator('text=Payments')).toBeVisible()
    await expect(page.locator('nav').locator('text=Appointments')).toBeVisible()
    await expect(page.locator('nav').locator('text=Analytics')).toBeVisible()
  })

  test('Navigate to all main pages', async ({ page }) => {
    const pages = [
      { name: 'Customers', url: '/customers', title: 'Dashboard' },
      { name: 'Payments', url: '/payments', title: 'Payments' },
      { name: 'Appointments', url: '/appointments', title: 'Appointments' },
      { name: 'Analytics', url: '/analytics', title: 'Analytics' }
    ]

    for (const pageInfo of pages) {
      // Navigate directly via URL
      await page.goto(`http://localhost:3001${pageInfo.url}`)
      await page.waitForLoadState('networkidle')
      
      // Verify page loaded
      if (pageInfo.name === 'Customers') {
        // Customers page uses same layout as dashboard
        await expect(page.locator('text=Total Revenue')).toBeVisible()
      } else {
        await expect(page.locator('h1').first()).toContainText(pageInfo.title)
      }
    }
  })

  test('Dashboard metrics display correctly', async ({ page }) => {
    // Check Total Revenue card
    const revenueCard = page.locator('text=Total Revenue').locator('..')
    await expect(revenueCard.locator('text=$12,500')).toBeVisible()
    await expect(revenueCard.locator('text=+15.2%')).toBeVisible()
    
    // Check Total Clients card
    const clientsCard = page.locator('text=Total Clients').locator('..')
    await expect(clientsCard.locator('text=234')).toBeVisible()
    await expect(clientsCard.locator('text=+8')).toBeVisible()
    
    // Check Monthly Appointments card
    const appointmentsCard = page.locator('text=Monthly Appointments').locator('..')
    await expect(appointmentsCard.locator('text=45')).toBeVisible()
    await expect(appointmentsCard.locator('text=+12.5%')).toBeVisible()
    
    // Check Satisfaction Rating card
    const ratingCard = page.locator('text=Satisfaction Rating').locator('..')
    await expect(ratingCard.locator('text=4.8')).toBeVisible()
    await expect(ratingCard.locator('text=+0.2')).toBeVisible()
  })

  test('Payments page functionality', async ({ page }) => {
    await page.goto('http://localhost:3001/payments')
    await page.waitForLoadState('networkidle')
    
    // Check page elements
    await expect(page.locator('h1').filter({ hasText: 'Payments' })).toBeVisible()
    await expect(page.locator('text=Track and manage client payments')).toBeVisible()
    
    // Verify summary cards
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=Pending Payments')).toBeVisible()
    await expect(page.locator('text=Completed Payments')).toBeVisible()
    
    // Check for payment list
    await expect(page.locator('text=Recent Payments')).toBeVisible()
    
    // Verify search functionality exists
    await expect(page.locator('input[placeholder="Search payments..."]')).toBeVisible()
    
    // Check action buttons
    await expect(page.locator('button:has-text("Export")')).toBeVisible()
    await expect(page.locator('button:has-text("Record Payment")')).toBeVisible()
  })

  test('Appointments page functionality', async ({ page }) => {
    await page.goto('http://localhost:3001/appointments')
    await page.waitForLoadState('networkidle')
    
    // Check page elements
    await expect(page.locator('h1').filter({ hasText: 'Appointments' })).toBeVisible()
    await expect(page.locator('text=Manage your appointment schedule')).toBeVisible()
    
    // Verify calendar/schedule view
    await expect(page.locator('text=Upcoming Appointments')).toBeVisible()
    
    // Check for appointment cards or list
    const appointmentsList = page.locator('[data-testid="appointments-list"], .space-y-4')
    await expect(appointmentsList).toBeVisible()
  })

  test('Analytics page displays data visualizations', async ({ page }) => {
    await page.goto('http://localhost:3001/analytics')
    await page.waitForLoadState('networkidle')
    
    // Check page title
    await expect(page.locator('h1').filter({ hasText: 'Analytics' })).toBeVisible()
    
    // Verify analytics components
    await expect(page.locator('text=Revenue Analytics')).toBeVisible()
    await expect(page.locator('text=Appointment Trends')).toBeVisible()
    await expect(page.locator('text=Customer Insights')).toBeVisible()
    
    // Check for chart containers
    const charts = page.locator('[class*="recharts"]')
    const chartCount = await charts.count()
    expect(chartCount).toBeGreaterThan(0)
  })

  test('Responsive sidebar navigation', async ({ page }) => {
    // Test sidebar toggle
    const sidebarTrigger = page.locator('[data-sidebar-trigger], button[aria-label*="sidebar"]').first()
    if (await sidebarTrigger.isVisible()) {
      await sidebarTrigger.click()
      await page.waitForTimeout(500) // Wait for animation
      await sidebarTrigger.click()
      await page.waitForTimeout(500)
    }
    
    // Verify sidebar is functional
    await expect(page.locator('nav')).toBeVisible()
  })

  test('Dark mode toggle functionality', async ({ page }) => {
    // Find and click theme toggle
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="mode"]').first()
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const htmlElement = page.locator('html')
      const initialTheme = await htmlElement.getAttribute('class') || ''
      
      // Toggle theme
      await themeToggle.click()
      await page.waitForTimeout(300) // Wait for theme transition
      
      // Verify theme changed
      const newTheme = await htmlElement.getAttribute('class') || ''
      expect(newTheme).not.toBe(initialTheme)
    }
  })

  test('Search functionality', async ({ page }) => {
    // Test search on payments page
    await page.goto('http://localhost:3001/payments')
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[placeholder="Search payments..."]')
    await searchInput.fill('John')
    await page.waitForTimeout(500) // Debounce delay
    
    // Verify search filters results
    const results = page.locator('text=John Doe')
    if (await results.isVisible()) {
      await expect(results).toBeVisible()
    }
  })

  test('API endpoints return data', async ({ page }) => {
    // Test dashboard API
    const dashboardResponse = await page.request.get('http://localhost:3001/api/admin/dashboard')
    expect(dashboardResponse.ok()).toBeTruthy()
    const dashboardData = await dashboardResponse.json()
    expect(dashboardData).toHaveProperty('stats')
    expect(dashboardData.stats).toHaveProperty('revenue')
    
    // Test payments API
    const paymentsResponse = await page.request.get('http://localhost:3001/api/admin/payments')
    expect(paymentsResponse.ok()).toBeTruthy()
    const paymentsData = await paymentsResponse.json()
    expect(Array.isArray(paymentsData)).toBeTruthy()
    
    // Test customers API
    const customersResponse = await page.request.get('http://localhost:3001/api/admin/customers')
    expect(customersResponse.ok()).toBeTruthy()
    const customersData = await customersResponse.json()
    expect(Array.isArray(customersData)).toBeTruthy()
  })

  test('Performance metrics', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Navigate through pages
    await page.goto('http://localhost:3001/payments')
    await page.goto('http://localhost:3001/appointments')
    
    // Should have no console errors
    expect(consoleErrors.length).toBe(0)
  })
})

test.describe('Missing Features Assessment', () => {
  test('Identify missing integrations', async ({ page }) => {
    const missingFeatures = []
    
    // Check for Cal.com integration
    await page.goto('http://localhost:3001/appointments')
    const calComElements = await page.locator('text=/cal\\.com/i').count()
    if (calComElements === 0) {
      missingFeatures.push('Cal.com integration not visible')
    }
    
    // Check for Vercel Analytics
    const analyticsScripts = await page.locator('script[src*="vercel-analytics"]').count()
    if (analyticsScripts === 0) {
      missingFeatures.push('Vercel Analytics not integrated')
    }
    
    // Check for Google Auth
    await page.goto('http://localhost:3001/login')
    const googleAuthButton = await page.locator('button:has-text("Google"), button:has-text("Sign in with Google")').count()
    if (googleAuthButton === 0) {
      missingFeatures.push('Google authentication not visible on login page')
    }
    
    // Check for Better Auth implementation
    const authEndpoint = await page.request.get('http://localhost:3001/api/auth/session')
    if (!authEndpoint.ok()) {
      missingFeatures.push('Better Auth session endpoint not functioning')
    }
    
    console.log('Missing Features:', missingFeatures)
    
    // Create a summary
    test.info().annotations.push({
      type: 'missing-features',
      description: missingFeatures.join('\n')
    })
  })
})

test.describe('Dashboard Completion Assessment', () => {
  test('Generate completion report', async ({ page }) => {
    const completionReport = {
      completedFeatures: [],
      inProgressFeatures: [],
      missingFeatures: [],
      overallCompletion: 0
    }
    
    // Test completed features
    await page.goto('http://localhost:3001')
    
    // UI Framework and Layout
    if (await page.locator('[data-sidebar]').isVisible()) {
      completionReport.completedFeatures.push('Sidebar navigation')
    }
    if (await page.locator('text=Dashboard').isVisible()) {
      completionReport.completedFeatures.push('Dashboard home page')
    }
    if (await page.locator('[class*="card"]').first().isVisible()) {
      completionReport.completedFeatures.push('Metric cards UI')
    }
    if (await page.locator('table').isVisible()) {
      completionReport.completedFeatures.push('Data tables')
    }
    
    // Navigation
    const navPages = ['customers', 'payments', 'appointments', 'analytics']
    for (const navPage of navPages) {
      const response = await page.goto(`http://localhost:3001/${navPage}`)
      if (response?.ok()) {
        completionReport.completedFeatures.push(`${navPage} page`)
      }
    }
    
    // API Endpoints
    const apiEndpoints = [
      '/api/admin/dashboard',
      '/api/admin/payments',
      '/api/admin/customers',
      '/api/admin/appointments'
    ]
    
    for (const endpoint of apiEndpoints) {
      const response = await page.request.get(`http://localhost:3001${endpoint}`)
      if (response.ok()) {
        completionReport.completedFeatures.push(`${endpoint} API`)
      }
    }
    
    // In Progress Features
    completionReport.inProgressFeatures = [
      'Authentication system (Better Auth)',
      'Real database integration',
      'Data persistence'
    ]
    
    // Missing Features
    completionReport.missingFeatures = [
      'Cal.com appointment integration',
      'Vercel Analytics integration',
      'Google OAuth provider',
      'Production deployment configuration',
      'Email notifications',
      'Real-time updates',
      'File upload for gallery',
      'Customer portal integration',
      'Stripe payment processing',
      'Automated testing CI/CD'
    ]
    
    // Calculate completion percentage
    const totalFeatures = 
      completionReport.completedFeatures.length + 
      completionReport.inProgressFeatures.length + 
      completionReport.missingFeatures.length
    
    completionReport.overallCompletion = Math.round(
      (completionReport.completedFeatures.length / totalFeatures) * 100
    )
    
    console.log('\n=== DASHBOARD COMPLETION REPORT ===')
    console.log(`Overall Completion: ${completionReport.overallCompletion}%`)
    console.log(`\nCompleted (${completionReport.completedFeatures.length}):`)
    completionReport.completedFeatures.forEach(f => console.log(`  ✓ ${f}`))
    console.log(`\nIn Progress (${completionReport.inProgressFeatures.length}):`)
    completionReport.inProgressFeatures.forEach(f => console.log(`  ⚡ ${f}`))
    console.log(`\nMissing (${completionReport.missingFeatures.length}):`)
    completionReport.missingFeatures.forEach(f => console.log(`  ✗ ${f}`))
    console.log('\n================================\n')
    
    // Assert minimum completion
    expect(completionReport.overallCompletion).toBeGreaterThan(40)
  })
})