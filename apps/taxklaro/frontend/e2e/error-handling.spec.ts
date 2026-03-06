import { test, expect } from '@playwright/test';

// T-ERROR-01: Missing VITE_SUPABASE_URL — SetupPage
// Special build required; skip in standard CI unless ERROR_TEST=true
test('T-ERROR-01: Missing VITE_SUPABASE_URL — SetupPage', async ({ page }) => {
  if (!process.env.ERROR_TEST) {
    test.skip(true, 'Skipping: requires special build without VITE_SUPABASE_URL. Set ERROR_TEST=true to run.');
    return;
  }

  await page.goto('/');
  await expect(page.getByText(/TaxKlaro Setup|Configuration Required/i)).toBeVisible();
  await expect(page.getByText(/VITE_SUPABASE_URL/i)).toBeVisible();

  const consoleErrors: string[] = [];
  page.on('pageerror', err => consoleErrors.push(err.message));
  expect(consoleErrors).toHaveLength(0);
});

// T-ERROR-02: Network Error During Compute (WASM Load Failure)
test('T-ERROR-02: Network Error During Compute (WASM Load Failure)', async ({ page }) => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  await page.goto('/computations/new');

  // Fill wizard up to compute button
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Gross Receipts/i).fill('700000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Optional Standard Deduction/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Intercept WASM load — abort it
  await page.route('**/taxklaro_engine_bg.wasm', route => route.abort());

  // Click compute
  const computeBtn = page.getByRole('button', { name: /See My Results|Compute/i });
  await computeBtn.click();

  // Should show error toast
  await expect(page.getByText(/Failed to initialize computation engine|refresh and try again/i)).toBeVisible({ timeout: 10000 });

  // Button should be re-enabled
  await expect(computeBtn).not.toBeDisabled({ timeout: 5000 });
});

// T-ERROR-03: Supabase Error During Save
test('T-ERROR-03: Supabase Error During Save', async ({ page }) => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  await page.goto('/computations/new');

  // Navigate to WS-04
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Intercept Supabase REST calls and return 503
  await page.route('**/rest/v1/computations**', route => route.fulfill({ status: 503 }));

  // Change field to trigger auto-save
  await page.getByLabel(/Gross Receipts/i).fill('500000');

  // Saving indicator should appear
  await expect(page.locator('[data-testid="save-status-saving"]')).toBeVisible({ timeout: 3000 });

  // Error toast should appear
  await expect(page.getByText(/Error saving|may not be saved/i)).toBeVisible({ timeout: 5000 });

  // Status should NOT show "Saved"
  await expect(page.locator('[data-testid="save-status-saved"]')).not.toBeVisible();
});
