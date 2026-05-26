import { expect, test } from '@playwright/test'

test.describe('Permissions & Authorization E2E', () => {
  // E2E tests run against the actual application
  // No need for setup() as playwright.config.ts handles webServer

  test('should show admin content for admin users', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)

    // Navigate to admin section
    await page.goto('http://localhost:23242/dashboard/admin')

    // Should see admin content
    await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible()
    await expect(page.locator('[data-testid="system-settings"]')).toBeVisible()
  })

  test('should hide admin content for regular users', async ({ page }) => {
    // Login as regular user
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)

    // Try to access admin section
    await page.goto('http://localhost:23242/dashboard/admin')

    // Should be redirected or show access denied
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible()
    await expect(page.locator('[data-testid="admin-panel"]')).not.toBeVisible()
  })

  test('should show role-based navigation items', async ({ page }) => {
    // Login as manager
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'manager@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)

    // Check navigation items based on role
    await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-team"]')).toBeVisible()

    // Admin-only items should not be visible
    await expect(page.locator('[data-testid="nav-system-admin"]')).not.toBeVisible()
  })

  test('should handle permission-based actions', async ({ page }) => {
    // Login as user with delete permissions
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.goto('http://localhost:23242/dashboard/users')

    // Should see delete buttons for admin
    await expect(page.locator('[data-testid="delete-user-btn"]').first()).toBeVisible()

    // Logout and login as regular user
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')

    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.goto('http://localhost:23242/dashboard/users')

    // Should not see delete buttons for regular user
    await expect(page.locator('[data-testid="delete-user-btn"]')).not.toBeVisible()
  })

  test('should handle tenant-based access', async ({ page }) => {
    // Login to tenant A
    await page.goto('http://localhost:23242/auth/login?tenant=tenant-a')
    await page.fill('input[type="email"]', 'user@tenant-a.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)

    // Should see tenant A data
    await expect(page.locator('[data-testid="tenant-name"]')).toContainText('Tenant A')

    // Try to access tenant B data
    await page.goto('http://localhost:23242/dashboard/data?tenant=tenant-b')

    // Should be denied or redirected
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible()
  })

  test('should handle permission directive in components', async ({ page }) => {
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.goto('http://localhost:23242/dashboard/settings')

    // Elements with v-permission directive should be visible for admin
    await expect(page.locator('[data-permission="canManageSettings"]')).toBeVisible()
    await expect(page.locator('[data-permission="canDeleteUsers"]')).toBeVisible()

    // Logout and login as regular user
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')

    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.goto('http://localhost:23242/dashboard/settings')

    // Elements should be hidden for regular user
    await expect(page.locator('[data-permission="canManageSettings"]')).not.toBeVisible()
    await expect(page.locator('[data-permission="canDeleteUsers"]')).not.toBeVisible()
  })

  test('should handle role guard components', async ({ page }) => {
    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'manager@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.goto('http://localhost:23242/dashboard/reports')

    // Manager-only content should be visible
    await expect(page.locator('[data-role="manager"]')).toBeVisible()
    await expect(page.locator('[data-role="admin"]')).not.toBeVisible()

    // Logout and login as admin
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')

    await page.goto('http://localhost:23242/auth/login')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.goto('http://localhost:23242/dashboard/reports')

    // Both manager and admin content should be visible for admin
    await expect(page.locator('[data-role="manager"]')).toBeVisible()
    await expect(page.locator('[data-role="admin"]')).toBeVisible()
  })
})
