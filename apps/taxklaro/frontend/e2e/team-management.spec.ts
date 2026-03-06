import { test, expect } from '@playwright/test';
import { TEST_INVITE_EMAIL } from './fixtures/test-data';

test.use({ storageState: 'e2e/.auth/user.json' });

// T-TEAM-01: Send Team Invitation
test('T-TEAM-01: Send Team Invitation', async ({ page }) => {
  await page.goto('/settings/team');

  const currentMembersSection = page.getByText(/Current Members/i);
  await expect(currentMembersSection).toBeVisible();

  // Check if on PRO plan (invite form visible) or FREE plan (upgrade CTA)
  const inviteForm = page.getByLabel(/Invite.*Email/i).or(page.locator('[data-testid="invite-email-input"]'));
  const isProPlan = await inviteForm.isVisible().catch(() => false);

  if (!isProPlan) {
    // FREE plan — skip invitation test, verify upgrade CTA instead
    await expect(page.getByText(/Upgrade/i)).toBeVisible();
    test.skip();
    return;
  }

  await inviteForm.fill(TEST_INVITE_EMAIL);

  const roleSelect = page.getByLabel(/Role/i);
  if (await roleSelect.isVisible()) {
    await roleSelect.selectOption('staff');
  }

  await page.getByRole('button', { name: 'Send Invitation' }).click();
  await expect(page.getByText(/Invitation sent/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(TEST_INVITE_EMAIL)).toBeVisible();
  await expect(page.getByText(/Pending/i)).toBeVisible();
});

// T-TEAM-02: Revoke Invitation
test('T-TEAM-02: Revoke Invitation', async ({ page }) => {
  await page.goto('/settings/team');

  const pendingRow = page.getByText(TEST_INVITE_EMAIL).locator('..');
  const isVisible = await pendingRow.isVisible().catch(() => false);
  if (!isVisible) {
    test.skip();
    return;
  }

  await pendingRow.getByRole('button', { name: 'Revoke' }).click();

  // Confirmation dialog
  const confirmBtn = page.getByRole('button', { name: /Confirm|Yes|Revoke/i });
  if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await confirmBtn.click();
  }

  await expect(page.getByText(/revoked/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(TEST_INVITE_EMAIL)).not.toBeVisible();
});

// T-TEAM-03: Seat Limit Enforcement — FREE Plan
test('T-TEAM-03: Seat Limit Enforcement — FREE Plan', async ({ page }) => {
  await page.goto('/settings/team');

  // If on FREE plan, invite form should not be visible
  const inviteForm = page.getByLabel(/Invite.*Email/i).or(page.locator('[data-testid="invite-email-input"]'));
  const upgradeCta = page.getByText(/Upgrade to PRO to add team members/i);

  const isFreePlan = await upgradeCta.isVisible().catch(() => false);
  if (isFreePlan) {
    await expect(inviteForm).not.toBeVisible();
    await expect(upgradeCta).toBeVisible();
  } else {
    // PRO plan — this test verifies FREE plan behavior, so we skip
    test.skip();
  }
});
