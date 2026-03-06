# Analysis: Toast Catalog

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** toast-catalog
**Date:** 2026-03-06
**Sources:** action-trigger-map.md, empty-states-and-loading.md, sharing.md, auth-flow.md, computation-management.md, batch-upload-ui.md, org-model.md

---

## Overview

Every user action that produces toast feedback is catalogued here with the exact Sonner call, message text, variant, duration, and any special behavior (action button, dedup ID, promise-based). This prevents silent failures and ensures consistent feedback across the app.

**Toast library:** `sonner` (the shadcn/ui recommended toast library).

**Import everywhere:**
```tsx
import { toast } from 'sonner';
```

**Toaster setup in `App.tsx`:**
```tsx
import { Toaster } from 'sonner';

// Inside <App>:
<Toaster
  position="bottom-right"
  richColors
  closeButton
  toastOptions={{
    duration: 4000,           // 4s default; errors use 6s
    className: 'font-sans text-sm',
  }}
/>
```

**Variant conventions:**
- `toast('message')` — success (green check icon)
- `toast.error('message')` — destructive (red X icon), `duration: 6000`
- `toast.promise(promise, {...})` — loading → success/error lifecycle
- `toast('message', { action: { label: 'Undo', onClick: fn } })` — with undo action

---

## 1. Authentication Toasts

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T01 | Magic link sent | `toast('...')` | "Magic link sent. Check your inbox." | 5000 |
| T02 | Magic link failed | `toast.error('...')` | "Failed to send magic link. Try again." | 6000 |
| T03 | Password updated (via UpdatePasswordPage) | `toast('...')` | "Password updated." | 4000 |
| T04 | Password update failed | `toast.error('...')` | "Failed to update password. Try again." | 6000 |
| T05 | Forgot password reset link failed | `toast.error('...')` | "Could not send reset link. Check the email address." | 6000 |

**Not toasted** (inline handling instead):
- Sign-in failure → inline `Alert` on `SignInPage`
- Sign-up failure → inline field errors on `SignUpPage`
- Sign-out → silent navigate to `/`

---

## 2. Computation Wizard Toasts

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T10 | Engine returned error | `toast.error('...')` | `"Computation failed: ${error.message}"` | 6000 |
| T11 | Engine succeeded but save to Supabase failed | `toast.error('...')` | "Computation ran but could not be saved. Please try again." | 6000 |

**Not toasted:**
- Successful wizard completion → navigate to `/compute/$id/results` (navigation is the feedback)
- Inline form validation errors → React Hook Form field errors (no toast)

**Implementation note:** The `toast.error()` calls live in `WizardContainer.handleComplete()` in `pages/compute/WizardContainer.tsx`.

---

## 3. Computation Management Toasts

### 3.1 Delete Computation

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T20 | Delete computation (dashboard card) — success | `toast('...')` | "Computation deleted." | 4000 |
| T21 | Delete computation (dashboard card) — failure | `toast.error('...')` | "Failed to delete computation. Please try again." | 6000 |
| T22 | Delete computation (results page) — success | `toast('...')` | "Computation deleted." | 4000 |
| T23 | Delete computation (results page) — failure | `toast.error('...')` | "Failed to delete. Please try again." | 6000 |

**Component locations:**
- T20/T21: `components/dashboard/ComputationCard.tsx`, inside `AlertDialog` confirm handler
- T22/T23: `components/results/ResultsActionsRow.tsx`, inside `AlertDialog` confirm handler

**Implementation pattern (T20):**
```tsx
const handleDelete = async () => {
  try {
    await deleteComputation(record.id);
    toast('Computation deleted.');
    // Card removed by query invalidation
  } catch {
    toast.error('Failed to delete computation. Please try again.');
  }
};
```

### 3.2 Auto-Save

Auto-save uses an inline indicator in the wizard header — NOT a toast. See `empty-states-and-loading.md` §5 for the indicator spec. Toasts are not used for auto-save because they would be distracting during form entry.

---

## 4. PDF Export Toasts

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T30 | Single computation PDF export failed | `toast.error('...')` | "PDF export failed. Please try again." | 6000 |
| T31 | NLRC worksheet PDF export failed | `toast.error('...')` | "NLRC PDF export failed. Please try again." | 6000 |
| T32 | Batch PDF export failed | `toast.error('...')` | "PDF export failed. Please try again." | 6000 |

**Not toasted on success:** Browser download dialog is the success feedback for PDF exports. No toast needed.

**Component locations:**
- T30: `components/results/PdfExportButton.tsx`
- T31: `components/nlrc/NlrcPdfExportButton.tsx`
- T32: `components/batch/BatchExportButtons.tsx`

**Implementation pattern (T30):**
```tsx
const exportPdf = async () => {
  setIsExporting(true);
  try {
    const blob = await pdf(RetirementPayPdfDocument({ output, employeeName })).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement-pay-${toKebabCase(employeeName)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('PDF export failed. Please try again.');
  } finally {
    setIsExporting(false);
  }
};
```

---

## 5. Batch Export Toasts

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T40 | CSV export failed | `toast.error('...')` | "CSV export failed. Please try again." | 6000 |
| T41 | CSV file not a .csv (file selection) | `toast.error('...')` | "Only CSV files are supported." | 5000 |
| T42 | CSV file too large (> 10MB) | `toast.error('...')` | "File too large. Maximum 10MB." | 5000 |
| T43 | Batch computation failed (engine error) | `toast.error('...')` | `"Batch computation failed: ${error.message}"` | 6000 |

**Not toasted on success:** Navigation to `/batch/$id` is the feedback for a successful batch computation.

**Component locations:**
- T40: `components/batch/BatchExportButtons.tsx`
- T41/T42: `components/batch/CsvDropZone.tsx` (in the `onChange`/`onDrop` handler)
- T43: `pages/batch/NewBatchPage.tsx` (in the compute handler)

---

## 6. Sharing Toasts

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T50 | Share link generated | `toast('...')` | "Share link created." | 4000 |
| T51 | Share link generation failed | `toast.error('...')` | "Failed to create share link." | 6000 |
| T52 | Link copied to clipboard (icon button OR footer button) | `toast('...')` | "Link copied to clipboard." | 3000 |
| T53 | Copy to clipboard failed (browser denied permission) | `toast.error('...')` | "Failed to copy link. Use Ctrl+C to copy manually." | 6000 |
| T54 | Share link revoked | `toast('...')` | "Share link revoked." | 4000 |
| T55 | Share link revoke failed | `toast.error('...')` | "Failed to revoke share link." | 6000 |

**Component location:** All in `components/sharing/ShareDialog.tsx` and the `useSharing()` hook.

**Implementation note for T52/T53:**
```tsx
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl);
    toast('Link copied to clipboard.');
  } catch {
    toast.error('Failed to copy link. Use Ctrl+C to copy manually.');
  }
};
```

**Dedup note:** If the user clicks "Copy Link" twice quickly, two toasts fire — this is acceptable. No dedup ID needed.

---

## 7. Organization Management Toasts

### 7.1 Create Organization

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T60 | Organization created | `toast('...')` | "Organization created." | 4000 |
| T61 | Organization creation failed | `toast.error('...')` | "Failed to create organization." | 6000 |

**Note:** "Slug already taken" is shown as an inline form error below the slug field, not as a toast. T61 fires only for non-validation server errors.

### 7.2 Invitations

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T62 | Invitation sent | `toast('...')` | `"Invitation sent to ${email}."` | 4000 |
| T63 | Invitation failed | `toast.error('...')` | "Failed to send invitation." | 6000 |
| T64 | Invitation already exists (409 from Supabase) | `toast.error('...')` | "This email has already been invited." | 5000 |
| T65 | Invitation revoked | `toast('...')` | "Invitation revoked." | 4000 |
| T66 | Invitation revoke failed | `toast.error('...')` | "Failed to revoke invitation." | 6000 |

**Component locations:**
- T62/T63/T64: `components/org/InviteMemberDialog.tsx`
- T65/T66: `components/org/OrgInvitationsTable.tsx`

### 7.3 Members

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T67 | Member removed | `toast('...')` | "Member removed." | 4000 |
| T68 | Member remove failed | `toast.error('...')` | "Failed to remove member." | 6000 |
| T69 | Role updated | `toast('...')` | `"Role updated to ${newRole}."` | 4000 |
| T70 | Role update failed | `toast.error('...')` | "Failed to update role." | 6000 |

**Component locations:**
- T67/T68: `components/org/OrgMembersTable.tsx`
- T69/T70: `components/org/OrgMembersTable.tsx` (Select onChange handler)

**T70 implementation note:** On error, revert the Select value to previous:
```tsx
const handleRoleChange = async (memberId: string, newRole: string, prevRole: string) => {
  try {
    await supabase.from('org_members').update({ role: newRole }).eq('id', memberId);
    toast(`Role updated to ${newRole}.`);
  } catch {
    toast.error('Failed to update role.');
    // revert optimistic update by refetching
    refetchMembers();
  }
};
```

### 7.4 Ownership

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T71 | Ownership transferred | `toast('...')` | "Ownership transferred." | 4000 |
| T72 | Ownership transfer failed | `toast.error('...')` | "Failed to transfer ownership." | 6000 |

**Component:** `components/org/TransferOwnershipDialog.tsx`

### 7.5 Delete Organization

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T73 | Organization deleted | `toast('...')` | "Organization deleted." | 4000 |
| T74 | Organization delete failed | `toast.error('...')` | "Failed to delete organization." | 6000 |

**Component:** `components/org/DeleteOrgDialog.tsx`

**Toast timing:** Toast is fired before navigation (`navigate({ to: '/dashboard' })`). Sonner persists toasts across navigation if the `Toaster` is mounted in the root layout.

---

## 8. Settings Toasts

| ID | Trigger | Call | Message | Duration |
|----|---------|------|---------|----------|
| T80 | Profile (display name) saved | `toast('...')` | "Profile updated." | 4000 |
| T81 | Profile save failed | `toast.error('...')` | "Failed to update profile." | 6000 |
| T82 | Password changed (from SettingsPage) | `toast('...')` | "Password updated." | 4000 |
| T83 | Password change failed | `toast.error('...')` | "Failed to update password." | 6000 |
| T84 | Account delete failed | `toast.error('...')` | "Failed to delete account. Contact support." | 8000 |

**Component locations:**
- T80/T81: `components/settings/ProfileTab.tsx`
- T82/T83: `components/settings/PasswordTab.tsx`
- T84: `components/settings/DangerZoneTab.tsx`

**Not toasted on account delete success:** Sign out and navigate to `/` is the feedback.

---

## 9. Promise-Based Toasts (Loading → Success/Error)

For operations that are slow enough to warrant a loading indicator in the toast itself (rather than just a button spinner), use `toast.promise()`:

### 9.1 Batch Computation (not recommended — use ComputingProgressCard instead)

Batch computation uses a full-page `ComputingProgressCard` component rather than a `toast.promise()`, because the operation can take 5–30 seconds for large CSVs. The progress card provides better UX than a toast that blocks interaction.

### 9.2 No other promise toasts

All other operations either:
- Are fast enough (< 2s) that a button spinner + result toast is sufficient
- Navigate away on success (computation wizard, delete with redirect)

---

## 10. Complete Toast Catalog Table

All 75 toasts, sorted by ID:

| ID | Message | Call | Duration | Component |
|----|---------|------|----------|-----------|
| T01 | "Magic link sent. Check your inbox." | `toast()` | 5000 | `SignInPage` |
| T02 | "Failed to send magic link. Try again." | `toast.error()` | 6000 | `SignInPage` |
| T03 | "Password updated." | `toast()` | 4000 | `UpdatePasswordPage` |
| T04 | "Failed to update password. Try again." | `toast.error()` | 6000 | `UpdatePasswordPage` |
| T05 | "Could not send reset link. Check the email address." | `toast.error()` | 6000 | `ForgotPasswordPage` |
| T10 | `"Computation failed: ${error.message}"` | `toast.error()` | 6000 | `WizardContainer` |
| T11 | "Computation ran but could not be saved. Please try again." | `toast.error()` | 6000 | `WizardContainer` |
| T20 | "Computation deleted." | `toast()` | 4000 | `ComputationCard` |
| T21 | "Failed to delete computation. Please try again." | `toast.error()` | 6000 | `ComputationCard` |
| T22 | "Computation deleted." | `toast()` | 4000 | `ResultsActionsRow` |
| T23 | "Failed to delete. Please try again." | `toast.error()` | 6000 | `ResultsActionsRow` |
| T30 | "PDF export failed. Please try again." | `toast.error()` | 6000 | `PdfExportButton` |
| T31 | "NLRC PDF export failed. Please try again." | `toast.error()` | 6000 | `NlrcPdfExportButton` |
| T32 | "PDF export failed. Please try again." | `toast.error()` | 6000 | `BatchExportButtons` |
| T40 | "CSV export failed. Please try again." | `toast.error()` | 6000 | `BatchExportButtons` |
| T41 | "Only CSV files are supported." | `toast.error()` | 5000 | `CsvDropZone` |
| T42 | "File too large. Maximum 10MB." | `toast.error()` | 5000 | `CsvDropZone` |
| T43 | `"Batch computation failed: ${error.message}"` | `toast.error()` | 6000 | `NewBatchPage` |
| T50 | "Share link created." | `toast()` | 4000 | `ShareDialog` |
| T51 | "Failed to create share link." | `toast.error()` | 6000 | `ShareDialog` |
| T52 | "Link copied to clipboard." | `toast()` | 3000 | `ShareDialog` |
| T53 | "Failed to copy link. Use Ctrl+C to copy manually." | `toast.error()` | 6000 | `ShareDialog` |
| T54 | "Share link revoked." | `toast()` | 4000 | `ShareDialog` |
| T55 | "Failed to revoke share link." | `toast.error()` | 6000 | `ShareDialog` |
| T60 | "Organization created." | `toast()` | 4000 | `NewOrgForm` |
| T61 | "Failed to create organization." | `toast.error()` | 6000 | `NewOrgForm` |
| T62 | `"Invitation sent to ${email}."` | `toast()` | 4000 | `InviteMemberDialog` |
| T63 | "Failed to send invitation." | `toast.error()` | 6000 | `InviteMemberDialog` |
| T64 | "This email has already been invited." | `toast.error()` | 5000 | `InviteMemberDialog` |
| T65 | "Invitation revoked." | `toast()` | 4000 | `OrgInvitationsTable` |
| T66 | "Failed to revoke invitation." | `toast.error()` | 6000 | `OrgInvitationsTable` |
| T67 | "Member removed." | `toast()` | 4000 | `OrgMembersTable` |
| T68 | "Failed to remove member." | `toast.error()` | 6000 | `OrgMembersTable` |
| T69 | `"Role updated to ${newRole}."` | `toast()` | 4000 | `OrgMembersTable` |
| T70 | "Failed to update role." | `toast.error()` | 6000 | `OrgMembersTable` |
| T71 | "Ownership transferred." | `toast()` | 4000 | `TransferOwnershipDialog` |
| T72 | "Failed to transfer ownership." | `toast.error()` | 6000 | `TransferOwnershipDialog` |
| T73 | "Organization deleted." | `toast()` | 4000 | `DeleteOrgDialog` |
| T74 | "Failed to delete organization." | `toast.error()` | 6000 | `DeleteOrgDialog` |
| T80 | "Profile updated." | `toast()` | 4000 | `ProfileTab` |
| T81 | "Failed to update profile." | `toast.error()` | 6000 | `ProfileTab` |
| T82 | "Password updated." | `toast()` | 4000 | `PasswordTab` |
| T83 | "Failed to update password." | `toast.error()` | 6000 | `PasswordTab` |
| T84 | "Failed to delete account. Contact support." | `toast.error()` | 8000 | `DangerZoneTab` |

**Total: 44 distinct toast events** (T01–T84, with gaps for untoasted actions).

---

## 11. Sonner Installation and Configuration

**Package:** `sonner` (not `@radix-ui/react-toast` — Sonner is the shadcn default)

**Install:**
```bash
npm install sonner
```

**`Toaster` placement in `src/App.tsx`:**
```tsx
import { Toaster } from 'sonner';

export function App() {
  return (
    <RouterProvider router={router} />
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        className: 'font-sans text-sm',
      }}
    />
  );
}
```

**Why `bottom-right`:** Standard placement for web apps. Does not overlap the sidebar (left side) or the wizard form (center). On mobile, Sonner automatically moves to `bottom-center`.

**Why `richColors`:** Provides green for success, red for error without needing custom CSS. Matches the app's color system.

**Why `closeButton`:** Users can dismiss errors early if they read the message. Especially important for 8s error toasts (T84).

---

## 12. What Is NOT Toasted

These actions produce NO toast — their feedback is navigation or inline UI change:

| Action | Feedback type |
|--------|--------------|
| Sign in (success) | Navigate to `/dashboard` |
| Sign in (failure) | Inline `Alert` on page |
| Sign up (success) | Page replaces form with confirmation |
| Sign up (failure) | Inline field errors |
| Sign out | Navigate to `/` |
| Wizard step next/back | Next/previous step renders |
| Wizard final submit (success) | Navigate to `/compute/$id/results` |
| Open share dialog | Dialog opens |
| Open invite dialog | Dialog opens |
| Open transfer/delete org dialogs | Dialog opens |
| Batch file selected | `FilePreviewCard` renders |
| Batch file cleared | `CsvDropZone` renders |
| Batch compute (success) | Navigate to `/batch/$id` |
| Batch retry | `CsvDropZone` renders |
| NLRC print | Browser print dialog |
| PDF export (success) | Browser download starts |
| CSV export (success) | Browser download starts |
| Dashboard navigation | Navigate |
| Results navigation | Navigate |
| NLRC navigation | Navigate |
| Mobile drawer open/close | Drawer animates |
| Org switcher change | Sidebar updates, queries refetch |

---

## 13. Toast Hook Utility

To avoid scattering toast calls throughout components, create a `useToastActions` composable that centralizes all toast messages:

```tsx
// hooks/useToastActions.ts
import { toast } from 'sonner';

export function useToastActions() {
  return {
    // Computation
    computationDeleted: () => toast('Computation deleted.'),
    computationDeleteFailed: () => toast.error('Failed to delete computation. Please try again.'),
    computationFailed: (msg: string) => toast.error(`Computation failed: ${msg}`),
    computationSaveFailed: () => toast.error('Computation ran but could not be saved. Please try again.'),

    // PDF
    pdfExportFailed: () => toast.error('PDF export failed. Please try again.'),
    nlrcPdfExportFailed: () => toast.error('NLRC PDF export failed. Please try again.'),

    // CSV / Batch
    csvExportFailed: () => toast.error('CSV export failed. Please try again.'),
    csvNotSupported: () => toast.error('Only CSV files are supported.'),
    csvTooLarge: () => toast.error('File too large. Maximum 10MB.'),
    batchFailed: (msg: string) => toast.error(`Batch computation failed: ${msg}`),

    // Sharing
    shareLinkCreated: () => toast('Share link created.'),
    shareLinkCreateFailed: () => toast.error('Failed to create share link.'),
    linkCopied: () => toast('Link copied to clipboard.'),
    copyFailed: () => toast.error('Failed to copy link. Use Ctrl+C to copy manually.'),
    shareLinkRevoked: () => toast('Share link revoked.'),
    shareLinkRevokeFailed: () => toast.error('Failed to revoke share link.'),

    // Org
    orgCreated: () => toast('Organization created.'),
    orgCreateFailed: () => toast.error('Failed to create organization.'),
    invitationSent: (email: string) => toast(`Invitation sent to ${email}.`),
    invitationFailed: () => toast.error('Failed to send invitation.'),
    invitationAlreadyExists: () => toast.error('This email has already been invited.'),
    invitationRevoked: () => toast('Invitation revoked.'),
    invitationRevokeFailed: () => toast.error('Failed to revoke invitation.'),
    memberRemoved: () => toast('Member removed.'),
    memberRemoveFailed: () => toast.error('Failed to remove member.'),
    roleUpdated: (role: string) => toast(`Role updated to ${role}.`),
    roleUpdateFailed: () => toast.error('Failed to update role.'),
    ownershipTransferred: () => toast('Ownership transferred.'),
    ownershipTransferFailed: () => toast.error('Failed to transfer ownership.'),
    orgDeleted: () => toast('Organization deleted.'),
    orgDeleteFailed: () => toast.error('Failed to delete organization.'),

    // Settings
    profileUpdated: () => toast('Profile updated.'),
    profileUpdateFailed: () => toast.error('Failed to update profile.'),
    passwordUpdated: () => toast('Password updated.'),
    passwordUpdateFailed: () => toast.error('Failed to update password.'),
    accountDeleteFailed: () =>
      toast.error('Failed to delete account. Contact support.', { duration: 8000 }),

    // Auth
    magicLinkSent: () => toast('Magic link sent. Check your inbox.', { duration: 5000 }),
    magicLinkFailed: () => toast.error('Failed to send magic link. Try again.'),
    resetLinkFailed: () => toast.error('Could not send reset link. Check the email address.'),
  };
}
```

This hook is imported into each component:
```tsx
const { computationDeleted, computationDeleteFailed } = useToastActions();
```

---

## Spec Integration Notes

The toast catalog maps to spec section **S21 (Action Trigger Map)** — every action row now has a precise toast ID and message. It also informs **S16 (Frontend Architecture)** by specifying that `Toaster` is mounted in `App.tsx` at the root level, outside the router outlet, ensuring toasts persist across navigation.

The `useToastActions` hook lives at `apps/retirement-pay/frontend/src/hooks/useToastActions.ts`.
