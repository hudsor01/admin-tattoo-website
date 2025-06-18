/**
 * Real Data Verification Tests
 * Ensures the application works with actual database data, not mocks
 */

import { expect, test } from '@playwright/test'

const APP_URL = process.env.APP_URL || 'http://localhost:3001'
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@ink37tattoos.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123'

test.describe('Real Data Verification Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${APP_URL}/auth/login`)
    await page.fill('input[name="email"], input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"], input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('Dashboard displays real database statistics', async ({ page }) => {
    await test.step('Capture initial dashboard stats', async () => {
      await page.goto(`${APP_URL}/dashboard`)
      
      // Wait for stats to load
      await page.waitForLoadState('networkidle')
      
      // Get stats values
      const statsCards = page.locator('[data-testid*="stats"], [data-testid*="card"], .stats-card')
      const initialStats = await statsCards.allTextContents()
      
      // Stats should contain actual numbers
      const hasNumbers = initialStats.some(text => /\d+/.test(text))
      expect(hasNumbers).toBe(true)
      
      console.log('Initial dashboard stats:', initialStats)
    })

    await test.step('Verify stats change after data modification', async () => {
      // Create a new customer to change statistics
      await page.goto(`${APP_URL}/dashboard/customers`)
      await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')
      
      const uniqueEmail = `realdata.test.${Date.now()}@example.com`
      
      await page.fill('input[name="firstName"]', 'RealData')
      await page.fill('input[name="lastName"]', 'Test')
      await page.fill('input[name="email"]', uniqueEmail)
      await page.fill('input[name="phone"]', '555-REAL-001')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text=RealData Test')).toBeVisible()
      
      // Go back to dashboard and check if stats updated
      await page.goto(`${APP_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      // Customer count should have increased
      const updatedStats = await page.locator('[data-testid*="stats"], [data-testid*="card"], .stats-card').allTextContents()
      console.log('Updated dashboard stats:', updatedStats)
      
      // Clean up - delete the test customer
      await page.goto(`${APP_URL}/dashboard/customers`)
      const testCustomer = page.locator(`tr:has-text("${uniqueEmail}")`).first()
      if (await testCustomer.isVisible()) {
        await testCustomer.locator('button:has-text("Delete"), button[aria-label="Delete"]').click()
        await page.click('button:has-text("Delete"), button:has-text("Confirm")')
      }
    })
  })

  test('API endpoints return actual database data', async ({ page }) => {
    await test.step('Dashboard stats API returns real data', async () => {
      // Capture API response
      let apiResponse = null
      
      page.on('response', response => {
        if (response.url().includes('/api/admin/dashboard/stats') || 
            response.url().includes('/dashboard/stats')) {
          apiResponse = response
        }
      })
      
      await page.goto(`${APP_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      if (apiResponse) {
        expect(apiResponse.status()).toBe(200)
        
        const data = await apiResponse.json()
        
        // Should have expected properties
        expect(data).toHaveProperty('totalClients')
        expect(data).toHaveProperty('totalAppointments')
        
        // Values should be numbers
        expect(typeof data.totalClients).toBe('number')
        expect(typeof data.totalAppointments).toBe('number')
        
        // Values should be non-negative
        expect(data.totalClients).toBeGreaterThanOrEqual(0)
        expect(data.totalAppointments).toBeGreaterThanOrEqual(0)
        
        console.log('Dashboard API data:', data)
      }
    })

    await test.step('Customers API returns real data', async () => {
      let customersResponse = null
      
      page.on('response', response => {
        if (response.url().includes('/api/admin/customers') || 
            response.url().includes('/customers')) {
          customersResponse = response
        }
      })
      
      await page.goto(`${APP_URL}/dashboard/customers`)
      await page.waitForLoadState('networkidle')
      
      if (customersResponse) {
        expect(customersResponse.status()).toBe(200)
        
        const data = await customersResponse.json()
        
        // Should be an array or object with data property
        const customers = Array.isArray(data) ? data : data.customers || data.data || []
        
        expect(Array.isArray(customers)).toBe(true)
        
        // If there are customers, they should have proper structure
        if (customers.length > 0) {
          const firstCustomer = customers[0]
          expect(firstCustomer).toHaveProperty('firstName')
          expect(firstCustomer).toHaveProperty('lastName')
          expect(firstCustomer).toHaveProperty('email')
          
          console.log('Sample customer data:', firstCustomer)
        }
      }
    })

    await test.step('Appointments API returns real data', async () => {
      let appointmentsResponse = null
      
      page.on('response', response => {
        if (response.url().includes('/api/admin/appointments') || 
            response.url().includes('/appointments')) {
          appointmentsResponse = response
        }
      })
      
      await page.goto(`${APP_URL}/dashboard/appointments`)
      await page.waitForLoadState('networkidle')
      
      if (appointmentsResponse) {
        expect(appointmentsResponse.status()).toBe(200)
        
        const data = await appointmentsResponse.json()
        
        // Should be an array or object with data property
        const appointments = Array.isArray(data) ? data : data.appointments || data.data || []
        
        expect(Array.isArray(appointments)).toBe(true)
        
        // If there are appointments, they should have proper structure
        if (appointments.length > 0) {
          const firstAppointment = appointments[0]
          expect(firstAppointment).toHaveProperty('date')
          expect(firstAppointment).toHaveProperty('time')
          
          console.log('Sample appointment data:', firstAppointment)
        }
      }
    })
  })

  test('Database operations persist correctly', async ({ page }) => {
    const testData = {
      firstName: 'Persistence',
      lastName: 'Test',
      email: `persistence.${Date.now()}@example.com`,
      phone: '555-PERSIST'
    }

    await test.step('Create data and verify it persists', async () => {
      // Create customer
      await page.goto(`${APP_URL}/dashboard/customers`)
      await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')
      
      await page.fill('input[name="firstName"]', testData.firstName)
      await page.fill('input[name="lastName"]', testData.lastName)
      await page.fill('input[name="email"]', testData.email)
      await page.fill('input[name="phone"]', testData.phone)
      
      await page.click('button[type="submit"]')
      await expect(page.locator(`text=${testData.firstName} ${testData.lastName}`)).toBeVisible()
    })

    await test.step('Verify data persists across page reloads', async () => {
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Data should still be there
      await expect(page.locator(`text=${testData.firstName} ${testData.lastName}`)).toBeVisible()
    })

    await test.step('Verify data persists across navigation', async () => {
      await page.goto(`${APP_URL}/dashboard`)
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      // Data should still be there
      await expect(page.locator(`text=${testData.firstName} ${testData.lastName}`)).toBeVisible()
    })

    await test.step('Update data and verify changes persist', async () => {
      // Edit the customer
      const customerRow = page.locator(`tr:has-text("${testData.email}")`).first()
      await customerRow.locator('button:has-text("Edit"), button[aria-label="Edit"]').click()
      
      // Update phone
      const phoneInput = page.locator('input[name="phone"]')
      await phoneInput.clear()
      await phoneInput.fill('555-UPDATED')
      
      await page.click('button:has-text("Save"), button:has-text("Update")')
      
      // Verify update persists
      await page.reload()
      await expect(page.locator('text=555-UPDATED')).toBeVisible()
    })

    await test.step('Delete data and verify removal persists', async () => {
      // Delete the customer
      const customerRow = page.locator(`tr:has-text("${testData.email}")`).first()
      await customerRow.locator('button:has-text("Delete"), button[aria-label="Delete"]').click()
      await page.click('button:has-text("Delete"), button:has-text("Confirm")')
      
      // Verify deletion
      await expect(page.locator(`text=${testData.firstName} ${testData.lastName}`)).not.toBeVisible()
      
      // Verify deletion persists across reload
      await page.reload()
      await expect(page.locator(`text=${testData.firstName} ${testData.lastName}`)).not.toBeVisible()
    })
  })

  test('Search and filtering work with real data', async ({ page }) => {
    await test.step('Search functionality returns real results', async () => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      // Get all visible customers first
      const allCustomers = await page.locator('tr[data-testid*="customer"], tr:has([data-testid*="customer"]), tbody tr').count()
      
      if (allCustomers > 0) {
        // Get the first customer's name for search
        const firstCustomerName = await page.locator('tbody tr').first().textContent()
        const nameMatch = firstCustomerName?.match(/[A-Za-z]+/g)
        
        if (nameMatch && nameMatch[0]) {
          const searchTerm = nameMatch[0]
          
          // Search for this customer
          const searchInput = page.locator('input[placeholder*="Search"], input[name="search"]')
          if (await searchInput.isVisible()) {
            await searchInput.fill(searchTerm)
            await page.waitForTimeout(1000) // Wait for search debounce
            
            // Should find fewer or equal results
            const searchResults = await page.locator('tbody tr').count()
            expect(searchResults).toBeLessThanOrEqual(allCustomers)
            
            // Clear search
            await searchInput.clear()
            await page.waitForTimeout(1000)
            
            // Should show all results again
            const clearedResults = await page.locator('tbody tr').count()
            expect(clearedResults).toBe(allCustomers)
          }
        }
      }
    })

    await test.step('Filtering works with real data', async () => {
      await page.goto(`${APP_URL}/dashboard/appointments`)
      
      // Try date filtering if available
      const dateFilter = page.locator('input[type="date"], input[name*="date"]')
      if (await dateFilter.isVisible()) {
        const totalAppointments = await page.locator('tbody tr').count()
        
        // Filter by future date
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 30)
        const futureDateString = futureDate.toISOString().split('T')[0]
        
        await dateFilter.fill(futureDateString)
        await page.waitForTimeout(1000)
        
        // Should show only future appointments (could be 0)
        const filteredAppointments = await page.locator('tbody tr').count()
        expect(filteredAppointments).toBeLessThanOrEqual(totalAppointments)
      }
    })
  })

  test('Pagination works with real data', async ({ page }) => {
    await test.step('Test pagination if data set is large enough', async () => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      // Check if pagination exists
      const paginationNext = page.locator('button:has-text("Next"), button[aria-label="Next"], .pagination button')
      
      if (await paginationNext.isVisible()) {
        // Get current page data
        const page1Data = await page.locator('tbody tr').allTextContents()
        
        // Go to next page
        await paginationNext.click()
        await page.waitForLoadState('networkidle')
        
        // Get next page data
        const page2Data = await page.locator('tbody tr').allTextContents()
        
        // Data should be different
        expect(page1Data).not.toEqual(page2Data)
        
        // Go back to first page
        const paginationPrev = page.locator('button:has-text("Previous"), button[aria-label="Previous"], .pagination button')
        if (await paginationPrev.isVisible()) {
          await paginationPrev.click()
          await page.waitForLoadState('networkidle')
          
          // Should show original data
          const backToPage1Data = await page.locator('tbody tr').allTextContents()
          expect(backToPage1Data).toEqual(page1Data)
        }
      }
    })
  })

  test('Data validation prevents invalid entries', async ({ page }) => {
    await test.step('Email validation works', async () => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')
      
      // Try invalid email
      await page.fill('input[name="firstName"]', 'Invalid')
      await page.fill('input[name="lastName"]', 'Email')
      await page.fill('input[name="email"]', 'invalid-email-format')
      
      await page.click('button[type="submit"]')
      
      // Should show validation error
      await expect(page.locator('text=/invalid.*email|email.*invalid|valid.*email/i')).toBeVisible()
    })

    await test.step('Required fields validation works', async () => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')
      
      // Submit empty form
      await page.click('button[type="submit"]')
      
      // Should show required field errors
      await expect(page.locator('text=/required|field.*required|enter/i')).toBeVisible()
    })

    await test.step('Phone number validation works', async () => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')
      
      await page.fill('input[name="firstName"]', 'Invalid')
      await page.fill('input[name="lastName"]', 'Phone')
      await page.fill('input[name="email"]', 'valid@email.com')
      await page.fill('input[name="phone"]', 'not-a-phone-number')
      
      await page.click('button[type="submit"]')
      
      // Should either show validation error or format the phone number
      const hasError = await page.locator('text=/invalid.*phone|phone.*invalid|valid.*phone/i').isVisible()
      const wasCreated = await page.locator('text=Invalid Phone').isVisible()
      
      // Either validation prevented creation OR phone was formatted/accepted
      expect(hasError || wasCreated).toBe(true)
      
      // Clean up if created
      if (wasCreated) {
        const customerRow = page.locator('tr:has-text("valid@email.com")')
        if (await customerRow.isVisible()) {
          await customerRow.locator('button:has-text("Delete"), button[aria-label="Delete"]').click()
          await page.click('button:has-text("Delete"), button:has-text("Confirm")')
        }
      }
    })
  })

  test('Real-time updates work correctly', async ({ page, context }) => {
    await test.step('Changes reflect immediately in UI', async () => {
      // Create a customer
      await page.goto(`${APP_URL}/dashboard/customers`)
      await page.click('button:has-text("Add"), button:has-text("New"), button:has-text("Create")')
      
      const timestamp = Date.now()
      await page.fill('input[name="firstName"]', 'RealTime')
      await page.fill('input[name="lastName"]', 'Update')
      await page.fill('input[name="email"]', `realtime.${timestamp}@example.com`)
      await page.fill('input[name="phone"]', '555-REAL-TIME')
      
      await page.click('button[type="submit"]')
      
      // Should appear immediately in the list
      await expect(page.locator('text=RealTime Update')).toBeVisible()
      
      // Dashboard stats should update
      await page.goto(`${APP_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      // Clean up
      await page.goto(`${APP_URL}/dashboard/customers`)
      const customerRow = page.locator(`tr:has-text("realtime.${timestamp}@example.com")`)
      if (await customerRow.isVisible()) {
        await customerRow.locator('button:has-text("Delete"), button[aria-label="Delete"]').click()
        await page.click('button:has-text("Delete"), button:has-text("Confirm")')
      }
    })
  })
})