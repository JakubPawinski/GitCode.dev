import { expect, test as setup } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.auth/auth.json')
setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:3000')

  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.waitForURL(/.*localhost:8090.*/)

  await page.click('text=GitHub')

  await page.waitForURL(/.*github.com.*/)

  await page.fill('#login_field', process.env.GITHUB_USER!)
  await page.fill('#password', process.env.GITHUB_PASS!)

  await page.click('input[type="submit"]')

  const authorizeButton = page.getByRole('button', { name: /authorize/i })

  if ((await authorizeButton.count()) > 0) {
    await authorizeButton.click()
  }

  await expect(page).toHaveURL('/problems')
  await page.context().storageState({ path: authFile })
})
