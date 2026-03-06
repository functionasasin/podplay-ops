# Playwright E2E Specs — TaxKlaro

**Wave:** 6 (Testing + Deployment)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** component-wiring-map, action-trigger-map, route-table, supabase-migrations, computation-management, sharing, pdf-export-layout

---

## Summary

Complete Playwright E2E test specifications for TaxKlaro. 12 test suites covering all critical user flows. Each suite specifies exact steps, assertions, test data, and failure scenarios. Derived from route-table, computation-management, and action-trigger-map analyses.

---

## 1. Playwright Configuration

### `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,       // Must be sequential: auth state shared across tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                 // Single worker to prevent DB contention on Supabase
  reporter: [['html'], ['line']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Serve production build for E2E (not dev server)
  // webServer is handled by CI before Playwright runs
});
```

### Directory Structure

```
e2e/
  fixtures/
    test-data.ts       — Shared test data (users, computations)
    auth.setup.ts      — Authenticated session setup
  auth.spec.ts
  onboarding.spec.ts
  computation-wizard.spec.ts
  auto-save.spec.ts
  compute-engine.spec.ts
  share.spec.ts
  pdf-export.spec.ts
  client-management.spec.ts
  team-management.spec.ts
  deadlines.spec.ts
  responsive.spec.ts
  error-handling.spec.ts
```

---

## 2. Test Data Fixtures

### `e2e/fixtures/test-data.ts`

```typescript
export const TEST_USER = {
  email: `e2e-test-${Date.now()}@taxklaro-test.ph`,
  password: 'TestPassword123!',
  fullName: 'Maria Santos',
  firmName: 'Santos Tax Consulting',
};

export const TEST_CLIENT = {
  fullName: 'Juan dela Cruz',
  email: 'juan.delacruz@example.ph',
  phone: '09171234567',
  tin: '123-456-789-000',
};

// Based on test vector TV-BASIC-001: SC-P-ML-8
// Purely self-employed, ₱700,000 gross receipts, 8% wins
export const TEST_COMPUTATION = {
  title: 'Juan dela Cruz — 2025 Annual',
  taxYear: 2025,
  // Wizard step inputs (matching field IDs in wizard-steps.md)
  wizardInputs: {
    // WS-00
    mode: 'ANNUAL',
    // WS-01
    taxpayerType: 'PURELY_SE',
    fullName: 'Juan dela Cruz',
    tin: '123-456-789-000',
    // WS-03
    taxYear: '2025',
    filingPeriod: 'ANNUAL',
    // WS-04
    grossReceipts: '700000',
    // WS-06
    expenseMethod: 'OSD',   // will trigger engine to compare all paths
    // WS-10
    isVatRegistered: false,
    // WS-12
    returnType: 'ORIGINAL',
  },
  // Expected results after compute (TV-BASIC-001)
  expectedResults: {
    recommendedRegime: 'PATH_B_8_PERCENT',
    // 8% of ₱700,000 minus ₱250,000 exemption = 8% × ₱450,000 = ₱36,000
    taxDue8Percent: '36,000.00',
  },
};

export const TEST_INVITE_EMAIL = `e2e-invite-${Date.now()}@taxklaro-test.ph`;
```

### `e2e/fixtures/auth.setup.ts`

```typescript
import { test as setup } from '@playwright/test';
import { TEST_USER } from './test-data';

// Creates a real user in Supabase and saves auth state to disk.
// Requires E2E_SUPABASE_SERVICE_KEY in environment for admin user creation.
// Alternative: use Supabase local dev with email auto-confirm enabled.

setup('create authenticated session', async ({ page }) => {
  await page.goto('/auth?mode=signup');

  await page.getByLabel('Full Name').fill(TEST_USER.fullName);
  await page.getByLabel('Firm Name').fill(TEST_USER.firmName);
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByLabel('Confirm Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  // In local dev, email is auto-confirmed — user lands on /onboarding
  // In CI, use admin API to confirm email, then sign in directly
  await page.waitForURL('**/onboarding');

  // Complete onboarding
  await page.getByLabel('Firm Name').fill(TEST_USER.firmName);
  await page.getByRole('button', { name: 'Create Workspace' }).click();
  await page.waitForURL('**/computations');

  // Save auth state for reuse across tests
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
```

---

## 3. Test Suite: Auth Flow

**File:** `e2e/auth.spec.ts`

### T-AUTH-01: Sign Up → Confirm → Onboarding

```
Preconditions:
  - No existing account for test email
  - Supabase local with email auto-confirm enabled (or admin API confirm in CI)

Steps:
  1. Navigate to /auth?mode=signup
  2. Assert: page title "Create your account"
  3. Assert: fields visible: Full Name, Firm Name, Email, Password, Confirm Password
  4. Fill Full Name: "Maria Santos"
  5. Fill Firm Name: "Santos Tax Consulting"
  6. Fill Email: unique test email
  7. Fill Password: "TestPassword123!"
  8. Fill Confirm Password: "TestPassword123!"
  9. Click "Create Account" button
  10. Assert (auto-confirm path): URL changes to /onboarding
  11. Assert: "Set up your workspace" heading visible
  12. Assert: Firm Name field pre-filled from sign-up data
  13. Fill Firm Name (if needed): "Santos Tax Consulting"
  14. Click "Create Workspace" button
  15. Assert: URL changes to /computations
  16. Assert: empty state visible "No computations yet"
  17. Assert: sidebar visible with navigation items

Expected result: User created, org created, authenticated session established.
```

### T-AUTH-02: Sign In with Valid Credentials

```
Preconditions:
  - Account exists (from auth.setup.ts)

Steps:
  1. Navigate to /auth?mode=signin
  2. Assert: "Sign in" tab active
  3. Fill Email: TEST_USER.email
  4. Fill Password: TEST_USER.password
  5. Click "Sign In" button
  6. Assert: URL changes to / or /computations
  7. Assert: AppLayout sidebar visible
  8. Assert: user email displayed in sidebar footer

Expected result: Authenticated session, redirected to dashboard.
```

### T-AUTH-03: Sign In with Wrong Password

```
Steps:
  1. Navigate to /auth?mode=signin
  2. Fill Email: TEST_USER.email
  3. Fill Password: "WrongPassword999!"
  4. Click "Sign In" button
  5. Assert: no URL change (stays on /auth)
  6. Assert: Alert destructive visible with text "Invalid email or password."
  7. Assert: Password field NOT cleared (user can correct and retry)

Expected result: Error shown, user remains on sign-in page.
```

### T-AUTH-04: Unauthenticated Redirect

```
Preconditions:
  - Not signed in (use page without auth state)

Steps:
  1. Navigate to /computations (authenticated route)
  2. Assert: URL changes to /auth?mode=signin&redirect=%2Fcomputations
  3. Sign in with valid credentials
  4. Assert: URL changes to /computations (redirect param honored)

Expected result: Redirect chain works, user lands on intended page after auth.
```

### T-AUTH-05: Password Reset Flow

```
Steps:
  1. Navigate to /auth/reset
  2. Assert: "Reset Password" heading visible
  3. Fill Email: TEST_USER.email
  4. Click "Send Reset Link" button
  5. Assert: confirmation card visible "Check your email for a reset link"
  6. Assert: NO redirect (stays on /auth/reset, shows confirmation in-place)

Expected result: Reset email sent (user must check email to complete).
```

---

## 4. Test Suite: Computation Wizard

**File:** `e2e/computation-wizard.spec.ts`
**Auth:** uses `e2e/.auth/user.json` storage state

### T-WIZARD-01: Complete New Computation (Happy Path — TV-BASIC-001)

```
Preconditions:
  - Authenticated, has org

Steps:
  1. Navigate to /computations/new (or click "New Computation" in sidebar)
  2. Assert: TaxWizard renders, Step WS-00 visible
  3. Assert: progress bar shows "Step 1 of N"

  --- WS-00: Mode Selection ---
  4. Select "Annual" radio option
  5. Click "Continue"

  --- WS-01: Taxpayer Profile ---
  6. Assert: WS-01 visible, heading "Taxpayer Profile"
  7. Select taxpayer type: "Purely Self-Employed"
  8. Assert: "Mixed Income" option visible but not selected
  9. Click "Continue"

  --- WS-03: Tax Year and Filing Period ---
  10. Assert: WS-03 visible
  11. Set Tax Year: "2025"
  12. Set Filing Period: "Annual"
  13. Click "Continue"

  --- WS-04: Gross Receipts ---
  14. Assert: WS-04 visible
  15. Fill Gross Receipts: "700000"
  16. Assert: ₱ prefix renders, number formatted as "700,000" on blur
  17. Assert: no error message visible
  18. Click "Continue"

  --- WS-06: Expense Method ---
  19. Assert: WS-06 visible
  20. Select "Optional Standard Deduction (OSD)" radio
  21. Assert: note visible "OSD = 40% of Net Receipts"
  22. Click "Continue"

  --- WS-10: Registration Status ---
  23. Assert: WS-10 visible
  24. Assert: VAT toggle defaults to OFF
  25. Leave VAT: Not Registered
  26. Leave BMBE: Not Registered
  27. Click "Continue"

  --- WS-11: Regime Election ---
  28. Assert: WS-11 visible (or skipped to WS-12 if auto-recommend)
  29. Select "Let TaxKlaro Recommend" option
  30. Click "Continue"

  --- WS-12: Filing Details ---
  31. Assert: WS-12 visible
  32. Set Return Type: "Original Return"
  33. Click "Continue"

  --- Final Step ---
  34. Assert: "See My Results" button visible (last step)
  35. Click "See My Results"

  --- Computation Trigger ---
  36. Assert: loading indicator visible ("Computing...")
  37. Assert: ResultsView appears within 5 seconds
  38. Assert: URL changed to /computations/$compId

  --- Results Assertions ---
  39. Assert: "Recommended Regime" section visible
  40. Assert: "8% Flat Tax Option" highlighted as recommended
  41. Assert: tax due value contains "36,000" (8% × ₱450,000)
  42. Assert: 3-regime comparison table visible (Path A | Path B | Path C)
  43. Assert: savings amount visible ("Save ₱X vs OSD Graduated")
  44. Assert: ActionsBar visible with buttons: "Export PDF", "Share", "Finalize"
  45. Assert: status badge shows "Computed"

Expected result: Full wizard → compute → results flow completes successfully.
```

### T-WIZARD-02: Validation — Required Fields

```
Steps:
  1. Navigate to /computations/new
  2. Complete WS-00 (Annual)
  3. On WS-01: click "Continue" without selecting taxpayer type
  4. Assert: error message "Please select a taxpayer type" visible below the radio group
  5. Assert: NO navigation to next step

  6. On WS-04: fill Gross Receipts with "0"
  7. Click "Continue"
  8. Assert: error message "Gross receipts must be greater than ₱0" visible
  9. Assert: NO navigation

  10. On WS-04: fill Gross Receipts with "-500"
  11. Assert: negative sign rejected or field reverts to "0" (per peso field spec)

Expected result: Validation prevents advancing with invalid data.
```

### T-WIZARD-03: Mixed Income Path — WS-05 Appears

```
Steps:
  1. Navigate to /computations/new
  2. WS-00: select "Annual"
  3. WS-01: select "Mixed Income (Self-Employed + Employed)"
  4. Click "Continue"
  5. Assert: WS-05 (Compensation Income) step appears
  6. Fill Compensation Income: "500000"
  7. Click "Continue"
  8. Continue through remaining steps
  9. Assert: computation includes compensation income in results

Expected result: Mixed-income path enables WS-05 and factors compensation into computation.
```

### T-WIZARD-04: Resume from Draft

```
Preconditions:
  - An existing draft computation with title "Resume Test 2025"

Steps:
  1. Navigate to /computations
  2. Click on the "Resume Test 2025" ComputationCard
  3. Assert: URL is /computations/$compId
  4. Assert: Status badge shows "Draft"
  5. Assert: Input form rendered (not ResultsView)
  6. Assert: Gross Receipts field retains previously saved value
  7. Click "Compute"
  8. Assert: ResultsView renders

Expected result: Draft computations load with saved inputs intact.
```

---

## 5. Test Suite: Auto-Save

**File:** `e2e/auto-save.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

### T-AUTOSAVE-01: Input Changes Persist After Reload

```
Steps:
  1. Navigate to /computations/new
  2. Complete WS-00, WS-01
  3. On WS-04: fill Gross Receipts: "1200000"
  4. Assert: "Saving..." indicator appears (auto-save triggered)
  5. Assert: "Saved" indicator appears within 3 seconds
  6. Note the URL: /computations/$compId (created on first save)
  7. Reload the page (Ctrl+R)
  8. Assert: URL is still /computations/$compId
  9. Assert: Gross Receipts field shows "1,200,000" (value persisted)

Expected result: Auto-save preserves wizard inputs across reloads.

Assertions timing:
  - Auto-save debounce: 1.5s after last keystroke
  - DB write: within 1s
  - Total "Saved" indicator: within 3s of last keystroke
```

### T-AUTOSAVE-02: Status Indicator States

```
Steps:
  1. On computation detail page (draft status)
  2. Change a field value
  3. Assert: "Saving..." text visible in status indicator immediately
  4. Wait 3 seconds
  5. Assert: "Saved" text visible
  6. Wait 5 more seconds
  7. Assert: indicator returns to idle (no text or checkmark only)

Expected result: Three-state auto-save indicator (saving → saved → idle).
```

---

## 6. Test Suite: Compute Engine

**File:** `e2e/compute-engine.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

### T-ENGINE-01: WASM Bridge — Results Correctness

```
Description:
  Verify the WASM engine produces correct output by comparing against
  TV-BASIC-001 expected values. This is the only E2E test that
  validates computation accuracy.

Steps:
  1. Navigate to /computations/new
  2. Fill wizard with TV-BASIC-001 inputs:
     - Mode: Annual
     - Type: Purely Self-Employed
     - Tax Year: 2025
     - Gross Receipts: 700000
     - No itemized expenses
     - No CWT certificates
     - Expense Method: OSD (let engine compare)
     - Regime: Let TaxKlaro Recommend
  3. Click "See My Results"
  4. Wait for ResultsView

  Assertions (TV-BASIC-001 expected values):
  5. Assert: element [data-testid="recommended-regime"] text contains "8% Flat Tax"
  6. Assert: element [data-testid="tax-due-path-b"] text contains "36,000"
  7. Assert: element [data-testid="regime-comparison-path-a"] visible
  8. Assert: element [data-testid="regime-comparison-path-b"] has class indicating "winner"
  9. Assert: element [data-testid="regime-comparison-path-c"] visible
  10. Assert: NO manual review flags visible (clean case, no flags expected)
  11. Assert: element [data-testid="savings-callout"] visible with non-zero savings

Expected result: Engine output exactly matches TV-BASIC-001 expected values.
```

### T-ENGINE-02: WASM Error Handling — VAT Ineligibility

```
Description:
  Verify that VAT-registered taxpayers with gross < ₱3M see correct
  ineligibility message for 8% option.

Steps:
  1. Navigate to /computations/new, fill wizard:
     - Gross Receipts: 2000000 (₱2M — under VAT threshold but VAT registered)
     - Is VAT Registered: YES
  2. Compute
  3. Assert: ResultsView visible
  4. Assert: 8% option section shows ineligibility note
  5. Assert: recommended regime is Path A (OSD Graduated) or Path C (Itemized Graduated)
  6. Assert: ManualReviewFlag visible or advisory text "VAT-registered taxpayers cannot elect 8%"

Expected result: Ineligible regime flagged correctly, alternative recommended.
```

---

## 7. Test Suite: Share Flow

**File:** `e2e/share.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

### T-SHARE-01: Enable Sharing and View Public Link

```
Preconditions:
  - A computed computation exists

Steps:
  1. Navigate to /computations/$compId (computed status)
  2. Click "Share" button in ActionsBar
  3. Assert: Sheet/Panel opens with title "Share Computation"
  4. Assert: sharing toggle is OFF by default
  5. Assert: share link field is greyed out / no URL shown
  6. Toggle sharing ON
  7. Assert: toggle animates to ON state
  8. Assert: share URL appears in link field (format: https://taxklaro.ph/share/{uuid})
  9. Assert: Sonner toast: "Computation shared! Link copied."
  10. Assert: clipboard contains the share URL (verify via navigator.clipboard read)

  --- Open in new incognito context ---
  11. Open a new browser context (incognito) with NO auth state
  12. Navigate to the share URL
  13. Assert: no AppLayout sidebar visible (bare layout)
  14. Assert: TaxKlaro logo visible in header
  15. Assert: "Shared Computation" or computation title visible
  16. Assert: ResultsView visible with the same data
  17. Assert: NO ActionsBar (read-only — no Compute, Export PDF, Share buttons)
  18. Assert: "Created with TaxKlaro" attribution footer visible

Expected result: Sharing toggle creates public link, incognito access shows read-only results.
```

### T-SHARE-02: Disable Sharing — Link Invalidated

```
Preconditions:
  - T-SHARE-01 completed, share URL captured

Steps:
  1. Return to authenticated session
  2. Navigate to /computations/$compId
  3. Click "Share" button
  4. Assert: sharing toggle is ON
  5. Toggle sharing OFF
  6. Assert: toast "Share link disabled"
  7. Open incognito context, navigate to the share URL from T-SHARE-01
  8. Assert: "This link is no longer valid or sharing has been disabled." card visible
  9. Assert: NO computation data shown

Expected result: Disabling sharing invalidates existing share URLs.
```

### T-SHARE-03: Invalid Share Token — Not Found

```
Steps:
  1. Open incognito context (no auth)
  2. Navigate to /share/00000000-0000-0000-0000-000000000000
  3. Assert: "This link is no longer valid" card visible
  4. Assert: no computation data shown
  5. Assert: no JavaScript errors in console (graceful null handling from RPC)

Expected result: Invalid/non-existent tokens handled gracefully.
```

---

## 8. Test Suite: PDF Export

**File:** `e2e/pdf-export.spec.ts`
**Auth:** uses `e2e/.auth/user.json` with PRO plan org

### T-PDF-01: Export PDF Downloads Correctly

```
Preconditions:
  - A computed computation exists
  - User org has PRO or ENTERPRISE plan (pdf export enabled)

Steps:
  1. Navigate to /computations/$compId (computed status)
  2. Set up download event listener
  3. Click "Export PDF" button in ActionsBar
  4. Assert: loading indicator visible ("Generating PDF..." or button disabled)
  5. Assert: file download triggered within 10 seconds
  6. Assert: downloaded filename matches pattern "tax-computation-*-2025.pdf"
  7. Assert: file size > 20KB (not empty/blank PDF)
  8. Assert: Sonner toast "PDF ready for download" visible

Expected result: PDF generates and downloads with correct filename and non-zero size.
```

### T-PDF-02: Export PDF Disabled for FREE Plan

```
Preconditions:
  - User org has FREE plan

Steps:
  1. Navigate to /computations/$compId (computed status)
  2. Assert: "Export PDF" button visible but disabled (grayed out)
  3. Hover over "Export PDF" button
  4. Assert: Tooltip visible "Upgrade to PRO to export PDFs"
  5. Click the button (should not trigger download)
  6. Assert: no download event fired
  7. Assert: upgrade modal or navigation to /settings does NOT happen (tooltip only)

Expected result: PDF export gracefully gated for free plan users.
```

---

## 9. Test Suite: Client Management

**File:** `e2e/client-management.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

### T-CLIENT-01: Add New Client

```
Steps:
  1. Click "Clients" in sidebar
  2. Assert: URL is /clients
  3. Assert: EmptyState visible "No clients yet" (first time)
     OR existing clients table visible (subsequent runs)
  4. Click "Add Client" button (EmptyState CTA or top-right button)
  5. Assert: URL changes to /clients/new
  6. Fill Full Name: "Juan dela Cruz"
  7. Fill Email: "juan@example.ph"
  8. Fill Phone: "09171234567"
  9. Fill TIN: "123-456-789-000"
  10. Click "Save Client"
  11. Assert: URL changes to /clients/$clientId
  12. Assert: Sonner toast "Client added successfully"
  13. Assert: client profile page shows: Name, Email, TIN
  14. Assert: "Computations for this client" section visible (empty initially)
  15. Assert: "New Computation" button visible → links to /computations/new?clientId=$clientId

Expected result: Client created and visible in profile with linked computation CTA.
```

### T-CLIENT-02: New Computation Pre-Filled from Client

```
Preconditions:
  - Client "Juan dela Cruz" exists with known $clientId

Steps:
  1. Navigate to /clients/$clientId
  2. Click "New Computation for This Client"
  3. Assert: URL is /computations/new?clientId=$clientId
  4. Assert: wizard opens with client name pre-filled OR client linked (WS-01 shows client)
  5. Complete wizard and compute
  6. Navigate back to /clients/$clientId
  7. Assert: new computation appears in "Computations for this client" list

Expected result: Client-linked computation flow works end-to-end.
```

### T-CLIENT-03: Client Table Search/Sort

```
Preconditions:
  - At least 3 clients exist

Steps:
  1. Navigate to /clients
  2. Assert: clients table renders with columns: Name, TIN, Email, Phone, Actions
  3. Assert: rows sorted alphabetically by name (ascending)
  4. Type "Juan" in search field (if search exists)
     OR: confirm all clients visible in correct order

Expected result: Clients list renders with all columns populated.
```

---

## 10. Test Suite: Team Management

**File:** `e2e/team-management.spec.ts`
**Auth:** uses `e2e/.auth/user.json` (admin role)

### T-TEAM-01: Send Team Invitation

```
Preconditions:
  - User is org admin
  - Org has PRO or ENTERPRISE plan (multiple seats)

Steps:
  1. Click "Settings" in sidebar
  2. Click "Team" tab or navigate to /settings/team
  3. Assert: "Current Members" section shows at least 1 member (current user)
  4. Assert: "Invite New Member" form visible
  5. Fill Invite Email: TEST_INVITE_EMAIL
  6. Select Role: "Staff"
  7. Click "Send Invitation"
  8. Assert: Sonner toast "Invitation sent to {email}"
  9. Assert: invitation appears in "Pending Invitations" table
  10. Assert: invitation shows: email, role "Staff", status "Pending", expiry date (7 days from now)

Expected result: Invitation sent and visible in pending list.
```

### T-TEAM-02: Revoke Invitation

```
Preconditions:
  - T-TEAM-01 completed, pending invitation exists

Steps:
  1. Navigate to /settings/team
  2. Find invitation for TEST_INVITE_EMAIL in Pending Invitations table
  3. Click "Revoke" button for that invitation
  4. Assert: confirmation dialog appears (if confirmation is required)
  5. Confirm revocation
  6. Assert: Sonner toast "Invitation revoked"
  7. Assert: invitation removed from Pending Invitations table

Expected result: Invitation revoked and removed from list.
```

### T-TEAM-03: Seat Limit Enforcement — FREE Plan

```
Preconditions:
  - User org has FREE plan (1 seat)

Steps:
  1. Navigate to /settings/team
  2. Assert: "Invite New Member" form is NOT visible
  3. Assert: upgrade CTA visible "Upgrade to PRO to add team members"
  4. Assert: "Current Members" shows only 1 member (solo plan)

Expected result: Free plan users cannot invite team members.
```

---

## 11. Test Suite: Deadlines

**File:** `e2e/deadlines.spec.ts`
**Auth:** uses `e2e/.auth/user.json`

### T-DEADLINES-01: Deadlines Page Loads

```
Steps:
  1. Click "Deadlines" in sidebar
  2. Assert: URL is /deadlines
  3. Assert (no deadlines): EmptyState with Calendar icon, "No upcoming deadlines"
  4. Assert (has deadlines): DeadlineCards visible, grouped by month
  5. Assert: each card shows: label, due date, computation title, client name

Expected result: Deadlines page renders correctly for both empty and non-empty states.
```

---

## 12. Test Suite: Responsive (Mobile)

**File:** `e2e/responsive.spec.ts`
**Auth:** uses `e2e/.auth/user.json`
**Viewport:** 375×812 (Pixel 5)

### T-RESPONSIVE-01: Mobile Navigation

```
Steps:
  1. Navigate to /computations (mobile viewport)
  2. Assert: sidebar NOT visible (desktop sidebar hidden)
  3. Assert: hamburger menu button (Menu icon) visible in top bar
  4. Click hamburger button
  5. Assert: drawer slides in from left
  6. Assert: navigation items visible in drawer: Dashboard, New Computation, Computations, Clients, Deadlines, Settings
  7. Click "Computations" in drawer
  8. Assert: drawer closes
  9. Assert: URL stays at /computations
  10. Assert: navigation worked (page content for /computations visible)

Expected result: Mobile drawer navigation works correctly.
```

### T-RESPONSIVE-02: Mobile Wizard

```
Steps:
  1. Navigate to /computations/new (mobile viewport)
  2. Assert: wizard renders in single-column layout
  3. Assert: "Continue" button full-width at bottom
  4. Assert: "Back" button visible above "Continue"
  5. Assert: progress bar visible and readable
  6. Fill Step WS-00, click "Continue"
  7. Assert: smooth transition to WS-01 (no layout shift)
  8. Assert: all fields on WS-01 visible without horizontal scroll

Expected result: Wizard is usable on 375px viewport.
```

---

## 13. Test Suite: Error Handling

**File:** `e2e/error-handling.spec.ts`

### T-ERROR-01: Missing VITE_SUPABASE_URL — SetupPage

```
Preconditions:
  - Production build with no VITE_SUPABASE_URL env var
  - This test requires a special build; skip in standard CI

Steps:
  1. Navigate to /
  2. Assert: SetupPage renders (NOT crash/white page)
  3. Assert: heading "TaxKlaro Setup" or "Configuration Required" visible
  4. Assert: instructions for setting VITE_SUPABASE_URL visible
  5. Assert: no JavaScript uncaught exceptions in console

Expected result: Missing config shows setup page, not a blank crash.
```

### T-ERROR-02: Network Error During Compute

```
Steps:
  1. Navigate to /computations/$compId (draft status)
  2. Intercept the WASM load request and make it fail:
     await page.route('**/*.wasm', route => route.abort())
  3. Click "Compute" button
  4. Assert: Sonner toast error "Failed to initialize computation engine. Please refresh and try again."
  5. Assert: "Compute" button re-enabled (not stuck in loading state)
  6. Assert: computation status remains "draft" (no partial save)

Expected result: WASM load failure handled gracefully, user can retry.
```

### T-ERROR-03: Supabase Error During Save

```
Steps:
  1. Navigate to /computations/new, fill WS-04 with ₱500,000
  2. Intercept Supabase REST calls and return 503:
     await page.route('**/rest/v1/computations**', route => route.fulfill({ status: 503 }))
  3. Trigger auto-save (wait 2 seconds after field change)
  4. Assert: "Saving..." indicator appears
  5. Assert: Sonner toast error "Error saving computation. Changes may not be saved."
  6. Assert: Status indicator shows error state (not "Saved")

Expected result: Save failures surfaced to user, data not silently lost.
```

---

## 14. Orphan Verification Script

In addition to Playwright tests, the CI pipeline runs a static orphan check:

### `scripts/orphan-scan.ts`

```typescript
// Verifies every component in src/components/ is:
// 1. Imported by at least one route OR parent component (static analysis)
// 2. Listed in the component-wiring-map (documentation check)

// Additionally verifies action triggers:
// For action-triggered features (PDF, share, delete, finalize):
// 3. The trigger button exists in the parent component specified in action-trigger-map.md

// Failure mode: exits with code 1, prints list of orphaned components

// Run in CI Phase 7 before Playwright:
// npx tsx scripts/orphan-scan.ts
```

---

## 15. CI Integration Order

Playwright E2E tests run AFTER unit tests and production build:

```
Phase 1: Unit tests (vitest run) — must pass before E2E starts
Phase 2: Production build (npm run build) — must succeed
Phase 3: Production serve (npx serve dist -l 8080) — start in background
Phase 4: Supabase local start (supabase start) — required for E2E auth
Phase 5: Playwright E2E (npx playwright test)
  - auth.setup.ts runs first (creates test user)
  - All other suites run in parallel per --workers config
  - Mobile suite runs on Pixel 5 project
Phase 6: Cleanup (supabase stop, kill serve process)
```

### Environment Variables Required for E2E

```
E2E_BASE_URL=http://localhost:8080       # production build server
VITE_SUPABASE_URL=http://127.0.0.1:54321 # local Supabase
VITE_SUPABASE_ANON_KEY=<local-anon-key> # from supabase status
VITE_APP_URL=http://localhost:8080
```

---

## 16. Critical Traps

1. **auth.setup.ts must run first**: Use Playwright `--project auth-setup` with `dependencies` in config. Auth state file `e2e/.auth/user.json` must exist before other suites start.

2. **Email auto-confirm in local dev**: Set `enable_email_autoconfirm = true` in `supabase/config.toml` for E2E. In CI against production Supabase, use service key to confirm email via admin API before test login.

3. **UUID in share token**: Route param `$token` in `/share/$token` is a string. E2E tests using invalid UUIDs (T-SHARE-03) must use valid UUID format `00000000-0000-0000-0000-000000000000` — the RPC must handle this as "not found" not a DB error.

4. **PDF download in headless Chrome**: Playwright headless mode blocks downloads by default. Set `acceptDownloads: true` in the browser context for T-PDF-01.

5. **WASM in Playwright**: Production build fetches `.wasm` file from `/assets/`. Playwright's network interception in T-ERROR-02 must match the exact path, not `**/*.wasm` loosely (may intercept other binaries).

6. **Auto-save timing**: T-AUTOSAVE-01 must wait at least 2s after field change before asserting "Saved" (1.5s debounce + ~300ms DB write). Use `page.waitForSelector('[data-testid="save-status-saved"]')` with a 5s timeout.

7. **PRO plan for PDF/share tests**: T-PDF-01 and T-SHARE-01 require a PRO plan org. Either create the test org with PRO plan via direct DB insert in `auth.setup.ts`, or use a separate fixture for premium tests.

8. **Test isolation**: Each test suite should create its own computations rather than sharing state from other suites. Use `beforeEach` to create a fresh draft computation for wizard/compute suites.
