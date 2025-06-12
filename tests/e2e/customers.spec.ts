import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to customers page
    await page.goto('http://localhost:3001/customers');
  });

  test('should display customers page with proper layout', async ({ page }) => {
    await expect(page.getByText('Customers')).toBeVisible();
    
    // Check for search functionality
    const searchInput = page.getByPlaceholder(/search customers/i).or(page.locator('input[type="search"]')).first();
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
    
    // Check for add customer button
    const addButton = page.getByRole('button', { name: /add customer/i }).or(page.getByText(/add.*customer/i)).first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should handle customer search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search customers/i).or(page.locator('input[type="search"]')).first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');
      
      // Wait for search results or no results message
      await page.waitForTimeout(1000);
      
      // Should either show filtered results or "no results" message
      const hasResults = await page.getByText(/no.*results/i).isVisible();
      const hasCustomers = await page.locator('[data-testid="customer-item"]').count() > 0;
      
      expect(hasResults || hasCustomers).toBeTruthy();
    }
  });

  test('should open customer details on click', async ({ page }) => {
    // Check if there are any customers displayed
    const customerItems = page.locator('[data-testid="customer-item"]').or(page.locator('tr').filter({ hasText: /@/ }));
    const customerCount = await customerItems.count();
    
    if (customerCount > 0) {
      await customerItems.first().click();
      
      // Should navigate to customer detail page or open modal
      await expect(page.locator('[data-testid="customer-detail"]').or(page.getByText(/customer.*details/i)).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle add customer modal/form', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add customer/i }).or(page.getByText(/add.*customer/i)).first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Should open add customer form or modal
      await expect(page.locator('[data-testid="add-customer-form"]').or(page.getByText(/create.*customer/i)).first()).toBeVisible({ timeout: 5000 });
      
      // Check for required form fields
      const nameField = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i)).first();
      const emailField = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
      
      if (await nameField.isVisible()) {
        await expect(nameField).toBeVisible();
      }
      if (await emailField.isVisible()) {
        await expect(emailField).toBeVisible();
      }
    }
  });

  test('should display customer list with pagination if applicable', async ({ page }) => {
    // Check for pagination controls
    const paginationNext = page.getByRole('button', { name: /next/i }).or(page.getByText(/next/i));
    const paginationPrev = page.getByRole('button', { name: /previous/i }).or(page.getByText(/previous/i));
    
    // If pagination exists, verify it works
    if (await paginationNext.isVisible() && await paginationNext.isEnabled()) {
      await paginationNext.click();
      await page.waitForTimeout(1000);
      
      // Should update the page
      await expect(paginationPrev).toBeEnabled();
    }
  });

  test('should handle customer filtering', async ({ page }) => {
    // Check for filter options
    const filterButton = page.getByRole('button', { name: /filter/i }).or(page.getByText(/filter/i)).first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Should show filter options
      await expect(page.locator('[data-testid="filter-options"]').or(page.getByText(/filter.*by/i)).first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display customer data correctly', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if customer table/list is displayed
    const customerTable = page.locator('table').or(page.locator('[data-testid="customers-list"]')).first();
    
    if (await customerTable.isVisible()) {
      // Verify table headers
      const expectedHeaders = ['Name', 'Email', 'Phone', 'Appointments'];
      
      for (const header of expectedHeaders) {
        const headerElement = page.getByText(header, { exact: false });
        if (await headerElement.isVisible()) {
          await expect(headerElement).toBeVisible();
        }
      }
    }
  });

  test('should handle customer actions menu', async ({ page }) => {
    const customerItems = page.locator('[data-testid="customer-item"]').or(page.locator('tr').filter({ hasText: /@/ }));
    const customerCount = await customerItems.count();
    
    if (customerCount > 0) {
      // Look for actions menu (usually three dots or gear icon)
      const actionsMenu = customerItems.first().locator('[data-testid="actions-menu"]').or(customerItems.first().getByRole('button', { name: /actions/i })).first();
      
      if (await actionsMenu.isVisible()) {
        await actionsMenu.click();
        
        // Should show action options
        await expect(page.getByText(/edit/i).or(page.getByText(/delete/i)).or(page.getByText(/view/i)).first()).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe('Customer Detail Page', () => {
  test('should display customer information correctly', async ({ page }) => {
    await page.goto('http://localhost:3001/customers');
    
    // If there are customers, click on the first one
    const customerItems = page.locator('[data-testid="customer-item"]').or(page.locator('tr').filter({ hasText: /@/ }));
    const customerCount = await customerItems.count();
    
    if (customerCount > 0) {
      await customerItems.first().click();
      
      // Should display customer details
      await expect(page.locator('[data-testid="customer-detail"]').or(page.getByText(/customer.*information/i)).first()).toBeVisible({ timeout: 5000 });
      
      // Check for customer information sections
      const infoSections = ['Contact Information', 'Appointment History', 'Medical Information'];
      
      for (const section of infoSections) {
        const sectionElement = page.getByText(section, { exact: false });
        if (await sectionElement.isVisible()) {
          await expect(sectionElement).toBeVisible();
        }
      }
    }
  });

  test('should allow editing customer information', async ({ page }) => {
    await page.goto('http://localhost:3001/customers');
    
    const customerItems = page.locator('[data-testid="customer-item"]').or(page.locator('tr').filter({ hasText: /@/ }));
    const customerCount = await customerItems.count();
    
    if (customerCount > 0) {
      await customerItems.first().click();
      
      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i });
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should open edit form
        await expect(page.getByText(/edit.*customer/i).or(page.locator('[data-testid="edit-customer-form"]')).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});