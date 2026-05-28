import { expect, test } from '@playwright/test'

test.describe('Authentication Flow E2E', () => {
  // E2E tests run against the actual application
  // No need for setup() as playwright.config.ts handles webServer

  test('should display login page for unauthenticated users', async ({ page }) => {
    await page.goto('http://localhost:23242/dashboard')

    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/auth\/login/)

    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle login flow with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:23242/auth/login')

    // Fill login form
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/\/dashboard/)

    // Check if user is authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:23242/auth/login')

    // Fill login form with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit form
    await page.click('button[type="submit"]')

    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test('should handle logout flow', async ({ page }) => {
    // First login
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)

    // Click logout button
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')

    // Should redirect to home page
    await expect(page).toHaveURL('http://localhost:23242/')

    // Try to access protected route - should redirect to login
    await page.goto('http://localhost:23242/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should persist session across page reloads', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)

    // Reload page
    await page.reload()

    // Should still be authenticated
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle remember me functionality', async ({ page }) => {
    await page.goto('http://localhost:23242/auth/login')

    // Fill form and check remember me
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('#remember')

    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/)

    // Check if remember me cookie is set
    const cookies = await page.context().cookies()
    const rememberCookie = cookies.find(cookie => cookie.name.includes('remember'))
    expect(rememberCookie).toBeDefined()
  })
})
