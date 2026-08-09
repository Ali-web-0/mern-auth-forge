import { expect, test } from '@playwright/test'

// Single critical-path E2E flow, per SPEC.md section 8: register -> login ->
// access a protected route -> silently refresh -> logout. Everything below
// it (validation edge cases, RBAC, ownership scoping) is already covered
// by the integration tier — E2E stays intentionally narrow so it stays fast
// and doesn't become a second copy of the integration suite in a browser.

test('register, access dashboard, refresh silently on reload, then log out', async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`
  const password = 'Password1'

  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: /create account/i }).click()

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByText(email)).toBeVisible()

  // The access token lives in memory only (never localStorage) — a hard
  // reload wipes it. Staying logged in after reload proves the httpOnly
  // refresh cookie + silent /auth/refresh retry in lib/api.ts actually works
  // end to end, not just against a mocked fetch in a unit test.
  await page.reload()
  await expect(page.getByText(email)).toBeVisible()
  await expect(page).toHaveURL('/dashboard')

  await page.getByRole('button', { name: /^log out$/i }).click()
  await expect(page).toHaveURL('/login')

  // Log back in with the same credentials to prove the account persisted.
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: /^log in$/i }).click()

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByText(email)).toBeVisible()
})
