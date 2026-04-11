import { test, expect } from '@playwright/test'

test.describe('Routing', () => {
  test('should navigate to the problems page', async ({ page }) => {
    await page.goto('/problems')
    await expect(page).toHaveURL('/problems')
  })

  test('should navigate to the trending page', async ({ page }) => {
    await page.goto('/trending')
    await expect(page).toHaveURL('/trending')
  })

  //   test('should navigate to the profile page', async ({ page }) => {
  //     await page.getByRole('button', { name: 'Open user menu' }).click()
  //     await page.getByRole('link', { name: 'Profile' }).click()
  //     await expect(page).toHaveURL(/.*\/profile\/.*/)
  //   })

  //   test('should navigate to a problem page', async ({ page }) => {
  //     await page.goto('/problems')
  //     await page.getByRole('link').first().click()
  //     await expect(page).toHaveURL(/.*\/problems\/.*/)
  //   })
})
