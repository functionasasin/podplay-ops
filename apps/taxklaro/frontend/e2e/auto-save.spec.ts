import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

// T-AUTOSAVE-01: Input Changes Persist After Reload
test('T-AUTOSAVE-01: Input Changes Persist After Reload', async ({ page }) => {
  await page.goto('/computations/new');

  // WS-00
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-01
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-03
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-04: fill gross receipts
  await page.getByLabel(/Gross Receipts/i).fill('1200000');

  // Assert auto-save triggered
  await expect(page.locator('[data-testid="save-status-saving"]')).toBeVisible({ timeout: 3000 });
  await expect(page.locator('[data-testid="save-status-saved"]')).toBeVisible({ timeout: 5000 });

  // Note URL — should have computation ID
  const compUrl = page.url();
  expect(compUrl).toMatch(/\/computations\/.+/);

  // Reload
  await page.reload();
  expect(page.url()).toBe(compUrl);

  // Value should be persisted (formatted with commas)
  await expect(page.getByLabel(/Gross Receipts/i)).toHaveValue(/1.200.000|1,200,000|1200000/);
});

// T-AUTOSAVE-02: Status Indicator States
test('T-AUTOSAVE-02: Status Indicator States', async ({ page }) => {
  await page.goto('/computations/new');

  // Navigate to a step with a field to change
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click(); // WS-03

  // Change a field to trigger auto-save
  await page.getByLabel(/Gross Receipts/i).fill('888000');

  // Should immediately show "Saving..."
  await expect(page.locator('[data-testid="save-status-saving"]')).toBeVisible({ timeout: 3000 });

  // After debounce + write, should show "Saved"
  await expect(page.locator('[data-testid="save-status-saved"]')).toBeVisible({ timeout: 5000 });

  // After a few more seconds, should return to idle/no-text state
  await page.waitForTimeout(5000);
  await expect(page.locator('[data-testid="save-status-saving"]')).not.toBeVisible();
});
