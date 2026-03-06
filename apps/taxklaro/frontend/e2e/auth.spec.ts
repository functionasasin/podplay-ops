import { test, expect } from '@playwright/test';
import { TEST_USER } from './fixtures/test-data';

// T-AUTH-01: Sign Up → Confirm → Onboarding
test('T-AUTH-01: Sign Up → Confirm → Onboarding', async ({ page }) => {
  const uniqueEmail = `e2e-signup-${Date.now()}@taxklaro-test.ph`;

  await page.goto('/auth?mode=signup');
  await expect(page.getByText('Create your account')).toBeVisible();
  await expect(page.getByLabel('Full Name')).toBeVisible();
  await expect(page.getByLabel('Firm Name')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByLabel('Confirm Password')).toBeVisible();

  await page.getByLabel('Full Name').fill('Maria Santos');
  await page.getByLabel('Firm Name').fill('Santos Tax Consulting');
  await page.getByLabel('Email').fill(uniqueEmail);
  await page.getByLabel('Password').fill('TestPassword123!');
  await page.getByLabel('Confirm Password').fill('TestPassword123!');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await page.waitForURL('**/onboarding');
  await expect(page.getByText('Set up your workspace')).toBeVisible();

  await page.getByRole('button', { name: 'Create Workspace' }).click();
  await page.waitForURL('**/computations');
  await expect(page.getByText('No computations yet')).toBeVisible();
  await expect(page.locator('nav, aside')).toBeVisible();
});

// T-AUTH-02: Sign In with Valid Credentials
test('T-AUTH-02: Sign In with Valid Credentials', async ({ page }) => {
  await page.goto('/auth?mode=signin');
  await expect(page.getByRole('tab', { name: 'Sign in' }).or(page.getByText('Sign in'))).toBeVisible();

  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL('**/computations');
  await expect(page.locator('nav, aside')).toBeVisible();
  await expect(page.getByText(TEST_USER.email)).toBeVisible();
});

// T-AUTH-03: Sign In with Wrong Password
test('T-AUTH-03: Sign In with Wrong Password', async ({ page }) => {
  await page.goto('/auth?mode=signin');
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill('WrongPassword999!');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Should stay on /auth
  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByText('Invalid email or password.')).toBeVisible();

  // Password field should NOT be cleared
  await expect(page.getByLabel('Password')).toHaveValue('WrongPassword999!');
});

// T-AUTH-04: Unauthenticated Redirect
test('T-AUTH-04: Unauthenticated Redirect', async ({ page }) => {
  await page.goto('/computations');
  await page.waitForURL(/\/auth.*redirect/);
  await expect(page.url()).toContain('redirect=%2Fcomputations');

  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL('**/computations');
});

// T-AUTH-05: Password Reset Flow
test('T-AUTH-05: Password Reset Flow', async ({ page }) => {
  await page.goto('/auth/reset');
  await expect(page.getByText('Reset Password')).toBeVisible();

  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByRole('button', { name: 'Send Reset Link' }).click();

  await expect(page.getByText(/check your email/i)).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/reset/);
});
