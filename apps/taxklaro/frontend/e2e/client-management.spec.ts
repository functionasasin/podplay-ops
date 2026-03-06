import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

let clientId: string;

// T-CLIENT-01: Add New Client
test('T-CLIENT-01: Add New Client', async ({ page }) => {
  await page.getByRole('link', { name: 'Clients' }).click();
  await expect(page).toHaveURL(/\/clients/);

  const emptyOrTable = page.getByText('No clients yet').or(page.locator('table'));
  await expect(emptyOrTable).toBeVisible();

  await page.getByRole('button', { name: 'Add Client' }).click();
  await expect(page).toHaveURL(/\/clients\/new/);

  await page.getByLabel(/Full Name/i).fill('Juan dela Cruz');
  await page.getByLabel(/Email/i).fill('juan@example.ph');
  await page.getByLabel(/Phone/i).fill('09171234567');
  await page.getByLabel(/TIN/i).fill('123-456-789-000');
  await page.getByRole('button', { name: 'Save Client' }).click();

  await page.waitForURL(/\/clients\/.+/);
  clientId = page.url().split('/').pop() ?? '';

  await expect(page.getByText(/Client added/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Juan dela Cruz')).toBeVisible();
  await expect(page.getByText('juan@example.ph')).toBeVisible();
  await expect(page.getByText('123-456-789-000')).toBeVisible();
  await expect(page.getByText(/Computations for this client/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /New Computation/i })).toBeVisible();
});

// T-CLIENT-02: New Computation Pre-Filled from Client
test('T-CLIENT-02: New Computation Pre-Filled from Client', async ({ page }) => {
  if (!clientId) {
    // Create a client first
    await page.goto('/clients/new');
    await page.getByLabel(/Full Name/i).fill('Test Client');
    await page.getByLabel(/Email/i).fill('testclient@example.ph');
    await page.getByRole('button', { name: 'Save Client' }).click();
    await page.waitForURL(/\/clients\/.+/);
    clientId = page.url().split('/').pop() ?? '';
  }

  await page.goto(`/clients/${clientId}`);
  await page.getByRole('link', { name: /New Computation/i }).click();

  await expect(page).toHaveURL(new RegExp(`/computations/new.*clientId=${clientId}`));
  // Client name should be pre-filled in wizard
  await expect(page.getByText(/Juan dela Cruz|Test Client/i)).toBeVisible();
});

// T-CLIENT-03: Client Table — Columns Present
test('T-CLIENT-03: Client Table — Columns Present', async ({ page }) => {
  // Ensure at least one client exists
  await page.goto('/clients/new');
  await page.getByLabel(/Full Name/i).fill(`Test Client ${Date.now()}`);
  await page.getByLabel(/Email/i).fill(`client-${Date.now()}@example.ph`);
  await page.getByRole('button', { name: 'Save Client' }).click();
  await page.waitForURL(/\/clients\/.+/);

  await page.goto('/clients');
  await expect(page).toHaveURL(/\/clients/);

  // Table should be visible with required columns
  const table = page.locator('table');
  await expect(table).toBeVisible();
  await expect(table.getByText(/Name/i)).toBeVisible();
  await expect(table.getByText(/TIN/i)).toBeVisible();
  await expect(table.getByText(/Email/i)).toBeVisible();
});
