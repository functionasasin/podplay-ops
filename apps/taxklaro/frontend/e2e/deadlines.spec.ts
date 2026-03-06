import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

// T-DEADLINES-01: Deadlines Page Loads
test('T-DEADLINES-01: Deadlines Page Loads', async ({ page }) => {
  await page.getByRole('link', { name: 'Deadlines' }).click();
  await expect(page).toHaveURL(/\/deadlines/);

  // Either empty state or deadline cards
  const emptyState = page.getByText(/No upcoming deadlines/i).or(page.locator('[data-testid="empty-state"]'));
  const deadlineCards = page.locator('[data-testid="deadline-card"]');

  const hasDeadlines = await deadlineCards.count() > 0;
  if (hasDeadlines) {
    await expect(deadlineCards.first()).toBeVisible();
    // Each card should show label, due date
    await expect(deadlineCards.first().getByText(/due|deadline/i).or(deadlineCards.first().locator('time'))).toBeVisible();
  } else {
    await expect(emptyState).toBeVisible();
  }
});
