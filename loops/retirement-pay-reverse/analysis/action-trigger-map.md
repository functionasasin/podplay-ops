# Analysis: Action Trigger Map

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** action-trigger-map
**Date:** 2026-03-06
**Sources:** component-wiring-map.md, results-view.md, sharing.md, batch-upload-ui.md, nlrc-worksheet-ui.md, computation-management.md, org-model.md, auth-flow.md, wizard-steps.md

---

## Overview

Every user-triggered action in the app is catalogued here with its exact button, parent component, onClick handler, and feedback (toast/download/navigation/modal). This prevents "infra built but no trigger" failures — the inheritance app's PDF export was fully built but no button triggered it.

Format per action:
- **Button**: Element type, text label, icon, variant, size
- **Parent**: The component file that contains the button
- **onClick**: The handler (function call or navigation)
- **Feedback**: What the user sees immediately after (toast, navigation, loading state, dialog)

---

## 1. Authentication Actions

### 1.1 Sign In with Email/Password

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" className="w-full">Sign In</Button>` |
| **Parent** | `pages/auth/SignInPage.tsx` |
| **onClick** | Form `onSubmit` handler → `supabase.auth.signInWithPassword({ email, password })` |
| **Success feedback** | Navigate to `?redirect` param or `/dashboard` |
| **Error feedback** | Inline form error below button: "Invalid email or password." (Alert, destructive variant) |
| **Loading state** | Button disabled, text: "Signing in..." with `Loader2` icon spinning |

### 1.2 Sign In with Magic Link

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" className="w-full">Send Magic Link</Button>`, icon: `Mail` |
| **Parent** | `pages/auth/SignInPage.tsx` |
| **onClick** | `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/auth/callback' } })` |
| **Success feedback** | Page switches to confirmation screen: "Check your email — magic link sent to {email}." |
| **Error feedback** | Toast: "Failed to send magic link. Try again." (destructive) |
| **Loading state** | Button disabled, text: "Sending..." with `Loader2` icon |

### 1.3 Sign Up

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" className="w-full">Create Account</Button>` |
| **Parent** | `pages/auth/SignUpPage.tsx` |
| **onClick** | Form `onSubmit` → `supabase.auth.signUp({ email, password, options: { emailRedirectTo: ... } })` |
| **Success feedback** | Page replaces form with: "Check your email to confirm your account." |
| **Error feedback** | Inline: "An account with this email already exists." or "Password must be at least 8 characters." |
| **Loading state** | Button disabled, text: "Creating account..." with `Loader2` |

### 1.4 Forgot Password — Request Reset

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" className="w-full">Send Reset Link</Button>` |
| **Parent** | `pages/auth/ForgotPasswordPage.tsx` |
| **onClick** | `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/update-password' })` |
| **Success feedback** | Page shows: "Reset link sent. Check your email." |
| **Error feedback** | Toast: "Could not send reset link. Check the email address." (destructive) |

### 1.5 Update Password (after recovery link click)

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" className="w-full">Update Password</Button>` |
| **Parent** | `pages/auth/UpdatePasswordPage.tsx` |
| **onClick** | `supabase.auth.updateUser({ password: newPassword })` |
| **Success feedback** | Toast: "Password updated." then navigate to `/dashboard` after 1500ms |
| **Error feedback** | Inline: "New password must be at least 8 characters." or "Passwords do not match." |

### 1.6 Sign Out

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="sm">Sign Out</Button>`, icon: `LogOut` |
| **Parent** | `components/layout/UserMenu.tsx` (in Sidebar dropdown) |
| **onClick** | `supabase.auth.signOut()` → navigate to `/` |
| **Feedback** | Navigate to `/` (landing page); no toast needed |

---

## 2. Dashboard Actions

### 2.1 New Computation (from Dashboard)

| Field | Value |
|-------|-------|
| **Button** | `<Button><Plus className="w-4 h-4 mr-2" />New Computation</Button>` |
| **Parent** | `pages/DashboardPage.tsx` (top header row) |
| **onClick** | `navigate({ to: '/compute/new' })` (via `<Link>` or router) |
| **Feedback** | Navigate to `/compute/new` |

### 2.2 New Batch Upload (from Dashboard)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline"><Upload className="w-4 h-4 mr-2" />Batch Upload</Button>` |
| **Parent** | `pages/DashboardPage.tsx` (top header row, beside New Computation) |
| **onClick** | `navigate({ to: '/batch/new' })` |
| **Feedback** | Navigate to `/batch/new` |

### 2.3 Open Existing Computation

| Field | Value |
|-------|-------|
| **Trigger** | Click anywhere on `ComputationCard` |
| **Parent** | `components/dashboard/ComputationCard.tsx` |
| **onClick** | `navigate({ to: '/compute/$id/results', params: { id: record.id } })` |
| **Feedback** | Navigate to `/compute/$id/results` |

### 2.4 Delete Computation (from Dashboard Card)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="icon" className="text-red-500"><Trash2 /></Button>` in card menu |
| **Parent** | `components/dashboard/ComputationCard.tsx` (kebab menu or hover actions) |
| **onClick** | Opens inline `AlertDialog` confirming delete |
| **Confirm button** | `<AlertDialogAction className="bg-red-600">Delete</AlertDialogAction>` → `deleteComputation(record.id)` |
| **Success feedback** | Toast: "Computation deleted." (default); card removed from grid (query invalidation) |
| **Error feedback** | Toast: "Failed to delete computation." (destructive) |
| **Cancel** | `<AlertDialogCancel>Cancel</AlertDialogCancel>` — dialog closes, nothing happens |

### 2.5 Open Existing Batch Record

| Field | Value |
|-------|-------|
| **Trigger** | Click anywhere on `BatchCard` |
| **Parent** | `components/dashboard/BatchCard.tsx` |
| **onClick** | `navigate({ to: '/batch/$id', params: { id: record.id } })` |
| **Feedback** | Navigate to `/batch/$id` |

---

## 3. Computation Wizard Actions

### 3.1 Wizard: Next Step (Steps 1–4)

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit">Continue<ArrowRight className="w-4 h-4 ml-1" /></Button>` |
| **Parent** | `Step1EmployeeInfo.tsx`, `Step2EmploymentDates.tsx`, `Step3SalaryBenefits.tsx`, `Step4RetirementDetails.tsx` |
| **onClick** | Form `onSubmit` → Zod validation → if valid: `onNext(data)` → `WizardContainer` advances `currentStep` |
| **Validation error** | React Hook Form inline field errors; button stays enabled; form not submitted |

### 3.2 Wizard: Back (Steps 2–5)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" type="button"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>` |
| **Parent** | `Step2EmploymentDates.tsx`, `Step3SalaryBenefits.tsx`, `Step4RetirementDetails.tsx`, `Step5CompanyPlan.tsx` |
| **onClick** | `onBack()` → `WizardContainer` decrements `currentStep` (no data loss — step data preserved in reducer state) |
| **Feedback** | Previous step renders immediately; no toast |

### 3.3 Wizard: Skip Company Plan (Step 5)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" type="button">Skip — no company plan</Button>` |
| **Parent** | `Step5CompanyPlan.tsx` |
| **onClick** | `onSkip()` → `WizardContainer` sets company plan fields to null and calls submit |
| **Feedback** | Shows loading state on button while computation runs |

### 3.4 Wizard: Final Submit (Step 5 Continue, or Step 4 if Step 5 skipped)

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" disabled={isComputing}>` — text: "Compute Retirement Pay" when idle, "Computing..." with `Loader2` when running |
| **Parent** | `Step5CompanyPlan.tsx` (or skip path from `WizardContainer`) |
| **onClick** | `onNext(data)` → `WizardContainer.handleComplete(input: RetirementInput)` |
| **Handler sequence** | 1. `bridge.computeSingle(JSON.stringify(input))` → `RetirementOutput`; 2. `supabase.from('computations').insert(...)` → gets `newId`; 3. `navigate({ to: '/compute/$id/results', params: { id: newId } })` |
| **Success feedback** | Navigate to `/compute/$id/results` |
| **Engine error** | Toast: "Computation failed: {error.message}." (destructive); wizard stays on step 5, button re-enabled |
| **Save error** | Toast: "Computation ran but could not be saved. Please try again." (destructive) |

---

## 4. Results Page Actions

### 4.1 Edit Computation

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" size="sm" asChild><Link to="/compute/$id/edit"><Pencil />Edit</Link></Button>` |
| **Parent** | `components/results/ResultsPageHeader.tsx` |
| **onClick** | Navigation via `<Link>` to `/compute/$id/edit` |
| **Feedback** | Navigate to edit page (wizard pre-populated with existing `input` data) |

### 4.2 Open Share Dialog

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1" />Share</Button>` |
| **Parent** | `components/results/ResultsPageHeader.tsx` (contains `ShareButton` subcomponent) |
| **onClick** | `setShareDialogOpen(true)` (state in `ComputationResultsPage`) |
| **Feedback** | `ShareDialog` opens; spinner while loading existing share link status |

### 4.3 PDF Export (from Results Page Header)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" size="sm" onClick={exportPdf} disabled={isExporting}>` — text: "Export PDF", icon: `Download`; when exporting: "Generating..." with `Loader2` |
| **Parent** | `components/results/PdfExportButton.tsx` (rendered in `ResultsPageHeader`) |
| **onClick** | `exportPdf()` from `usePdfExport(output)` hook |
| **Handler** | `pdf(RetirementPayPdfDocument({ output, employeeName })).toBlob()` → `URL.createObjectURL(blob)` → programmatic `<a download>` click |
| **Filename** | `retirement-pay-{employee-name-kebab}.pdf` |
| **Success feedback** | Browser download starts; no toast needed (download dialog is the feedback) |
| **Error feedback** | Toast: "PDF export failed. Please try again." (destructive) |

### 4.4 View NLRC Worksheet

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" size="sm" asChild><Link to="/compute/$id/nlrc"><FileText />NLRC Worksheet</Link></Button>` |
| **Parent** | `components/results/ResultsActionsRow.tsx` |
| **onClick** | Navigation via `<Link>` |
| **Feedback** | Navigate to `/compute/$id/nlrc` |

### 4.5 New Computation (from Results Page)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" size="sm" asChild><Link to="/compute/new"><Plus />New Computation</Link></Button>` |
| **Parent** | `components/results/ResultsActionsRow.tsx` |
| **onClick** | Navigation via `<Link>` |
| **Feedback** | Navigate to `/compute/new` (fresh wizard) |

### 4.6 Delete Computation (from Results Page)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 />Delete</Button>` |
| **Parent** | `components/results/ResultsActionsRow.tsx` |
| **onClick** | `setShowDeleteConfirm(true)` (local state in `ResultsActionsRow`) |
| **Confirm** | `AlertDialog` with `AlertDialogAction` (red): `await deleteComputation(); navigate({ to: '/dashboard' })` |
| **Success feedback** | Navigate to `/dashboard`; Toast: "Computation deleted." |
| **Error feedback** | Toast: "Failed to delete. Please try again." (destructive); stays on results page |
| **Cancel** | `AlertDialogCancel` — dialog closes; nothing deleted |

---

## 5. Sharing Dialog Actions

All sharing actions live inside `ShareDialog` (`components/sharing/ShareDialog.tsx`), opened by the Share button in `ResultsPageHeader`.

### 5.1 Generate Share Link

| Field | Value |
|-------|-------|
| **Button** | `<Button onClick={createLink} disabled={isCreating} className="w-full sm:w-auto">` — text: "Generate Share Link", icon: `Share2`; loading: `Loader2` + "Generating..." |
| **Parent** | `ShareDialog` footer (shown when no existing link) |
| **onClick** | `createLink()` from `useSharing(computationId, userId)` |
| **Handler** | `createShareLink(computationId, userId)` → inserts `shared_links` row + updates computation `status = 'shared'` |
| **Success feedback** | Toast: "Share link created." (default); dialog body updates to show URL in read-only input |
| **Error feedback** | Toast: "Failed to create share link." (destructive) |

### 5.2 Copy Share Link (icon button in URL input row)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" size="icon" onClick={copyLink}><Copy className="h-4 w-4" /></Button>` |
| **Parent** | `ShareDialog` body (shown when link exists) |
| **onClick** | `copyLink()` from `useSharing` → `navigator.clipboard.writeText(shareUrl)` |
| **Feedback** | Toast: "Link copied to clipboard." (default) |

### 5.3 Copy Share Link (footer button)

| Field | Value |
|-------|-------|
| **Button** | `<Button onClick={copyLink}><Copy className="mr-2 h-4 w-4" />Copy Link</Button>` |
| **Parent** | `ShareDialog` footer (shown when link exists) |
| **onClick** | Same `copyLink()` handler |
| **Feedback** | Toast: "Link copied to clipboard." (default) |

### 5.4 Revoke Share Link

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" onClick={revokeLink} disabled={isRevoking} className="text-red-600 border-red-200 hover:bg-red-50">` — text: "Revoke Link", icon: `Trash2`; loading: `Loader2` |
| **Parent** | `ShareDialog` footer (shown when link exists) |
| **onClick** | `revokeLink()` from `useSharing` → deletes `shared_links` row + resets computation `status = 'computed'` |
| **Success feedback** | Toast: "Share link revoked." (default); dialog body reverts to "no link" state |
| **Error feedback** | Toast: "Failed to revoke share link." (destructive) |

---

## 6. NLRC Worksheet Actions

### 6.1 Print NLRC Worksheet

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Print</Button>` |
| **Parent** | `components/nlrc/NlrcPrintButton.tsx` (in `NlrcWorksheetPage` header row) |
| **onClick** | `window.print()` — triggers browser print dialog |
| **Feedback** | Browser print dialog opens; no toast |
| **Note** | The page has `@media print` CSS that hides nav, actions row, and non-worksheet elements |

### 6.2 Export NLRC Worksheet as PDF

| Field | Value |
|-------|-------|
| **Button** | `<Button onClick={exportNlrcPdf} disabled={isExporting}>` — text: "Download PDF", icon: `Download`; loading: `Loader2` + "Generating..." |
| **Parent** | `components/nlrc/NlrcPdfExportButton.tsx` (in `NlrcWorksheetPage` header row, beside Print) |
| **onClick** | `exportNlrcPdf()` from `useNlrcPdfExport(worksheet, employeeName)` hook |
| **Handler** | `pdf(NlrcWorksheetPdfDocument({ worksheet, employeeName })).toBlob()` → `URL.createObjectURL(blob)` → programmatic download |
| **Filename** | `nlrc-worksheet-{employee-name-kebab}.pdf` |
| **Success feedback** | Browser download starts |
| **Error feedback** | Toast: "NLRC PDF export failed. Please try again." (destructive) |

### 6.3 Back to Results (from NLRC Page)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="sm" asChild><Link to="/compute/$id/results"><ArrowLeft />Back to Results</Link></Button>` |
| **Parent** | `NlrcWorksheetPage` (page header, above worksheet content) |
| **onClick** | Navigation via `<Link>` |
| **Feedback** | Navigate to `/compute/$id/results` |

---

## 7. Batch Upload Actions

### 7.1 Select CSV File (Drop Zone)

| Field | Value |
|-------|-------|
| **Trigger** | Drag-and-drop onto `CsvDropZone` area, OR click `CsvDropZone` to open file picker |
| **Button** | `<label>` wrapping a hidden `<input type="file" accept=".csv">` — visual: dashed border area with `Upload` icon + "Drop CSV here or click to browse" |
| **Parent** | `components/batch/CsvDropZone.tsx` (in `NewBatchPage`, `phase === "idle"`) |
| **onChange/onDrop** | `dispatch({ type: 'FILE_SELECTED', file })` → parse first 5 rows for preview → `dispatch({ type: 'PREVIEW_READY', preview })` |
| **Validation feedback** | If not `.csv`: Toast: "Only CSV files are supported." (destructive); If > 10MB: Toast: "File too large. Maximum 10MB." |

### 7.2 Clear Selected File

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="sm"><X className="w-4 h-4 mr-1" />Clear</Button>` |
| **Parent** | `components/batch/FilePreviewCard.tsx` |
| **onClick** | `dispatch({ type: 'CLEAR' })` → state back to `phase: "idle"` |
| **Feedback** | `FilePreviewCard` unmounts; `CsvDropZone` renders again |

### 7.3 Compute Batch

| Field | Value |
|-------|-------|
| **Button** | `<Button onClick={onCompute} className="w-full sm:w-auto">` — text: "Compute Retirement Pay for {rowCount} Employees", icon: `Play` |
| **Parent** | `components/batch/FilePreviewCard.tsx` |
| **onClick** | `dispatch({ type: 'COMPUTE_START' })` → `phase: "computing"` → Worker processes CSV rows via `bridge.computeBatch(jsonInput)` → on result: inserts `batch_computations` row → `navigate({ to: '/batch/$id', params: { id: newId } })` |
| **Loading state** | `ComputingProgressCard` renders instead of `FilePreviewCard` (no progress %, just spinner + "Computing {filename}...") |
| **Success feedback** | Navigate to `/batch/$id` |
| **Error feedback** | `dispatch({ type: 'ERROR', error: message })` → `BatchErrorCard` renders |

### 7.4 Retry After Batch Error

| Field | Value |
|-------|-------|
| **Button** | `<Button onClick={onRetry}>Try Again</Button>` |
| **Parent** | `components/batch/BatchErrorCard.tsx` |
| **onClick** | `dispatch({ type: 'CLEAR' })` → reset to `phase: "idle"`, file cleared |
| **Feedback** | `CsvDropZone` renders again |

### 7.5 Export Batch Results as CSV

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-1" />Export CSV</Button>` |
| **Parent** | `components/batch/BatchExportButtons.tsx` (in `BatchResultsPage`) |
| **onClick** | `exportBatchCsv(output)` → generates CSV string from `output.employees` → `URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))` → programmatic download |
| **Filename** | `batch-retirement-pay-{YYYY-MM-DD}.csv` |
| **Success feedback** | Browser download starts |
| **Error feedback** | Toast: "CSV export failed." (destructive) |

### 7.6 Export Batch Results as PDF

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" onClick={exportPdf} disabled={isExporting}>` — text: "Export PDF", icon: `Download`; loading: `Loader2` + "Generating..." |
| **Parent** | `components/batch/BatchExportButtons.tsx` (in `BatchResultsPage`) |
| **onClick** | `exportBatchPdf(output, record)` from `useBatchPdfExport(output)` → `pdf(BatchSummaryPdfDocument({ output, record })).toBlob()` → download |
| **Filename** | `batch-retirement-pay-{YYYY-MM-DD}.pdf` |
| **Success feedback** | Browser download starts |
| **Error feedback** | Toast: "PDF export failed." (destructive) |

---

## 8. Organization Management Actions

### 8.1 Create Organization

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" disabled={isSubmitting}>Create Organization</Button>` |
| **Parent** | `components/org/NewOrgForm.tsx` (in `NewOrgPage` at `/org/new`) |
| **onClick** | Form submit → `supabase.rpc('create_organization', { p_name, p_slug })` → on success: `navigate({ to: '/org/$orgId', params: { orgId: newOrg.id } })` |
| **Success feedback** | Navigate to `/org/$orgId`; Toast: "Organization created." (default) |
| **Error feedback** | Inline: "Slug already taken." or "Name is required."; Toast: "Failed to create organization." (destructive) |

### 8.2 Open Invite Member Dialog

| Field | Value |
|-------|-------|
| **Button** | `<Button size="sm"><UserPlus className="w-4 h-4 mr-1" />Invite Member</Button>` |
| **Parent** | `pages/org/OrgMembersPage.tsx` (page header) |
| **onClick** | `setInviteDialogOpen(true)` |
| **Feedback** | `InviteMemberDialog` opens |

### 8.3 Send Member Invitation

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" disabled={isSending}>Send Invitation</Button>` |
| **Parent** | `components/org/InviteMemberDialog.tsx` |
| **onClick** | `supabase.from('org_invitations').insert({ org_id: orgId, email, role })` |
| **Success feedback** | Toast: "Invitation sent to {email}." (default); dialog closes; invitation appears in `OrgInvitationsPage` |
| **Error feedback** | Toast: "Failed to send invitation." (destructive) or inline: "This email has already been invited." |

### 8.4 Revoke Pending Invitation

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="sm" className="text-red-600"><X />Revoke</Button>` |
| **Parent** | `components/org/OrgInvitationsTable.tsx` (per-row action) |
| **onClick** | `supabase.from('org_invitations').delete().eq('id', invitation.id)` → invalidate invitations query |
| **Success feedback** | Toast: "Invitation revoked." (default); row removed from table |
| **Error feedback** | Toast: "Failed to revoke invitation." (destructive) |

### 8.5 Remove Member from Organization

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="sm" className="text-red-600"><UserMinus />Remove</Button>` (visible to owner/admin only; hidden for own row if owner) |
| **Parent** | `components/org/OrgMembersTable.tsx` (per-row action) |
| **onClick** | Opens inline confirmation AlertDialog: "Remove {member.name} from organization?" |
| **Confirm** | `supabase.from('org_members').delete().eq('id', member.id)` → invalidate members query |
| **Success feedback** | Toast: "Member removed." (default); row removed from table |
| **Error feedback** | Toast: "Failed to remove member." (destructive) |

### 8.6 Change Member Role

| Field | Value |
|-------|-------|
| **Trigger** | `<Select>` dropdown per row (options: "member", "admin") — visible to owner only |
| **Parent** | `components/org/OrgMembersTable.tsx` |
| **onChange** | `supabase.from('org_members').update({ role: newRole }).eq('id', member.id)` |
| **Success feedback** | Toast: "Role updated to {newRole}." (default); select value updates |
| **Error feedback** | Toast: "Failed to update role." (destructive); select reverts to previous value |

### 8.7 Open Transfer Ownership Dialog

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="outline" className="text-yellow-700 border-yellow-300"><ArrowRightLeft />Transfer Ownership</Button>` |
| **Parent** | `pages/org/OrgSettingsPage.tsx` (danger zone section) |
| **onClick** | `setTransferDialogOpen(true)` |
| **Feedback** | `TransferOwnershipDialog` opens with member dropdown |

### 8.8 Confirm Transfer Ownership

| Field | Value |
|-------|-------|
| **Button** | `<Button className="bg-yellow-600 hover:bg-yellow-700" disabled={!selectedMemberId || isTransferring}>Transfer Ownership</Button>` |
| **Parent** | `components/org/TransferOwnershipDialog.tsx` |
| **onClick** | `supabase.rpc('transfer_org_ownership', { p_org_id: orgId, p_new_owner_id: selectedMemberId })` |
| **Success feedback** | Toast: "Ownership transferred." (default); dialog closes; current user's role updates to "admin" in UI |
| **Error feedback** | Toast: "Failed to transfer ownership." (destructive) |

### 8.9 Open Delete Organization Dialog

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="destructive"><Trash2 />Delete Organization</Button>` |
| **Parent** | `pages/org/OrgSettingsPage.tsx` (danger zone, owner only) |
| **onClick** | `setDeleteOrgDialogOpen(true)` |
| **Feedback** | `DeleteOrgDialog` opens with name-confirmation input |

### 8.10 Confirm Delete Organization

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="destructive" disabled={confirmValue !== org.name || isDeleting}>Delete Organization</Button>` |
| **Parent** | `components/org/DeleteOrgDialog.tsx` |
| **Precondition** | User must type the org name exactly to enable the button |
| **onClick** | `supabase.from('organizations').delete().eq('id', org.id)` (cascades to members, invitations via FK ON DELETE CASCADE) |
| **Success feedback** | Navigate to `/dashboard`; Toast: "Organization deleted." (default) |
| **Error feedback** | Toast: "Failed to delete organization." (destructive) |

---

## 9. Settings Actions

### 9.1 Update Display Name

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" disabled={isSaving}>Save Changes</Button>` |
| **Parent** | `components/settings/ProfileTab.tsx` |
| **onClick** | `supabase.auth.updateUser({ data: { display_name: name } })` |
| **Success feedback** | Toast: "Profile updated." (default) |
| **Error feedback** | Toast: "Failed to update profile." (destructive) |

### 9.2 Change Password

| Field | Value |
|-------|-------|
| **Button** | `<Button type="submit" disabled={isSaving}>Update Password</Button>` |
| **Parent** | `components/settings/PasswordTab.tsx` |
| **onClick** | Form validates current + new + confirm match → `supabase.auth.updateUser({ password: newPassword })` |
| **Success feedback** | Toast: "Password updated." (default); form resets |
| **Error feedback** | Inline: "Passwords do not match." or Toast: "Failed to update password." (destructive) |

### 9.3 Delete Account

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="destructive">Delete My Account</Button>` |
| **Parent** | `components/settings/DangerZoneTab.tsx` |
| **onClick** | Opens `AlertDialog`: "This permanently deletes your account and all computations. This cannot be undone." |
| **Confirm button** | `<AlertDialogAction className="bg-red-600">Delete Account</AlertDialogAction>` → `supabase.functions.invoke('delete-user')` (Edge Function needed; `supabase.auth.admin.deleteUser()` requires service role) |
| **Success feedback** | `supabase.auth.signOut()` → navigate to `/` |
| **Error feedback** | Toast: "Failed to delete account. Contact support." (destructive) |

---

## 10. Navigation Actions

### 10.1 Toggle Mobile Drawer

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>` |
| **Parent** | `components/layout/MobileTopBar.tsx` |
| **onClick** | `setDrawerOpen(true)` (state in `AppShell`) |
| **Feedback** | `MobileDrawer` slides in from left |

### 10.2 Close Mobile Drawer (X button)

| Field | Value |
|-------|-------|
| **Button** | `<Button variant="ghost" size="icon"><X /></Button>` |
| **Parent** | `components/layout/MobileDrawer.tsx` (top-right of drawer) |
| **onClick** | `onClose()` → `setDrawerOpen(false)` |
| **Feedback** | Drawer slides closed |

### 10.3 Close Mobile Drawer (Navigation)

| Field | Value |
|-------|-------|
| **Trigger** | Any `NavLink` click inside `MobileDrawer` |
| **Parent** | `components/layout/NavLinks.tsx` (when rendered inside `MobileDrawer`) |
| **onClick** | Navigation + `onNavigate?.()` callback → `setDrawerOpen(false)` |
| **Feedback** | Navigate to route; drawer closes |

### 10.4 Switch Organization (OrgSwitcher)

| Field | Value |
|-------|-------|
| **Trigger** | `<Select>` or dropdown in `OrgSwitcher` |
| **Parent** | `components/layout/OrgSwitcher.tsx` |
| **onChange** | `setActiveOrg(orgId)` in `useOrganization()` hook → persists to `localStorage` → invalidate org-scoped queries |
| **Feedback** | Active org name updates in sidebar; org-scoped pages reload with new org context |

---

## 11. Complete Action-Trigger Matrix

Summary table of all unique button → feedback pairs:

| Action ID | Action Label | Button Text | Parent Component | Handler | Primary Feedback |
|-----------|-------------|-------------|-----------------|---------|-----------------|
| A01 | Sign In | "Sign In" | `SignInPage` | `signInWithPassword()` | Navigate to `/dashboard` |
| A02 | Magic Link | "Send Magic Link" | `SignInPage` | `signInWithOtp()` | Page: "Check email" |
| A03 | Sign Up | "Create Account" | `SignUpPage` | `auth.signUp()` | Page: "Check email to confirm" |
| A04 | Forgot Password | "Send Reset Link" | `ForgotPasswordPage` | `resetPasswordForEmail()` | Page: "Reset link sent" |
| A05 | Update Password | "Update Password" | `UpdatePasswordPage` | `auth.updateUser()` | Toast + navigate `/dashboard` |
| A06 | Sign Out | "Sign Out" | `UserMenu` | `auth.signOut()` | Navigate to `/` |
| A07 | New Computation | "New Computation" | `DashboardPage` | `navigate('/compute/new')` | Navigate |
| A08 | New Batch | "Batch Upload" | `DashboardPage` | `navigate('/batch/new')` | Navigate |
| A09 | Open Computation | Card click | `ComputationCard` | `navigate('/compute/$id/results')` | Navigate |
| A10 | Delete Computation (dashboard) | "Delete" (card menu) | `ComputationCard` | AlertDialog → `deleteComputation()` | Toast + card removed |
| A11 | Open Batch | Card click | `BatchCard` | `navigate('/batch/$id')` | Navigate |
| A12 | Wizard Next | "Continue" | Step1–4 components | `onNext(data)` | Next step renders |
| A13 | Wizard Back | "Back" | Step2–5 components | `onBack()` | Previous step renders |
| A14 | Wizard Skip Step 5 | "Skip — no company plan" | `Step5CompanyPlan` | `onSkip()` → `handleComplete()` | Loading → navigate results |
| A15 | Wizard Submit | "Compute Retirement Pay" | `Step5CompanyPlan` | `handleComplete(input)` → bridge + supabase | Navigate to `/compute/$id/results` |
| A16 | Edit Computation | "Edit" | `ResultsPageHeader` | `navigate('/compute/$id/edit')` | Navigate |
| A17 | Open Share Dialog | "Share" | `ResultsPageHeader` | `setShareDialogOpen(true)` | Dialog opens |
| A18 | PDF Export (results) | "Export PDF" | `PdfExportButton` | `exportPdf()` | Browser download |
| A19 | NLRC Worksheet | "NLRC Worksheet" | `ResultsActionsRow` | `navigate('/compute/$id/nlrc')` | Navigate |
| A20 | New Computation (from results) | "New Computation" | `ResultsActionsRow` | `navigate('/compute/new')` | Navigate |
| A21 | Delete Computation (results) | "Delete" | `ResultsActionsRow` | AlertDialog → `deleteComputation()` | Toast + navigate `/dashboard` |
| A22 | Generate Share Link | "Generate Share Link" | `ShareDialog` | `createLink()` | Toast + URL in dialog |
| A23 | Copy Share Link (icon) | Copy icon button | `ShareDialog` body | `copyLink()` | Toast: "Copied" |
| A24 | Copy Share Link (footer) | "Copy Link" | `ShareDialog` footer | `copyLink()` | Toast: "Copied" |
| A25 | Revoke Share Link | "Revoke Link" | `ShareDialog` footer | `revokeLink()` | Toast + dialog resets |
| A26 | Print NLRC | "Print" | `NlrcPrintButton` | `window.print()` | Browser print dialog |
| A27 | PDF Export NLRC | "Download PDF" | `NlrcPdfExportButton` | `exportNlrcPdf()` | Browser download |
| A28 | Back to Results (NLRC) | "Back to Results" | `NlrcWorksheetPage` | `navigate('/compute/$id/results')` | Navigate |
| A29 | Select CSV File | Drop zone / file picker | `CsvDropZone` | `dispatch FILE_SELECTED` | `FilePreviewCard` renders |
| A30 | Clear CSV File | "Clear" | `FilePreviewCard` | `dispatch CLEAR` | `CsvDropZone` renders |
| A31 | Compute Batch | "Compute..." | `FilePreviewCard` | `dispatch COMPUTE_START` → bridge → supabase | Navigate to `/batch/$id` |
| A32 | Retry Batch | "Try Again" | `BatchErrorCard` | `dispatch CLEAR` | `CsvDropZone` renders |
| A33 | Export Batch CSV | "Export CSV" | `BatchExportButtons` | `exportBatchCsv(output)` | Browser download |
| A34 | Export Batch PDF | "Export PDF" | `BatchExportButtons` | `exportBatchPdf(output, record)` | Browser download |
| A35 | Create Organization | "Create Organization" | `NewOrgForm` | `rpc('create_organization')` | Navigate to `/org/$orgId` |
| A36 | Open Invite Dialog | "Invite Member" | `OrgMembersPage` | `setInviteDialogOpen(true)` | Dialog opens |
| A37 | Send Invitation | "Send Invitation" | `InviteMemberDialog` | insert `org_invitations` | Toast + dialog closes |
| A38 | Revoke Invitation | "Revoke" | `OrgInvitationsTable` | delete `org_invitations` row | Toast + row removed |
| A39 | Remove Member | "Remove" | `OrgMembersTable` | AlertDialog → delete `org_members` row | Toast + row removed |
| A40 | Change Member Role | Role dropdown | `OrgMembersTable` | update `org_members.role` | Toast: "Role updated" |
| A41 | Open Transfer Dialog | "Transfer Ownership" | `OrgSettingsPage` | `setTransferDialogOpen(true)` | Dialog opens |
| A42 | Confirm Transfer | "Transfer Ownership" | `TransferOwnershipDialog` | `rpc('transfer_org_ownership')` | Toast + dialog closes |
| A43 | Open Delete Org Dialog | "Delete Organization" | `OrgSettingsPage` | `setDeleteOrgDialogOpen(true)` | Dialog opens |
| A44 | Confirm Delete Org | "Delete Organization" | `DeleteOrgDialog` | delete `organizations` row | Toast + navigate `/dashboard` |
| A45 | Update Profile | "Save Changes" | `ProfileTab` | `auth.updateUser({ data })` | Toast: "Profile updated" |
| A46 | Change Password | "Update Password" | `PasswordTab` | `auth.updateUser({ password })` | Toast + form reset |
| A47 | Delete Account | "Delete My Account" | `DangerZoneTab` | AlertDialog → Edge Function | Sign out + navigate `/` |
| A48 | Toggle Mobile Drawer | Hamburger icon | `MobileTopBar` | `setDrawerOpen(true)` | Drawer slides open |
| A49 | Close Drawer (X) | X icon | `MobileDrawer` | `onClose()` | Drawer slides closed |
| A50 | Switch Organization | Org dropdown | `OrgSwitcher` | `setActiveOrg(orgId)` | Sidebar updates |

---

## 12. Loading State Specification

Every async action must show a loading state on the triggering button to prevent double-submission.

| Action | Loading Indicator | Button Disabled? |
|--------|------------------|-----------------|
| All `type="submit"` forms | Text changes + `Loader2` spin icon | Yes |
| PDF Export (A18, A27, A34) | Text: "Generating..." + `Loader2` | Yes |
| Compute Batch (A31) | `ComputingProgressCard` replaces `FilePreviewCard` | N/A (button gone) |
| Delete (A10, A21, A39, A44) | AlertDialog action button text: "Deleting..." + `Loader2` | Yes |
| Generate Share Link (A22) | `Loader2` in button | Yes |
| Revoke Share Link (A25) | `Loader2` in button | Yes |
| Send Invitation (A37) | `isSending` → button disabled | Yes |
| Transfer Ownership (A42) | `isTransferring` → button disabled | Yes |
| Auth actions (A01–A06) | Button text + `Loader2` | Yes |

---

## 13. Toast Catalog (Preview)

All toast messages use Sonner (`import { toast } from 'sonner'`). Variants: `toast()` = default (success), `toast.error()` = destructive.

| Event | Message | Variant |
|-------|---------|---------|
| Password updated | "Password updated." | default |
| Profile saved | "Profile updated." | default |
| Computation deleted | "Computation deleted." | default |
| Share link created | "Share link created." | default |
| Link copied | "Link copied to clipboard." | default |
| Share link revoked | "Share link revoked." | default |
| Organization created | "Organization created." | default |
| Invitation sent | "Invitation sent to {email}." | default |
| Invitation revoked | "Invitation revoked." | default |
| Member removed | "Member removed." | default |
| Role updated | "Role updated to {role}." | default |
| Ownership transferred | "Ownership transferred." | default |
| Organization deleted | "Organization deleted." | default |
| Engine error | "Computation failed: {message}" | error |
| Save error | "Computation ran but could not be saved." | error |
| PDF export failed | "PDF export failed. Please try again." | error |
| Batch compute failed | "Batch computation failed: {message}" | error |
| Delete failed | "Failed to delete. Please try again." | error |
| Share create failed | "Failed to create share link." | error |
| Share revoke failed | "Failed to revoke share link." | error |
| Invitation failed | "Failed to send invitation." | error |
| File too large | "File too large. Maximum 10MB." | error |
| Not a CSV | "Only CSV files are supported." | error |
| Auth error | "Invalid email or password." | error (inline) |

---

## Summary

Total distinct actions catalogued: **50** (A01–A50).

Every action has:
- An exact button element with text, icon, variant, and size
- The exact parent component file
- The exact onClick handler (Supabase call, navigation, or dispatch)
- Primary success feedback (toast message, navigation destination, or visual state change)
- Error feedback (toast variant and message)
- Loading state specification

Zero actions are defined without a corresponding button trigger. Zero buttons exist without a defined handler.
