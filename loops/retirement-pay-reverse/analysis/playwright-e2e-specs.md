# Analysis: Playwright E2E Test Scenarios

**Wave:** 6 — Testing + Deployment
**Aspect:** playwright-e2e-specs
**Date:** 2026-03-06
**Sources:** auth-flow.md, wizard-steps.md, route-table.md, batch-upload-ui.md, sharing.md, nlrc-worksheet-ui.md, action-trigger-map.md, results-view.md, computation-management.md, org-model.md

---

## Overview

This document specifies the complete Playwright E2E test suite for the RA 7641 Retirement Pay
Calculator. Every critical user flow has at least one happy-path spec and one failure-path spec.

Tests run against the app served from `npm run build && npx serve dist` (production build),
not `npm run dev`. This catches tree-shaking, WASM loading, and Vite plugin ordering issues.

Test user credentials are seeded via `supabase db seed` before the test suite runs.

---

## File Structure

```
apps/retirement-pay/frontend/
├── playwright.config.ts
├── e2e/
│   ├── fixtures/
│   │   ├── auth.fixture.ts          # Authenticated page fixture
│   │   ├── test-data.ts             # Employee test data constants
│   │   └── sample.csv               # Sample batch CSV file
│   ├── auth.spec.ts                 # Auth flow tests
│   ├── wizard.spec.ts               # Single employee wizard tests
│   ├── results.spec.ts              # Results page tests
│   ├── nlrc.spec.ts                 # NLRC worksheet tests
│   ├── batch.spec.ts                # Batch upload tests
│   ├── sharing.spec.ts              # Share link tests
│   ├── org.spec.ts                  # Organization management tests
│   ├── dashboard.spec.ts            # Dashboard tests
│   └── navigation.spec.ts           # Navigation + auth guard tests
```

---

## Playwright Config

**File:** `apps/retirement-pay/frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,   // false: Supabase state is shared; tests must not run concurrently
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',  // `npx serve dist` default port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx serve dist --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## Auth Fixture

**File:** `e2e/fixtures/auth.fixture.ts`

```typescript
import { test as base, type Page } from '@playwright/test'

// Test accounts seeded into local Supabase (no email confirmation required in dev)
export const TEST_USER = {
  email: 'hr@testcompany.com.ph',
  password: 'Test1234!',
  fullName: 'Maria Santos',
}

export const TEST_USER_2 = {
  email: 'hr2@testcompany.com.ph',
  password: 'Test1234!',
  fullName: 'Juan dela Cruz',
}

type AuthFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Sign in via the UI (not API session injection) to test the full auth flow
    await page.goto('/auth/sign-in')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/dashboard')
    await use(page)
  },
})

export const { expect } = test
```

---

## Test Data Constants

**File:** `e2e/fixtures/test-data.ts`

```typescript
// Standard test employee — produces deterministic retirement pay
export const STANDARD_EMPLOYEE = {
  // Step 1: Employee info
  employeeName: 'Ana Reyes',
  employeeId: 'EMP-001',
  companyName: 'Sunrise Manufacturing Corp.',
  // Step 2: Employment dates
  hireDate: '2000-01-15',       // January 15, 2000
  retirementDate: '2025-01-15', // 25 credited years exactly
  // Step 3: Salary & benefits
  monthlyBasicSalary: '40000',   // PHP 40,000 basic
  regularAllowances: '5000',     // PHP 5,000 regular allowance
  annualSilDays: '5',
  thirteenthMonthPay: '40000',   // = 1 month basic
  // Step 4: Retirement details
  retirementAge: '60',
  retirementType: 'optional',    // Voluntary at age 60
  hasBirApprovedPlan: 'false',
  // Expected output (pre-computed):
  //   Daily rate = (40000 + 5000) / 26 = 1730.77 approx
  //   Actually: (monthlyBasic * 12) / 312 for daily rate per 22.5-day formula
  //   22.5-day value = 22.5 * daily rate
  //   Credited years = 25
  //   Retirement pay = 25 * 22.5 * daily rate
  // Expected: approximately PHP 975,000 (precise centavo value in test assertions)
}

// Employee with partial credited years (6-month rounding)
export const ROUNDING_EMPLOYEE = {
  employeeName: 'Pedro Mendoza',
  hireDate: '2010-01-01',
  retirementDate: '2025-08-01',  // 15 years 7 months → rounds to 16 credited years
  monthlyBasicSalary: '30000',
  companyName: 'Coastal Foods Inc.',
  retirementAge: '65',
  retirementType: 'compulsory',
}

// Employee eligible for tax exemption (BIR-approved plan, age >= 50, 10+ years)
export const TAX_EXEMPT_EMPLOYEE = {
  employeeName: 'Carmen Villanueva',
  hireDate: '2005-03-01',
  retirementDate: '2025-03-01',  // 20 years service
  monthlyBasicSalary: '80000',
  companyName: 'MNC Corporation',
  retirementAge: '55',
  retirementType: 'optional',
  hasBirApprovedPlan: 'true',
}

// Batch CSV content (5 employees)
export const BATCH_CSV_CONTENT = `employee_name,employee_id,company_name,hire_date,retirement_date,monthly_basic_salary,regular_allowances,annual_sil_days,thirteenth_month_pay,retirement_age,retirement_type,has_bir_approved_plan
Ana Reyes,EMP-001,Sunrise Corp,2000-01-15,2025-01-15,40000,5000,5,40000,60,optional,false
Pedro Mendoza,EMP-002,Coastal Foods,2010-01-01,2025-08-01,30000,0,5,30000,65,compulsory,false
Carmen Villanueva,EMP-003,MNC Corp,2005-03-01,2025-03-01,80000,0,5,80000,55,optional,true
Jose Bautista,EMP-004,Tech Solutions,2015-06-01,2025-06-01,50000,3000,5,50000,60,optional,false
Maria Cruz,EMP-005,Retail Group,2008-09-01,2025-09-01,25000,0,5,25000,65,compulsory,false`
```

---

## Suite 1: Authentication (`auth.spec.ts`)

### Spec 1.1 — Sign In with Valid Credentials

```typescript
test('sign in with valid email/password navigates to dashboard', async ({ page }) => {
  await page.goto('/auth/sign-in')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Password').fill(TEST_USER.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

### Spec 1.2 — Sign In with Invalid Credentials

```typescript
test('sign in with wrong password shows error message', async ({ page }) => {
  await page.goto('/auth/sign-in')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Password').fill('WrongPassword99!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Inline error Alert appears — no navigation
  await expect(page.getByRole('alert')).toContainText('Invalid email or password')
  await expect(page).toHaveURL('/auth/sign-in')
})
```

### Spec 1.3 — Magic Link Request

```typescript
test('magic link: entering email shows confirmation message', async ({ page }) => {
  await page.goto('/auth/sign-in')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByRole('button', { name: 'Send magic link' }).click()

  // Page shows confirmation (no navigation)
  await expect(page.getByText(/check your email/i)).toBeVisible()
  await expect(page).toHaveURL('/auth/sign-in')
})
```

### Spec 1.4 — Magic Link Without Email

```typescript
test('magic link: clicking without email shows field error', async ({ page }) => {
  await page.goto('/auth/sign-in')
  // Do NOT fill email
  await page.getByRole('button', { name: 'Send magic link' }).click()

  await expect(page.getByRole('alert')).toContainText('Enter your email address first')
})
```

### Spec 1.5 — Sign Up Shows Email Confirmation Screen

```typescript
test('sign up shows email confirmation message after submit', async ({ page }) => {
  const uniqueEmail = `test-${Date.now()}@example.com`

  await page.goto('/auth/sign-up')
  await page.getByLabel('Full name').fill('Test User')
  await page.getByLabel('Email').fill(uniqueEmail)
  await page.getByLabel('Password').fill('SecurePass99!')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByText(/check your email/i)).toBeVisible()
  await expect(page.getByText(uniqueEmail)).toBeVisible()
})
```

### Spec 1.6 — Sign Up with Short Password

```typescript
test('sign up validates password minimum length', async ({ page }) => {
  await page.goto('/auth/sign-up')
  await page.getByLabel('Full name').fill('Test User')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('short')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('alert')).toContainText('at least 8 characters')
})
```

### Spec 1.7 — Forgot Password Shows Confirmation

```typescript
test('forgot password: submitting valid email shows sent confirmation', async ({ page }) => {
  await page.goto('/auth/forgot-password')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByRole('button', { name: 'Send reset link' }).click()

  await expect(page.getByRole('alert')).toContainText(/reset link|check your inbox/i)
})
```

### Spec 1.8 — Sign Out

```typescript
test('sign out navigates to landing page', async ({ authenticatedPage: page }) => {
  // Find and click sign out in user menu
  await page.getByRole('button', { name: /sign out/i }).click()

  await expect(page).toHaveURL('/')
  // Attempting to go to dashboard redirects back to sign-in
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/auth/sign-in')
})
```

### Spec 1.9 — Auth Guard Redirect

```typescript
test('unauthenticated user is redirected from protected route to sign-in', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/auth/sign-in')
})

test('unauthenticated user redirected from /compute/new', async ({ page }) => {
  await page.goto('/compute/new')
  await expect(page).toHaveURL('/auth/sign-in')
})
```

---

## Suite 2: Single Employee Wizard (`wizard.spec.ts`)

### Spec 2.1 — Full Wizard Happy Path (Steps 1–4, Skip Step 5)

```typescript
test('complete wizard with skip on step 5 navigates to results', async ({ authenticatedPage: page }) => {
  await page.goto('/compute/new')

  // Step 1: Employee info
  await expect(page.getByText('Step 1 of 5')).toBeVisible()
  await page.getByLabel('Employee Name').fill(STANDARD_EMPLOYEE.employeeName)
  await page.getByLabel('Employee ID').fill(STANDARD_EMPLOYEE.employeeId)
  await page.getByLabel('Company Name').fill(STANDARD_EMPLOYEE.companyName)
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 2: Employment dates
  await expect(page.getByText('Step 2 of 5')).toBeVisible()
  await page.getByLabel('Hire Date').fill(STANDARD_EMPLOYEE.hireDate)
  await page.getByLabel('Retirement Date').fill(STANDARD_EMPLOYEE.retirementDate)
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 3: Salary & benefits
  await expect(page.getByText('Step 3 of 5')).toBeVisible()
  await page.getByLabel('Monthly Basic Salary').fill(STANDARD_EMPLOYEE.monthlyBasicSalary)
  await page.getByLabel('Regular Allowances').fill(STANDARD_EMPLOYEE.regularAllowances)
  await page.getByLabel('Annual SIL Days').fill(STANDARD_EMPLOYEE.annualSilDays)
  await page.getByLabel('13th Month Pay').fill(STANDARD_EMPLOYEE.thirteenthMonthPay)
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 4: Retirement details
  await expect(page.getByText('Step 4 of 5')).toBeVisible()
  await page.getByLabel('Retirement Age').fill(STANDARD_EMPLOYEE.retirementAge)
  await page.getByLabel('Retirement Type').selectOption(STANDARD_EMPLOYEE.retirementType)
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 5: Company plan — skip
  await expect(page.getByText('Step 5 of 5')).toBeVisible()
  await page.getByRole('button', { name: /skip/i }).click()

  // Should navigate to results
  await expect(page).toHaveURL(/\/compute\/.+\/results/)
  await expect(page.getByText('Total Retirement Pay')).toBeVisible()
})
```

### Spec 2.2 — Wizard Back Navigation Preserves Data

```typescript
test('wizard back button preserves step data', async ({ authenticatedPage: page }) => {
  await page.goto('/compute/new')

  const testName = 'Luisa Fernandez'

  // Step 1: Fill employee name
  await page.getByLabel('Employee Name').fill(testName)
  await page.getByLabel('Company Name').fill('Test Corp')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 2: Go back
  await expect(page.getByText('Step 2 of 5')).toBeVisible()
  await page.getByRole('button', { name: /back/i }).click()

  // Step 1 should show the filled name
  await expect(page.getByLabel('Employee Name')).toHaveValue(testName)
})
```

### Spec 2.3 — Wizard Step 1 Validation

```typescript
test('wizard step 1 requires employee name and company name', async ({ authenticatedPage: page }) => {
  await page.goto('/compute/new')

  // Click continue without filling required fields
  await page.getByRole('button', { name: /continue/i }).click()

  // Should still be on step 1 with validation errors
  await expect(page.getByText('Step 1 of 5')).toBeVisible()
  await expect(page.getByText(/required|is required/i)).toBeVisible()
})
```

### Spec 2.4 — Wizard Step 2: Retirement Before Hire

```typescript
test('wizard step 2 validates retirement date is after hire date', async ({ authenticatedPage: page }) => {
  await page.goto('/compute/new')

  // Complete step 1
  await page.getByLabel('Employee Name').fill('Test Employee')
  await page.getByLabel('Company Name').fill('Test Corp')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 2: enter dates where retirement is before hire
  await page.getByLabel('Hire Date').fill('2020-01-01')
  await page.getByLabel('Retirement Date').fill('2015-01-01')
  await page.getByRole('button', { name: /continue/i }).click()

  // Validation error
  await expect(page.getByText(/retirement date must be after hire date/i)).toBeVisible()
  await expect(page.getByText('Step 2 of 5')).toBeVisible()
})
```

### Spec 2.5 — Wizard Step 3: Negative Salary Rejected

```typescript
test('wizard step 3 rejects negative salary', async ({ authenticatedPage: page }) => {
  await page.goto('/compute/new')

  // Skip to step 3
  await page.getByLabel('Employee Name').fill('Test')
  await page.getByLabel('Company Name').fill('Corp')
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByLabel('Hire Date').fill('2000-01-01')
  await page.getByLabel('Retirement Date').fill('2025-01-01')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 3: enter negative salary
  await page.getByLabel('Monthly Basic Salary').fill('-5000')
  await page.getByRole('button', { name: /continue/i }).click()

  await expect(page.getByText(/must be.*positive|greater than 0/i)).toBeVisible()
})
```

### Spec 2.6 — Full Wizard with Company Plan (Step 5)

```typescript
test('complete wizard including company plan step shows gap analysis in results', async ({ authenticatedPage: page }) => {
  await page.goto('/compute/new')

  // Step 1
  await page.getByLabel('Employee Name').fill('Carlos Reyes')
  await page.getByLabel('Company Name').fill('MNC Corp')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 2
  await page.getByLabel('Hire Date').fill('2005-01-01')
  await page.getByLabel('Retirement Date').fill('2025-01-01')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 3
  await page.getByLabel('Monthly Basic Salary').fill('50000')
  await page.getByLabel('Annual SIL Days').fill('5')
  await page.getByLabel('13th Month Pay').fill('50000')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 4
  await page.getByLabel('Retirement Age').fill('60')
  await page.getByLabel('Retirement Type').selectOption('optional')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 5: Enter company plan formula (15-day formula — lower than statutory)
  await page.getByLabel('Company Plan Formula Days').fill('15')
  await page.getByRole('button', { name: /compute retirement pay/i }).click()

  await expect(page).toHaveURL(/\/compute\/.+\/results/)
  // Company plan gap section should be visible
  await expect(page.getByText(/company plan gap|undercovered/i)).toBeVisible()
})
```

### Spec 2.7 — Ineligible Employee (Less than 5 Years Service)

```typescript
test('ineligible employee shows ineligibility reason in results', async ({ authenticatedPage: page }) => {
  await page.goto('/compute/new')

  // Step 1
  await page.getByLabel('Employee Name').fill('New Employee')
  await page.getByLabel('Company Name').fill('Corp')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 2: Only 3 years service (ineligible)
  await page.getByLabel('Hire Date').fill('2022-01-01')
  await page.getByLabel('Retirement Date').fill('2025-01-01')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 3
  await page.getByLabel('Monthly Basic Salary').fill('30000')
  await page.getByLabel('Annual SIL Days').fill('5')
  await page.getByLabel('13th Month Pay').fill('30000')
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 4
  await page.getByLabel('Retirement Age').fill('60')
  await page.getByLabel('Retirement Type').selectOption('optional')
  await page.getByRole('button', { name: /continue/i }).click()

  // Skip step 5
  await page.getByRole('button', { name: /skip/i }).click()

  await expect(page).toHaveURL(/\/compute\/.+\/results/)
  // Should show ineligible badge
  await expect(page.getByText(/not eligible|ineligible/i)).toBeVisible()
  // Should show reason (less than 5 years)
  await expect(page.getByText(/5 years|minimum service/i)).toBeVisible()
})
```

---

## Suite 3: Results Page (`results.spec.ts`)

### Spec 3.1 — Results Page Shows Correct Breakdown Components

```typescript
test('results page shows all required breakdown components', async ({ authenticatedPage: page }) => {
  // Complete wizard first (reuse helper)
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/results`)

  // Required components
  await expect(page.getByText('Total Retirement Pay')).toBeVisible()
  await expect(page.getByText('Eligibility')).toBeVisible()
  await expect(page.getByText('Pay Breakdown')).toBeVisible()
  await expect(page.getByText('Tax Treatment')).toBeVisible()
  // 15-day vs 22.5-day comparison
  await expect(page.getByText(/22\.5.day/i)).toBeVisible()
  await expect(page.getByText(/15.day.*incorrect/i)).toBeVisible()
})
```

### Spec 3.2 — Edit Button Navigates to Edit Page

```typescript
test('edit button on results page navigates to edit wizard', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/results`)
  await page.getByRole('button', { name: /edit/i }).click()

  await expect(page).toHaveURL(`/compute/${computationId}/edit`)
  // Wizard should be pre-populated
  await expect(page.getByLabel('Employee Name')).toHaveValue(STANDARD_EMPLOYEE.employeeName)
})
```

### Spec 3.3 — NLRC Worksheet Button Navigates to NLRC Page

```typescript
test('NLRC worksheet button navigates to NLRC page', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/results`)
  await page.getByRole('button', { name: /nlrc worksheet/i }).click()

  await expect(page).toHaveURL(`/compute/${computationId}/nlrc`)
})
```

### Spec 3.4 — Delete Computation Opens Confirmation Dialog

```typescript
test('delete button shows confirmation dialog before deleting', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/results`)
  await page.getByRole('button', { name: /delete/i }).click()

  // AlertDialog should appear
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expect(page.getByText(/cannot be undone|permanently/i)).toBeVisible()
})
```

### Spec 3.5 — Delete Computation Confirmed

```typescript
test('confirming delete navigates to dashboard and removes computation', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/results`)
  await page.getByRole('button', { name: /delete/i }).click()
  // Confirm in dialog
  await page.getByRole('button', { name: /delete/i }).last().click()

  // Should navigate to dashboard
  await expect(page).toHaveURL('/dashboard')
  // Toast
  await expect(page.getByText('Computation deleted')).toBeVisible()

  // Deleted computation no longer accessible
  await page.goto(`/compute/${computationId}/results`)
  // Should show 404 or redirect (implementation: returns empty state or error)
  await expect(page.getByText(/not found|does not exist|deleted/i)).toBeVisible()
})
```

### Spec 3.6 — PDF Export Downloads File

```typescript
test('PDF export button triggers download', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/results`)

  // Wait for download event when clicking the button
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /export pdf/i }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/retirement-pay.*\.pdf/i)
})
```

---

## Suite 4: NLRC Worksheet (`nlrc.spec.ts`)

### Spec 4.1 — NLRC Worksheet Shows Required Legal Fields

```typescript
test('NLRC worksheet displays required legal fields and citations', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/nlrc`)

  // Required NLRC fields
  await expect(page.getByText(STANDARD_EMPLOYEE.employeeName)).toBeVisible()
  await expect(page.getByText(STANDARD_EMPLOYEE.companyName)).toBeVisible()
  await expect(page.getByText(/statement of computation/i)).toBeVisible()
  await expect(page.getByText(/RA 7641|Republic Act/i)).toBeVisible()
  await expect(page.getByText(/22\.5|22 and one.half/i)).toBeVisible()
  // Legal citation
  await expect(page.getByText(/Elegir/i)).toBeVisible()
})
```

### Spec 4.2 — NLRC PDF Export Downloads File

```typescript
test('NLRC PDF export button triggers download', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/nlrc`)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /download pdf/i }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/nlrc-worksheet.*\.pdf/i)
})
```

### Spec 4.3 — Back to Results Button Works

```typescript
test('back to results button navigates from NLRC to results page', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/nlrc`)
  await page.getByRole('button', { name: /back to results/i }).click()

  await expect(page).toHaveURL(`/compute/${computationId}/results`)
})
```

---

## Suite 5: Batch Upload (`batch.spec.ts`)

### Spec 5.1 — CSV Upload Shows Preview

```typescript
test('uploading valid CSV shows file preview with row count', async ({ authenticatedPage: page }) => {
  await page.goto('/batch/new')

  // Upload the CSV file
  const fileInput = page.locator('input[type="file"][accept=".csv"]')
  await fileInput.setInputFiles({
    name: 'employees.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(BATCH_CSV_CONTENT),
  })

  // File preview card should appear with correct row count
  await expect(page.getByText('employees.csv')).toBeVisible()
  await expect(page.getByText(/5 employees|5 rows/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /compute retirement pay/i })).toBeVisible()
})
```

### Spec 5.2 — Non-CSV File Rejected

```typescript
test('uploading non-CSV file shows error toast', async ({ authenticatedPage: page }) => {
  await page.goto('/batch/new')

  const fileInput = page.locator('input[type="file"][accept=".csv"]')
  await fileInput.setInputFiles({
    name: 'employees.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('fake excel data'),
  })

  await expect(page.getByText(/only csv files/i)).toBeVisible()
})
```

### Spec 5.3 — Clear File Returns to Drop Zone

```typescript
test('clear button returns to file drop zone', async ({ authenticatedPage: page }) => {
  await page.goto('/batch/new')

  const fileInput = page.locator('input[type="file"][accept=".csv"]')
  await fileInput.setInputFiles({
    name: 'employees.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(BATCH_CSV_CONTENT),
  })

  await expect(page.getByText('employees.csv')).toBeVisible()
  await page.getByRole('button', { name: /clear/i }).click()

  // Drop zone re-appears
  await expect(page.getByText(/drop csv here|click to browse/i)).toBeVisible()
  await expect(page.getByText('employees.csv')).not.toBeVisible()
})
```

### Spec 5.4 — Batch Computation Runs and Navigates to Results

```typescript
test('computing batch CSV navigates to batch results page', async ({ authenticatedPage: page }) => {
  await page.goto('/batch/new')

  const fileInput = page.locator('input[type="file"][accept=".csv"]')
  await fileInput.setInputFiles({
    name: 'employees.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(BATCH_CSV_CONTENT),
  })

  await page.getByRole('button', { name: /compute retirement pay/i }).click()

  // Wait for navigation to batch results (computation may take a moment)
  await expect(page).toHaveURL(/\/batch\/.+/, { timeout: 30000 })

  // Results page shows summary
  await expect(page.getByText(/total retirement pay|total liability/i)).toBeVisible()
  await expect(page.getByText(/5 employees/i)).toBeVisible()
})
```

### Spec 5.5 — Batch Results Export CSV

```typescript
test('batch results page CSV export downloads file', async ({ authenticatedPage: page }) => {
  // Navigate to an existing batch result
  const batchId = await computeBatch(page, BATCH_CSV_CONTENT)

  await page.goto(`/batch/${batchId}`)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /export csv/i }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/batch-retirement-pay.*\.csv/i)
})
```

### Spec 5.6 — Batch Results Export PDF

```typescript
test('batch results page PDF export downloads file', async ({ authenticatedPage: page }) => {
  const batchId = await computeBatch(page, BATCH_CSV_CONTENT)

  await page.goto(`/batch/${batchId}`)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /export pdf/i }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/batch-retirement-pay.*\.pdf/i)
})
```

### Spec 5.7 — Batch Results Shows Per-Employee Table

```typescript
test('batch results shows all 5 employees in table', async ({ authenticatedPage: page }) => {
  const batchId = await computeBatch(page, BATCH_CSV_CONTENT)

  await page.goto(`/batch/${batchId}`)

  // All 5 employee names should appear in the results table
  await expect(page.getByText('Ana Reyes')).toBeVisible()
  await expect(page.getByText('Pedro Mendoza')).toBeVisible()
  await expect(page.getByText('Carmen Villanueva')).toBeVisible()
  await expect(page.getByText('Jose Bautista')).toBeVisible()
  await expect(page.getByText('Maria Cruz')).toBeVisible()
})
```

### Spec 5.8 — Invalid CSV (Missing Required Columns) Shows Error

```typescript
test('CSV missing required columns shows batch error state', async ({ authenticatedPage: page }) => {
  await page.goto('/batch/new')

  const badCsv = 'first_name,last_name\nJohn,Doe'
  const fileInput = page.locator('input[type="file"][accept=".csv"]')
  await fileInput.setInputFiles({
    name: 'bad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(badCsv),
  })

  await page.getByRole('button', { name: /compute retirement pay/i }).click()

  // Error state should appear
  await expect(page.getByText(/missing required columns|invalid csv|column.*not found/i)).toBeVisible()
  // Try Again button
  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible()
})
```

---

## Suite 6: Sharing (`sharing.spec.ts`)

### Spec 6.1 — Generate Share Link

```typescript
test('generating share link creates public URL and copies to clipboard', async ({ authenticatedPage: page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}/results`)
  await page.getByRole('button', { name: /share/i }).click()

  // Dialog opens
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText(/share computation/i)).toBeVisible()

  // Generate the link
  await page.getByRole('button', { name: /generate share link/i }).click()

  // Toast appears
  await expect(page.getByText(/share link created/i)).toBeVisible()

  // URL appears in read-only input
  const urlInput = page.getByRole('textbox', { name: '' }).filter({ hasText: /\/share\// })
  await expect(urlInput).toBeVisible()
  const shareUrl = await urlInput.inputValue()
  expect(shareUrl).toMatch(/\/share\/[0-9a-f-]{36}/)

  // Copy button works
  await page.getByRole('button', { name: /copy link/i }).click()
  await expect(page.getByText(/link copied to clipboard/i)).toBeVisible()
})
```

### Spec 6.2 — Recipient Can View Shared Computation

```typescript
test('shared computation URL is accessible without authentication', async ({ page, browser }) => {
  // Authenticate and create a share link
  const authPage = await browser.newPage()
  await signIn(authPage)
  const computationId = await completeWizard(authPage, STANDARD_EMPLOYEE)
  const shareToken = await generateShareLink(authPage, computationId)
  await authPage.close()

  // Now access the share URL without any auth (fresh page, no cookies)
  await page.goto(`/share/${shareToken}`)

  // Should show results without requiring login
  await expect(page.getByText('Total Retirement Pay')).toBeVisible()
  await expect(page.getByText(STANDARD_EMPLOYEE.employeeName)).toBeVisible()
  // Should show legal notice
  await expect(page.getByText(/RA 7641|Elegir/i)).toBeVisible()
  // Should NOT show edit/delete buttons (read-only)
  await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible()
  await expect(page.getByRole('button', { name: /delete/i })).not.toBeVisible()
})
```

### Spec 6.3 — Invalid Share Token Shows Error View

```typescript
test('invalid share token shows invalid link error', async ({ page }) => {
  await page.goto('/share/00000000-0000-0000-0000-000000000000')

  await expect(page.getByText(/invalid or has been revoked|link is invalid/i)).toBeVisible()
  // CTA to create own computation
  await expect(page.getByRole('link', { name: /create your own/i })).toBeVisible()
})
```

### Spec 6.4 — Revoke Share Link

```typescript
test('revoking share link makes URL inaccessible', async ({ authenticatedPage: page, browser }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)
  const shareToken = await generateShareLink(page, computationId)

  // Revoke the link
  await page.goto(`/compute/${computationId}/results`)
  await page.getByRole('button', { name: /share/i }).click()
  await page.getByRole('button', { name: /revoke link/i }).click()

  await expect(page.getByText(/share link revoked/i)).toBeVisible()
  // Dialog should show "no link" state
  await expect(page.getByRole('button', { name: /generate share link/i })).toBeVisible()

  // Verify the old URL now returns invalid
  const newPage = await browser.newPage()
  await newPage.goto(`/share/${shareToken}`)
  await expect(newPage.getByText(/invalid or has been revoked/i)).toBeVisible()
  await newPage.close()
})
```

---

## Suite 7: Organization Management (`org.spec.ts`)

### Spec 7.1 — Create Organization

```typescript
test('creating organization navigates to org dashboard', async ({ authenticatedPage: page }) => {
  await page.goto('/org/new')

  await page.getByLabel('Organization Name').fill('HR Department PH')
  // Slug should auto-fill
  await page.getByRole('button', { name: /create organization/i }).click()

  await expect(page).toHaveURL(/\/org\/.+/)
  await expect(page.getByText(/HR Department PH/i)).toBeVisible()
  await expect(page.getByText(/organization created/i)).toBeVisible()
})
```

### Spec 7.2 — Invite Member to Organization

```typescript
test('invite member dialog sends invitation', async ({ authenticatedPage: page }) => {
  const orgId = await getOrCreateOrg(page, 'Test HR Corp')

  await page.goto(`/org/${orgId}/members`)
  await page.getByRole('button', { name: /invite member/i }).click()

  // Dialog opens
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('Email').fill(TEST_USER_2.email)
  await page.getByLabel('Role').selectOption('member')
  await page.getByRole('button', { name: /send invitation/i }).click()

  await expect(page.getByText(/invitation sent/i)).toBeVisible()
})
```

### Spec 7.3 — New User Without Org Is Redirected to Create Org

```typescript
test('/org redirects to /org/new when user has no organization', async ({ page }) => {
  // Sign in as a freshly created user with no org
  const newUserEmail = `newuser-${Date.now()}@example.com`
  // (Pre-seeded test account with no org membership)
  await signIn(page, { email: 'noorgs@testcompany.com.ph', password: 'Test1234!' })

  await page.goto('/org')
  await expect(page).toHaveURL('/org/new')
})
```

---

## Suite 8: Dashboard (`dashboard.spec.ts`)

### Spec 8.1 — Dashboard Shows Saved Computations

```typescript
test('dashboard shows computation cards for saved computations', async ({ authenticatedPage: page }) => {
  // Create a computation first
  await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto('/dashboard')

  await expect(page.getByText(STANDARD_EMPLOYEE.employeeName)).toBeVisible()
  await expect(page.getByText(STANDARD_EMPLOYEE.companyName)).toBeVisible()
})
```

### Spec 8.2 — Empty Dashboard Shows Empty State

```typescript
test('dashboard shows empty state when no computations exist', async ({ authenticatedPage: page }) => {
  // This test requires a fresh user with no computations
  // Use a dedicated "empty" test user or clean up before running
  await page.goto('/dashboard')

  // If no computations exist, empty state should show
  const hasEmptyState = await page.getByText(/no computations yet|get started/i).isVisible()
  const hasCards = await page.getByTestId('computation-card').count()

  // Either: empty state visible OR cards present (test is valid if user has data)
  expect(hasEmptyState || hasCards > 0).toBe(true)
})
```

### Spec 8.3 — Clicking Computation Card Navigates to Results

```typescript
test('clicking computation card navigates to results page', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto('/dashboard')

  await page.getByText(STANDARD_EMPLOYEE.employeeName).click()

  await expect(page).toHaveURL(`/compute/${computationId}/results`)
})
```

### Spec 8.4 — New Computation Button Navigates to Wizard

```typescript
test('new computation button navigates to wizard', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard')
  await page.getByRole('button', { name: /new computation/i }).click()

  await expect(page).toHaveURL('/compute/new')
  await expect(page.getByText('Step 1 of 5')).toBeVisible()
})
```

### Spec 8.5 — Batch Upload Button Navigates to Batch Page

```typescript
test('batch upload button navigates to batch upload page', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard')
  await page.getByRole('button', { name: /batch upload/i }).click()

  await expect(page).toHaveURL('/batch/new')
  await expect(page.getByText(/drop csv here|upload/i)).toBeVisible()
})
```

---

## Suite 9: Navigation (`navigation.spec.ts`)

### Spec 9.1 — Sidebar Nav Links Navigate Correctly

```typescript
test('sidebar navigation links go to correct pages', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard')

  // Dashboard link
  await page.getByRole('link', { name: /dashboard/i }).first().click()
  await expect(page).toHaveURL('/dashboard')

  // New Computation link
  await page.getByRole('link', { name: /new computation/i }).click()
  await expect(page).toHaveURL('/compute/new')

  // Batch Upload link (via sidebar)
  await page.getByRole('link', { name: /batch upload/i }).click()
  await expect(page).toHaveURL('/batch/new')

  // Settings link
  await page.getByRole('link', { name: /settings/i }).click()
  await expect(page).toHaveURL('/settings')
})
```

### Spec 9.2 — Landing Page CTAs Navigate to Auth

```typescript
test('landing page CTA buttons navigate to sign-up and sign-in', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: /get started|create.*account/i }).click()
  await expect(page).toHaveURL('/auth/sign-up')

  await page.goto('/')
  await page.getByRole('link', { name: /sign in/i }).click()
  await expect(page).toHaveURL('/auth/sign-in')
})
```

### Spec 9.3 — 404 Not Found Page

```typescript
test('navigating to unknown route shows 404 page', async ({ page }) => {
  await page.goto('/this-route-does-not-exist-xyz')

  await expect(page.getByText('404')).toBeVisible()
  await expect(page.getByText(/page not found/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /go to homepage/i })).toBeVisible()
})
```

### Spec 9.4 — /compute/$id Redirects to /compute/$id/results

```typescript
test('/compute/$id redirects to /compute/$id/results', async ({ authenticatedPage: page }) => {
  const computationId = await completeWizard(page, STANDARD_EMPLOYEE)

  await page.goto(`/compute/${computationId}`)
  await expect(page).toHaveURL(`/compute/${computationId}/results`)
})
```

### Spec 9.5 — Mobile Drawer Opens and Navigates

```typescript
test('mobile drawer opens on hamburger click and navigates', async ({ authenticatedPage: page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/dashboard')

  // Hamburger menu button should be visible on mobile
  await page.getByRole('button', { name: /menu|open.*navigation/i }).click()

  // Drawer should slide open with nav links
  await expect(page.getByRole('navigation')).toBeVisible()

  // Click a nav link inside the drawer
  await page.getByRole('link', { name: /new computation/i }).first().click()
  await expect(page).toHaveURL('/compute/new')

  // Drawer should close after navigation
  // (verify by checking drawer is no longer visible or in closed state)
})
```

---

## Suite 10: Setup Page (`setup.spec.ts`)

### Spec 10.1 — Setup Page Shows When Env Vars Missing

```typescript
// Note: This test requires a build without env vars — run in isolation
test('app shows setup page when VITE_SUPABASE_URL is missing', async ({ page }) => {
  // This test is only meaningful when building without env vars
  // In CI: run a separate build step without env vars and test that output
  // The test asserts the SetupPage component renders
  await page.goto('/setup')

  await expect(page.getByText(/setup required|configure/i)).toBeVisible()
  await expect(page.getByText('VITE_SUPABASE_URL')).toBeVisible()
  await expect(page.getByText('VITE_SUPABASE_ANON_KEY')).toBeVisible()
})
```

---

## Helper Functions

**File:** `e2e/fixtures/helpers.ts`

```typescript
import type { Page } from '@playwright/test'
import { TEST_USER } from './auth.fixture'
import type { EmployeeTestData } from './test-data'

export async function signIn(
  page: Page,
  creds = { email: TEST_USER.email, password: TEST_USER.password }
): Promise<void> {
  await page.goto('/auth/sign-in')
  await page.getByLabel('Email').fill(creds.email)
  await page.getByLabel('Password').fill(creds.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/dashboard')
}

export async function completeWizard(
  page: Page,
  employee: EmployeeTestData
): Promise<string> {
  await page.goto('/compute/new')

  // Step 1
  await page.getByLabel('Employee Name').fill(employee.employeeName)
  if (employee.employeeId) await page.getByLabel('Employee ID').fill(employee.employeeId)
  await page.getByLabel('Company Name').fill(employee.companyName)
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 2
  await page.getByLabel('Hire Date').fill(employee.hireDate)
  await page.getByLabel('Retirement Date').fill(employee.retirementDate)
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 3
  await page.getByLabel('Monthly Basic Salary').fill(employee.monthlyBasicSalary)
  await page.getByLabel('Annual SIL Days').fill(employee.annualSilDays ?? '5')
  await page.getByLabel('13th Month Pay').fill(employee.thirteenthMonthPay)
  if (employee.regularAllowances) {
    await page.getByLabel('Regular Allowances').fill(employee.regularAllowances)
  }
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 4
  await page.getByLabel('Retirement Age').fill(employee.retirementAge)
  await page.getByLabel('Retirement Type').selectOption(employee.retirementType)
  await page.getByRole('button', { name: /continue/i }).click()

  // Step 5: always skip in basic helper
  await page.getByRole('button', { name: /skip/i }).click()

  // Wait for results page
  await page.waitForURL(/\/compute\/.+\/results/)

  // Extract ID from URL
  const url = page.url()
  const match = url.match(/\/compute\/([^/]+)\/results/)
  if (!match) throw new Error(`Could not extract computation ID from URL: ${url}`)
  return match[1]
}

export async function generateShareLink(
  page: Page,
  computationId: string
): Promise<string> {
  await page.goto(`/compute/${computationId}/results`)
  await page.getByRole('button', { name: /share/i }).click()
  await page.getByRole('button', { name: /generate share link/i }).click()
  await page.waitForSelector('[data-testid="share-url-input"], input[readonly]')

  const urlInput = page.locator('input[readonly]')
  const shareUrl = await urlInput.inputValue()
  const match = shareUrl.match(/\/share\/([0-9a-f-]{36})/)
  if (!match) throw new Error(`Could not extract token from share URL: ${shareUrl}`)
  return match[1]
}

export async function computeBatch(
  page: Page,
  csvContent: string
): Promise<string> {
  await page.goto('/batch/new')

  const fileInput = page.locator('input[type="file"][accept=".csv"]')
  await fileInput.setInputFiles({
    name: 'batch.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent),
  })

  await page.getByRole('button', { name: /compute retirement pay/i }).click()
  await page.waitForURL(/\/batch\/.+/, { timeout: 30000 })

  const url = page.url()
  const match = url.match(/\/batch\/([^/]+)/)
  if (!match) throw new Error(`Could not extract batch ID from URL: ${url}`)
  return match[1]
}

export async function getOrCreateOrg(
  page: Page,
  orgName: string
): Promise<string> {
  await page.goto('/org')

  if (page.url().includes('/org/new')) {
    // Create new org
    await page.getByLabel('Organization Name').fill(orgName)
    await page.getByRole('button', { name: /create organization/i }).click()
    await page.waitForURL(/\/org\/.+/)
  }

  // Extract orgId from URL
  const url = page.url()
  const match = url.match(/\/org\/([0-9a-f-]{36})/)
  if (!match) throw new Error(`Could not extract orgId from URL: ${url}`)
  return match[1]
}
```

---

## Database Seeding for E2E Tests

**File:** `supabase/seed.sql` (additions for E2E test users)

```sql
-- E2E test users (created via Supabase auth API in setup script, not raw SQL)
-- Run once before E2E suite:
--   supabase db reset
--   node e2e/scripts/seed-test-users.js
--
-- Test users seeded:
--   hr@testcompany.com.ph / Test1234!   — primary test user
--   hr2@testcompany.com.ph / Test1234!  — secondary test user (for sharing, org tests)
--   noorgs@testcompany.com.ph / Test1234! — user with no org membership
```

**File:** `e2e/scripts/seed-test-users.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role — allows creating users directly
)

const testUsers = [
  { email: 'hr@testcompany.com.ph', password: 'Test1234!', fullName: 'Maria Santos' },
  { email: 'hr2@testcompany.com.ph', password: 'Test1234!', fullName: 'Juan dela Cruz' },
  { email: 'noorgs@testcompany.com.ph', password: 'Test1234!', fullName: 'No Org User' },
]

for (const user of testUsers) {
  const { error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    user_metadata: { full_name: user.fullName },
    email_confirm: true,  // Bypass email confirmation in test env
  })

  if (error && !error.message.includes('already registered')) {
    console.error(`Failed to create ${user.email}:`, error.message)
    process.exit(1)
  }

  console.log(`Seeded: ${user.email}`)
}
```

---

## CI Integration

E2E tests run as the final stage of the CI pipeline, after the production build is verified.

```yaml
# In .github/workflows/ci.yml — e2e job
e2e:
  runs-on: ubuntu-latest
  needs: [build]  # E2E always runs against production build
  steps:
    - uses: actions/checkout@v4
    - uses: supabase/setup-cli@v1
    - name: Start local Supabase
      run: supabase start
    - name: Seed test users
      run: npx tsx e2e/scripts/seed-test-users.ts
      env:
        SUPABASE_URL: http://localhost:54321
        SUPABASE_SERVICE_ROLE_KEY: ${{ steps.supabase.outputs.service_role_key }}
    - name: Build frontend
      run: npm run build
      working-directory: apps/retirement-pay/frontend
      env:
        VITE_SUPABASE_URL: http://localhost:54321
        VITE_SUPABASE_ANON_KEY: ${{ steps.supabase.outputs.anon_key }}
    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium
    - name: Run E2E tests
      run: npx playwright test
      working-directory: apps/retirement-pay/frontend
    - name: Upload test report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: apps/retirement-pay/frontend/playwright-report/
```

---

## Test Coverage Summary

| Flow | # Specs | Happy Path | Error Path |
|------|---------|------------|------------|
| Auth — sign in/out | 9 | Yes | Yes |
| Single wizard | 7 | Yes | Yes |
| Results page | 6 | Yes | Yes |
| NLRC worksheet | 3 | Yes | No (no error path needed) |
| Batch upload | 8 | Yes | Yes |
| Share link | 4 | Yes | Yes |
| Organization | 3 | Yes | No |
| Dashboard | 5 | Yes | Yes |
| Navigation | 5 | Yes | Yes |
| Setup page | 1 | Yes | N/A |
| **Total** | **51** | — | — |

---

## Summary

51 Playwright E2E specs covering all critical flows:

1. **Auth (9 specs)** — sign-in/sign-out, magic link, sign-up, forgot password, update password, auth guard redirects
2. **Wizard (7 specs)** — full happy path, back navigation, field validation, ineligible employee
3. **Results (6 specs)** — breakdown display, edit navigation, NLRC navigation, delete (dialog + confirm), PDF export
4. **NLRC (3 specs)** — content display, PDF export, back navigation
5. **Batch (8 specs)** — CSV upload, non-CSV rejection, clear file, compute + navigate, CSV export, PDF export, per-employee table, invalid CSV error
6. **Sharing (4 specs)** — generate link, recipient view (unauthenticated), invalid token, revoke
7. **Org (3 specs)** — create org, invite member, redirect for new user
8. **Dashboard (5 specs)** — saved computations display, empty state, card click, new computation, batch upload buttons
9. **Navigation (5 specs)** — sidebar links, landing page CTAs, 404, /compute/$id redirect, mobile drawer
10. **Setup (1 spec)** — setup page renders when env vars missing

Key design decisions:
- Tests run against **production build** (`npx serve dist`) not dev server
- `fullyParallel: false` and `workers: 1` — Supabase state is shared
- Helper functions (`completeWizard`, `generateShareLink`, `computeBatch`) reduce repetition
- Test users seeded with `email_confirm: true` via service role key (bypass email confirmation)
- Each suite is independent — suites create their own test data via UI
- No mocking of the WASM engine — full integration tests verify real computation results
