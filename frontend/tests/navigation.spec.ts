import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate to the home page when clicking the logo', async ({
    page,
  }) => {
    await page.goto('/problems')
    // Assuming the logo is a link with a specific role or text
    await page.getByRole('link', { name: 'GitCode' }).click()
    await expect(page).toHaveURL('/')
  })

  test('should navigate to the problems page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Problems' }).click()
    await expect(page).toHaveURL('/problems')
  })

  test('should navigate to the trending page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Trending' }).click()
    await expect(page).toHaveURL('/trending')
  })
})
