import { test, expect } from '@playwright/test'

test.describe('Buttons and Interactions', () => {
  test('should open the filter menu on the problems page', async ({ page }) => {
    await page.goto('/problems')
    await page.getByTestId('filter-button').click()
    await expect(page.getByTestId('filter-menu')).toBeVisible()
  })

  test('should open the sort menu on the problems page', async ({ page }) => {
    await page.goto('/problems')
    await page.getByTestId('sort-button').click()
    await expect(page.getByTestId('sort-menu')).toBeVisible()
  })

  test('should show search results when using the search bar', async ({
    page,
  }) => {
    await page.goto('/problems')
    await page.getByPlaceholder('Search problems').fill('Two Sum')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Two Sum')).toBeVisible()
  })
})
