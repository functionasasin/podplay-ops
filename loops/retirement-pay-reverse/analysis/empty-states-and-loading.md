# Analysis: Empty States and Loading

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** empty-states-and-loading
**Date:** 2026-03-06
**Sources:** component-wiring-map.md, visual-verification-checklist.md, action-trigger-map.md, computation-management.md, batch-upload-ui.md, org-model.md, results-view.md, sharing.md

---

## Overview

Every async operation in the app has three render states that must be explicitly handled: **loading**, **empty**, and **error**. This document specifies the exact component, icon, copy, and interaction for each state. A component that renders `null`, a blank area, or a raw spinner without context is incomplete.

---

## 1. Skeleton Loaders (Async Pages)

Skeleton loaders are shown immediately when a page mounts and data is still loading. They match the shape of the real content so the layout does not shift. All skeletons use the shadcn `Skeleton` component (`animate-pulse bg-gray-100 rounded`).

### 1.1 DashboardPage — Computation Grid Skeleton

**When shown:** User navigates to `/dashboard`, `useComputations()` is loading.

**Layout:**
```
<div className="max-w-5xl mx-auto py-8 px-4">
  <Skeleton className="h-8 w-48 mb-6" />  {/* Page title */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1,2,3,4,5,6].map(i => (
      <Card key={i} className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />   {/* Card title */}
        <Skeleton className="h-3 w-1/2" />   {/* Employee name */}
        <Skeleton className="h-3 w-1/3" />   {/* Date */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-5 w-16 rounded-full" />  {/* Status badge */}
          <Skeleton className="h-4 w-8" />                {/* Action icon */}
        </div>
      </Card>
    ))}
  </div>
</div>
```

### 1.2 ComputeResultsPage — Results Skeleton

**When shown:** User navigates to `/compute/$id/results`, `useComputation(id)` is loading.

**Layout:**
```
<div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
  <Skeleton className="h-8 w-64 mb-2" />   {/* Page heading */}
  <Skeleton className="h-5 w-48 mb-6" />   {/* Sub-heading */}
  {/* Eligibility block */}
  <Card className="p-6">
    <Skeleton className="h-5 w-32 mb-3" />
    <Skeleton className="h-8 w-24 rounded-full" />
  </Card>
  {/* Pay breakdown */}
  <Card className="p-6 space-y-3">
    <Skeleton className="h-5 w-40 mb-2" />
    {[1,2,3,4].map(i => (
      <div key={i} className="flex justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
    <Separator />
    <div className="flex justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-28" />
    </div>
  </Card>
  {/* Tax treatment */}
  <Skeleton className="h-20 w-full rounded-md" />
</div>
```

### 1.3 BatchResultsPage — Table Skeleton

**When shown:** User navigates to `/batch/$id`, batch data is loading.

**Layout:**
```
<div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
  <Skeleton className="h-8 w-56 mb-4" />
  <Card className="p-4 space-y-2">
    {[1,2,3,4,5].map(i => (
      <div key={i} className="flex gap-4 py-2 border-b last:border-0">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full ml-auto" />
      </div>
    ))}
  </Card>
  {/* Summary card skeleton */}
  <Card className="p-4 space-y-3">
    <Skeleton className="h-5 w-32 mb-2" />
    <div className="grid grid-cols-2 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-6 w-36" />
        </div>
      ))}
    </div>
  </Card>
</div>
```

### 1.4 NLRCWorksheetPage — Worksheet Skeleton

**When shown:** User navigates to `/compute/$id/nlrc`, data is loading.

**Layout:**
```
<div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
  <Skeleton className="h-8 w-72 mb-2" />
  <Skeleton className="h-4 w-96 mb-6" />
  <Card className="p-6 space-y-4">
    {[1,2,3,4,5,6,7,8].map(i => (
      <div key={i} className="flex justify-between border-b pb-3 last:border-0">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    ))}
  </Card>
</div>
```

### 1.5 SharedResultsPage — Shared View Skeleton

**When shown:** `/share/$token` page mounts, `useSharedComputation(token)` is loading.

**Layout:** Same structure as `1.2 ComputeResultsPage` skeleton, but wrapped with an info banner placeholder:
```
<div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
  <Skeleton className="h-12 w-full rounded-md mb-4" />  {/* Info banner */}
  {/* Same card skeletons as ComputeResultsPage */}
</div>
```

### 1.6 OrgMembersPage — Members Table Skeleton

**When shown:** `/org/members` mounts, `useOrgMembers()` is loading.

**Layout:**
```
<div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
  <Skeleton className="h-8 w-40 mb-4" />
  <Card>
    <div className="p-4 space-y-2">
      {[1,2,3].map(i => (
        <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
          <Skeleton className="h-8 w-8 rounded-full" />     {/* Avatar */}
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />    {/* Role badge */}
          <Skeleton className="h-8 w-8 rounded" />          {/* Action button */}
        </div>
      ))}
    </div>
  </Card>
</div>
```

### 1.7 WizardPage (Compute New) — Step Skeleton

**When shown:** `/compute/new` mounts and wizard config is loading (e.g., fetching org defaults). In practice this page is mostly static, but if the user is editing an existing draft (navigating to `/compute/$id`), the existing form values must be populated before rendering.

**Layout:**
```
<div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
  <Skeleton className="h-6 w-48 mb-2" />   {/* Step indicator */}
  <Card className="p-6 space-y-4">
    <Skeleton className="h-5 w-40 mb-2" />   {/* Step title */}
    {[1,2,3,4].map(i => (
      <div key={i} className="space-y-1">
        <Skeleton className="h-3 w-24" />   {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Input */}
      </div>
    ))}
  </Card>
  <div className="flex justify-between mt-4">
    <Skeleton className="h-10 w-24" />  {/* Back button */}
    <Skeleton className="h-10 w-24" />  {/* Next button */}
  </div>
</div>
```

---

## 2. Empty State Components

Empty states are shown when data is loaded but the collection is empty. Every empty state has: icon (lucide, `w-12 h-12 text-gray-300`), title (`text-gray-900 font-medium`), description (`text-gray-500 text-sm`), and a primary CTA button.

### 2.1 `EmptyComputationsState`

**Shown in:** `DashboardPage` when `computations.length === 0` and not loading.

| Field | Value |
|-------|-------|
| **Icon** | `FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-4"` |
| **Title** | "No computations yet" |
| **Description** | "Compute retirement pay for an employee to get started." |
| **CTA Button** | `<Button asChild><Link to="/compute/new">New Computation</Link></Button>` |
| **Wrapper** | `<div className="text-center py-16 px-4">` |

### 2.2 `EmptyBatchState`

**Shown in:** `DashboardPage` batch tab when `batches.length === 0` and not loading.

| Field | Value |
|-------|-------|
| **Icon** | `FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4"` |
| **Title** | "No batch computations yet" |
| **Description** | "Upload a CSV with your employee roster to compute retirement pay for multiple employees at once." |
| **CTA Button** | `<Button asChild><Link to="/batch/new">Upload CSV</Link></Button>` |
| **Wrapper** | `<div className="text-center py-16 px-4">` |

### 2.3 `EmptyOrgMembersState`

**Shown in:** `OrgMembersPage` when `members.length === 0` (only owner, no additional members).

| Field | Value |
|-------|-------|
| **Icon** | `Users className="w-12 h-12 text-gray-300 mx-auto mb-4"` |
| **Title** | "No team members yet" |
| **Description** | "Invite colleagues to collaborate on retirement pay computations." |
| **CTA Button** | `<Button onClick={() => setInviteDialogOpen(true)}>Invite Member</Button>` |
| **Wrapper** | `<div className="text-center py-16 px-4">` |

### 2.4 `EmptyOrgInvitationsState`

**Shown in:** `OrgInvitationsPage` when `invitations.length === 0`.

| Field | Value |
|-------|-------|
| **Icon** | `Mail className="w-12 h-12 text-gray-300 mx-auto mb-4"` |
| **Title** | "No pending invitations" |
| **Description** | "Invitations you send will appear here until accepted or expired." |
| **CTA Button** | none (CTA already on page header) |
| **Wrapper** | `<div className="text-center py-12 px-4">` |

### 2.5 `EmptyBatchRowsState`

**Shown in:** `BatchResultsPage` when `batch.employees.length === 0` (parsed CSV had zero valid rows).

| Field | Value |
|-------|-------|
| **Icon** | `AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4"` |
| **Title** | "No valid employee rows found" |
| **Description** | "The uploaded CSV contained no valid data rows. Check that the file uses the required column headers: `employee_id`, `full_name`, `hire_date`, `retirement_date`, `monthly_basic_salary`, `sil_days_per_year`, `thirteenth_month_amount`." |
| **CTA Button** | `<Button variant="outline" asChild><Link to="/batch/new">Upload New CSV</Link></Button>` |
| **Wrapper** | `<div className="text-center py-16 px-4">` |

### 2.6 `EmptyCompanyPlanGapsState`

**Shown in:** `CompanyPlanComparisonPage` gap analysis table when all employees are fully covered (no gaps).

| Field | Value |
|-------|-------|
| **Icon** | `CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4"` |
| **Title** | "All employees are fully covered" |
| **Description** | "Your company retirement plan meets or exceeds the RA 7641 statutory minimum for all employees in this batch." |
| **CTA Button** | none |
| **Wrapper** | `<div className="text-center py-12 px-4">` |

---

## 3. Error States

Error states are shown when a fetch or mutation fails with a non-empty error. Every error state provides: a clear message, an icon (`AlertCircle` or `XCircle` in red), and a recovery action.

### 3.1 `PageLoadError` — Generic Full-Page Error

**Shown in:** Any page where the primary data fetch fails (computations, batch, shared result).

**Component:**
```tsx
// components/PageLoadError.tsx
interface PageLoadErrorProps {
  title?: string;
  message: string;
  retryFn?: () => void;
}

// Renders:
<div className="max-w-md mx-auto mt-24 px-4 text-center">
  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
  <h2 className="text-lg font-semibold text-gray-900 mb-2">{title ?? "Something went wrong"}</h2>
  <p className="text-sm text-gray-500 mb-6">{message}</p>
  {retryFn && (
    <Button variant="outline" onClick={retryFn}>Try again</Button>
  )}
</div>
```

**Usage sites:**
| Page | Error message | retryFn |
|------|--------------|---------|
| `DashboardPage` | "Failed to load your computations. Check your connection and try again." | `refetch()` |
| `ComputeResultsPage` | "Failed to load computation results." | `refetch()` |
| `BatchResultsPage` | "Failed to load batch results." | `refetch()` |
| `NLRCWorksheetPage` | "Failed to load NLRC worksheet." | `refetch()` |
| `SharedResultsPage` | "This shared link is invalid or has expired." | none (no retry) |
| `OrgMembersPage` | "Failed to load organization members." | `refetch()` |

### 3.2 `SharedLinkNotFoundError`

**Shown in:** `SharedResultsPage` when `get_shared_computation()` returns null (token not found or expired).

**Component:** Inline — not `PageLoadError`. Uses an `Alert`:
```tsx
<Alert variant="destructive" className="max-w-md mx-auto mt-24">
  <XCircle className="h-4 w-4" />
  <AlertTitle>Link not found</AlertTitle>
  <AlertDescription>
    This shared link is invalid or has expired. Ask the owner to share a new link.
  </AlertDescription>
</Alert>
```

### 3.3 Inline Form Validation Errors

**Shown in:** All wizard steps and form pages, below individual fields.

**Pattern:**
```tsx
{errors.field_name && (
  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    {errors.field_name.message}
  </p>
)}
```

**Specific error messages by field:**

| Field | Error condition | Message |
|-------|----------------|---------|
| `monthlyBasicSalary` | value <= 0 | "Monthly salary must be greater than zero." |
| `monthlyBasicSalary` | value > 10_000_000_00 (centavos) | "Salary seems unrealistically high. Please verify." |
| `hireDate` | after `retirementDate` | "Hire date must be before retirement date." |
| `hireDate` | in the future | "Hire date cannot be in the future." |
| `retirementDate` | before `hireDate` | "Retirement date must be after hire date." |
| `retirementDate` | more than 100 years from `hireDate` | "Retirement date seems too far in the future." |
| `silDaysPerYear` | value < 0 | "SIL days cannot be negative." |
| `silDaysPerYear` | value > 30 | "SIL days cannot exceed 30 days per year." |
| `thirteenthMonthAmount` | value < 0 | "13th month amount cannot be negative." |
| `companyPlanFormula.ratePerYear` | value < 0 | "Rate per year of service cannot be negative." |
| `employeeAge` (computed) | < 60 and not compulsory | Warning (not error): "Employee is under 60. Retirement pay only applies from age 60 (optional) or 65 (compulsory)." |

### 3.4 CSV Upload Errors

**Shown in:** `BatchUploadPage` after file selection or after processing.

**Pattern:** `Alert` component with list of errors:
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>CSV validation errors</AlertTitle>
  <AlertDescription>
    <ul className="mt-2 space-y-1 text-sm">
      {csvErrors.map((e, i) => (
        <li key={i}>Row {e.row}: {e.message}</li>
      ))}
    </ul>
  </AlertDescription>
</Alert>
```

**CSV error messages:**

| Condition | Message |
|-----------|---------|
| Missing required column | "Missing required column: `{column_name}`" |
| Invalid date format (not YYYY-MM-DD) | "Invalid date format in `{column}`: expected YYYY-MM-DD, got `{value}`" |
| Non-numeric salary | "Invalid salary in `{column}`: `{value}` is not a number" |
| Negative salary | "Salary must be positive in row {N}" |
| hire_date after retirement_date | "Hire date is after retirement date" |
| sil_days_per_year > 30 | "SIL days `{value}` exceeds maximum of 30" |
| Duplicate employee_id | "Duplicate employee_id `{id}` — each employee must appear once" |

**Maximum errors shown:** 10. If more than 10 errors: "...and {N} more errors. Fix these and re-upload."

### 3.5 WASM Computation Error

**Shown in:** `ComputeWizard` after the user submits the final step and `compute_single_json()` returns an error.

**Pattern:** `Alert variant="destructive"` above the form submit button:
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Computation error</AlertTitle>
  <AlertDescription>
    {engineError.message}
    {engineError.field && (
      <span className="block mt-1 text-xs">
        Field: <code className="font-mono">{engineError.field}</code>
      </span>
    )}
  </AlertDescription>
</Alert>
```

**Known WASM error codes and their display messages:**

| Engine error code | Display message |
|-------------------|----------------|
| `INELIGIBLE_AGE` | "Employee does not meet the age requirement for retirement pay (must be 60–65)." |
| `INELIGIBLE_SERVICE` | "Employee does not meet the minimum 5-year service requirement." |
| `INELIGIBLE_SMALL_EMPLOYER` | "Employer has 10 or fewer employees — RA 7641 statutory minimum does not apply." |
| `INVALID_DATE_RANGE` | "Hire date must be before retirement date." |
| `INVALID_SALARY` | "Monthly salary must be greater than zero." |
| `OVERFLOW` | "Computation overflow — salary or benefit amounts are too large. Please verify inputs." |

### 3.6 Auth Errors

**Shown in:** Sign-in, sign-up, forgot password, and update password pages.

| Page | Error condition | Display |
|------|----------------|---------|
| `SignInPage` | Invalid credentials | `Alert variant="destructive"`: "Invalid email or password." |
| `SignInPage` | Rate limited | `Alert variant="destructive"`: "Too many sign-in attempts. Please wait a few minutes." |
| `SignUpPage` | Email already exists | Inline below email field: "An account with this email already exists." |
| `SignUpPage` | Weak password | Inline below password field: "Password must be at least 8 characters." |
| `ForgotPasswordPage` | Email not found | Still shows success (do not reveal whether email exists — security best practice): "If this email is registered, a reset link has been sent." |
| `UpdatePasswordPage` | Token expired | `Alert variant="destructive"`: "This reset link has expired. Request a new one." |
| `AuthCallbackPage` | OAuth error param | Redirect to `/auth?error=callback_failed` and show `Alert variant="destructive"`: "Sign-in failed. Please try again." |

### 3.7 Mutation Errors (Save, Delete, Share, Invite)

Handled by toast. See `toast-catalog.md` for full catalog. Summary:

| Action | Error toast message |
|--------|-------------------|
| Save computation | "Failed to save. Your computation is preserved locally — try again." |
| Delete computation | "Failed to delete. Please try again." |
| Toggle share | "Failed to update sharing settings. Please try again." |
| Invite member | "Failed to send invitation. Check the email address and try again." |
| Remove member | "Failed to remove member. Please try again." |
| Copy share link | "Failed to copy link. Use Ctrl+C to copy manually." |

---

## 4. Loading States for Buttons (In-Flight)

Every button that triggers an async operation must show a loading state while the operation is pending. The user must not be able to double-submit.

| Button | Loading label | Loading icon | Disabled during loading |
|--------|--------------|--------------|------------------------|
| "Sign In" | "Signing in..." | `Loader2 animate-spin` | yes |
| "Create Account" | "Creating account..." | `Loader2 animate-spin` | yes |
| "Send Magic Link" | "Sending..." | `Loader2 animate-spin` | yes |
| "Send Reset Link" | "Sending..." | `Loader2 animate-spin` | yes |
| "Update Password" | "Updating..." | `Loader2 animate-spin` | yes |
| "Save Computation" (auto-save) | "Saving..." | `Loader2 animate-spin h-3 w-3` (small inline) | no (non-blocking) |
| "Calculate" (wizard final step) | "Calculating..." | `Loader2 animate-spin` | yes |
| "Export PDF" | "Generating PDF..." | `Loader2 animate-spin` | yes |
| "Export CSV" (batch) | "Exporting..." | `Loader2 animate-spin` | yes |
| "Upload CSV" (batch) | "Processing..." | `Loader2 animate-spin` | yes |
| "Delete" (confirmation dialog) | "Deleting..." | `Loader2 animate-spin` | yes |
| "Invite Member" | "Sending..." | `Loader2 animate-spin` | yes |
| "Remove Member" | "Removing..." | `Loader2 animate-spin` | yes |
| "Enable Sharing" toggle | shows `Loader2` in badge area | — | toggle disabled |
| "Disable Sharing" toggle | shows `Loader2` in badge area | — | toggle disabled |

---

## 5. Auto-Save Indicator

The `ComputeWizardPage` auto-saves the form as a draft after each step navigation. The save status appears in the wizard header as a small inline badge:

| State | Display |
|-------|---------|
| Idle (no changes) | nothing |
| Pending save | `<span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>` |
| Saved | `<span className="text-xs text-gray-400 flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Saved</span>` (fades after 3 seconds) |
| Save failed | `<span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Save failed</span>` |

---

## 6. WASM Initialization Loading

Before any computation is possible, the WASM module must be initialized. This is handled by a `useWasm()` hook.

**Hook behavior:**
```tsx
// hooks/useWasm.ts
const { isReady, error } = useWasm();
// isReady: false until init() resolves
// error: non-null if WASM failed to load
```

**Rendering in `ComputeWizardPage`:**
```tsx
if (!isReady && !wasmError) {
  return (
    <div className="flex items-center justify-center min-h-64 gap-3 text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span className="text-sm">Loading computation engine...</span>
    </div>
  );
}

if (wasmError) {
  return (
    <PageLoadError
      title="Computation engine failed to load"
      message="Could not load the retirement pay calculation engine. Try refreshing the page."
      retryFn={() => window.location.reload()}
    />
  );
}
```

**Shown in:** Any page that calls the WASM engine before `isReady`. Specifically: `ComputeWizardPage` final step button is disabled with label "Loading engine..." until `isReady === true`.

---

## 7. Confirmation Dialogs (Destructive Actions)

Destructive actions (delete computation, delete batch, remove member) require a confirmation dialog before proceeding. These are not loading states per se, but they are part of the async state lifecycle.

### 7.1 Delete Computation Dialog

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4" /></Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete computation?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the computation for {employeeName}. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className="bg-red-600 hover:bg-red-700"
        onClick={handleDelete}
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 7.2 Delete Batch Dialog

Same structure as 7.1, replacing "computation" with "batch upload" in the description.

### 7.3 Remove Member Dialog

```tsx
<AlertDialogDescription>
  Remove {memberName} ({memberEmail}) from {orgName}?
  They will lose access to all computations in this organization.
</AlertDialogDescription>
// Action button: "Remove" (red)
```

---

## Spec Integration Notes

These states map to the following spec sections:
- Skeleton loaders → **S16 (Frontend Architecture)**, included per-component in wizard steps, batch upload UI, results view
- EmptyState components → **S16** sidebar note per data list component
- Error states → **S16** + **S18.1 (Authentication)**
- WASM loading → **S13.4 (Initialization)** + **S16 note**
- Auto-save indicator → **S18.7 (Computation Management)**
- Confirmation dialogs → **S21 (Action Trigger Map)** supplement
