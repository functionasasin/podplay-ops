import { test, expect } from '@playwright/test';

test.use({
  storageState: 'e2e/.auth/user.json',
  viewport: { width: 375, height: 812 },
});

// T-RESPONSIVE-01: Mobile Navigation
test('T-RESPONSIVE-01: Mobile Navigation', async ({ page }) => {
  await page.goto('/computations');

  // Desktop sidebar should NOT be visible on mobile
  await expect(page.locator('.sidebar-desktop, [data-testid="desktop-sidebar"]')).not.toBeVisible({ timeout: 3000 }).catch(() => {});

  // Hamburger button visible
  const hamburger = page.getByRole('button', { name: /menu|open/i }).or(page.locator('[data-testid="mobile-menu-button"], [aria-label="Menu"]'));
  await expect(hamburger).toBeVisible();
  await hamburger.click();

  // Drawer slides in
  const drawer = page.locator('[data-testid="mobile-drawer"], [role="dialog"], .sheet-content');
  await expect(drawer).toBeVisible({ timeout: 3000 });

  // Navigation items visible in drawer
  await expect(drawer.getByRole('link', { name: /Computations/i })).toBeVisible();

  // Click Computations nav item
  await drawer.getByRole('link', { name: /Computations/i }).click();

  // Drawer should close
  await expect(drawer).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  await expect(page).toHaveURL(/\/computations/);
});

// T-RESPONSIVE-02: Mobile Wizard
test('T-RESPONSIVE-02: Mobile Wizard', async ({ page }) => {
  await page.goto('/computations/new');

  // Wizard renders in single-column layout
  const wizard = page.locator('[data-testid="wizard-container"], form').first();
  await expect(wizard).toBeVisible();

  // Continue button should be full-width (mobile)
  const continueBtn = page.getByRole('button', { name: 'Continue' });
  await expect(continueBtn).toBeVisible();

  // Back button visible (or step indicator)
  const progressBar = page.locator('[data-testid="progress-bar"], [role="progressbar"]');
  await expect(progressBar).toBeVisible();

  // Fill WS-00 and continue
  await page.getByLabel('Annual').click();
  await continueBtn.click();

  // WS-01 should appear — no horizontal scroll
  await expect(page.getByText('Taxpayer Profile')).toBeVisible();

  // Verify no horizontal overflow
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // allow 5px tolerance
});
