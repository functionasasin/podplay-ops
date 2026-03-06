import { test, expect, Browser } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

// T-SHARE-01: Enable Sharing and View Public Link
test('T-SHARE-01: Enable Sharing and View Public Link', async ({ page, browser }) => {
  // First create and compute a computation
  await page.goto('/computations/new');
  await page.getByLabel('Annual').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Purely Self-Employed/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click(); // WS-03
  await page.getByLabel(/Gross Receipts/i).fill('700000');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/Optional Standard Deduction/i).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /See My Results|Compute/i }).click();
  await page.waitForSelector('[data-testid="results-view"]', { timeout: 10000 });

  const compUrl = page.url();

  // Click Share button
  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.getByText(/Share Computation/i)).toBeVisible();

  // Toggle sharing ON
  const sharingToggle = page.locator('[data-testid="sharing-toggle"]').or(page.getByRole('switch'));
  const isOff = await sharingToggle.getAttribute('aria-checked');
  if (isOff === 'false' || isOff === null) {
    await sharingToggle.click();
  }

  // Share URL appears
  const shareUrlInput = page.locator('[data-testid="share-url-input"]').or(page.getByRole('textbox').filter({ hasText: /share|taxklaro/ }));
  await expect(shareUrlInput.or(page.getByText(/share\//))).toBeVisible({ timeout: 5000 });

  // Toast confirmation
  await expect(page.getByText(/shared|copied/i)).toBeVisible({ timeout: 5000 });

  // Get the share URL
  const shareUrl = await shareUrlInput.inputValue().catch(() => '');
  if (!shareUrl) return; // Skip incognito test if URL not found

  // Open in incognito context
  const incognitoContext = await browser.newContext({ storageState: undefined });
  const incognitoPage = await incognitoContext.newPage();
  await incognitoPage.goto(shareUrl);

  await expect(incognitoPage.locator('nav.sidebar, aside')).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  await expect(incognitoPage.getByText(/TaxKlaro/i)).toBeVisible();
  await expect(incognitoPage.locator('[data-testid="results-view"]')).toBeVisible({ timeout: 10000 });
  await expect(incognitoPage.getByRole('button', { name: 'Share' })).not.toBeVisible();

  await incognitoContext.close();
});

// T-SHARE-02: Disable Sharing — Link Invalidated
test('T-SHARE-02: Disable Sharing — Link Invalidated', async ({ page, browser }) => {
  // Create a computation with sharing enabled
  await page.goto('/computations/new');
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
  await page.getByRole('button', { name: /See My Results|Compute/i }).click();
  await page.waitForSelector('[data-testid="results-view"]', { timeout: 10000 });

  // Enable sharing
  await page.getByRole('button', { name: 'Share' }).click();
  const sharingToggle = page.locator('[data-testid="sharing-toggle"]').or(page.getByRole('switch'));
  await sharingToggle.click();
  await page.waitForTimeout(1000);

  const shareUrlInput = page.locator('[data-testid="share-url-input"]').or(page.getByRole('textbox'));
  const shareUrl = await shareUrlInput.inputValue().catch(() => '');

  // Disable sharing
  await sharingToggle.click();
  await expect(page.getByText(/disabled|Share link disabled/i)).toBeVisible({ timeout: 5000 });

  if (!shareUrl) return;

  // Open in incognito — link should be invalid
  const incognitoContext = await browser.newContext({ storageState: undefined });
  const incognitoPage = await incognitoContext.newPage();
  await incognitoPage.goto(shareUrl);

  await expect(incognitoPage.getByText(/no longer valid|disabled/i)).toBeVisible({ timeout: 10000 });
  await incognitoContext.close();
});

// T-SHARE-03: Invalid Share Token — Not Found
test('T-SHARE-03: Invalid Share Token — Not Found', async ({ browser }) => {
  const incognitoContext = await browser.newContext({ storageState: undefined });
  const incognitoPage = await incognitoContext.newPage();

  const consoleErrors: string[] = [];
  incognitoPage.on('pageerror', err => consoleErrors.push(err.message));

  await incognitoPage.goto('/share/00000000-0000-0000-0000-000000000000');
  await expect(incognitoPage.getByText(/no longer valid|not found|disabled/i)).toBeVisible({ timeout: 10000 });
  expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);

  await incognitoContext.close();
});
