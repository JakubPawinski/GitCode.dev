import { testPassword, testUsername } from '@/tests/consts/testConstants'
import { Page } from '@playwright/test'

export const testLogin = async ({ page }: { page: Page }) => {
  await page.goto('/login')

  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.waitForURL(/.*localhost:8090.*/)

  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.locator('#username').fill(testUsername)
  await page.locator('#password').fill(testPassword)
}
