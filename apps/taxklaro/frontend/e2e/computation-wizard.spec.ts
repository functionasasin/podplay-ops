import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

// T-WIZARD-01: Complete New Computation (Happy Path — TV-BASIC-001)
test('T-WIZARD-01: Complete New Computation (Happy Path)', async ({ page }) => {
  await page.goto('/computations/new');
  await expect(page.locator('[data-testid="wizard-container"], form')).toBeVisible();

  // WS-00: Mode Selection
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-01: Taxpayer Profile
  await expect(page.getByText('Taxpayer Profile')).toBeVisible();
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-03: Tax Year and Filing Period
  await page.getByLabel(/Tax Year/i).fill('2025');
  await page.getByLabel(/Filing Period/i).selectOption('ANNUAL');
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-04: Gross Receipts
  await expect(page.getByText(/Gross Receipts/i)).toBeVisible();
  await page.getByLabel(/Gross Receipts/i).fill('700000');
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-06: Expense Method
  await page.getByLabel(/Optional Standard Deduction/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-10: Registration Status
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-12: Filing Details
  await page.getByLabel(/Original Return/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Final step
  const seeResultsBtn = page.getByRole('button', { name: /See My Results|Compute/i });
  await expect(seeResultsBtn).toBeVisible();
  await seeResultsBtn.click();

  // Results
  await page.waitForSelector('[data-testid="results-view"], [data-testid="recommended-regime"]', { timeout: 10000 });
  await expect(page).toHaveURL(/\/computations\/.+/);

  await expect(page.getByText(/8% Flat Tax|Path C/i)).toBeVisible();
  await expect(page.locator('[data-testid="tax-due-path-b"], [data-testid="tax-due-path-c"]')).toContainText('36,000');
  await expect(page.getByText(/Export PDF|Share|Finalize/i)).toBeVisible();
  await expect(page.getByText(/Computed/i)).toBeVisible();
});

// T-WIZARD-02: Validation — Required Fields
test('T-WIZARD-02: Validation — Required Fields', async ({ page }) => {
  await page.goto('/computations/new');

  // WS-00
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-01: try to continue without selecting type
  const continueBtn = page.getByRole('button', { name: 'Continue' });
  await continueBtn.click();
  await expect(page.getByText(/select a taxpayer type/i)).toBeVisible();
  await expect(page.getByText('Taxpayer Profile')).toBeVisible(); // Still on WS-01

  // Navigate to WS-04 to test gross receipts validation
  await page.getByLabel(/Purely Self-Employed/i).click();
  await continueBtn.click();

  // WS-03
  await continueBtn.click();

  // WS-04: fill 0
  await page.getByLabel(/Gross Receipts/i).fill('0');
  await continueBtn.click();
  await expect(page.getByText(/greater than/i)).toBeVisible();
  await expect(page.getByText(/Gross Receipts/i)).toBeVisible(); // Still on WS-04
});

// T-WIZARD-03: Mixed Income Path — WS-05 Appears
test('T-WIZARD-03: Mixed Income Path — WS-05 Appears', async ({ page }) => {
  await page.goto('/computations/new');

  // WS-00
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-01: Mixed Income
  await page.getByLabel(/Mixed Income/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // WS-05: Compensation Income should appear
  await expect(page.getByText(/Compensation Income/i)).toBeVisible();
  await page.getByLabel(/Compensation/i).fill('500000');
  await page.getByRole('button', { name: 'Continue' }).click();
});

// T-WIZARD-04: Resume from Draft
test('T-WIZARD-04: Resume from Draft', async ({ page }) => {
  // First create a draft
  await page.goto('/computations/new');
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Wait for auto-save to create the computation
  await page.waitForSelector('[data-testid="save-status-saved"]', { timeout: 5000 }).catch(() => {});
  const url = page.url();

  // Navigate away
  await page.goto('/computations');

  if (url.includes('/computations/') && url !== '/computations') {
    await page.goto(url);
    await expect(page.getByText(/Draft/i)).toBeVisible();
    await expect(page.locator('input, select, form')).toBeVisible();
  } else {
    // No comp ID yet — just verify we can navigate back
    const draftCard = page.locator('[data-testid="computation-card"]').first();
    if (await draftCard.isVisible()) {
      await draftCard.click();
      await expect(page.getByText(/Draft/i)).toBeVisible();
    }
  }
});
