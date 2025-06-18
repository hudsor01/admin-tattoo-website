/**
 * CRUD Operations Test Suite
 * Tests Create, Read, Update, Delete for all major entities
 */

import { expect, test } from '@playwright/test'

const APP_URL = process.env.APP_URL || 'http://localhost:3001'

test.describe('CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${APP_URL}/auth/login`)
    await page.fill('input[name="email"]', 'admin@ink37tattoos.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test.describe('Appointments CRUD', () => {
    let createdAppointmentId: string

    test('CREATE: New appointment with all fields', async ({ page }) => {
      await page.goto(`${APP_URL}/dashboard/appointments`)
      
      // Click new appointment button
      await page.click('button:has-text("New Appointment")')
      
      // Fill in all fields
      await page.fill('input[name="date"]', '2024-12-30')
      await page.fill('input[name="time"]', '14:00')
      await page.fill('input[name="duration"]', '180') // 3 hours
      
      // Select client (should have real clients in dropdown)
      const clientOptions = await page.locator('select[name="clientId"] option').count()
      expect(clientOptions).toBeGreaterThan(1) // Should have at least one client + empty option
      await page.selectOption('select[name="clientId"]', { index: 1 })
      
      // Select artist
      const artistOptions = await page.locator('select[name="artistId"] option').count()
      expect(artistOptions).toBeGreaterThan(1) // Should have artists
      await page.selectOption('select[name="artistId"]', { index: 1 })
      
      // Select service type
      await page.selectOption('select[name="serviceType"]', 'tattoo')
      
      // Add description
      await page.fill('textarea[name="description"]', 'Full sleeve session 1 - Japanese traditional')
      
      // Add notes
      await page.fill('textarea[name="notes"]', 'Client prefers black and grey, no color')
      
      // Set deposit
      await page.fill('input[name="deposit"]', '200')
      
      // Submit
      await page.click('button[type="submit"]')
      
      // Should show success message
      await expect(page.locator('text=Appointment created successfully')).toBeVisible()
      
      // Should redirect to appointments list
      await expect(page).toHaveURL(`${APP_URL}/dashboard/appointments`)
      
      // New appointment should appear in list
      await expect(page.locator('text=Full sleeve session 1')).toBeVisible()
      
      // Capture the ID for later tests
      createdAppointmentId = await page.locator('tr:has-text("Full sleeve session 1")').getAttribute('data-appointment-id')
    })

    test('READ: View appointment details', async ({ page }) => {
      await page.goto(`${APP_URL}/dashboard/appointments`)
      
      // Click on the created appointment
      await page.click('text=Full sleeve session 1')
      
      // Should show appointment details
      await expect(page.locator('h1')).toContainText('Appointment Details')
      
      // Verify all data is displayed
      await expect(page.locator('text=December 30, 2024')).toBeVisible()
      await expect(page.locator('text=2:00 PM')).toBeVisible()
      await expect(page.locator('text=3 hours')).toBeVisible()
      await expect(page.locator('text=Japanese traditional')).toBeVisible()
      await expect(page.locator('text=$200 deposit')).toBeVisible()
      
      // Should show client info
      await expect(page.locator('[data-testid="client-name"]')).toBeVisible()
      
      // Should show artist info
      await expect(page.locator('[data-testid="artist-name"]')).toBeVisible()
    })

    test('UPDATE: Edit appointment time and notes', async ({ page }) => {
      await page.goto(`${APP_URL}/dashboard/appointments`)
      
      // Find and click edit button
      await page.locator('tr:has-text("Full sleeve session 1")').locator('button[aria-label="Edit"]').click()
      
      // Update time
      await page.fill('input[name="time"]', '16:00') // Change to 4 PM
      
      // Update notes
      await page.fill('textarea[name="notes"]', 'Client prefers black and grey, no color. Bring reference images.')
      
      // Add a status update
      await page.selectOption('select[name="status"]', 'confirmed')
      
      // Save
      await page.click('button:has-text("Save Changes")')
      
      // Should show success
      await expect(page.locator('text=Appointment updated successfully')).toBeVisible()
      
      // Verify changes reflected
      await expect(page.locator('text=4:00 PM')).toBeVisible()
      await expect(page.locator('text=Confirmed')).toBeVisible()
    })

    test('DELETE: Remove appointment with confirmation', async ({ page }) => {
      await page.goto(`${APP_URL}/dashboard/appointments`)
      
      // Find and click delete button
      await page.locator('tr:has-text("Full sleeve session 1")').locator('button[aria-label="Delete"]').click()
      
      // Should show confirmation dialog
      await expect(page.locator('text=Are you sure you want to delete this appointment?')).toBeVisible()
      
      // Confirm deletion
      await page.click('button:has-text("Delete")')
      
      // Should show success
      await expect(page.locator('text=Appointment deleted successfully')).toBeVisible()
      
      // Should be removed from list
      await expect(page.locator('text=Full sleeve session 1')).not.toBeVisible()
    })

    test('Prevent double-booking', async ({ page }) => {
      // First create an appointment
      await page.goto(`${APP_URL}/dashboard/appointments/new`)
      
      await page.fill('input[name="date"]', '2024-12-31')
      await page.fill('input[name="time"]', '10:00')
      await page.selectOption('select[name="clientId"]', { index: 1 })
      await page.selectOption('select[name="artistId"]', { index: 1 })
      await page.fill('textarea[name="description"]', 'Morning session')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Appointment created')).toBeVisible()
      
      // Try to create overlapping appointment
      await page.goto(`${APP_URL}/dashboard/appointments/new`)
      
      await page.fill('input[name="date"]', '2024-12-31')
      await page.fill('input[name="time"]', '10:30') // Overlapping time
      await page.selectOption('select[name="artistId"]', { index: 1 }) // Same artist
      await page.selectOption('select[name="clientId"]', { index: 2 }) // Different client
      
      await page.click('button[type="submit"]')
      
      // Should show error
      await expect(page.locator('text=Artist is already booked')).toBeVisible()
    })
  })

  test.describe('Customers CRUD', () => {
    let createdCustomerId: string

    test('CREATE: New customer with medical information', async ({ page }) => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      await page.click('button:has-text("Add Customer")')
      
      // Personal information
      await page.fill('input[name="firstName"]', 'John')
      await page.fill('input[name="lastName"]', 'TestCustomer')
      await page.fill('input[name="email"]', `john.test.${Date.now()}@example.com`)
      await page.fill('input[name="phone"]', '555-0199')
      await page.fill('input[name="dateOfBirth"]', '1990-06-15')
      
      // Medical information (critical for tattoo business)
      await page.fill('textarea[name="medicalConditions"]', 'Diabetes Type 2, controlled with medication')
      await page.fill('textarea[name="allergies"]', 'Latex, Red ink dye #40')
      await page.fill('textarea[name="medications"]', 'Metformin 500mg daily')
      
      // Emergency contact
      await page.fill('input[name="emergencyContactName"]', 'Jane TestCustomer')
      await page.fill('input[name="emergencyContactPhone"]', '555-0198')
      await page.fill('input[name="emergencyContactRelationship"]', 'Spouse')
      
      // Consent checkboxes
      await page.check('input[name="consentToTattoo"]')
      await page.check('input[name="consentToPhotos"]')
      
      // Submit
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=Customer created successfully')).toBeVisible()
      await expect(page.locator('text=John TestCustomer')).toBeVisible()
      
      createdCustomerId = await page.locator('tr:has-text("John TestCustomer")').getAttribute('data-customer-id')
    })

    test('READ: Search and filter customers', async ({ page }) => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      // Search by name
      await page.fill('input[placeholder*="Search"]', 'John Test')
      await page.waitForTimeout(500) // Debounce
      
      await expect(page.locator('text=John TestCustomer')).toBeVisible()
      
      // Clear and search by phone
      await page.fill('input[placeholder*="Search"]', '')
      await page.fill('input[placeholder*="Search"]', '555-0199')
      await page.waitForTimeout(500)
      
      await expect(page.locator('text=John TestCustomer')).toBeVisible()
      
      // Filter by has medical conditions
      await page.click('button:has-text("Filters")')
      await page.check('input[name="hasMedicalConditions"]')
      await page.click('button:has-text("Apply")')
      
      await expect(page.locator('text=John TestCustomer')).toBeVisible()
    })

    test('READ: View customer details with medical info', async ({ page }) => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      await page.click('text=John TestCustomer')
      
      // Should show all customer details
      await expect(page.locator('h1')).toContainText('Customer Details')
      
      // Personal info
      await expect(page.locator('text=john.test')).toBeVisible()
      await expect(page.locator('text=555-0199')).toBeVisible()
      await expect(page.locator('text=June 15, 1990')).toBeVisible()
      
      // Medical info section
      await expect(page.locator('h2:has-text("Medical Information")')).toBeVisible()
      await expect(page.locator('text=Diabetes Type 2')).toBeVisible()
      await expect(page.locator('text=Latex, Red ink dye')).toBeVisible()
      
      // Emergency contact
      await expect(page.locator('text=Jane TestCustomer')).toBeVisible()
      await expect(page.locator('text=Spouse')).toBeVisible()
      
      // Appointment history
      await expect(page.locator('h2:has-text("Appointment History")')).toBeVisible()
    })

    test('UPDATE: Edit customer allergies', async ({ page }) => {
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      await page.locator('tr:has-text("John TestCustomer")').locator('button[aria-label="Edit"]').click()
      
      // Update allergies (critical medical info)
      await page.fill('textarea[name="allergies"]', 'Latex, Red ink dye #40, Nickel')
      
      // Add a note
      await page.fill('textarea[name="notes"]', 'Prefers morning appointments. Very punctual.')
      
      await page.click('button:has-text("Save Changes")')
      
      await expect(page.locator('text=Customer updated successfully')).toBeVisible()
    })

    test('Prevent deleting customer with appointments', async ({ page }) => {
      // First create an appointment for this customer
      await page.goto(`${APP_URL}/dashboard/appointments/new`)
      
      await page.selectOption('select[name="clientId"]', { label: 'John TestCustomer' })
      await page.fill('input[name="date"]', '2025-01-15')
      await page.fill('input[name="time"]', '10:00')
      await page.selectOption('select[name="artistId"]', { index: 1 })
      await page.fill('textarea[name="description"]', 'Test appointment')
      
      await page.click('button[type="submit"]')
      
      // Now try to delete the customer
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      await page.locator('tr:has-text("John TestCustomer")').locator('button[aria-label="Delete"]').click()
      
      // Should show error
      await expect(page.locator('text=Cannot delete customer with existing appointments')).toBeVisible()
    })

    test('DELETE: Remove customer without appointments', async ({ page }) => {
      // First delete the appointment
      await page.goto(`${APP_URL}/dashboard/appointments`)
      await page.locator('tr:has-text("Test appointment")').locator('button[aria-label="Delete"]').click()
      await page.click('button:has-text("Delete")')
      
      // Now delete the customer
      await page.goto(`${APP_URL}/dashboard/customers`)
      
      await page.locator('tr:has-text("John TestCustomer")').locator('button[aria-label="Delete"]').click()
      
      await expect(page.locator('text=Are you sure')).toBeVisible()
      await page.click('button:has-text("Delete")')
      
      await expect(page.locator('text=Customer deleted successfully')).toBeVisible()
      await expect(page.locator('text=John TestCustomer')).not.toBeVisible()
    })
  })

  test('Data persistence across sessions', async ({ page, context }) => {
    // Create some data
    await page.goto(`${APP_URL}/dashboard/customers/new`)
    
    const timestamp = Date.now()
    await page.fill('input[name="firstName"]', 'Persistent')
    await page.fill('input[name="lastName"]', `Test${timestamp}`)
    await page.fill('input[name="email"]', `persist${timestamp}@test.com`)
    await page.fill('input[name="phone"]', '555-9999')
    
    await page.click('button[type="submit"]')
    await expect(page.locator(`text=Persistent Test${timestamp}`)).toBeVisible()
    
    // Clear all cookies and storage (simulate new session)
    await context.clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Login again
    await page.goto(`${APP_URL}/auth/login`)
    await page.fill('input[name="email"]', 'admin@ink37tattoos.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.click('button[type="submit"]')
    
    // Check data still exists
    await page.goto(`${APP_URL}/dashboard/customers`)
    await expect(page.locator(`text=Persistent Test${timestamp}`)).toBeVisible()
  })
})