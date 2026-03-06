import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

// T-ENGINE-01: WASM Bridge — Results Correctness (TV-BASIC-001)
test('T-ENGINE-01: WASM Bridge — Results Correctness (TV-BASIC-001)', async ({ page }) => {
  await page.goto('/computations/new');

  // Fill wizard with TV-BASIC-001 inputs
  // WS-00: Annual
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-01: Purely Self-Employed
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-03: Tax Year 2025, Annual
  await page.getByLabel(/Tax Year/i).fill('2025');
  const filingPeriodSelect = page.getByLabel(/Filing Period/i);
  if (await filingPeriodSelect.isVisible()) {
    await filingPeriodSelect.selectOption('ANNUAL');
  }
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-04: Gross Receipts 700000
  await page.getByLabel(/Gross Receipts/i).fill('700000');
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-06: Expense Method — OSD
  await page.getByLabel(/Optional Standard Deduction/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Continue through remaining steps
  await page.getByRole('button', { name: 'Continue' }).click(); // WS-10
  await page.getByRole('button', { name: 'Continue' }).click(); // WS-12 or next

  // Final step: Compute
  await page.getByRole('button', { name: /See My Results|Compute/i }).click();

  // Wait for results
  await page.waitForSelector('[data-testid="recommended-regime"], [data-testid="results-view"]', { timeout: 10000 });

  // TV-BASIC-001 expected: 8% flat rate recommended
  await expect(page.locator('[data-testid="recommended-regime"]')).toContainText(/8% Flat Tax|Path C/i);
  await expect(page.locator('[data-testid="tax-due-path-b"], [data-testid="tax-due-path-c"]')).toContainText('36,000');
  await expect(page.locator('[data-testid="regime-comparison-path-a"]')).toBeVisible();
  await expect(page.locator('[data-testid="regime-comparison-path-b"]')).toBeVisible();
  await expect(page.locator('[data-testid="regime-comparison-path-c"]')).toBeVisible();
  await expect(page.locator('[data-testid="savings-callout"]')).toBeVisible();
});

// T-ENGINE-02: WASM Error Handling — VAT Ineligibility
test('T-ENGINE-02: WASM Error Handling — VAT Ineligibility', async ({ page }) => {
  await page.goto('/computations/new');

  // WS-00: Annual
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-01
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-03
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-04: ₱2M gross receipts — VAT threshold
  await page.getByLabel(/Gross Receipts/i).fill('2000000');
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-06
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-10: VAT registered toggle ON
  const vatToggle = page.getByLabel(/VAT Registered/i).or(page.locator('[data-testid="vat-toggle"]'));
  if (await vatToggle.isVisible()) {
    await vatToggle.click();
  }
  await page.getByRole('button', { name: 'Continue' }).click();

  // Continue remaining
  await page.getByRole('button', { name: 'Continue' }).click();

  // Compute
  await page.getByRole('button', { name: /See My Results|Compute/i }).click();

  await page.waitForSelector('[data-testid="results-view"], [data-testid="recommended-regime"]', { timeout: 10000 });

  // 8% should be flagged as ineligible
  await expect(page.getByText(/VAT-registered/i).or(page.getByText(/ineligible/i))).toBeVisible();
  // Recommended should not be 8% flat
  const recommended = page.locator('[data-testid="recommended-regime"]');
  await expect(recommended).not.toContainText('8% Flat Tax');
});
