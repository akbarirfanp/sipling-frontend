import { expect, test } from '@playwright/test'

test.describe('Navigation & UI E2E', () => {
  // E2E tests run against the actual application
  // No need for setup() as playwright.config.ts handles webServer

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should navigate through main menu items', async ({ page }) => {
    // Test dashboard navigation
    await page.click('[data-testid="nav-dashboard"]')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Test users navigation
    await page.click('[data-testid="nav-users"]')
    await expect(page).toHaveURL(/\/dashboard\/users/)
    await expect(page.locator('h1')).toContainText('Users')

    // Test settings navigation
    await page.click('[data-testid="nav-settings"]')
    await expect(page).toHaveURL(/\/dashboard\/settings/)
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('should handle sidebar collapse/expand', async ({ page }) => {
    // Check if sidebar is expanded by default
    await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/expanded/)

    // Click collapse button
    await page.click('[data-testid="sidebar-toggle"]')

    // Check if sidebar is collapsed
    await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/collapsed/)

    // Click expand button
    await page.click('[data-testid="sidebar-toggle"]')

    // Check if sidebar is expanded again
    await expect(page.locator('[data-testid="sidebar"]')).toHaveClass(/expanded/)
  })

  test('should display breadcrumb navigation', async ({ page }) => {
    // Navigate to nested page
    await page.goto('/dashboard/users/123')

    // Check breadcrumb items
    await expect(page.locator('[data-testid="breadcrumb"]')).toBeVisible()
    await expect(page.locator('[data-testid="breadcrumb-item"]').first()).toContainText('Dashboard')
    await expect(page.locator('[data-testid="breadcrumb-item"]').nth(1)).toContainText('Users')
    await expect(page.locator('[data-testid="breadcrumb-item"]').last()).toContainText('User Details')

    // Click breadcrumb item to navigate
    await page.click('[data-testid="breadcrumb-item"]:has-text("Users")')
    await expect(page).toHaveURL(/\/dashboard\/users/)
  })

  test('should handle dark/light mode toggle', async ({ page }) => {
    // Check current theme
    const htmlElement = page.locator('html')

    // Toggle theme
    await page.click('[data-testid="theme-toggle"]')

    // Wait for theme change
    await page.waitForTimeout(500)

    // Check if theme class changed
    const themeClass = await htmlElement.getAttribute('class')
    expect(themeClass).toMatch(/(dark|light)/)

    // Toggle again
    await page.click('[data-testid="theme-toggle"]')
    await page.waitForTimeout(500)

    // Theme should change back
    const newThemeClass = await htmlElement.getAttribute('class')
    expect(newThemeClass).not.toBe(themeClass)
  })

  test('should handle user menu dropdown', async ({ page }) => {
    // Click user menu
    await page.click('[data-testid="user-menu"]')

    // Check dropdown items
    await expect(page.locator('[data-testid="user-dropdown"]')).toBeVisible()
    await expect(page.locator('[data-testid="profile-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="settings-link"]')).toBeVisible()
    await expect(page.locator('[data-testid="logout-button"]')).toBeVisible()

    // Click profile link
    await page.click('[data-testid="profile-link"]')
    await expect(page).toHaveURL(/\/profile/)
  })

  test('should handle responsive navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Mobile menu should be hidden by default
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()

    // Click mobile menu toggle
    await page.click('[data-testid="mobile-menu-toggle"]')

    // Mobile menu should be visible
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // Click menu item
    await page.click('[data-testid="mobile-nav-users"]')

    // Should navigate and close menu
    await expect(page).toHaveURL(/\/dashboard\/users/)
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()
  })

  test('should handle search functionality', async ({ page }) => {
    await page.goto('/dashboard/users')

    // Click search input
    await page.click('[data-testid="search-input"]')

    // Type search query
    await page.fill('[data-testid="search-input"]', 'john')

    // Press enter or click search button
    await page.press('[data-testid="search-input"]', 'Enter')

    // Check if search results are displayed
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-item"]')).toContainText('john')
  })

  test('should handle pagination', async ({ page }) => {
    await page.goto('/dashboard/users')

    // Check pagination controls
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible()
    await expect(page.locator('[data-testid="page-info"]')).toBeVisible()

    // Click next page
    await page.click('[data-testid="next-page"]')

    // Check if page changed
    await expect(page.locator('[data-testid="page-info"]')).toContainText('Page 2')

    // Click previous page
    await page.click('[data-testid="prev-page"]')

    // Should be back to page 1
    await expect(page.locator('[data-testid="page-info"]')).toContainText('Page 1')
  })

  test('should handle loading states', async ({ page }) => {
    // Navigate to page that shows loading
    await page.goto('/dashboard/reports')

    // Should show loading spinner initially
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()

    // Wait for content to load
    await page.waitForSelector('[data-testid="reports-content"]', { timeout: 10000 })

    // Loading spinner should be hidden
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()

    // Content should be visible
    await expect(page.locator('[data-testid="reports-content"]')).toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    // Navigate to page that might show error
    await page.goto('/dashboard/invalid-page')

    // Should show 404 error
    await expect(page.locator('[data-testid="error-404"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Page Not Found')

    // Click back to dashboard
    await page.click('[data-testid="back-to-dashboard"]')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
