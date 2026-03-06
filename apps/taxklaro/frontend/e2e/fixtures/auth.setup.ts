import { test as setup } from '@playwright/test';
import { TEST_USER } from './test-data';

// Creates a real user in Supabase and saves auth state to disk.
// Requires Supabase local dev with email auto-confirm enabled.
// In CI against production Supabase, use admin API to confirm email.

setup('create authenticated session', async ({ page }) => {
  await page.goto('/auth?mode=signup');

  await page.getByLabel('Full Name').fill(TEST_USER.fullName);
  await page.getByLabel('Firm Name').fill(TEST_USER.firmName);
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByLabel('Confirm Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  // In local dev, email is auto-confirmed — user lands on /onboarding
  await page.waitForURL('**/onboarding');

  // Complete onboarding
  await page.getByLabel('Firm Name').fill(TEST_USER.firmName);
  await page.getByRole('button', { name: 'Create Workspace' }).click();
  await page.waitForURL('**/computations');

  // Save auth state for reuse across tests
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
