import { test, expect } from '@playwright/test'

test.describe('Authentication with Keycloak', () => {
  // Test that a protected route redirects to Keycloak
  test('should redirect to Keycloak login page when trying to access a protected route', async ({
    page,
  }) => {
    await page.goto('/profile/me')
    // The app first redirects to /login, which then redirects to Keycloak.
    // We wait for the final URL to be the Keycloak one.
    await page.waitForURL(/.*localhost:8090.*/)
    // Now we can assert that the URL is correct.
    await expect(page).toHaveURL(/.*localhost:8090.*/)
  })

  // Test successful login
  test('should allow a user to log in via Keycloak', async ({ page }) => {
    await page.goto('/login')

    // Wait for the Keycloak page to load
    await page.waitForURL(/.*localhost:8090.*/)

    // Fill in credentials on the Keycloak page
    await page.locator('#email').fill('your-email@example.com') // Changed from #username to #email
    await page.locator('#password').fill('your-password')
    await page.getByRole('button', { name: 'Sign In' }).click() // Made specific to 'Sign In'

    // After successful login, Keycloak should redirect back to the app
    // and the user should be on their profile page.
    await expect(page).toHaveURL('/profile/me')
    // You might want to check for an element that confirms login without being user-specific
    await expect(
      page.getByRole('heading', { name: /My Profile/i })
    ).toBeVisible()
  })

  // Test login with invalid credentials
  test('should show an error message with invalid credentials on Keycloak page', async ({
    page,
  }) => {
    await page.goto('/login')

    // Wait for the Keycloak page to load
    await page.waitForURL(/.*localhost:8090.*/)

    // Fill in invalid credentials
    await page.locator('#email').fill('wrong@example.com') // Changed from #username to #email
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click() // Made specific to 'Sign In'

    // Expect an error message to be visible on the Keycloak page
    // This text might be different in your Keycloak setup
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })
})
