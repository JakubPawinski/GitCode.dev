import { test, expect } from '@playwright/test'
import { testRegister } from './e2e/components/auth/testRegister'

test.describe('Authentication with Keycloak', () => {
  test('should redirect to /login when trying to access a protected route and then to Keycloak', async ({
    page,
  }) => {
    await page.goto('/problems')
    await expect(page).toHaveURL('/login')

    await page.getByRole('button', { name: 'Sign In' }).click()

    await page.waitForURL(/.*localhost:8090.*/)

    await expect(page.url()).toContain('localhost:8090')
  })

  test('should allow a user to log in via Keycloak', async ({ page }) => {
    await testRegister({ page })

    await expect(page).toHaveURL('/problems')
  })

  test('should show an error message with invalid credentials on Keycloak page', async ({
    page,
  }) => {
    await expect(page.getByText('Invalid username or password')).toBeVisible()
  })
  test('should show an error message with invalid credentials on Keycloak register page', async ({
    page,
  }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL(/.*localhost:8090.*/)

    await page.getByRole('link', { name: 'Register' }).click()

    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page.getByText('Please specify first name.')).toBeVisible()
    await expect(page.getByText('Please specify last name.')).toBeVisible()
    await expect(page.getByText('Please specify email.')).toBeVisible()
    await expect(page.getByText('Please specify password.')).toBeVisible()
  })
})
