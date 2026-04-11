import {
  testEmail,
  testFirstName,
  testLastName,
  testPassword,
} from '@/tests/e2e/consts/testConstants'
import { expect, Page } from '@playwright/test'

export const testRegister = async ({ page }: { page: Page }) => {
  await page.goto('/login')

  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.waitForURL(/.*localhost:8090.*/)

  await page.getByRole('link', { name: 'Register' }).click()

  await page.locator('#firstName').fill(testFirstName)
  await page.locator('#lastName').fill(testLastName)
  await page.locator('#email').fill(testEmail)
  await page.locator('#password').fill(testPassword)
  await page.locator('#password-confirm').fill(testPassword)
  await page.getByRole('button', { name: 'Register' }).click()

  await expect(page).toHaveURL('/problems')
}
